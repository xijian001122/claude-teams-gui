import { FastifyInstance } from 'fastify';
import { readdir, readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ApiResponse, Task, TaskStatus } from '@shared/types';
import { TaskStorageService } from '../services/task-storage';
import { SessionSummaryService } from '../services/session-summary';

/**
 * Read tasks from ~/.claude/tasks/<team-name>/ directory (legacy function)
 */
async function readTasksFromFiles(teamName: string): Promise<Task[]> {
  const tasksDir = join(homedir(), '.claude', 'tasks', teamName);

  if (!existsSync(tasksDir)) {
    return [];
  }

  try {
    const files = await readdir(tasksDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const tasks: Task[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = join(tasksDir, file);
        const content = await readFile(filePath, 'utf-8');
        const task = JSON.parse(content) as Task;

        // Validate required fields
        if (task.id && task.subject && task.status) {
          tasks.push({
            id: task.id,
            subject: task.subject,
            description: task.description,
            status: task.status,
            owner: task.owner,
            blockedBy: task.blockedBy || [],
            activeForm: task.activeForm,
            metadata: task.metadata,
            history: task.history,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          });
        }
      } catch (parseError) {
        // Skip invalid JSON files
        console.error(`[Tasks] Failed to parse task file ${file}:`, parseError);
      }
    }

    // Sort by task ID (numeric)
    tasks.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      return numA - numB;
    });

    return tasks;
  } catch (error) {
    console.error(`[Tasks] Failed to read tasks directory:`, error);
    return [];
  }
}

// Task storage service instance
const taskStorage = new TaskStorageService();

/**
 * Task counts interface
 */
interface TaskCounts {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  deleted: number;
}

/**
 * Calculate task counts
 */
function calculateCounts(tasks: Task[]): TaskCounts {
  const counts: TaskCounts = {
    total: tasks.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    deleted: 0
  };

  for (const task of tasks) {
    switch (task.status) {
      case 'pending':
        counts.pending++;
        break;
      case 'in_progress':
        counts.in_progress++;
        break;
      case 'completed':
        counts.completed++;
        break;
      case 'deleted':
        counts.deleted++;
        break;
    }
  }

  return counts;
}

export async function tasksRoutes(fastify: FastifyInstance) {
  // ========================================
  // Team-scoped Task Endpoints
  // ========================================

  // GET /api/teams/:name/tasks - Get tasks for a team
  fastify.get('/:name/tasks', async (request, reply) => {
    const { name } = request.params as { name: string };

    try {
      const tasks = await readTasksFromFiles(name);

      return {
        success: true,
        data: { tasks }
      } as ApiResponse<{ tasks: Task[] }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch tasks'
      } as ApiResponse<never>;
    }
  });

  // POST /api/teams/:name/tasks - Create a new task
  fastify.post<{
    Params: { name: string };
    Body: {
      id?: string;
      subject: string;
      description?: string;
      status?: TaskStatus;
      owner?: string;
      blockedBy?: string[];
      activeForm?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/:name/tasks', async (request, reply) => {
    const { name } = request.params;
    const body = request.body;

    if (!body.subject) {
      reply.status(400);
      return {
        success: false,
        error: 'subject is required'
      } as ApiResponse<never>;
    }

    try {
      // Generate task ID if not provided
      const taskId = body.id || Date.now().toString();

      // Check if task already exists
      const existingTask = await taskStorage.readTaskFile(name, taskId);
      if (existingTask) {
        reply.status(409);
        return {
          success: false,
          error: `Task ${taskId} already exists`
        } as ApiResponse<never>;
      }

      // Create the task
      const task = await taskStorage.createTask(name, taskId, {
        subject: body.subject,
        description: body.description,
        status: body.status,
        owner: body.owner,
        blockedBy: body.blockedBy,
        activeForm: body.activeForm,
        metadata: body.metadata
      });

      reply.status(201);
      return {
        success: true,
        data: task
      } as ApiResponse<Task>;
    } catch (err) {
      console.error(`[Tasks] Error creating task:`, err);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to create task'
      } as ApiResponse<never>;
    }
  });

  // PUT /api/teams/:name/tasks/:id - Update a task
  fastify.put<{
    Params: { name: string; id: string };
    Body: {
      subject?: string;
      description?: string;
      status?: TaskStatus;
      owner?: string;
      blockedBy?: string[];
      activeForm?: string;
      metadata?: Record<string, unknown>;
      changedBy?: string;
    };
  }>('/:name/tasks/:id', async (request, reply) => {
    const { name, id } = request.params;
    const body = request.body;

    try {
      // Update task with history tracking
      const task = await taskStorage.updateTaskWithHistory(
        name,
        id,
        {
          subject: body.subject,
          description: body.description,
          status: body.status,
          owner: body.owner,
          blockedBy: body.blockedBy,
          activeForm: body.activeForm,
          metadata: body.metadata
        },
        body.changedBy
      );

      if (!task) {
        reply.status(404);
        return {
          success: false,
          error: `Task ${id} not found`
        } as ApiResponse<never>;
      }

      return {
        success: true,
        data: task
      } as ApiResponse<Task>;
    } catch (err) {
      console.error(`[Tasks] Error updating task ${id}:`, err);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to update task'
      } as ApiResponse<never>;
    }
  });

  // DELETE /api/teams/:name/tasks/:id - Delete a task
  fastify.delete<{
    Params: { name: string; id: string };
    Querystring: { hard?: string };
  }>('/:name/tasks/:id', async (request, reply) => {
    const { name, id } = request.params;
    const { hard } = request.query;

    try {
      const hardDelete = hard === 'true';
      const success = await taskStorage.deleteTaskFile(name, id, !hardDelete);

      if (!success) {
        reply.status(404);
        return {
          success: false,
          error: `Task ${id} not found`
        } as ApiResponse<never>;
      }

      return {
        success: true
      } as ApiResponse<void>;
    } catch (err) {
      console.error(`[Tasks] Error deleting task ${id}:`, err);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to delete task'
      } as ApiResponse<never>;
    }
  });

  // POST /api/teams/:name/session-summary - Generate session summary
  fastify.post<{
    Params: { name: string };
  }>('/:name/session-summary', async (request, reply) => {
    const { name } = request.params;

    try {
      const summaryService = new SessionSummaryService();
      const filePath = await summaryService.generateSessionSummary(name);

      return {
        success: true,
        data: { filePath }
      } as ApiResponse<{ filePath: string }>;
    } catch (err) {
      console.error(`[Tasks] Error generating session summary for ${name}:`, err);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to generate session summary'
      } as ApiResponse<never>;
    }
  });

  // ========================================
  // Global Task Endpoints (registered separately)
  // ========================================
}

/**
 * Register global task routes (without team prefix)
 */
export async function globalTasksRoutes(fastify: FastifyInstance) {
  // GET /api/tasks - Get all tasks across all teams
  fastify.get<{
    Querystring: {
      status?: TaskStatus;
      team?: string;
    };
  }>('/tasks', async (request, reply) => {
    const { status, team } = request.query;

    try {
      const allTasks: Array<Task & { teamName: string }> = [];

      if (team) {
        // Get tasks for specific team
        const tasks = await readTasksFromFiles(team);
        for (const task of tasks) {
          if (!status || task.status === status) {
            allTasks.push({ ...task, teamName: team });
          }
        }
      } else {
        // Get tasks from all teams
        const tasksBaseDir = join(homedir(), '.claude', 'tasks');

        if (existsSync(tasksBaseDir)) {
          const teamDirs = await readdir(tasksBaseDir);

          for (const teamName of teamDirs) {
            const teamPath = join(tasksBaseDir, teamName);
            try {
              if (statSync(teamPath).isDirectory()) {
                const tasks = await readTasksFromFiles(teamName);
                for (const task of tasks) {
                  if (!status || task.status === status) {
                    allTasks.push({ ...task, teamName });
                  }
                }
              }
            } catch (e) {
              // Skip inaccessible directories
            }
          }
        }
      }

      // Calculate counts (before filtering for display)
      const allTasksForCounts = team
        ? await readTasksFromFiles(team)
        : await getAllTasksForCounts();
      const counts = calculateCounts(allTasksForCounts);

      return {
        success: true,
        data: {
          tasks: allTasks,
          counts
        }
      } as ApiResponse<{ tasks: Array<Task & { teamName: string }>; counts: TaskCounts }>;
    } catch (err) {
      console.error('[Tasks] Error fetching global tasks:', err);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch tasks'
      } as ApiResponse<never>;
    }
  });
}

/**
 * Get all tasks for count calculation
 */
async function getAllTasksForCounts(): Promise<Task[]> {
  const tasksBaseDir = join(homedir(), '.claude', 'tasks');
  const allTasks: Task[] = [];

  if (!existsSync(tasksBaseDir)) {
    return allTasks;
  }

  try {
    const teamDirs = await readdir(tasksBaseDir);

    for (const teamName of teamDirs) {
      const teamPath = join(tasksBaseDir, teamName);
      try {
        if (statSync(teamPath).isDirectory()) {
          const tasks = await readTasksFromFiles(teamName);
          allTasks.push(...tasks);
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return allTasks;
}

export default tasksRoutes;

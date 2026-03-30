/**
 * Task Storage Service
 *
 * Handles reading and writing task files to ~/.claude/tasks/<team-name>/
 * Provides atomic writes and history tracking
 */

import { readFile, writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Task, TaskHistoryField, TaskStatus } from '@shared/types';
import { createLogger } from './log-factory';

// Module logger
const log = createLogger({ module: 'TaskStorage', shorthand: 's.s.task-storage' });

const TASKS_BASE_DIR = join(homedir(), '.claude', 'tasks');
const MAX_HISTORY_ENTRIES = 100;

/**
 * Task storage options
 */
export interface TaskStorageOptions {
  /** Override base directory for testing */
  baseDir?: string;
}

/**
 * Create task data (without generated fields)
 */
export interface CreateTaskData {
  subject: string;
  description?: string;
  status?: TaskStatus;
  owner?: string;
  blockedBy?: string[];
  activeForm?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update task data (partial)
 */
export interface UpdateTaskData {
  subject?: string;
  description?: string;
  status?: TaskStatus;
  owner?: string;
  blockedBy?: string[];
  activeForm?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Task Storage Service
 */
export class TaskStorageService {
  private baseDir: string;

  constructor(options?: TaskStorageOptions) {
    this.baseDir = options?.baseDir || TASKS_BASE_DIR;
  }

  /**
   * Get tasks directory path for a team
   */
  private getTeamTasksDir(teamName: string): string {
    return join(this.baseDir, teamName);
  }

  /**
   * Get task file path
   */
  private getTaskFilePath(teamName: string, taskId: string): string {
    return join(this.getTeamTasksDir(teamName), `${taskId}.json`);
  }

  /**
   * Ensure team tasks directory exists
   */
  private async ensureTeamDir(teamName: string): Promise<void> {
    const teamDir = this.getTeamTasksDir(teamName);
    if (!existsSync(teamDir)) {
      await mkdir(teamDir, { recursive: true });
    }
  }

  /**
   * Add history entry to task
   */
  private addHistoryEntry(
    task: Task,
    field: TaskHistoryField,
    oldValue: string | null,
    newValue: string,
    changedBy?: string
  ): void {
    if (!task.history) {
      task.history = [];
    }

    task.history.push({
      timestamp: new Date().toISOString(),
      field,
      oldValue,
      newValue,
      changedBy
    });

    // Limit history entries
    if (task.history.length > MAX_HISTORY_ENTRIES) {
      task.history = task.history.slice(-MAX_HISTORY_ENTRIES);
    }
  }

  /**
   * Read a task file
   */
  async readTaskFile(teamName: string, taskId: string): Promise<Task | null> {
    const filePath = this.getTaskFilePath(teamName, taskId);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const task = JSON.parse(content) as Task;

      // Validate required fields
      if (!task.id || !task.subject || !task.status) {
        log.error(`Invalid task file ${taskId}: missing required fields`);
        return null;
      }

      return task;
    } catch (error) {
      log.error(`Error reading task ${taskId}: ${error}`);
      return null;
    }
  }

  /**
   * Write a task file (atomic write)
   */
  async writeTaskFile(teamName: string, task: Task): Promise<boolean> {
    try {
      await this.ensureTeamDir(teamName);

      const filePath = this.getTaskFilePath(teamName, task.id);
      const tempPath = `${filePath}.tmp`;

      // Write to temp file first
      await writeFile(tempPath, JSON.stringify(task, null, 2));

      // Rename atomically (in Node.js, rename is atomic on POSIX systems)
      const { rename } = await import('fs/promises');
      await rename(tempPath, filePath);

      log.debug(`Wrote task ${task.id} for team ${teamName}`);
      return true;
    } catch (error) {
      log.error(`Error writing task ${task.id}: ${error}`);
      return false;
    }
  }

  /**
   * Delete a task file (or mark as deleted)
   */
  async deleteTaskFile(teamName: string, taskId: string, softDelete = true): Promise<boolean> {
    const filePath = this.getTaskFilePath(teamName, taskId);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      if (softDelete) {
        // Update task status to deleted
        const task = await this.readTaskFile(teamName, taskId);
        if (task) {
          const oldStatus = task.status;
          task.status = 'deleted';
          task.updatedAt = new Date().toISOString();
          this.addHistoryEntry(task, 'status', oldStatus, 'deleted');
          await this.writeTaskFile(teamName, task);
        }
      } else {
        // Hard delete
        await unlink(filePath);
      }

      log.info(`Deleted task ${taskId} (soft: ${softDelete})`);
      return true;
    } catch (error) {
      log.error(`Error deleting task ${taskId}: ${error}`);
      return false;
    }
  }

  /**
   * Create a new task
   */
  async createTask(teamName: string, taskId: string, data: CreateTaskData): Promise<Task> {
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      subject: data.subject,
      description: data.description,
      status: data.status || 'pending',
      owner: data.owner,
      blockedBy: data.blockedBy || [],
      activeForm: data.activeForm,
      metadata: data.metadata,
      history: [],
      createdAt: now,
      updatedAt: now
    };

    await this.writeTaskFile(teamName, task);
    return task;
  }

  /**
   * Update a task with history tracking
   */
  async updateTaskWithHistory(
    teamName: string,
    taskId: string,
    updates: UpdateTaskData,
    changedBy?: string
  ): Promise<Task | null> {
    const task = await this.readTaskFile(teamName, taskId);
    if (!task) {
      return null;
    }

    // Track changes in history
    if (updates.status !== undefined && updates.status !== task.status) {
      this.addHistoryEntry(task, 'status', task.status, updates.status, changedBy);
    }
    if (updates.owner !== undefined && updates.owner !== task.owner) {
      this.addHistoryEntry(task, 'owner', task.owner || null, updates.owner, changedBy);
    }
    if (updates.subject !== undefined && updates.subject !== task.subject) {
      this.addHistoryEntry(task, 'subject', task.subject, updates.subject, changedBy);
    }
    if (updates.description !== undefined && updates.description !== task.description) {
      this.addHistoryEntry(
        task,
        'description',
        task.description || null,
        updates.description,
        changedBy
      );
    }

    // Apply updates
    if (updates.subject !== undefined) task.subject = updates.subject;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.owner !== undefined) task.owner = updates.owner;
    if (updates.blockedBy !== undefined) task.blockedBy = updates.blockedBy;
    if (updates.activeForm !== undefined) task.activeForm = updates.activeForm;
    if (updates.metadata !== undefined) task.metadata = updates.metadata;

    task.updatedAt = new Date().toISOString();

    await this.writeTaskFile(teamName, task);
    return task;
  }

  /**
   * Read all tasks for a team
   */
  async readAllTasks(teamName: string): Promise<Task[]> {
    const teamDir = this.getTeamTasksDir(teamName);

    if (!existsSync(teamDir)) {
      return [];
    }

    try {
      const files = await readdir(teamDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const tasks: Task[] = [];

      for (const file of jsonFiles) {
        const taskId = file.replace('.json', '');
        const task = await this.readTaskFile(teamName, taskId);
        if (task) {
          tasks.push(task);
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
      log.error(`Error reading tasks for team ${teamName}: ${error}`);
      return [];
    }
  }

  /**
   * Read all tasks from all teams
   */
  async readAllTeamsTasks(): Promise<Map<string, Task[]>> {
    const result = new Map<string, Task[]>();

    if (!existsSync(this.baseDir)) {
      return result;
    }

    try {
      const teamDirs = await readdir(this.baseDir);

      for (const teamName of teamDirs) {
        const teamPath = join(this.baseDir, teamName);
        if (existsSync(teamPath) && (await import('fs').then(fs => fs.statSync(teamPath).isDirectory()))) {
          const tasks = await this.readAllTasks(teamName);
          if (tasks.length > 0) {
            result.set(teamName, tasks);
          }
        }
      }

      return result;
    } catch (error) {
      log.error(`Error reading all teams tasks: ${error}`);
      return result;
    }
  }
}

export default TaskStorageService;

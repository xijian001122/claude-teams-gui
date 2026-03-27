/**
 * Task Storage Service
 *
 * Handles reading and writing task files to ~/.claude/tasks/<team-name>/
 * Provides atomic writes and history tracking
 */
import type { Task, TaskStatus } from '@shared/types';
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
export declare class TaskStorageService {
    private baseDir;
    constructor(options?: TaskStorageOptions);
    /**
     * Get tasks directory path for a team
     */
    private getTeamTasksDir;
    /**
     * Get task file path
     */
    private getTaskFilePath;
    /**
     * Ensure team tasks directory exists
     */
    private ensureTeamDir;
    /**
     * Add history entry to task
     */
    private addHistoryEntry;
    /**
     * Read a task file
     */
    readTaskFile(teamName: string, taskId: string): Promise<Task | null>;
    /**
     * Write a task file (atomic write)
     */
    writeTaskFile(teamName: string, task: Task): Promise<boolean>;
    /**
     * Delete a task file (or mark as deleted)
     */
    deleteTaskFile(teamName: string, taskId: string, softDelete?: boolean): Promise<boolean>;
    /**
     * Create a new task
     */
    createTask(teamName: string, taskId: string, data: CreateTaskData): Promise<Task>;
    /**
     * Update a task with history tracking
     */
    updateTaskWithHistory(teamName: string, taskId: string, updates: UpdateTaskData, changedBy?: string): Promise<Task | null>;
    /**
     * Read all tasks for a team
     */
    readAllTasks(teamName: string): Promise<Task[]>;
    /**
     * Read all tasks from all teams
     */
    readAllTeamsTasks(): Promise<Map<string, Task[]>>;
}
export default TaskStorageService;
//# sourceMappingURL=task-storage.d.ts.map
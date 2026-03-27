/**
 * Session Summary Service
 *
 * Generates Markdown session summaries for teams
 */
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TaskStorageService } from './task-storage';
/**
 * Session Summary Service
 */
export class SessionSummaryService {
    teamsPath;
    taskStorage;
    constructor(options) {
        this.teamsPath = options?.teamsPath || join(homedir(), '.claude', 'teams');
        this.taskStorage = new TaskStorageService();
    }
    /**
     * Generate a session summary for a team
     */
    async generateSessionSummary(teamName) {
        // Get all tasks for the team
        const tasks = await this.taskStorage.readAllTasks(teamName);
        // Calculate statistics
        const stats = this.calculateStats(tasks);
        // Generate Markdown content
        const markdown = this.generateMarkdown(teamName, tasks, stats);
        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `session-summary-${timestamp}.md`;
        const filePath = join(this.teamsPath, teamName, fileName);
        await this.ensureDir(join(this.teamsPath, teamName));
        await writeFile(filePath, markdown, 'utf-8');
        console.log(`[SessionSummary] Generated summary for team ${teamName}: ${fileName}`);
        return filePath;
    }
    /**
     * Calculate task statistics
     */
    calculateStats(tasks) {
        const stats = {
            total: tasks.length,
            completed: 0,
            inProgress: 0,
            pending: 0,
            deleted: 0
        };
        for (const task of tasks) {
            switch (task.status) {
                case 'completed':
                    stats.completed++;
                    break;
                case 'in_progress':
                    stats.inProgress++;
                    break;
                case 'pending':
                    stats.pending++;
                    break;
                case 'deleted':
                    stats.deleted++;
                    break;
            }
        }
        return stats;
    }
    /**
     * Generate Markdown content
     */
    generateMarkdown(teamName, tasks, stats) {
        const now = new Date();
        const formattedDate = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const lines = [
            `# 会话任务摘要 - ${teamName}`,
            '',
            `生成时间: ${formattedDate}`,
            '',
            '## 任务统计',
            '',
            `- 总任务数: ${stats.total}`,
            `- 已完成: ${stats.completed}`,
            `- 进行中: ${stats.inProgress}`,
            `- 等待中: ${stats.pending}`,
            ''
        ];
        // Completed tasks section
        const completedTasks = tasks.filter(t => t.status === 'completed');
        if (completedTasks.length > 0) {
            lines.push('## 已完成任务');
            lines.push('');
            lines.push('| ID | 任务 | 负责人 |');
            lines.push('|----|------|--------|');
            for (const task of completedTasks) {
                const owner = task.owner || '-';
                lines.push(`| ${task.id} | ${this.escapeMarkdown(task.subject)} | ${owner} |`);
            }
            lines.push('');
        }
        // Incomplete tasks section
        const incompleteTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'deleted');
        if (incompleteTasks.length > 0) {
            lines.push('## 未完成任务');
            lines.push('');
            lines.push('| ID | 任务 | 状态 | 阻塞 |');
            lines.push('|----|------|------|------|');
            for (const task of incompleteTasks) {
                const statusMap = {
                    'pending': '等待中',
                    'in_progress': '进行中',
                    'completed': '已完成',
                    'deleted': '已删除'
                };
                const status = statusMap[task.status] || task.status;
                const blockedBy = task.blockedBy && task.blockedBy.length > 0
                    ? task.blockedBy.map(id => `#${id}`).join(', ')
                    : '-';
                lines.push(`| ${task.id} | ${this.escapeMarkdown(task.subject)} | ${status} | ${blockedBy} |`);
            }
            lines.push('');
        }
        // Task history section (if any task has history)
        const tasksWithHistory = tasks.filter(t => t.history && t.history.length > 0);
        if (tasksWithHistory.length > 0) {
            lines.push('## 任务变更历史');
            lines.push('');
            for (const task of tasksWithHistory) {
                lines.push(`### 任务 #${task.id}: ${this.escapeMarkdown(task.subject)}`);
                lines.push('');
                if (task.history) {
                    for (const entry of task.history) {
                        const time = new Date(entry.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const fieldMap = {
                            'status': '状态',
                            'owner': '负责人',
                            'subject': '标题',
                            'description': '描述'
                        };
                        const field = fieldMap[entry.field] || entry.field;
                        lines.push(`- ${time} ${field}: ${entry.oldValue || '空'} → ${entry.newValue}`);
                    }
                }
                lines.push('');
            }
        }
        return lines.join('\n');
    }
    /**
     * Escape special Markdown characters
     */
    escapeMarkdown(text) {
        return text.replace(/[|\\]/g, '\\$&');
    }
    /**
     * Ensure directory exists
     */
    async ensureDir(dir) {
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
    }
}
export default SessionSummaryService;
//# sourceMappingURL=session-summary.js.map
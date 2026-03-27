import { readFile } from 'fs/promises';
import { join } from 'path';
export async function logsRoutes(fastify, options) {
    const { configService } = options;
    // GET /api/logs/error - Get error log content
    fastify.get('/error', async (_request, reply) => {
        try {
            const config = configService.getConfig();
            const logPath = join(config.dataDir, 'logs', 'error.log');
            try {
                const content = await readFile(logPath, 'utf-8');
                return {
                    success: true,
                    data: content
                };
            }
            catch (err) {
                // File doesn't exist or can't be read
                return {
                    success: true,
                    data: ''
                };
            }
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to read error log'
            };
        }
    });
    // GET /api/logs/console - Get console log content
    fastify.get('/console', async (_request, reply) => {
        try {
            const config = configService.getConfig();
            const logPath = join(config.dataDir, 'logs', 'console.log');
            try {
                const content = await readFile(logPath, 'utf-8');
                return {
                    success: true,
                    data: content
                };
            }
            catch (err) {
                return {
                    success: true,
                    data: ''
                };
            }
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to read console log'
            };
        }
    });
    // GET /api/logs/info - Get info log content
    fastify.get('/info', async (_request, reply) => {
        try {
            const config = configService.getConfig();
            const logPath = join(config.dataDir, 'logs', 'info.log');
            try {
                const content = await readFile(logPath, 'utf-8');
                return {
                    success: true,
                    data: content
                };
            }
            catch (err) {
                return {
                    success: true,
                    data: ''
                };
            }
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to read info log'
            };
        }
    });
}
export default logsRoutes;
//# sourceMappingURL=logs.js.map
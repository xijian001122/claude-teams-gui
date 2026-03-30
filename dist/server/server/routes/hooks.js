import { createLogger } from '../services/log-factory';
// Module logger
const log = createLogger({ module: 'Hooks', shorthand: 's.r.hooks' });
/**
 * Broadcast task_created event to all WebSocket clients
 */
function broadcastTaskCreated(fastify, taskData) {
    const wsServer = fastify.websocketServer;
    if (!wsServer?.clients) {
        return;
    }
    const message = JSON.stringify({
        type: 'task_created',
        team: taskData.teamName,
        task: {
            id: taskData.taskId,
            subject: taskData.subject || '',
            status: taskData.status || 'pending',
            owner: taskData.owner || ''
        }
    });
    wsServer.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}
export async function hooksRoutes(fastify, _options) {
    // POST /api/hooks/task-created - Hook endpoint for task creation events
    fastify.post('/task-created', async (request, reply) => {
        const body = request.body;
        // Validate required fields
        if (!body.taskId || !body.teamName) {
            reply.status(400);
            return {
                success: false,
                error: 'Missing required fields: taskId, teamName'
            };
        }
        log.info(`Task created: ${body.taskId} for team ${body.teamName}`);
        // Broadcast to all WebSocket clients
        broadcastTaskCreated(fastify, {
            taskId: body.taskId,
            teamName: body.teamName,
            subject: body.subject,
            status: body.status,
            owner: body.owner
        });
        return {
            success: true,
            data: {
                received: true,
                taskId: body.taskId,
                teamName: body.teamName
            }
        };
    });
}
export default hooksRoutes;
//# sourceMappingURL=hooks.js.map
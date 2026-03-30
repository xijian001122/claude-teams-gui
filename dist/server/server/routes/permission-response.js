import { join } from 'path';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { createLogger } from '../services/log-factory';
// Module logger
const log = createLogger({ module: 'PermissionResponse', shorthand: 's.r.perm' });
export async function permissionResponseRoutes(fastify, options) {
    const { db, claudeTeamsPath } = options;
    // POST /api/teams/:name/permission-response - Send permission response
    fastify.post('/:name/permission-response', async (request, reply) => {
        const { name } = request.params;
        const body = request.body;
        // Validate required fields
        if (!body.request_id || typeof body.request_id !== 'string') {
            reply.status(400);
            return {
                success: false,
                error: 'request_id is required and must be a string'
            };
        }
        if (typeof body.approve !== 'boolean') {
            reply.status(400);
            return {
                success: false,
                error: 'approve is required and must be a boolean'
            };
        }
        if (!body.agent_id || typeof body.agent_id !== 'string') {
            reply.status(400);
            return {
                success: false,
                error: 'agent_id is required and must be a string'
            };
        }
        try {
            // Check if team exists
            const team = await db.getTeam(name);
            if (!team) {
                reply.status(404);
                return {
                    success: false,
                    error: 'Team not found'
                };
            }
            // Construct permission_response message
            const timestamp = body.timestamp || new Date().toISOString();
            const permissionResponse = {
                type: 'permission_response',
                request_id: body.request_id,
                subtype: 'success',
                response: {
                    approved: body.approve,
                    timestamp
                }
            };
            // Write to agent's inbox file
            const inboxPath = join(claudeTeamsPath, name, 'inboxes', `${body.agent_id}.json`);
            if (!existsSync(inboxPath)) {
                reply.status(404);
                return {
                    success: false,
                    error: `Agent inbox not found: ${body.agent_id}`
                };
            }
            // Read existing messages
            const messages = JSON.parse(readFileSync(inboxPath, 'utf8'));
            if (!Array.isArray(messages)) {
                reply.status(500);
                return {
                    success: false,
                    error: 'Invalid inbox format'
                };
            }
            // Append permission_response message
            messages.push({
                from: 'user',
                text: JSON.stringify(permissionResponse),
                summary: `Permission ${body.approve ? 'approved' : 'rejected'}: ${body.request_id}`,
                timestamp,
                read: false
            });
            // Write back to file
            writeFileSync(inboxPath, JSON.stringify(messages, null, 2));
            log.info(`Written to ${body.agent_id}'s inbox: ${body.approve ? 'approved' : 'rejected'} ${body.request_id}`);
            // Update the permission_request message status in the database
            const newStatus = body.approve ? 'approved' : 'rejected';
            await db.updatePermissionRequestStatus(name, body.request_id, newStatus);
            log.debug(`Updated database status to ${newStatus} for request ${body.request_id}`);
            reply.status(201);
            return {
                success: true,
                data: {
                    request_id: body.request_id,
                    approve: body.approve,
                    timestamp
                }
            };
        }
        catch (err) {
            log.error(`Error processing permission response: ${err}`);
            reply.status(500);
            return {
                success: false,
                error: 'Failed to process permission response'
            };
        }
    });
}
export default permissionResponseRoutes;
//# sourceMappingURL=permission-response.js.map
import { join } from 'path';
import { existsSync, readdirSync, rmSync } from 'fs';
export async function archiveRoutes(fastify, options) {
    const { db, dataDir } = options;
    // GET /api/archive - Get archived teams
    fastify.get('/', async (_request, reply) => {
        try {
            const teams = await db.getTeams('archived');
            return {
                success: true,
                data: { teams }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch archived teams'
            };
        }
    });
    // POST /api/archive/:name/restore - Restore archived team
    fastify.post('/:name/restore', async (request, reply) => {
        const { name } = request.params;
        try {
            const team = await db.getTeam(name);
            if (!team) {
                reply.status(404);
                return {
                    success: false,
                    error: 'Team not found'
                };
            }
            if (team.status !== 'archived') {
                reply.status(400);
                return {
                    success: false,
                    error: 'Team is not archived'
                };
            }
            db.updateTeamStatus(name, 'active', undefined);
            return {
                success: true
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to restore team'
            };
        }
    });
    // DELETE /api/archive/:name - Permanently delete archived team
    fastify.delete('/:name', async (request, reply) => {
        const { name } = request.params;
        try {
            const team = await db.getTeam(name);
            if (!team) {
                reply.status(404);
                return {
                    success: false,
                    error: 'Team not found'
                };
            }
            if (team.status !== 'archived') {
                reply.status(400);
                return {
                    success: false,
                    error: 'Can only delete archived teams'
                };
            }
            // Delete from database
            db.deleteTeam(name);
            // Delete archive directories matching pattern <name>-*
            const archiveBase = join(dataDir, 'archive');
            if (existsSync(archiveBase)) {
                const entries = readdirSync(archiveBase, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory() && entry.name.startsWith(`${name}-`)) {
                        const dirPath = join(archiveBase, entry.name);
                        rmSync(dirPath, { recursive: true });
                    }
                }
            }
            return {
                success: true
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to delete team'
            };
        }
    });
}
export default archiveRoutes;
//# sourceMappingURL=archive.js.map
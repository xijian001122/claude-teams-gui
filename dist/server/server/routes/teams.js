export async function teamRoutes(fastify, options) {
    const { db } = options;
    // GET /api/teams - Get all teams
    fastify.get('/', async (request, reply) => {
        try {
            const query = request.query;
            const acceptsCrossTeamMessages = query.acceptsCrossTeamMessages === 'true';
            const teams = await db.getTeams('active', acceptsCrossTeamMessages || undefined);
            // Add unread counts (in a real app, this would be per-user)
            const teamsWithUnread = teams.map(t => ({
                ...t,
                unreadCount: 0
            }));
            return {
                success: true,
                data: { teams: teamsWithUnread }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch teams'
            };
        }
    });
    // GET /api/teams/:name - Get single team
    fastify.get('/:name', async (request, reply) => {
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
            return {
                success: true,
                data: { team }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch team'
            };
        }
    });
    // GET /api/teams/:name/members - Get team members
    fastify.get('/:name/members', async (request, reply) => {
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
            return {
                success: true,
                data: { members: team.members }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch members'
            };
        }
    });
}
export default teamRoutes;
//# sourceMappingURL=teams.js.map
import { SessionReaderService } from '../services/session-reader';
export async function memberSessionRoutes(fastify, options) {
    const sessionReader = new SessionReaderService({ teamsPath: options.teamsPath });
    // GET /api/teams/:team/members/:member/session
    // Returns session registration info for a member
    fastify.get('/:team/members/:member/session', async (request, reply) => {
        const { team, member } = request.params;
        const session = sessionReader.getMemberSession(team, member);
        if (!session) {
            reply.status(404);
            return {
                success: false,
                error: 'Session not registered'
            };
        }
        return {
            success: true,
            data: session
        };
    });
    // GET /api/teams/:team/members/:member/conversation
    // Returns conversation history for a member's session
    fastify.get('/:team/members/:member/conversation', async (request, _reply) => {
        const { team, member } = request.params;
        const query = request.query;
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const conversation = sessionReader.getMemberConversation(team, member, limit);
        return {
            success: true,
            data: conversation
        };
    });
    // GET /api/teams/:team/members/sessions
    // List all registered sessions for a team
    fastify.get('/:team/members/sessions', async (request, _reply) => {
        const { team } = request.params;
        const sessions = sessionReader.listMemberSessions(team);
        return {
            success: true,
            data: { sessions }
        };
    });
}
export default memberSessionRoutes;
//# sourceMappingURL=member-session.js.map
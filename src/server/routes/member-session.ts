import { FastifyInstance } from 'fastify';
import type { ApiResponse } from '@shared/types';
import { SessionReaderService } from '../services/session-reader';

export interface MemberSessionRouteOptions {
  /** Override teams path for testing */
  teamsPath?: string;
}

export async function memberSessionRoutes(
  fastify: FastifyInstance,
  options: MemberSessionRouteOptions
) {
  const sessionReader = new SessionReaderService({ teamsPath: options.teamsPath });

  // GET /api/teams/:team/members/:member/session
  // Returns session registration info for a member
  fastify.get('/:team/members/:member/session', async (request, reply) => {
    const { team, member } = request.params as { team: string; member: string };

    const session = sessionReader.getMemberSession(team, member);

    if (!session) {
      reply.status(404);
      return {
        success: false,
        error: 'Session not registered'
      } as ApiResponse<never>;
    }

    return {
      success: true,
      data: session
    } as ApiResponse<typeof session>;
  });

  // GET /api/teams/:team/members/:member/conversation
  // Returns conversation history for a member's session
  fastify.get('/:team/members/:member/conversation', async (request, _reply) => {
    const { team, member } = request.params as { team: string; member: string };
    const query = request.query as { limit?: string };

    const limit = query.limit ? parseInt(query.limit, 10) : 50;

    const conversation = sessionReader.getMemberConversation(team, member, limit);

    return {
      success: true,
      data: conversation
    } as ApiResponse<typeof conversation>;
  });

  // GET /api/teams/:team/members/sessions
  // List all registered sessions for a team
  fastify.get('/:team/members/sessions', async (request, _reply) => {
    const { team } = request.params as { team: string };

    const sessions = sessionReader.listMemberSessions(team);

    return {
      success: true,
      data: { sessions }
    } as ApiResponse<{ sessions: typeof sessions }>;
  });
}

export default memberSessionRoutes;

import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
import type { ApiResponse, Team } from '@shared/types';

export async function teamRoutes(fastify: FastifyInstance, options: { db: DatabaseService }) {
  const { db } = options;

  // GET /api/teams - Get all teams
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as { acceptsCrossTeamMessages?: string };
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
      } as ApiResponse<{ teams: Team[] }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch teams'
      } as ApiResponse<never>;
    }
  });

  // GET /api/teams/:name - Get single team
  fastify.get('/:name', async (request, reply) => {
    const { name } = request.params as { name: string };

    try {
      const team = await db.getTeam(name);

      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: 'Team not found'
        } as ApiResponse<never>;
      }

      return {
        success: true,
        data: { team }
      } as ApiResponse<{ team: Team }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch team'
      } as ApiResponse<never>;
    }
  });

  // GET /api/teams/:name/members - Get team members
  fastify.get('/:name/members', async (request, reply) => {
    const { name } = request.params as { name: string };

    try {
      const team = await db.getTeam(name);

      if (!team) {
        reply.status(404);
        return {
          success: false,
          error: 'Team not found'
        } as ApiResponse<never>;
      }

      return {
        success: true,
        data: { members: team.members }
      } as ApiResponse<{ members: Team['members'] }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch members'
      } as ApiResponse<never>;
    }
  });
}

export default teamRoutes;

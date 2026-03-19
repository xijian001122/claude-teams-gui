import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
import type { ApiResponse, Team } from '@shared/types';

export async function archiveRoutes(fastify: FastifyInstance, options: { db: DatabaseService }) {
  const { db } = options;

  // GET /api/archive - Get archived teams
  fastify.get('/', async (_request, reply) => {
    try {
      const teams = await db.getTeams('archived');

      return {
        success: true,
        data: { teams }
      } as ApiResponse<{ teams: Team[] }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch archived teams'
      } as ApiResponse<never>;
    }
  });

  // POST /api/archive/:name/restore - Restore archived team
  fastify.post('/:name/restore', async (request, reply) => {
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

      if (team.status !== 'archived') {
        reply.status(400);
        return {
          success: false,
          error: 'Team is not archived'
        } as ApiResponse<never>;
      }

      db.updateTeamStatus(name, 'active', undefined);

      return {
        success: true
      } as ApiResponse<never>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to restore team'
      } as ApiResponse<never>;
    }
  });

  // DELETE /api/archive/:name - Permanently delete archived team
  fastify.delete('/:name', async (request, reply) => {
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

      if (team.status !== 'archived') {
        reply.status(400);
        return {
          success: false,
          error: 'Can only delete archived teams'
        } as ApiResponse<never>;
      }

      db.deleteTeam(name);

      return {
        success: true
      } as ApiResponse<never>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to delete team'
      } as ApiResponse<never>;
    }
  });
}

export default archiveRoutes;

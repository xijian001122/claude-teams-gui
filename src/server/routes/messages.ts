import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
import type { DataSyncService } from '../services';
import type { ApiResponse, Message, GetMessagesQuery, SendMessageBody } from '@shared/types';

export async function messageRoutes(
  fastify: FastifyInstance,
  options: { db: DatabaseService; dataSync: DataSyncService }
) {
  const { db, dataSync } = options;

  // GET /api/teams/:name/messages - Get messages
  fastify.get('/:name/messages', async (request, reply) => {
    const { name } = request.params as { name: string };
    const query = request.query as GetMessagesQuery;

    try {
      const limit = Math.min(query.limit || 50, 200);

      const messages = await db.getMessages(name, {
        before: query.before,
        limit,
        to: query.to,
        instance: query.instance
      });

      const hasMore = messages.length === limit;

      // Extract instance metadata
      const instances = new Set<string>();
      const sourceProjects = new Set<string>();
      messages.forEach(msg => {
        if (msg.teamInstance) instances.add(msg.teamInstance);
        if (msg.sourceProject) sourceProjects.add(msg.sourceProject);
      });

      return {
        success: true,
        data: {
          messages,
          hasMore,
          metadata: {
            instances: Array.from(instances),
            sourceProjects: Array.from(sourceProjects)
          }
        }
      } as ApiResponse<{ messages: Message[]; hasMore: boolean; metadata: { instances: string[]; sourceProjects: string[] } }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch messages'
      } as ApiResponse<never>;
    }
  });

  // POST /api/teams/:name/messages - Send message
  fastify.post('/:name/messages', async (request, reply) => {
    const { name } = request.params as { name: string };
    const body = request.body as SendMessageBody;

    if (!body.content?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: 'Content is required'
      } as ApiResponse<never>;
    }

    try {
      // Check if this is a cross-team message
      const to = body.to || null;
      if (to && to.startsWith('team:')) {
        const targetTeam = to.slice(5); // Remove 'team:' prefix

        // Validate target team exists
        const targetTeamData = await db.getTeam(targetTeam);
        if (!targetTeamData) {
          reply.status(404);
          return {
            success: false,
            error: 'Target team not found'
          } as ApiResponse<never>;
        }

        // Check if target team allows cross-team messages
        if (!targetTeamData.allowCrossTeamMessages) {
          reply.status(403);
          return {
            success: false,
            error: 'Cross-team messaging is disabled for target team'
          } as ApiResponse<never>;
        }

        // Send cross-team message
        const result = await dataSync.sendCrossTeamMessage(
          name,
          targetTeam,
          body.content.trim(),
          body.contentType || 'text'
        );

        if (!result.success) {
          reply.status(400);
          return {
            success: false,
            error: result.error || 'Failed to send cross-team message'
          } as ApiResponse<never>;
        }

        reply.status(201);
        return {
          success: true,
          data: { message: result.message }
        } as ApiResponse<{ message: Message }>;
      }

      // Regular message
      const message = await dataSync.sendMessage(
        name,
        to,
        body.content.trim(),
        body.contentType || 'text'
      );

      reply.status(201);
      return {
        success: true,
        data: { message }
      } as ApiResponse<{ message: Message }>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to send message'
      } as ApiResponse<never>;
    }
  });

  // PUT /api/teams/:name/messages/:id - Update message
  fastify.put('/:name/messages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { content: string };

    if (!body.content?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: 'Content is required'
      } as ApiResponse<never>;
    }

    try {
      db.updateMessage(id, {
        content: body.content.trim(),
        editedAt: new Date().toISOString()
      });

      return {
        success: true
      } as ApiResponse<never>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to update message'
      } as ApiResponse<never>;
    }
  });

  // DELETE /api/teams/:name/messages/:id - Delete message
  fastify.delete('/:name/messages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      db.updateMessage(id, {
        deletedAt: new Date().toISOString()
      });

      return {
        success: true
      } as ApiResponse<never>;
    } catch (err) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to delete message'
      } as ApiResponse<never>;
    }
  });
}

export default messageRoutes;

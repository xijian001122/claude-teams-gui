import { FastifyInstance } from 'fastify';
import type { ApiResponse } from '@shared/types';
import { SessionReaderService, type ConversationMessage } from '../services/session-reader';
import type { DatabaseService } from '../db';

export interface MemberSessionRouteOptions {
  /** Override teams path for testing */
  teamsPath?: string;
  /** Database service for merging GUI-sent messages */
  db: DatabaseService;
}

export async function memberSessionRoutes(
  fastify: FastifyInstance,
  options: MemberSessionRouteOptions
) {
  const sessionReader = new SessionReaderService({ teamsPath: options.teamsPath });
  const { db } = options;

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
  // Merges: Claude CLI session JSONL + GUI-sent messages from SQLite
  fastify.get('/:team/members/:member/conversation', async (request, _reply) => {
    const { team, member } = request.params as { team: string; member: string };
    const query = request.query as { limit?: string };

    const limit = query.limit ? parseInt(query.limit, 10) : 50;

    // 1. Read Claude CLI session messages from JSONL
    const conversation = sessionReader.getMemberConversation(team, member, limit);

    // 2. Read GUI-sent messages from SQLite that target this member
    let dbMessages: ConversationMessage[] = [];
    try {
      const sentToMember = await db.getMessages(team, { to: member, limit: 100 });
      // Also get messages sent from user without specific target (team-wide)
      // that might appear in this context
      for (const msg of sentToMember) {
        dbMessages.push({
          role: msg.from === 'user' ? 'user' : 'assistant',
          type: 'text',
          content: msg.content,
          timestamp: msg.timestamp,
          senderName: msg.from || 'user',
        });
      }
    } catch (err) {
      // If DB query fails, just use session messages
    }

    // 3. Merge: add DB messages that aren't already in session messages
    const existingTimestamps = new Set(
      conversation.messages.map(m => m.timestamp)
    );
    const newDbMessages = dbMessages.filter(m => !existingTimestamps.has(m.timestamp));

    const allMessages = [...conversation.messages, ...newDbMessages];
    // Sort by timestamp
    allMessages.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });

    return {
      success: true,
      data: {
        ...conversation,
        messages: allMessages.slice(-limit),
      }
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

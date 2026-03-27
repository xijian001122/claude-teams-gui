export async function messageRoutes(fastify, options) {
    const { db, dataSync } = options;
    // GET /api/teams/:name/messages - Get messages
    fastify.get('/:name/messages', async (request, reply) => {
        const { name } = request.params;
        const query = request.query;
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
            const instances = new Set();
            const sourceProjects = new Set();
            messages.forEach(msg => {
                if (msg.teamInstance)
                    instances.add(msg.teamInstance);
                if (msg.sourceProject)
                    sourceProjects.add(msg.sourceProject);
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
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch messages'
            };
        }
    });
    // POST /api/teams/:name/messages - Send message
    fastify.post('/:name/messages', async (request, reply) => {
        const { name } = request.params;
        const body = request.body;
        if (!body.content?.trim()) {
            reply.status(400);
            return {
                success: false,
                error: 'Content is required'
            };
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
                    };
                }
                // Check if target team allows cross-team messages
                if (!targetTeamData.allowCrossTeamMessages) {
                    reply.status(403);
                    return {
                        success: false,
                        error: 'Cross-team messaging is disabled for target team'
                    };
                }
                // Send cross-team message
                const result = await dataSync.sendCrossTeamMessage(name, targetTeam, body.content.trim(), body.contentType || 'text');
                if (!result.success) {
                    reply.status(400);
                    return {
                        success: false,
                        error: result.error || 'Failed to send cross-team message'
                    };
                }
                reply.status(201);
                return {
                    success: true,
                    data: { message: result.message }
                };
            }
            // Regular message
            const message = await dataSync.sendMessage(name, to, body.content.trim(), body.contentType || 'text');
            reply.status(201);
            return {
                success: true,
                data: { message }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to send message'
            };
        }
    });
    // PUT /api/teams/:name/messages/:id - Update message
    fastify.put('/:name/messages/:id', async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        if (!body.content?.trim()) {
            reply.status(400);
            return {
                success: false,
                error: 'Content is required'
            };
        }
        try {
            db.updateMessage(id, {
                content: body.content.trim(),
                editedAt: new Date().toISOString()
            });
            return {
                success: true
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to update message'
            };
        }
    });
    // DELETE /api/teams/:name/messages/:id - Delete message
    fastify.delete('/:name/messages/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            db.updateMessage(id, {
                deletedAt: new Date().toISOString()
            });
            return {
                success: true
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to delete message'
            };
        }
    });
}
export default messageRoutes;
//# sourceMappingURL=messages.js.map
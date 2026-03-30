import { createLogger } from '../services/log-factory';
// Module logger
const log = createLogger({ module: 'Settings', shorthand: 's.r.settings' });
export async function settingsRoutes(fastify, options) {
    const { configService, onRestart } = options;
    // GET /api/settings - Get current settings
    fastify.get('/', async (_request, _reply) => {
        const config = configService.getConfig();
        // Return full config (all editable fields)
        const safeConfig = {
            port: config.port,
            host: config.host,
            dataDir: config.dataDir,
            teamsPath: config.teamsPath,
            theme: config.theme,
            desktopNotifications: config.desktopNotifications,
            soundEnabled: config.soundEnabled,
            retentionDays: config.retentionDays,
            cleanupEnabled: config.cleanupEnabled,
            cleanupTime: config.cleanupTime
        };
        return {
            success: true,
            data: safeConfig
        };
    });
    // PUT /api/settings - Update settings
    fastify.put('/', async (request, reply) => {
        const body = request.body;
        try {
            // Validate settings
            if (body.theme && !['light', 'dark', 'auto'].includes(body.theme)) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Invalid theme value'
                };
            }
            if (body.retentionDays && (body.retentionDays < 1 || body.retentionDays > 365)) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Retention days must be between 1 and 365'
                };
            }
            // Save settings via ConfigService
            const changes = configService.updateConfig(body);
            return {
                success: true,
                data: {
                    changes,
                    pendingRestart: configService.needsRestart()
                }
            };
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to save settings'
            };
        }
    });
    // GET /api/settings/pending - Get pending restart state
    fastify.get('/pending', async (_request, _reply) => {
        return {
            success: true,
            data: {
                pendingRestart: configService.needsRestart(),
                changes: configService.getPendingChanges()
            }
        };
    });
    // GET /api/settings/restart-info - Get changed config items
    fastify.get('/restart-info', async (_request, _reply) => {
        return {
            success: true,
            data: {
                needsRestart: configService.needsRestart(),
                changes: configService.getPendingChanges()
            }
        };
    });
    // POST /api/settings/restart - Restart the server
    fastify.post('/restart', async (_request, reply) => {
        if (!onRestart) {
            reply.status(501);
            return {
                success: false,
                error: 'Restart not supported in this mode'
            };
        }
        try {
            // Clear pending changes before restart
            configService.clearPendingChanges();
            // Send response before restart
            reply.send({
                success: true,
                message: 'Server restarting...'
            });
            // Trigger restart after a short delay to allow response to be sent
            setTimeout(async () => {
                try {
                    await onRestart();
                }
                catch (err) {
                    log.error(`Restart failed: ${err}`);
                }
            }, 100);
            return reply;
        }
        catch (err) {
            reply.status(500);
            return {
                success: false,
                error: 'Failed to restart server'
            };
        }
    });
}
export default settingsRoutes;
//# sourceMappingURL=settings.js.map
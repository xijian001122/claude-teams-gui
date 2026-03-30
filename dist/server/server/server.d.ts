import type { AppConfig } from '@shared/types';
import { DatabaseService } from './db';
import { DataSyncService, FileWatcherService, CleanupService, MemberStatusService } from './services';
export interface ServerOptions {
    config: AppConfig;
    dataDir: string;
}
export declare function createServer(options: ServerOptions): Promise<{
    fastify: import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault> & PromiseLike<import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
    db: DatabaseService;
    dataSync: DataSyncService;
    fileWatcher: FileWatcherService;
    cleanupService: CleanupService;
    memberStatusService: MemberStatusService;
}>;
export default createServer;
//# sourceMappingURL=server.d.ts.map
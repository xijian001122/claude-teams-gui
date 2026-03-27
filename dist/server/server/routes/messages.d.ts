import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
import type { DataSyncService } from '../services';
export declare function messageRoutes(fastify: FastifyInstance, options: {
    db: DatabaseService;
    dataSync: DataSyncService;
}): Promise<void>;
export default messageRoutes;
//# sourceMappingURL=messages.d.ts.map
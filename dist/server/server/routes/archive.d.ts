import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
export declare function archiveRoutes(fastify: FastifyInstance, options: {
    db: DatabaseService;
    dataDir: string;
}): Promise<void>;
export default archiveRoutes;
//# sourceMappingURL=archive.d.ts.map
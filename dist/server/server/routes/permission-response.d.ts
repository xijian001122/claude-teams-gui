import { FastifyInstance } from 'fastify';
import type { DatabaseService } from '../db';
export declare function permissionResponseRoutes(fastify: FastifyInstance, options: {
    db: DatabaseService;
    claudeTeamsPath: string;
}): Promise<void>;
export default permissionResponseRoutes;
//# sourceMappingURL=permission-response.d.ts.map
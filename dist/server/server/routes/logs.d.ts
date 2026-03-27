import { FastifyInstance } from 'fastify';
import { ConfigService } from '../services/config';
export interface LogsRoutesOptions {
    configService: ConfigService;
}
export declare function logsRoutes(fastify: FastifyInstance, options: LogsRoutesOptions): Promise<void>;
export default logsRoutes;
//# sourceMappingURL=logs.d.ts.map
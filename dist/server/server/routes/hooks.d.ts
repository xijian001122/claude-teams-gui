import { FastifyInstance } from 'fastify';
export interface TaskCreatedBody {
    taskId: string;
    teamName: string;
    subject?: string;
    status?: string;
    owner?: string;
}
export interface HookRoutesOptions {
    fastify: FastifyInstance;
}
export declare function hooksRoutes(fastify: FastifyInstance, _options: HookRoutesOptions): Promise<void>;
export default hooksRoutes;
//# sourceMappingURL=hooks.d.ts.map
import { FastifyInstance } from 'fastify';
export interface MemberSessionRouteOptions {
    /** Override teams path for testing */
    teamsPath?: string;
}
export declare function memberSessionRoutes(fastify: FastifyInstance, options: MemberSessionRouteOptions): Promise<void>;
export default memberSessionRoutes;
//# sourceMappingURL=member-session.d.ts.map
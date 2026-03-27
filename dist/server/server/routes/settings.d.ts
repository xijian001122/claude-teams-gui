import { FastifyInstance } from 'fastify';
import { ConfigService } from '../services/config';
export interface SettingsRoutesOptions {
    configService: ConfigService;
    onRestart?: () => Promise<void>;
}
export declare function settingsRoutes(fastify: FastifyInstance, options: SettingsRoutesOptions): Promise<void>;
export default settingsRoutes;
//# sourceMappingURL=settings.d.ts.map
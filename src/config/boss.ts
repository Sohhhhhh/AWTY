import { PgBoss } from 'pg-boss';
import envConfig from './env';

export const boss = new PgBoss(envConfig.DATABASE_URL);
boss.on('error', console.error);

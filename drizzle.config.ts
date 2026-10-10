import { defineConfig } from 'drizzle-kit';
import env from './src/config/env';
export default defineConfig({
  dialect: 'postgresql',
  out: `./src/drizzle/migrations`,
  schema: `./src/drizzle/schema/*`,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});

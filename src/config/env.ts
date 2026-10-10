import { z } from 'zod';
import path from 'path';
import { config } from 'dotenv';

config({ quiet: true, path: path.join(process.cwd(), '.env') });

const envConfig = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    DATABASE_URL: z.string(),
  })
  .parse(process.env);

export default envConfig;

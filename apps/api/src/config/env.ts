import { z } from 'zod';

const booleanEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:4200'),
  JIRA_BASE_URL: z.string().default('https://aquera.atlassian.net/browse'),
  CSV_SEED_PATH: z.string().default('./apps/api/data/projects-filtered-20260713-1412.csv'),
  STATIC_DIR: z.string().optional(),
  AUTO_SEED: booleanEnv.default(false)
});

export const env = envSchema.parse(process.env);

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:4200'),
  JIRA_BASE_URL: z.string().default('https://aquera.atlassian.net/browse'),
  CSV_SEED_PATH: z.string().default('./data/projects-filtered-20260713-1412.csv')
});

export const env = envSchema.parse(process.env);

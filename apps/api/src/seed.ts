import 'dotenv/config';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { importProjectsFromCsv } from './services/csv-import.service.js';

const result = await importProjectsFromCsv(env.CSV_SEED_PATH);
console.log(JSON.stringify(result, null, 2));
await prisma.$disconnect();

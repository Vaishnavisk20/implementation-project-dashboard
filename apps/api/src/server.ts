import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { importRouter } from './routes/import.routes.js';
import { projectRouter } from './routes/project.routes.js';
import { importProjectsFromCsv } from './services/csv-import.service.js';

const app = express();
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const defaultStaticDir = path.resolve(currentDir, '../../../apps/web/dist/implementation-dashboard/browser');
const staticDir = path.resolve(env.STATIC_DIR ?? defaultStaticDir);

app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = env.WEB_ORIGIN.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/projects', projectRouter);
app.use('/api/import', importRouter);

app.use(express.static(staticDir));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
    res.sendFile(path.join(staticDir, 'index.html'));
    return;
  }
  next();
});

app.use(errorMiddleware);

async function autoSeedIfNeeded() {
  if (!env.AUTO_SEED) return;
  const count = await prisma.project.count();
  if (count > 0) return;
  const result = await importProjectsFromCsv(env.CSV_SEED_PATH);
  console.log(`Auto-seeded ${result.importedRows} projects from ${env.CSV_SEED_PATH}`);
}

autoSeedIfNeeded()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Implementation Dashboard listening on http://localhost:${env.PORT}`);
      console.log(`Serving Angular assets from ${staticDir}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Implementation Dashboard', error);
    process.exit(1);
  });

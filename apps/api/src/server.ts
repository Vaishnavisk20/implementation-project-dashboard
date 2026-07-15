import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { importRouter } from './routes/import.routes.js';
import { projectRouter } from './routes/project.routes.js';

const app = express();

app.use(helmet());
const allowedOrigins = env.WEB_ORIGIN.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/projects', projectRouter);
app.use('/api/import', importRouter);
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Implementation Dashboard API listening on http://localhost:${env.PORT}`);
});

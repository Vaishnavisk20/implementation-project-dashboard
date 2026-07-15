import fs from 'node:fs';
import multer from 'multer';
import { Router } from 'express';
import { clearData, previewUpload, resetAndSeedImport, seedImport, uploadImport } from '../controllers/import.controller.js';

fs.mkdirSync('uploads', { recursive: true });
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

export const importRouter = Router();

importRouter.post('/seed', seedImport);
importRouter.post('/reset', resetAndSeedImport);
importRouter.post('/clear', clearData);
importRouter.post('/preview', upload.single('file'), previewUpload);
importRouter.post('/upload', upload.single('file'), uploadImport);

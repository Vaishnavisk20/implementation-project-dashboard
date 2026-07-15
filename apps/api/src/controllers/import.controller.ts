import fs from 'node:fs/promises';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { getCsvHeaders, importProjectsFromCsv, readCsvRows } from '../services/csv-import.service.js';

export async function seedImport(_req: Request, res: Response) {
  res.json(await importProjectsFromCsv(env.CSV_SEED_PATH));
}

export async function resetAndSeedImport(_req: Request, res: Response) {
  const deleted = await prisma.$transaction(async (tx) => {
    const statusHistory = await tx.projectStatusHistory.deleteMany();
    const projects = await tx.project.deleteMany();
    return { statusHistory: statusHistory.count, projects: projects.count };
  });
  const importResult = await importProjectsFromCsv(env.CSV_SEED_PATH);
  res.json({ deleted, importResult });
}

export async function clearData(_req: Request, res: Response) {
  const deleted = await prisma.$transaction(async (tx) => {
    const statusHistory = await tx.projectStatusHistory.deleteMany();
    const projects = await tx.project.deleteMany();
    return { statusHistory: statusHistory.count, projects: projects.count };
  });
  res.json({ deleted, projectCount: 0 });
}

export async function uploadImport(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
  const result = await importProjectsFromCsv(req.file.path);
  await fs.unlink(req.file.path).catch(() => undefined);
  res.json(result);
}

export async function previewUpload(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
  const rows = await readCsvRows(req.file.path);
  await fs.unlink(req.file.path).catch(() => undefined);
  res.json({ headers: getCsvHeaders(), preview: rows.slice(0, 10), totalRows: rows.length });
}

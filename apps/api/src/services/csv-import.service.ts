import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import csv from 'csv-parser';
import { Prisma, type Project } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { parseCsvDate } from '../utils/dates.js';
import { calculateRisk } from './risk.service.js';

export type ImportError = {
  row: number;
  field: string;
  message: string;
  value: unknown;
};

export type ImportResult = {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  invalidRows: number;
  errors: ImportError[];
  preview: Array<Record<string, unknown>>;
};

const rowSchema = z.object({
  projectName: z.string().min(1, 'Project is required'),
  customer: z.string().min(1, 'Customer is required'),
  customerTier: z.string().nullable(),
  projectStatus: z.string().nullable(),
  competency: z.string().nullable(),
  ic: z.string().nullable(),
  secondaryIc: z.string().nullable(),
  icLead: z.string().nullable(),
  stationName: z.string().nullable(),
  estimatedGoLiveDate: z.date().nullable(),
  integrationType: z.string().nullable(),
  templateName: z.string().nullable(),
  surgeTransferable: z.boolean().nullable(),
  productDetail: z.string().nullable(),
  jiraTicketNumber: z.string().nullable(),
  developerName: z.string().nullable(),
  engineeringDueDate: z.date().nullable(),
  actionPendingOn: z.string().nullable(),
  engineeringStatus: z.string().nullable(),
  hrSource: z.string().nullable(),
  itsmSource: z.string().nullable(),
  directorySource: z.string().nullable(),
  downstreamApp: z.string().nullable(),
  useCase: z.string().nullable(),
  comment: z.string().nullable()
});

export const csvHeaderMap: Record<string, keyof z.infer<typeof rowSchema>> = {
  Project: 'projectName',
  Customer: 'customer',
  'Customer Tier': 'customerTier',
  'Project Status': 'projectStatus',
  Competency: 'competency',
  IC: 'ic',
  'Secondary IC': 'secondaryIc',
  'IC Lead': 'icLead',
  'Station Name': 'stationName',
  'Estimated Go Live Date': 'estimatedGoLiveDate',
  'Integration Type': 'integrationType',
  'Template Name': 'templateName',
  'Surge Transferable': 'surgeTransferable',
  'Product Detail': 'productDetail',
  'Jira Ticket Number': 'jiraTicketNumber',
  'Developer Name': 'developerName',
  'Engineering Due Date': 'engineeringDueDate',
  'Action Pending On': 'actionPendingOn',
  'Engineering Status': 'engineeringStatus',
  'HR Source': 'hrSource',
  'ITSM Source': 'itsmSource',
  'Directory Source': 'directorySource',
  'Downstream App': 'downstreamApp',
  'Use Case': 'useCase',
  Comment: 'comment'
};

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseBoolean(value: unknown): boolean | null {
  const normalized = normalize(value)?.toLowerCase();
  if (!normalized) return null;
  if (['yes', 'y', 'true', '1'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0'].includes(normalized)) return false;
  return null;
}

function normalizeRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};
  for (const [csvHeader, modelKey] of Object.entries(csvHeaderMap)) {
    if (modelKey === 'estimatedGoLiveDate' || modelKey === 'engineeringDueDate') {
      mapped[modelKey] = parseCsvDate(row[csvHeader]);
    } else if (modelKey === 'surgeTransferable') {
      mapped[modelKey] = parseBoolean(row[csvHeader]);
    } else {
      mapped[modelKey] = normalize(row[csvHeader]);
    }
  }
  if (!mapped.ic && mapped.secondaryIc) {
    mapped.ic = mapped.secondaryIc;
  }
  return mapped;
}

function fingerprintRow(row: Record<string, unknown>): string {
  const stableRow = Object.fromEntries(Object.keys(csvHeaderMap).sort().map((header) => [header, normalize(row[header])]));
  return crypto.createHash('sha256').update(JSON.stringify(stableRow)).digest('hex');
}

export async function readCsvRows(filePath: string): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    const rows: Array<Record<string, unknown>> = [];
    fs.createReadStream(path.resolve(filePath))
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

export async function importProjectsFromCsv(filePath: string): Promise<ImportResult> {
  const rawRows = await readCsvRows(filePath);
  const result: ImportResult = {
    totalRows: rawRows.length,
    importedRows: 0,
    skippedRows: 0,
    duplicateRows: 0,
    invalidRows: 0,
    errors: [],
    preview: rawRows.slice(0, 10)
  };

  for (const [index, rawRow] of rawRows.entries()) {
    const rowNumber = index + 2;
    const normalized = normalizeRow(rawRow);
    const sourceFingerprint = fingerprintRow(rawRow);
    const parsed = rowSchema.safeParse(normalized);

    if (!parsed.success) {
      result.invalidRows += 1;
      result.skippedRows += 1;
      for (const issue of parsed.error.issues) {
        result.errors.push({
          row: rowNumber,
          field: issue.path.join('.'),
          message: issue.message,
          value: normalized[issue.path.join('.')]
        });
      }
      continue;
    }

    const { explanation: _explanation, ...risk } = calculateRisk(parsed.data as Partial<Project>);
    const data = { ...parsed.data, sourceFingerprint, ...risk };

    try {
      await prisma.project.create({ data });
      result.importedRows += 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        result.duplicateRows += 1;
        result.skippedRows += 1;
      } else {
        result.invalidRows += 1;
        result.skippedRows += 1;
        result.errors.push({
          row: rowNumber,
          field: 'row',
          message: error instanceof Error ? error.message : 'Unknown import error',
          value: parsed.data.projectName
        });
      }
    }
  }

  return result;
}

export function getCsvHeaders(): string[] {
  return Object.keys(csvHeaderMap);
}

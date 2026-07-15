import { Parser } from 'json2csv';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { calculateRisk } from '../services/risk.service.js';
import { buildProjectWhere, getFilterOptions, getProjectAnalytics, listProjects, toPublicProject } from '../services/project-query.service.js';
import { daysUntil } from '../utils/dates.js';

const nullableString = z.preprocess((value) => (value === '' ? null : value), z.string().nullable().optional());
const dateField = z.preprocess((value) => (value ? new Date(String(value)) : null), z.date().nullable().optional());

export const projectSchema = z.object({
  projectName: z.string().min(1),
  customer: z.string().min(1),
  customerTier: nullableString,
  projectStatus: nullableString,
  competency: nullableString,
  ic: nullableString,
  secondaryIc: nullableString,
  icLead: nullableString,
  stationName: nullableString,
  estimatedGoLiveDate: dateField,
  integrationType: nullableString,
  templateName: nullableString,
  surgeTransferable: z.boolean().nullable().optional(),
  productDetail: nullableString,
  jiraTicketNumber: nullableString,
  developerName: nullableString,
  engineeringDueDate: dateField,
  actionPendingOn: nullableString,
  engineeringStatus: nullableString,
  hrSource: nullableString,
  itsmSource: nullableString,
  directorySource: nullableString,
  downstreamApp: nullableString,
  useCase: nullableString,
  comment: nullableString
});

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(25),
  sortBy: z.string().default('estimatedGoLiveDate'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
  filters: z.string().optional()
});

function normalizeProjectPayload<T extends { ic?: string | null; secondaryIc?: string | null }>(payload: T): T {
  if (!payload.ic && payload.secondaryIc) {
    return { ...payload, ic: payload.secondaryIc };
  }
  return payload;
}

function parseFilters(value?: string) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function projectId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function getProjects(req: Request, res: Response) {
  const query = listSchema.parse(req.query);
  const payload = await listProjects({ ...query, filters: parseFilters(query.filters) });
  res.json(payload);
}

export async function getProject(req: Request, res: Response) {
  const project = await prisma.project.findUnique({
    where: { id: projectId(req) },
    include: { statusHistory: { orderBy: { changedAt: 'desc' } } }
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const risk = calculateRisk(project);
  const { sourceFingerprint: _sourceFingerprint, ...publicProject } = project;
  res.json({ ...publicProject, daysRemaining: daysUntil(project.estimatedGoLiveDate), riskExplanation: risk.explanation });
}

export async function createProject(req: Request, res: Response) {
  const parsed = normalizeProjectPayload(projectSchema.parse(req.body));
  const { explanation: _explanation, ...risk } = calculateRisk(parsed);
  const project = await prisma.project.create({ data: { ...parsed, ...risk } });
  res.status(201).json(project);
}

export async function updateProject(req: Request, res: Response) {
  const id = projectId(req);
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Project not found' });
  const parsed = normalizeProjectPayload(projectSchema.partial().parse(req.body));
  const candidate = { ...existing, ...parsed };
  const { explanation: _explanation, ...risk } = calculateRisk(candidate);
  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({ where: { id }, data: { ...parsed, ...risk } });
    if (parsed.projectStatus !== undefined && parsed.projectStatus !== existing.projectStatus) {
      await tx.projectStatusHistory.create({
        data: {
          projectId: id,
          previousStatus: existing.projectStatus,
          newStatus: parsed.projectStatus,
          changedBy: String(req.headers['x-user'] ?? 'Dashboard User'),
          comment: parsed.comment ?? null
        }
      });
    }
    return updated;
  });
  res.json(project);
}

export async function deleteProject(req: Request, res: Response) {
  await prisma.project.delete({ where: { id: projectId(req) } });
  res.status(204).send();
}

export async function analytics(_req: Request, res: Response) {
  res.json(await getProjectAnalytics());
}

export async function filters(_req: Request, res: Response) {
  res.json(await getFilterOptions());
}

export async function exportProjects(req: Request, res: Response) {
  const projects = await prisma.project.findMany({ where: buildProjectWhere(parseFilters(String(req.query.filters ?? ''))) });
  const parser = new Parser({
    fields: [
      { label: 'Project', value: 'projectName' },
      { label: 'Customer', value: 'customer' },
      { label: 'Customer Tier', value: 'customerTier' },
      { label: 'Project Status', value: 'projectStatus' },
      { label: 'Competency', value: 'competency' },
      { label: 'IC', value: 'ic' },
      { label: 'Secondary IC', value: 'secondaryIc' },
      { label: 'IC Lead', value: 'icLead' },
      { label: 'Station Name', value: 'stationName' },
      { label: 'Estimated Go Live Date', value: 'estimatedGoLiveDate' },
      { label: 'Integration Type', value: 'integrationType' },
      { label: 'Template Name', value: 'templateName' },
      { label: 'Surge Transferable', value: 'surgeTransferable' },
      { label: 'Product Detail', value: 'productDetail' },
      { label: 'Jira Ticket Number', value: 'jiraTicketNumber' },
      { label: 'Developer Name', value: 'developerName' },
      { label: 'Engineering Due Date', value: 'engineeringDueDate' },
      { label: 'Action Pending On', value: 'actionPendingOn' },
      { label: 'Engineering Status', value: 'engineeringStatus' },
      { label: 'HR Source', value: 'hrSource' },
      { label: 'ITSM Source', value: 'itsmSource' },
      { label: 'Directory Source', value: 'directorySource' },
      { label: 'Downstream App', value: 'downstreamApp' },
      { label: 'Use Case', value: 'useCase' },
      { label: 'Comment', value: 'comment' }
    ]
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('implementation-projects.csv');
  res.send(parser.parse(projects.map(toPublicProject)));
}

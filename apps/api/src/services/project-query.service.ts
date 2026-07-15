import { Prisma, type Project } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { daysUntil } from '../utils/dates.js';
import { isActiveStatus } from './risk.service.js';

export type ProjectFilters = {
  search?: string;
  customer?: string[];
  customerTier?: string[];
  projectStatus?: string[];
  ic?: string[];
  secondaryIc?: string[];
  icLead?: string[];
  competency?: string[];
  integrationType?: string[];
  surgeTransferable?: boolean;
  engineeringStatus?: string[];
  riskLevel?: string[];
  goLiveFrom?: string;
  goLiveTo?: string;
  engineeringFrom?: string;
  engineeringTo?: string;
  hasJiraTicket?: boolean;
  hasProductDetail?: boolean;
  assignment?: 'assigned' | 'unassigned';
};

export function toPublicProject(project: Project) {
  const { sourceFingerprint: _sourceFingerprint, ...publicProject } = project;
  return publicProject;
}

function arrayFilter(field: keyof Prisma.ProjectWhereInput, values?: string[]) {
  return values?.length ? { [field]: { in: values } } : {};
}

export function buildProjectWhere(filters: ProjectFilters): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {
    ...arrayFilter('customer', filters.customer),
    ...arrayFilter('customerTier', filters.customerTier),
    ...arrayFilter('projectStatus', filters.projectStatus),
    ...arrayFilter('ic', filters.ic),
    ...arrayFilter('secondaryIc', filters.secondaryIc),
    ...arrayFilter('icLead', filters.icLead),
    ...arrayFilter('competency', filters.competency),
    ...arrayFilter('integrationType', filters.integrationType),
    ...arrayFilter('engineeringStatus', filters.engineeringStatus),
    ...arrayFilter('riskLevel', filters.riskLevel)
  };

  if (filters.search) {
    where.OR = ['projectName', 'customer', 'ic', 'secondaryIc', 'developerName', 'jiraTicketNumber', 'comment'].map((field) => ({
      [field]: { contains: filters.search, mode: 'insensitive' }
    }));
  }
  if (filters.surgeTransferable !== undefined) where.surgeTransferable = filters.surgeTransferable;
  if (filters.hasJiraTicket !== undefined) where.jiraTicketNumber = filters.hasJiraTicket ? { not: null } : null;
  if (filters.hasProductDetail !== undefined) where.productDetail = filters.hasProductDetail ? { not: null } : null;
  if (filters.assignment === 'assigned') where.ic = { not: null };
  if (filters.assignment === 'unassigned') where.ic = null;
  if (filters.goLiveFrom || filters.goLiveTo) {
    where.estimatedGoLiveDate = {
      gte: filters.goLiveFrom ? new Date(filters.goLiveFrom) : undefined,
      lte: filters.goLiveTo ? new Date(filters.goLiveTo) : undefined
    };
  }
  if (filters.engineeringFrom || filters.engineeringTo) {
    where.engineeringDueDate = {
      gte: filters.engineeringFrom ? new Date(filters.engineeringFrom) : undefined,
      lte: filters.engineeringTo ? new Date(filters.engineeringTo) : undefined
    };
  }
  return where;
}

export async function listProjects(input: {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: ProjectFilters;
}) {
  const where = buildProjectWhere(input.filters);
  const allowedSorts = new Set(['customer', 'projectName', 'customerTier', 'projectStatus', 'ic', 'estimatedGoLiveDate', 'engineeringStatus', 'riskLevel', 'updatedAt']);
  const sortBy = allowedSorts.has(input.sortBy) ? input.sortBy : 'estimatedGoLiveDate';
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [sortBy]: input.sortDirection },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    }),
    prisma.project.count({ where })
  ]);

  return {
    items: items.map((project) => ({ ...toPublicProject(project), daysRemaining: daysUntil(project.estimatedGoLiveDate) })),
    total,
    page: input.page,
    pageSize: input.pageSize
  };
}

export async function getFilterOptions() {
  const fields = ['customer', 'customerTier', 'projectStatus', 'ic', 'secondaryIc', 'icLead', 'competency', 'integrationType', 'engineeringStatus', 'riskLevel'] as const;
  const entries = await Promise.all(
    fields.map(async (field) => {
      const rows = await prisma.project.findMany({ distinct: [field], select: { [field]: true }, orderBy: { [field]: 'asc' } });
      return [field, rows.map((row) => row[field]).filter(Boolean)] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function getProjectAnalytics() {
  const projects = await prisma.project.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };

  const group = (key: keyof (typeof projects)[number]) => {
    const counts = new Map<string, number>();
    for (const project of projects) counts.set(String(project[key] ?? 'Unassigned'), (counts.get(String(project[key] ?? 'Unassigned')) ?? 0) + 1);
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  };

  const active = projects.filter((project) => isActiveStatus(project.projectStatus));
  const upcoming30 = projects.filter((project) => {
    if (!project.estimatedGoLiveDate) return false;
    return project.estimatedGoLiveDate >= today && project.estimatedGoLiveDate <= inDays(30);
  });
  const overdue = projects.filter((project) => project.estimatedGoLiveDate && project.estimatedGoLiveDate < today && !String(project.projectStatus ?? '').toLowerCase().includes('completed'));
  const requiringEngineering = projects.filter((project) => project.jiraTicketNumber || project.engineeringStatus || project.productDetail?.toLowerCase().includes('missing'));
  const monthCounts = new Map<string, number>();
  for (const project of projects) {
    if (!project.estimatedGoLiveDate) continue;
    const key = project.estimatedGoLiveDate.toISOString().slice(0, 7);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  const completeness = projects.map((project) => {
    const required = ['projectName', 'customer', 'customerTier', 'projectStatus', 'ic', 'estimatedGoLiveDate', 'integrationType', 'templateName', 'productDetail'] as const;
    const missingFields = required.filter((field) => !project[field]);
    const score = Math.round(((required.length - missingFields.length) / required.length) * 100);
    return { id: project.id, projectName: project.projectName, customer: project.customer, missingFields, score };
  });

  return {
    kpis: {
      totalProjects: projects.length,
      activeProjects: active.length,
      upcomingGoLives: upcoming30.length,
      overdueProjects: overdue.length,
      onHoldProjects: projects.filter((project) => project.projectStatus?.toLowerCase().includes('hold')).length,
      projectsRequiringEngineering: requiringEngineering.length,
      surgeTransferableProjects: projects.filter((project) => project.surgeTransferable).length,
      unassignedProjects: projects.filter((project) => !project.ic).length,
      missingGoLiveDates: projects.filter((project) => !project.estimatedGoLiveDate).length,
      highRiskProjects: projects.filter((project) => ['High', 'Critical'].includes(project.riskLevel)).length
    },
    charts: {
      statusDistribution: group('projectStatus'),
      customerTierDistribution: group('customerTier'),
      integrationTypeDistribution: group('integrationType'),
      competencyDistribution: group('competency'),
      projectsByIc: group('ic'),
      riskDistribution: group('riskLevel'),
      engineeringStatusDistribution: group('engineeringStatus'),
      goLiveTrend: [...monthCounts.entries()].sort().map(([name, value]) => ({ name, value }))
    },
    planning: {
      within7: projects.filter((project) => {
        const days = daysUntil(project.estimatedGoLiveDate);
        return days !== null && days >= 0 && days <= 7;
      }),
      within14: projects.filter((project) => {
        const days = daysUntil(project.estimatedGoLiveDate);
        return days !== null && days >= 0 && days <= 14;
      }),
      within30: upcoming30,
      overdue,
      missingDates: projects.filter((project) => !project.estimatedGoLiveDate)
    },
    workload: buildWorkload(projects),
    engineering: {
      requiringEngineering,
      missingDevelopers: requiringEngineering.filter((project) => !project.developerName),
      overdueEngineering: projects.filter((project) => project.engineeringDueDate && project.engineeringDueDate < today),
      pendingAction: projects.filter((project) => project.actionPendingOn),
      productGaps: projects.filter((project) => project.productDetail?.toLowerCase().includes('missing'))
    },
    dataQuality: {
      completenessPercentage: projects.length ? Math.round(completeness.reduce((sum, row) => sum + row.score, 0) / projects.length) : 100,
      missingIcCount: projects.filter((project) => !project.ic).length,
      missingGoLiveDateCount: projects.filter((project) => !project.estimatedGoLiveDate).length,
      missingEngineeringStatusCount: projects.filter((project) => !project.engineeringStatus).length,
      missingTemplateNameCount: projects.filter((project) => !project.templateName).length,
      missingProductDetailCount: projects.filter((project) => !project.productDetail).length,
      missingDeveloperCount: projects.filter((project) => !project.developerName).length,
      missingCustomerTierCount: projects.filter((project) => !project.customerTier).length,
      duplicateProjectCount: projects.length - new Set(projects.map((project) => `${project.customer}|${project.projectName}|${project.integrationType}`)).size,
      invalidDateCount: 0,
      incompleteProjects: completeness.filter((row) => row.missingFields.length)
    }
  };
}

function buildWorkload(projects: Awaited<ReturnType<typeof prisma.project.findMany>>) {
  const consultants = new Map<string, { name: string; total: number; active: number; highRisk: number; upcoming: number; surge: number; status: string }>();
  for (const project of projects) {
    const name = project.ic ?? 'Unassigned';
    const row = consultants.get(name) ?? { name, total: 0, active: 0, highRisk: 0, upcoming: 0, surge: 0, status: 'Normal' };
    row.total += 1;
    if (isActiveStatus(project.projectStatus)) row.active += 1;
    if (['High', 'Critical'].includes(project.riskLevel)) row.highRisk += 1;
    const days = daysUntil(project.estimatedGoLiveDate);
    if (days !== null && days >= 0 && days <= 30) row.upcoming += 1;
    if (project.surgeTransferable) row.surge += 1;
    row.status = row.active > 10 ? 'High' : row.active > 5 ? 'Medium' : 'Normal';
    consultants.set(name, row);
  }
  return [...consultants.values()].sort((a, b) => b.active - a.active);
}

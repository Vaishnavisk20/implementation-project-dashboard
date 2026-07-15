import projectsSeed from './projects.json' assert { type: 'json' };

const state = {
  projects: projectsSeed.map((project) => ({ ...project }))
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}

function csv(data) {
  return new Response(data, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="implementation-projects.csv"'
    }
  });
}

function parseFilters(url) {
  const raw = url.searchParams.get('filters');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function asDate(value) {
  return value ? new Date(value) : null;
}

function daysUntil(value) {
  const date = asDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function matchesFilters(project, filters) {
  const includes = (field, values) => !Array.isArray(values) || values.length === 0 || values.includes(project[field]);
  if (filters.search) {
    const needle = String(filters.search).toLowerCase();
    const haystack = [project.projectName, project.customer, project.ic, project.secondaryIc, project.developerName, project.jiraTicketNumber, project.comment]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (!includes('customer', filters.customer)) return false;
  if (!includes('customerTier', filters.customerTier)) return false;
  if (!includes('projectStatus', filters.projectStatus)) return false;
  if (!includes('ic', filters.ic)) return false;
  if (!includes('secondaryIc', filters.secondaryIc)) return false;
  if (!includes('icLead', filters.icLead)) return false;
  if (!includes('competency', filters.competency)) return false;
  if (!includes('integrationType', filters.integrationType)) return false;
  if (!includes('engineeringStatus', filters.engineeringStatus)) return false;
  if (!includes('riskLevel', filters.riskLevel)) return false;
  if (filters.surgeTransferable !== undefined && project.surgeTransferable !== filters.surgeTransferable) return false;
  if (filters.assignment === 'assigned' && !project.ic) return false;
  if (filters.assignment === 'unassigned' && project.ic) return false;
  if (filters.hasJiraTicket !== undefined && Boolean(project.jiraTicketNumber) !== filters.hasJiraTicket) return false;
  if (filters.hasProductDetail !== undefined && Boolean(project.productDetail) !== filters.hasProductDetail) return false;
  return true;
}

function projectList(url) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
  const sortBy = url.searchParams.get('sortBy') ?? 'estimatedGoLiveDate';
  const sortDirection = url.searchParams.get('sortDirection') === 'desc' ? 'desc' : 'asc';
  const filters = parseFilters(url);
  const filtered = state.projects.filter((project) => matchesFilters(project, filters));
  filtered.sort((a, b) => {
    const left = a[sortBy] ?? '';
    const right = b[sortBy] ?? '';
    return String(left).localeCompare(String(right)) * (sortDirection === 'desc' ? -1 : 1);
  });
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize).map((project) => ({ ...project, daysRemaining: daysUntil(project.estimatedGoLiveDate) })),
    total: filtered.length,
    page,
    pageSize
  };
}

function group(projects, field) {
  const counts = new Map();
  for (const project of projects) {
    const key = project[field] ?? 'Unassigned';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

function isActiveStatus(status) {
  return ['onboarding', 'implementation', 'testing', 'uat', 'awaiting'].some((term) => String(status ?? '').toLowerCase().includes(term));
}

function analytics() {
  const projects = state.projects;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDays = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const active = projects.filter((project) => isActiveStatus(project.projectStatus));
  const upcoming30 = projects.filter((project) => {
    const date = asDate(project.estimatedGoLiveDate);
    return date && date >= today && date <= inDays(30);
  });
  const overdue = projects.filter((project) => {
    const date = asDate(project.estimatedGoLiveDate);
    return date && date < today && !String(project.projectStatus ?? '').toLowerCase().includes('completed');
  });
  const requiringEngineering = projects.filter((project) => project.jiraTicketNumber || project.engineeringStatus || String(project.productDetail ?? '').toLowerCase().includes('missing'));
  const monthCounts = new Map();
  for (const project of projects) {
    if (!project.estimatedGoLiveDate) continue;
    const key = project.estimatedGoLiveDate.slice(0, 7);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const required = ['projectName', 'customer', 'customerTier', 'projectStatus', 'ic', 'estimatedGoLiveDate', 'integrationType', 'templateName', 'productDetail'];
  const completeness = projects.map((project) => {
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
      onHoldProjects: projects.filter((project) => String(project.projectStatus ?? '').toLowerCase().includes('hold')).length,
      projectsRequiringEngineering: requiringEngineering.length,
      surgeTransferableProjects: projects.filter((project) => project.surgeTransferable).length,
      unassignedProjects: projects.filter((project) => !project.ic).length,
      missingGoLiveDates: projects.filter((project) => !project.estimatedGoLiveDate).length,
      highRiskProjects: projects.filter((project) => ['High', 'Critical'].includes(project.riskLevel)).length
    },
    charts: {
      statusDistribution: group(projects, 'projectStatus'),
      customerTierDistribution: group(projects, 'customerTier'),
      integrationTypeDistribution: group(projects, 'integrationType'),
      competencyDistribution: group(projects, 'competency'),
      projectsByIc: group(projects, 'ic'),
      riskDistribution: group(projects, 'riskLevel'),
      engineeringStatusDistribution: group(projects, 'engineeringStatus'),
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
      overdueEngineering: projects.filter((project) => {
        const date = asDate(project.engineeringDueDate);
        return date && date < today;
      }),
      pendingAction: projects.filter((project) => project.actionPendingOn),
      productGaps: projects.filter((project) => String(project.productDetail ?? '').toLowerCase().includes('missing'))
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

function buildWorkload(projects) {
  const consultants = new Map();
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

function filterOptions() {
  const fields = ['customer', 'customerTier', 'projectStatus', 'ic', 'secondaryIc', 'icLead', 'competency', 'integrationType', 'engineeringStatus', 'riskLevel'];
  return Object.fromEntries(fields.map((field) => [field, [...new Set(state.projects.map((project) => project[field]).filter(Boolean))].sort()]));
}

function exportProjects(url) {
  const fields = [
    ['Project', 'projectName'], ['Customer', 'customer'], ['Customer Tier', 'customerTier'], ['Project Status', 'projectStatus'], ['Competency', 'competency'],
    ['IC', 'ic'], ['Secondary IC', 'secondaryIc'], ['IC Lead', 'icLead'], ['Station Name', 'stationName'], ['Estimated Go Live Date', 'estimatedGoLiveDate'],
    ['Integration Type', 'integrationType'], ['Template Name', 'templateName'], ['Surge Transferable', 'surgeTransferable'], ['Product Detail', 'productDetail'],
    ['Jira Ticket Number', 'jiraTicketNumber'], ['Developer Name', 'developerName'], ['Engineering Due Date', 'engineeringDueDate'], ['Action Pending On', 'actionPendingOn'],
    ['Engineering Status', 'engineeringStatus'], ['HR Source', 'hrSource'], ['ITSM Source', 'itsmSource'], ['Directory Source', 'directorySource'], ['Downstream App', 'downstreamApp'],
    ['Use Case', 'useCase'], ['Comment', 'comment']
  ];
  const rows = state.projects.filter((project) => matchesFilters(project, parseFilters(url)));
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [fields.map(([label]) => escape(label)).join(','), ...rows.map((project) => fields.map(([, key]) => escape(project[key])).join(','))].join('\n');
}

async function handleApi(request, url) {
  if (url.pathname === '/api/projects' && request.method === 'GET') return json(projectList(url));
  if (url.pathname === '/api/projects/analytics' && request.method === 'GET') return json(analytics());
  if (url.pathname === '/api/projects/filters' && request.method === 'GET') return json(filterOptions());
  if (url.pathname === '/api/projects/export' && request.method === 'GET') return csv(exportProjects(url));
  const detail = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (detail && request.method === 'GET') {
    const project = state.projects.find((item) => item.id === detail[1]);
    return project ? json({ ...project, daysRemaining: daysUntil(project.estimatedGoLiveDate), riskExplanation: [] }) : json({ message: 'Project not found' }, { status: 404 });
  }
  if (url.pathname === '/api/import/reset' && request.method === 'POST') {
    state.projects = projectsSeed.map((project) => ({ ...project }));
    return json({ importedRows: state.projects.length, skippedRows: 0, duplicateRows: 0, invalidRows: 0, errors: [] });
  }
  if (url.pathname === '/api/import/clear' && request.method === 'POST') {
    state.projects = [];
    return json({ deletedProjects: true });
  }
  if (url.pathname.startsWith('/api/')) {
    return json({ message: 'This hosted demo supports dashboard, filters, details, export, reset, and clear data.' }, { status: 501 });
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiResponse = await handleApi(request, url);
    if (apiResponse) return apiResponse;

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const indexUrl = new URL('/index.html', url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  }
};

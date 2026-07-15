import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Analytics, Project, ProjectListResponse } from '../models/project.model';

export interface ProjectQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly staticMode = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);
  private readonly seedProjects$: Observable<Project[]>;
  private liveProjects?: Project[];

  constructor(private readonly http: HttpClient) {
    this.seedProjects$ = this.http.get<Project[]>('assets/projects.json').pipe(shareReplay(1));
  }

  getProjects(query: ProjectQuery): Observable<ProjectListResponse> {
    if (this.staticMode) return this.projects().pipe(map((projects) => this.listProjects(projects, query)));
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('pageSize', query.pageSize ?? 25)
      .set('sortBy', query.sortBy ?? 'estimatedGoLiveDate')
      .set('sortDirection', query.sortDirection ?? 'asc');
    if (query.filters) params = params.set('filters', JSON.stringify(query.filters));
    return this.http.get<ProjectListResponse>(`${this.baseUrl}/projects`, { params });
  }

  getProject(id: string): Observable<Project> {
    if (this.staticMode) {
      return this.projects().pipe(map((projects) => {
        const project = projects.find((item) => item.id === id);
        if (!project) throw new Error('Project not found');
        return { ...project, daysRemaining: this.daysUntil(project.estimatedGoLiveDate), riskExplanation: [] };
      }));
    }
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    if (this.staticMode) {
      const created = this.normalizeProject({ ...project, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), riskScore: 0, riskLevel: 'Low' } as Project);
      return this.projects().pipe(map((projects) => {
        this.liveProjects = [...projects, created];
        return created;
      }));
    }
    return this.http.post<Project>(`${this.baseUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    if (this.staticMode) {
      return this.projects().pipe(map((projects) => {
        const updatedProjects = projects.map((item) => item.id === id ? this.normalizeProject({ ...item, ...project, updatedAt: new Date().toISOString() }) : item);
        this.liveProjects = updatedProjects;
        const updated = updatedProjects.find((item) => item.id === id);
        if (!updated) throw new Error('Project not found');
        return updated;
      }));
    }
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    if (this.staticMode) {
      return this.projects().pipe(map((projects) => {
        this.liveProjects = projects.filter((project) => project.id !== id);
        return undefined;
      }));
    }
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  getAnalytics(): Observable<Analytics> {
    if (this.staticMode) return this.projects().pipe(map((projects) => this.analytics(projects)));
    return this.http.get<Analytics>(`${this.baseUrl}/projects/analytics`);
  }

  getFilterOptions(): Observable<Record<string, string[]>> {
    if (this.staticMode) {
      return this.projects().pipe(map((projects) => {
        const fields = ['customer', 'customerTier', 'projectStatus', 'ic', 'secondaryIc', 'icLead', 'competency', 'integrationType', 'engineeringStatus', 'riskLevel'];
        return Object.fromEntries(fields.map((field) => [field, [...new Set(projects.map((project) => project[field as keyof Project]).filter(Boolean) as string[])].sort()]));
      }));
    }
    return this.http.get<Record<string, string[]>>(`${this.baseUrl}/projects/filters`);
  }

  exportUrl(filters: Record<string, unknown>): string {
    if (this.staticMode) return 'assets/projects.csv';
    return `${this.baseUrl}/projects/export?filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  seedImport() {
    if (this.staticMode) return this.resetData();
    return this.http.post(`${this.baseUrl}/import/seed`, {});
  }

  resetData() {
    if (this.staticMode) {
      this.liveProjects = undefined;
      return this.projects().pipe(map((projects) => ({ importedRows: projects.length, skippedRows: 0, duplicateRows: 0, invalidRows: 0, errors: [] })));
    }
    return this.http.post(`${this.baseUrl}/import/reset`, {});
  }

  clearData() {
    if (this.staticMode) {
      this.liveProjects = [];
      return of({ deletedProjects: true });
    }
    return this.http.post(`${this.baseUrl}/import/clear`, {});
  }

  previewCsv(_file: File) {
    if (this.staticMode) return of({ message: 'CSV preview is available in the local full-stack app. The public GitHub Pages version uses bundled demo data.' });
    const data = new FormData();
    data.append('file', _file);
    return this.http.post(`${this.baseUrl}/import/preview`, data);
  }

  uploadCsv(_file: File) {
    if (this.staticMode) return of({ message: 'CSV upload requires the local Express/Postgres API. The public GitHub Pages version is read-only demo data.' });
    const data = new FormData();
    data.append('file', _file);
    return this.http.post(`${this.baseUrl}/import/upload`, data);
  }

  private projects(): Observable<Project[]> {
    if (this.liveProjects) return of(this.liveProjects);
    return this.seedProjects$.pipe(map((projects) => projects.map((project) => this.normalizeProject(project))));
  }

  private normalizeProject(project: Project): Project {
    return { ...project, daysRemaining: this.daysUntil(project.estimatedGoLiveDate) };
  }

  private listProjects(projects: Project[], query: ProjectQuery): ProjectListResponse {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const sortBy = query.sortBy ?? 'estimatedGoLiveDate';
    const sortDirection = query.sortDirection ?? 'asc';
    const filtered = projects.filter((project) => this.matches(project, query.filters ?? {}));
    filtered.sort((a, b) => String(a[sortBy as keyof Project] ?? '').localeCompare(String(b[sortBy as keyof Project] ?? '')) * (sortDirection === 'desc' ? -1 : 1));
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map((project) => this.normalizeProject(project)),
      total: filtered.length,
      page,
      pageSize
    };
  }

  private matches(project: Project, filters: Record<string, unknown>): boolean {
    const includes = (field: keyof Project) => {
      const values = filters[field] as string[] | undefined;
      return !Array.isArray(values) || !values.length || values.includes(String(project[field] ?? ''));
    };
    const search = String(filters['search'] ?? '').toLowerCase();
    if (search) {
      const haystack = [project.projectName, project.customer, project.ic, project.secondaryIc, project.developerName, project.jiraTicketNumber, project.comment].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (!includes('customer') || !includes('customerTier') || !includes('projectStatus') || !includes('ic') || !includes('secondaryIc') || !includes('icLead') || !includes('competency') || !includes('integrationType') || !includes('engineeringStatus') || !includes('riskLevel')) return false;
    if (filters['surgeTransferable'] !== undefined && project.surgeTransferable !== filters['surgeTransferable']) return false;
    if (filters['assignment'] === 'assigned' && !project.ic) return false;
    if (filters['assignment'] === 'unassigned' && project.ic) return false;
    if (filters['hasJiraTicket'] !== undefined && Boolean(project.jiraTicketNumber) !== filters['hasJiraTicket']) return false;
    if (filters['hasProductDetail'] !== undefined && Boolean(project.productDetail) !== filters['hasProductDetail']) return false;
    return true;
  }

  private analytics(projects: Project[]): Analytics {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inDays = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date;
    };
    const active = projects.filter((project) => this.isActive(project.projectStatus));
    const upcoming30 = projects.filter((project) => {
      const date = this.asDate(project.estimatedGoLiveDate);
      return date && date >= today && date <= inDays(30);
    });
    const overdue = projects.filter((project) => {
      const date = this.asDate(project.estimatedGoLiveDate);
      return date && date < today && !String(project.projectStatus ?? '').toLowerCase().includes('completed');
    });
    const requiringEngineering = projects.filter((project) => project.jiraTicketNumber || project.engineeringStatus || String(project.productDetail ?? '').toLowerCase().includes('missing'));
    const required = ['projectName', 'customer', 'customerTier', 'projectStatus', 'ic', 'estimatedGoLiveDate', 'integrationType', 'templateName', 'productDetail'] as const;
    const completeness = projects.map((project) => {
      const missingFields = required.filter((field) => !project[field]);
      const score = Math.round(((required.length - missingFields.length) / required.length) * 100);
      return { id: project.id, projectName: project.projectName, customer: project.customer, missingFields: [...missingFields], score };
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
        statusDistribution: this.group(projects, 'projectStatus'),
        customerTierDistribution: this.group(projects, 'customerTier'),
        integrationTypeDistribution: this.group(projects, 'integrationType'),
        competencyDistribution: this.group(projects, 'competency'),
        projectsByIc: this.group(projects, 'ic'),
        riskDistribution: this.group(projects, 'riskLevel'),
        engineeringStatusDistribution: this.group(projects, 'engineeringStatus'),
        goLiveTrend: this.goLiveTrend(projects)
      },
      planning: {
        within7: projects.filter((project) => {
          const days = this.daysUntil(project.estimatedGoLiveDate);
          return days !== null && days >= 0 && days <= 7;
        }),
        within14: projects.filter((project) => {
          const days = this.daysUntil(project.estimatedGoLiveDate);
          return days !== null && days >= 0 && days <= 14;
        }),
        within30: upcoming30,
        overdue,
        missingDates: projects.filter((project) => !project.estimatedGoLiveDate)
      },
      workload: this.workload(projects),
      engineering: {
        requiringEngineering,
        missingDevelopers: requiringEngineering.filter((project) => !project.developerName),
        overdueEngineering: projects.filter((project) => {
          const date = this.asDate(project.engineeringDueDate);
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

  private group(projects: Project[], field: keyof Project) {
    const counts = new Map<string, number>();
    for (const project of projects) counts.set(String(project[field] ?? 'Unassigned'), (counts.get(String(project[field] ?? 'Unassigned')) ?? 0) + 1);
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }

  private goLiveTrend(projects: Project[]) {
    const counts = new Map<string, number>();
    for (const project of projects) {
      if (!project.estimatedGoLiveDate) continue;
      const key = project.estimatedGoLiveDate.slice(0, 7);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort().map(([name, value]) => ({ name, value }));
  }

  private workload(projects: Project[]) {
    const rows = new Map<string, { name: string; total: number; active: number; highRisk: number; upcoming: number; surge: number; status: string }>();
    for (const project of projects) {
      const name = project.ic ?? 'Unassigned';
      const row = rows.get(name) ?? { name, total: 0, active: 0, highRisk: 0, upcoming: 0, surge: 0, status: 'Normal' };
      row.total += 1;
      if (this.isActive(project.projectStatus)) row.active += 1;
      if (['High', 'Critical'].includes(project.riskLevel)) row.highRisk += 1;
      const days = this.daysUntil(project.estimatedGoLiveDate);
      if (days !== null && days >= 0 && days <= 30) row.upcoming += 1;
      if (project.surgeTransferable) row.surge += 1;
      row.status = row.active > 10 ? 'High' : row.active > 5 ? 'Medium' : 'Normal';
      rows.set(name, row);
    }
    return [...rows.values()].sort((a, b) => b.active - a.active);
  }

  private isActive(status?: string | null): boolean {
    return ['onboarding', 'implementation', 'testing', 'uat', 'awaiting'].some((term) => String(status ?? '').toLowerCase().includes(term));
  }

  private asDate(value?: string | null): Date | null {
    return value ? new Date(value) : null;
  }

  private daysUntil(value?: string | null): number | null {
    const date = this.asDate(value);
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }
}

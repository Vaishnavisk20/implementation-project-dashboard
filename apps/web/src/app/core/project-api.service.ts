import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  constructor(private readonly http: HttpClient) {}

  getProjects(query: ProjectQuery): Observable<ProjectListResponse> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('pageSize', query.pageSize ?? 25)
      .set('sortBy', query.sortBy ?? 'estimatedGoLiveDate')
      .set('sortDirection', query.sortDirection ?? 'asc');
    if (query.filters) params = params.set('filters', JSON.stringify(query.filters));
    return this.http.get<ProjectListResponse>(`${this.baseUrl}/projects`, { params });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.baseUrl}/projects/analytics`);
  }

  getFilterOptions(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(`${this.baseUrl}/projects/filters`);
  }

  exportUrl(filters: Record<string, unknown>): string {
    return `${this.baseUrl}/projects/export?filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  seedImport() {
    return this.http.post(`${this.baseUrl}/import/seed`, {});
  }

  resetData() {
    return this.http.post(`${this.baseUrl}/import/reset`, {});
  }

  clearData() {
    return this.http.post(`${this.baseUrl}/import/clear`, {});
  }

  previewCsv(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post(`${this.baseUrl}/import/preview`, data);
  }

  uploadCsv(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post(`${this.baseUrl}/import/upload`, data);
  }
}

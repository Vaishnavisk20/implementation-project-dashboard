import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, switchMap } from 'rxjs';
import { ProjectApiService } from '../../core/project-api.service';
import { Project, ProjectListResponse } from '../../models/project.model';
import { ProjectFormComponent } from '../../shared/project-form.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [DatePipe, NgClass, NgFor, NgIf, RouterLink, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSortModule, MatTableModule, ProjectFormComponent],
  template: `
    <div class="page-head">
      <div><h1>Project Portfolio</h1><p>Search, filter, edit, export, and manage implementation projects.</p></div>
      <button mat-flat-button (click)="creating = !creating"><mat-icon>add</mat-icon>New Project</button>
    </div>

    <section class="card" *ngIf="creating">
      <app-project-form submitLabel="Create project" (submitted)="create($event)" />
    </section>

    <section class="card filter-panel">
      <form [formGroup]="filters" class="toolbar-row">
        <mat-form-field appearance="outline"><mat-label>Search</mat-label><input matInput formControlName="search" placeholder="Customer, project, IC, Jira"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="projectStatus" multiple><mat-option *ngFor="let v of options['projectStatus']" [value]="v">{{ v }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>IC</mat-label><mat-select formControlName="ic" multiple><mat-option *ngFor="let v of options['ic']" [value]="v">{{ v }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Competency</mat-label><mat-select formControlName="competency" multiple><mat-option *ngFor="let v of options['competency']" [value]="v">{{ v }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Risk</mat-label><mat-select formControlName="riskLevel" multiple><mat-option value="Low">Low</mat-option><mat-option value="Medium">Medium</mat-option><mat-option value="High">High</mat-option><mat-option value="Critical">Critical</mat-option></mat-select></mat-form-field>
        <span class="spacer"></span>
        <button mat-stroked-button type="button" (click)="reset()"><mat-icon>filter_alt_off</mat-icon>Clear</button>
        <button mat-stroked-button type="button" (click)="reload()"><mat-icon>refresh</mat-icon>Refresh</button>
        <a mat-stroked-button [href]="api.exportUrl(cleanFilters())"><mat-icon>download</mat-icon>Export CSV</a>
      </form>
    </section>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <h2>Projects</h2>
          <span class="table-meta">{{ data.total }} records · page {{ data.page }}</span>
        </div>
      </div>
      <table mat-table [dataSource]="data.items" matSort (matSortChange)="sort($event)">
        <ng-container matColumnDef="customer"><th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th><td mat-cell *matCellDef="let p"><a [routerLink]="['/projects', p.id]">{{ p.customer }}</a></td></ng-container>
        <ng-container matColumnDef="projectName"><th mat-header-cell *matHeaderCellDef mat-sort-header>Project</th><td mat-cell *matCellDef="let p">{{ p.projectName }}</td></ng-container>
        <ng-container matColumnDef="customerTier"><th mat-header-cell *matHeaderCellDef mat-sort-header>Tier</th><td mat-cell *matCellDef="let p">{{ p.customerTier || '-' }}</td></ng-container>
        <ng-container matColumnDef="projectStatus"><th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th><td mat-cell *matCellDef="let p"><span class="status-chip" [ngClass]="statusClass(p.projectStatus)">{{ p.projectStatus || 'Unknown' }}</span></td></ng-container>
        <ng-container matColumnDef="ic"><th mat-header-cell *matHeaderCellDef mat-sort-header>IC</th><td mat-cell *matCellDef="let p">{{ p.ic || 'Unassigned' }}</td></ng-container>
        <ng-container matColumnDef="secondaryIc"><th mat-header-cell *matHeaderCellDef>Secondary IC</th><td mat-cell *matCellDef="let p">{{ p.secondaryIc || '-' }}</td></ng-container>
        <ng-container matColumnDef="competency"><th mat-header-cell *matHeaderCellDef>Competency</th><td mat-cell *matCellDef="let p">{{ p.competency || '-' }}</td></ng-container>
        <ng-container matColumnDef="integrationType"><th mat-header-cell *matHeaderCellDef>Integration</th><td mat-cell *matCellDef="let p">{{ p.integrationType || '-' }}</td></ng-container>
        <ng-container matColumnDef="estimatedGoLiveDate"><th mat-header-cell *matHeaderCellDef mat-sort-header>Go-Live</th><td mat-cell *matCellDef="let p">{{ p.estimatedGoLiveDate | date:'mediumDate' }}</td></ng-container>
        <ng-container matColumnDef="daysRemaining"><th mat-header-cell *matHeaderCellDef>Days</th><td mat-cell *matCellDef="let p"><span class="metric-pill" [ngClass]="{ overdue: p.daysRemaining !== null && p.daysRemaining < 0 }">{{ p.daysRemaining ?? '-' }}</span></td></ng-container>
        <ng-container matColumnDef="engineeringStatus"><th mat-header-cell *matHeaderCellDef mat-sort-header>Engineering</th><td mat-cell *matCellDef="let p">{{ p.engineeringStatus || 'Not Required' }}</td></ng-container>
        <ng-container matColumnDef="surgeTransferable"><th mat-header-cell *matHeaderCellDef>Surge</th><td mat-cell *matCellDef="let p">{{ p.surgeTransferable ? 'Yes' : 'No' }}</td></ng-container>
        <ng-container matColumnDef="jiraTicketNumber"><th mat-header-cell *matHeaderCellDef>Jira</th><td mat-cell *matCellDef="let p" class="ellipsis">{{ p.jiraTicketNumber || '-' }}</td></ng-container>
        <ng-container matColumnDef="riskLevel"><th mat-header-cell *matHeaderCellDef mat-sort-header>Risk</th><td mat-cell *matCellDef="let p"><span class="risk-pill" [ngClass]="'risk-' + p.riskLevel">{{ p.riskLevel }}</span></td></ng-container>
        <ng-container matColumnDef="comment"><th mat-header-cell *matHeaderCellDef>Latest Comment</th><td mat-cell *matCellDef="let p" class="ellipsis">{{ p.comment || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let p"><a mat-icon-button [routerLink]="['/projects', p.id]"><mat-icon>visibility</mat-icon></a><button mat-icon-button (click)="edit(p)"><mat-icon>edit</mat-icon></button><button mat-icon-button (click)="remove(p)"><mat-icon>delete</mat-icon></button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <div class="empty" *ngIf="!data.items.length">No projects match the current filters.</div>
      <mat-paginator [length]="data.total" [pageSize]="25" [pageSizeOptions]="[10,25,50,100]" (page)="page($event)" />
    </div>
  `
})
export class PortfolioComponent implements OnInit {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sorter?: MatSort;
  columns = ['customer', 'projectName', 'customerTier', 'projectStatus', 'ic', 'secondaryIc', 'competency', 'integrationType', 'estimatedGoLiveDate', 'daysRemaining', 'engineeringStatus', 'surgeTransferable', 'jiraTicketNumber', 'riskLevel', 'comment', 'actions'];
  data: ProjectListResponse = { items: [], total: 0, page: 1, pageSize: 25 };
  options: Record<string, string[]> = {};
  creating = false;
  query: { page: number; pageSize: number; sortBy: string; sortDirection: 'asc' | 'desc' } = { page: 1, pageSize: 25, sortBy: 'estimatedGoLiveDate', sortDirection: 'asc' };
  filters = new FormBuilder().group({ search: [''], projectStatus: [[] as string[]], ic: [[] as string[]], competency: [[] as string[]], riskLevel: [[] as string[]] });

  constructor(public readonly api: ProjectApiService, private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly dialog: MatDialog) {}

  ngOnInit(): void {
    const incoming = this.route.snapshot.queryParamMap.get('filters');
    if (incoming) this.filters.patchValue(JSON.parse(incoming));
    this.api.getFilterOptions().subscribe((options) => (this.options = options));
    this.filters.valueChanges.pipe(debounceTime(250), switchMap(() => this.api.getProjects({ ...this.query, page: 1, filters: this.cleanFilters() }))).subscribe((data) => (this.data = data));
    this.reload();
  }

  cleanFilters(): Record<string, unknown> {
    return Object.fromEntries(Object.entries(this.filters.getRawValue()).filter(([, value]) => Array.isArray(value) ? value.length : value));
  }

  reload(): void {
    this.api.getProjects({ ...this.query, filters: this.cleanFilters() }).subscribe((data) => (this.data = data));
  }

  page(event: PageEvent): void {
    this.query = { ...this.query, page: event.pageIndex + 1, pageSize: event.pageSize };
    this.reload();
  }

  sort(event: Sort): void {
    this.query = { ...this.query, sortBy: event.active, sortDirection: (event.direction || 'asc') as 'asc' | 'desc' };
    this.reload();
  }

  reset(): void {
    this.filters.reset({ search: '', projectStatus: [], ic: [], competency: [], riskLevel: [] });
    this.router.navigate([], { queryParams: {} });
  }

  statusClass(status?: string | null): string {
    const value = (status ?? 'unknown').toLowerCase();
    if (value.includes('hold')) return 'status-hold';
    if (value.includes('completed') || value.includes('signed off') || value.includes('closed')) return 'status-done';
    if (value.includes('uat') || value.includes('testing')) return 'status-testing';
    if (value.includes('onboarding') || value.includes('implementation')) return 'status-active';
    return 'status-neutral';
  }

  create(project: Partial<Project>): void {
    this.api.createProject(project).subscribe(() => { this.creating = false; this.reload(); });
  }

  edit(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  remove(project: Project): void {
    if (confirm(`Delete ${project.customer} - ${project.projectName}?`)) this.api.deleteProject(project.id).subscribe(() => this.reload());
  }
}

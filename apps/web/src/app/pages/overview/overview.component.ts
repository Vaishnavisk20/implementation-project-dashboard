import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { ProjectApiService } from '../../core/project-api.service';
import { Analytics } from '../../models/project.model';
import { ChartCardComponent } from '../../shared/chart-card.component';

const kpiLabels: Record<string, { label: string; icon: string; filters: Record<string, unknown> }> = {
  totalProjects: { label: 'Total Projects', icon: 'inventory_2', filters: {} },
  activeProjects: { label: 'Active Projects', icon: 'rocket_launch', filters: { projectStatus: ['Onboarding', 'Implementation', 'Testing & UAT', 'Awaiting Go-Live'] } },
  upcomingGoLives: { label: 'Upcoming Go-Lives', icon: 'event_upcoming', filters: {} },
  overdueProjects: { label: 'Overdue Projects', icon: 'warning', filters: {} },
  onHoldProjects: { label: 'On-Hold Projects', icon: 'pause_circle', filters: { projectStatus: ['On Hold'] } },
  projectsRequiringEngineering: { label: 'Requiring Engineering', icon: 'engineering', filters: { hasJiraTicket: true } },
  surgeTransferableProjects: { label: 'Surge Transferable', icon: 'swap_horiz', filters: { surgeTransferable: true } },
  unassignedProjects: { label: 'Unassigned Projects', icon: 'person_off', filters: { assignment: 'unassigned' } },
  missingGoLiveDates: { label: 'Go-Live Date TBD', icon: 'event_busy', filters: {} },
  highRiskProjects: { label: 'High-Risk Projects', icon: 'priority_high', filters: { riskLevel: ['High', 'Critical'] } }
};

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [AsyncPipe, KeyValuePipe, NgFor, NgIf, MatIconModule, MatProgressSpinnerModule, ChartCardComponent],
  template: `
    <div class="page-head">
      <div><h1>Executive Overview</h1><p>Portfolio health, go-live pressure, risk, and ownership at a glance.</p></div>
    </div>
    <ng-container *ngIf="analytics$ | async as analytics; else loading">
      <section class="grid kpi-grid">
        <div class="card kpi" *ngFor="let item of analytics.kpis | keyvalue" (click)="openKpi(item.key)">
          <mat-icon>{{ meta(item.key).icon }}</mat-icon>
          <strong>{{ item.value }}</strong>
          <span>{{ meta(item.key).label }}</span>
        </div>
      </section>
      <section class="grid analytics-grid">
        <app-chart-card title="Project Status Distribution" [data]="analytics.charts['statusDistribution']" [horizontal]="true" />
        <app-chart-card title="Competency Distribution" [data]="analytics.charts['competencyDistribution']" [horizontal]="true" />
        <app-chart-card title="Customer Tier Distribution" [data]="analytics.charts['customerTierDistribution']" type="doughnut" />
        <app-chart-card title="Integration Type Distribution" [data]="analytics.charts['integrationTypeDistribution']" />
        <app-chart-card title="Projects by IC" [data]="analytics.charts['projectsByIc']" [horizontal]="true" />
        <app-chart-card title="Go-Live Trend" [data]="analytics.charts['goLiveTrend']" type="line" />
        <app-chart-card title="Risk Distribution" [data]="analytics.charts['riskDistribution']" type="doughnut" />
      </section>
    </ng-container>
    <ng-template #loading><mat-spinner diameter="40" /></ng-template>
  `
})
export class OverviewComponent implements OnInit {
  analytics$?: Observable<Analytics>;

  constructor(private readonly api: ProjectApiService, private readonly router: Router) {}

  ngOnInit(): void {
    this.analytics$ = this.api.getAnalytics();
  }

  meta(key: string) {
    return kpiLabels[key] ?? { label: key, icon: 'insights', filters: {} };
  }

  openKpi(key: string): void {
    this.router.navigate(['/portfolio'], { queryParams: { filters: JSON.stringify(this.meta(key).filters) } });
  }
}

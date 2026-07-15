import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { ProjectApiService } from '../../core/project-api.service';
import { Analytics, Project } from '../../models/project.model';
import { ChartCardComponent } from '../../shared/chart-card.component';

type PlanningKey = 'within7' | 'within14' | 'within30' | 'overdue' | 'missingDates';

@Component({
  selector: 'app-go-live',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, RouterLink, MatIconModule, MatTableModule, ChartCardComponent],
  template: `
    <div class="page-head"><div><h1>Go-Live Planning</h1><p>Upcoming, overdue, date-to-be-decided, calendar, and timeline views.</p></div></div>
    <ng-container *ngIf="analytics$ | async as a">
      <section class="grid kpi-grid">
        <button class="card kpi drill-card" type="button" [class.selected]="selectedKey === 'within7'" (click)="select('within7')"><mat-icon>looks_one</mat-icon><strong>{{ a.planning['within7'].length }}</strong><span>Within 7 days</span></button>
        <button class="card kpi drill-card" type="button" [class.selected]="selectedKey === 'within14'" (click)="select('within14')"><mat-icon>filter_2</mat-icon><strong>{{ a.planning['within14'].length }}</strong><span>Within 14 days</span></button>
        <button class="card kpi drill-card" type="button" [class.selected]="selectedKey === 'within30'" (click)="select('within30')"><mat-icon>calendar_month</mat-icon><strong>{{ a.planning['within30'].length }}</strong><span>Within 30 days</span></button>
        <button class="card kpi drill-card" type="button" [class.selected]="selectedKey === 'overdue'" (click)="select('overdue')"><mat-icon>error</mat-icon><strong>{{ a.planning['overdue'].length }}</strong><span>Overdue</span></button>
        <button class="card kpi drill-card" type="button" [class.selected]="selectedKey === 'missingDates'" (click)="select('missingDates')"><mat-icon>event_busy</mat-icon><strong>{{ a.planning['missingDates'].length }}</strong><span>Date TBD</span></button>
      </section>
      <section class="grid analytics-grid">
        <app-chart-card title="Monthly Go-Live Distribution" [data]="a.charts['goLiveTrend']" />
        <div class="card drill-table">
          <div class="table-toolbar compact">
            <div>
              <h2>{{ selectedLabel }} Projects</h2>
              <span class="table-meta">{{ selectedProjects(a).length }} records behind the selected card</span>
            </div>
          </div>
          <table mat-table [dataSource]="selectedProjects(a)">
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Go-Live</th><td mat-cell *matCellDef="let p">{{ p.estimatedGoLiveDate ? (p.estimatedGoLiveDate | date:'mediumDate') : 'Date TBD' }}</td></ng-container>
            <ng-container matColumnDef="customer"><th mat-header-cell *matHeaderCellDef>Customer</th><td mat-cell *matCellDef="let p">{{ p.customer }}</td></ng-container>
            <ng-container matColumnDef="project"><th mat-header-cell *matHeaderCellDef>Project</th><td mat-cell *matCellDef="let p"><a [routerLink]="['/projects', p.id]">{{ p.projectName }}</a></td></ng-container>
            <ng-container matColumnDef="ic"><th mat-header-cell *matHeaderCellDef>IC</th><td mat-cell *matCellDef="let p">{{ p.ic || 'Unassigned' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let p">{{ p.projectStatus || '-' }}</td></ng-container>
            <ng-container matColumnDef="risk"><th mat-header-cell *matHeaderCellDef>Risk</th><td mat-cell *matCellDef="let p">{{ p.riskLevel }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
          <div class="empty" *ngIf="!selectedProjects(a).length">No projects match this card.</div>
        </div>
      </section>
    </ng-container>
  `,
  styles: [`
    .drill-card {
      appearance: none;
      border: 1px solid #dfe3e8;
      text-align: left;
      font: inherit;
    }
    .drill-card.selected {
      border-color: #0b66d8;
      box-shadow: 0 0 0 2px rgba(11, 102, 216, .16);
    }
    .drill-table { padding: 0; overflow: hidden; }
    .compact { border-radius: 8px 8px 0 0; }
  `]
})
export class GoLiveComponent implements OnInit {
  analytics$?: Observable<Analytics>;
  selectedKey: PlanningKey = 'within30';
  columns = ['date', 'customer', 'project', 'ic', 'status', 'risk'];
  labels: Record<PlanningKey, string> = {
    within7: 'Within 7 days',
    within14: 'Within 14 days',
    within30: 'Within 30 days',
    overdue: 'Overdue',
    missingDates: 'Date TBD'
  };

  constructor(private readonly api: ProjectApiService) {}
  ngOnInit(): void { this.analytics$ = this.api.getAnalytics(); }

  get selectedLabel(): string {
    return this.labels[this.selectedKey];
  }

  select(key: PlanningKey): void {
    this.selectedKey = key;
  }

  selectedProjects(analytics: Analytics): Project[] {
    return analytics.planning[this.selectedKey] ?? [];
  }
}

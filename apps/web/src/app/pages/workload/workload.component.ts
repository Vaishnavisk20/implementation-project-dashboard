import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { map, Observable } from 'rxjs';
import { ProjectApiService } from '../../core/project-api.service';
import { Analytics, ChartPoint } from '../../models/project.model';
import { ChartCardComponent } from '../../shared/chart-card.component';

@Component({
  selector: 'app-workload',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, MatIconModule, MatTableModule, ChartCardComponent],
  template: `
    <div class="page-head"><div><h1>Team Workload</h1><p>Consultant load, active work, surge candidates, upcoming go-lives, and risk.</p></div></div>
    <ng-container *ngIf="viewModel$ | async as vm">
      <section class="grid analytics-grid">
        <app-chart-card title="Active Projects by IC" [data]="vm.workloadChart" [horizontal]="true" />
        <div class="card workload-table">
          <div class="table-toolbar compact">
            <div>
              <h2>Workload Table</h2>
              <span class="table-meta">{{ vm.analytics.workload.length }} consultants</span>
            </div>
          </div>
          <table mat-table [dataSource]="vm.analytics.workload">
            <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Consultant</th><td mat-cell *matCellDef="let r">{{ r.name }}</td></ng-container>
            <ng-container matColumnDef="active"><th mat-header-cell *matHeaderCellDef>Active</th><td mat-cell *matCellDef="let r">{{ r.active }}</td></ng-container>
            <ng-container matColumnDef="highRisk"><th mat-header-cell *matHeaderCellDef>High Risk</th><td mat-cell *matCellDef="let r">{{ r.highRisk }}</td></ng-container>
            <ng-container matColumnDef="upcoming"><th mat-header-cell *matHeaderCellDef>Upcoming</th><td mat-cell *matCellDef="let r">{{ r.upcoming }}</td></ng-container>
            <ng-container matColumnDef="surge"><th mat-header-cell *matHeaderCellDef>Surge</th><td mat-cell *matCellDef="let r">{{ r.surge }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let r">{{ r.status }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </div>
      </section>
      <section class="grid kpi-grid">
        <div class="card kpi" *ngFor="let r of vm.analytics.workload"><mat-icon>person</mat-icon><strong>{{ r.active }}</strong><span>{{ r.name }} · {{ r.status }}</span></div>
      </section>
    </ng-container>
  `,
  styles: [`
    .workload-table { padding: 0; overflow: hidden; }
    .compact { border-radius: 8px 8px 0 0; }
  `]
})
export class WorkloadComponent implements OnInit {
  cols = ['name', 'active', 'highRisk', 'upcoming', 'surge', 'status'];
  viewModel$?: Observable<{ analytics: Analytics; workloadChart: ChartPoint[] }>;
  constructor(private readonly api: ProjectApiService) {}
  ngOnInit(): void {
    this.viewModel$ = this.api.getAnalytics().pipe(
      map((analytics) => ({
        analytics,
        workloadChart: analytics.workload.map((row) => ({ name: row.name, value: row.active }))
      }))
    );
  }
}

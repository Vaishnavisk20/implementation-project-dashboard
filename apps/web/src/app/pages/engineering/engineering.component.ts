import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectApiService } from '../../core/project-api.service';
import { Analytics, Project } from '../../models/project.model';
import { ChartCardComponent } from '../../shared/chart-card.component';

@Component({
  selector: 'app-engineering',
  standalone: true,
  imports: [AsyncPipe, NgIf, MatIconModule, MatTableModule, ChartCardComponent],
  template: `
    <div class="page-head"><div><h1>Engineering and Risks</h1><p>Engineering dependencies, product gaps, Jira work, blockers, and high-risk projects.</p></div></div>
    <ng-container *ngIf="analytics$ | async as a">
      <section class="grid kpi-grid">
        <div class="card kpi"><mat-icon>engineering</mat-icon><strong>{{ a.engineering['requiringEngineering'].length }}</strong><span>Require engineering</span></div>
        <div class="card kpi"><mat-icon>person_off</mat-icon><strong>{{ a.engineering['missingDevelopers'].length }}</strong><span>Missing developers</span></div>
        <div class="card kpi"><mat-icon>schedule</mat-icon><strong>{{ a.engineering['overdueEngineering'].length }}</strong><span>Overdue due dates</span></div>
        <div class="card kpi"><mat-icon>pending_actions</mat-icon><strong>{{ a.engineering['pendingAction'].length }}</strong><span>Pending action</span></div>
        <div class="card kpi"><mat-icon>report_problem</mat-icon><strong>{{ a.engineering['productGaps'].length }}</strong><span>Product gaps</span></div>
      </section>
      <section class="grid analytics-grid">
        <app-chart-card title="Engineering Status Distribution" [data]="a.charts['engineeringStatusDistribution']" />
        <app-chart-card title="Risk Distribution" [data]="a.charts['riskDistribution']" type="doughnut" />
      </section>
      <div class="table-wrap">
        <table mat-table [dataSource]="a.engineering['requiringEngineering']">
          <ng-container matColumnDef="customer"><th mat-header-cell *matHeaderCellDef>Customer</th><td mat-cell *matCellDef="let p">{{ p.customer }}</td></ng-container>
          <ng-container matColumnDef="project"><th mat-header-cell *matHeaderCellDef>Project</th><td mat-cell *matCellDef="let p">{{ p.projectName }}</td></ng-container>
          <ng-container matColumnDef="jira"><th mat-header-cell *matHeaderCellDef>Jira</th><td mat-cell *matCellDef="let p"><a *ngIf="p.jiraTicketNumber" [href]="jira(p)" target="_blank">{{ p.jiraTicketNumber }}</a></td></ng-container>
          <ng-container matColumnDef="product"><th mat-header-cell *matHeaderCellDef>Product Detail</th><td mat-cell *matCellDef="let p">{{ p.productDetail }}</td></ng-container>
          <ng-container matColumnDef="developer"><th mat-header-cell *matHeaderCellDef>Developer</th><td mat-cell *matCellDef="let p">{{ p.developerName || '-' }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let p">{{ p.engineeringStatus || 'Not Required' }}</td></ng-container>
          <ng-container matColumnDef="risk"><th mat-header-cell *matHeaderCellDef>Risk</th><td mat-cell *matCellDef="let p">{{ p.riskLevel }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>
    </ng-container>
  `
})
export class EngineeringComponent implements OnInit {
  cols = ['customer', 'project', 'jira', 'product', 'developer', 'status', 'risk'];
  analytics$?: Observable<Analytics>;
  constructor(private readonly api: ProjectApiService) {}
  ngOnInit(): void { this.analytics$ = this.api.getAnalytics(); }
  jira(project: Project): string { return project.jiraTicketNumber?.startsWith('http') ? project.jiraTicketNumber : `${environment.jiraBaseUrl}/${project.jiraTicketNumber}`; }
}

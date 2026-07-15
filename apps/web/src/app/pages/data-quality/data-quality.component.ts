import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { ProjectApiService } from '../../core/project-api.service';
import { Analytics } from '../../models/project.model';

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [AsyncPipe, NgIf, MatIconModule, MatProgressBarModule, MatTableModule],
  template: `
    <div class="page-head"><div><h1>Data Quality</h1><p>Completeness scoring, duplicate signals, missing fields, and cleanup targets.</p></div></div>
    <ng-container *ngIf="analytics$ | async as a">
      <section class="card">
        <h3>Data completeness: {{ a.dataQuality.completenessPercentage }}%</h3>
        <mat-progress-bar mode="determinate" [value]="a.dataQuality.completenessPercentage" />
      </section>
      <section class="grid kpi-grid">
        <div class="card kpi"><mat-icon>person_off</mat-icon><strong>{{ a.dataQuality.missingIcCount }}</strong><span>Missing IC</span></div>
        <div class="card kpi"><mat-icon>event_busy</mat-icon><strong>{{ a.dataQuality.missingGoLiveDateCount }}</strong><span>Missing go-live</span></div>
        <div class="card kpi"><mat-icon>engineering</mat-icon><strong>{{ a.dataQuality.missingEngineeringStatusCount }}</strong><span>Missing engineering status</span></div>
        <div class="card kpi"><mat-icon>description</mat-icon><strong>{{ a.dataQuality.missingTemplateNameCount }}</strong><span>Missing template</span></div>
        <div class="card kpi"><mat-icon>inventory</mat-icon><strong>{{ a.dataQuality.missingProductDetailCount }}</strong><span>Missing product detail</span></div>
        <div class="card kpi"><mat-icon>code</mat-icon><strong>{{ a.dataQuality.missingDeveloperCount }}</strong><span>Missing developer</span></div>
        <div class="card kpi"><mat-icon>stars</mat-icon><strong>{{ a.dataQuality.missingCustomerTierCount }}</strong><span>Missing tier</span></div>
        <div class="card kpi"><mat-icon>content_copy</mat-icon><strong>{{ a.dataQuality.duplicateProjectCount }}</strong><span>Duplicate projects</span></div>
      </section>
      <div class="table-wrap">
        <table mat-table [dataSource]="a.dataQuality.incompleteProjects">
          <ng-container matColumnDef="customer"><th mat-header-cell *matHeaderCellDef>Customer</th><td mat-cell *matCellDef="let r">{{ r.customer }}</td></ng-container>
          <ng-container matColumnDef="project"><th mat-header-cell *matHeaderCellDef>Project</th><td mat-cell *matCellDef="let r">{{ r.projectName }}</td></ng-container>
          <ng-container matColumnDef="missing"><th mat-header-cell *matHeaderCellDef>Missing Fields</th><td mat-cell *matCellDef="let r">{{ r.missingFields.join(', ') }}</td></ng-container>
          <ng-container matColumnDef="score"><th mat-header-cell *matHeaderCellDef>Score</th><td mat-cell *matCellDef="let r">{{ r.score }}% · {{ grade(r.score) }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr><tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>
    </ng-container>
  `
})
export class DataQualityComponent implements OnInit {
  cols = ['customer', 'project', 'missing', 'score'];
  analytics$?: Observable<Analytics>;
  constructor(private readonly api: ProjectApiService) {}
  ngOnInit(): void { this.analytics$ = this.api.getAnalytics(); }
  grade(score: number): string { return score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Needs Attention' : 'Poor'; }
}

import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectApiService } from '../../core/project-api.service';
import { Project } from '../../models/project.model';
import { ProjectFormComponent } from '../../shared/project-form.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, MatButtonModule, MatIconModule, ProjectFormComponent],
  template: `
    <ng-container *ngIf="project">
      <div class="page-head">
        <div><h1>{{ project.customer }}</h1><p>{{ project.projectName }} · {{ project.projectStatus || 'Unknown status' }}</p></div>
        <button mat-stroked-button (click)="editing = !editing"><mat-icon>edit</mat-icon>Edit</button>
      </div>
      <section class="split">
        <div class="card">
          <h3>Project Details</h3>
          <div class="detail-grid">
            <span>Tier</span><strong>{{ project.customerTier || '-' }}</strong>
            <span>Competency</span><strong>{{ project.competency || '-' }}</strong>
            <span>IC</span><strong>{{ project.ic || 'Unassigned' }}</strong>
            <span>Secondary IC</span><strong>{{ project.secondaryIc || '-' }}</strong>
            <span>IC Lead</span><strong>{{ project.icLead || '-' }}</strong>
            <span>Station</span><strong>{{ project.stationName || '-' }}</strong>
            <span>Go-Live</span><strong>{{ project.estimatedGoLiveDate | date:'mediumDate' }} ({{ project.daysRemaining ?? '-' }} days)</strong>
            <span>Integration</span><strong>{{ project.integrationType || '-' }}</strong>
            <span>Template</span><strong>{{ project.templateName || '-' }}</strong>
            <span>Surge Transferable</span><strong>{{ project.surgeTransferable ? 'Yes' : 'No' }}</strong>
            <span>Product Detail</span><strong>{{ project.productDetail || '-' }}</strong>
            <span>Jira</span><strong>{{ project.jiraTicketNumber || '-' }}</strong>
            <span>Developer</span><strong>{{ project.developerName || '-' }}</strong>
            <span>Engineering Due</span><strong>{{ project.engineeringDueDate | date:'mediumDate' }}</strong>
            <span>Action Pending On</span><strong>{{ project.actionPendingOn || '-' }}</strong>
            <span>Engineering Status</span><strong>{{ project.engineeringStatus || '-' }}</strong>
            <span>Sources</span><strong>HR: {{ project.hrSource || '-' }} · ITSM: {{ project.itsmSource || '-' }} · Directory: {{ project.directorySource || '-' }}</strong>
            <span>Downstream App</span><strong>{{ project.downstreamApp || '-' }}</strong>
            <span>Use Case</span><strong>{{ project.useCase || '-' }}</strong>
            <span>Comment</span><strong>{{ project.comment || '-' }}</strong>
            <span>Risk</span><strong>{{ project.riskLevel }} · {{ project.riskScore }}</strong>
            <span>Updated</span><strong>{{ project.updatedAt | date:'medium' }}</strong>
          </div>
        </div>
        <div class="card">
          <h3>Progress Tracker</h3>
          <ol class="tracker"><li *ngFor="let step of steps" [class.done]="isDone(step)">{{ step }}</li></ol>
          <h3>Risk Explanation</h3>
          <p *ngFor="let reason of project.riskExplanation">{{ reason }}</p>
          <h3>Status History</h3>
          <p *ngFor="let h of project.statusHistory">{{ h.changedAt | date:'short' }} · {{ h.previousStatus || '-' }} → {{ h.newStatus || '-' }}</p>
        </div>
      </section>
      <section class="card" *ngIf="editing">
        <app-project-form [project]="project" submitLabel="Update project" (submitted)="save($event)" />
      </section>
    </ng-container>
  `,
  styles: [`.detail-grid { display: grid; grid-template-columns: 180px 1fr; gap: 10px 14px; } .detail-grid span { color: #5f6c7b; } .tracker { padding-left: 22px; } .tracker li { margin: 8px 0; color: #7a869a; } .tracker li.done { color: #1f7a39; font-weight: 700; }`]
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;
  editing = false;
  steps = ['Onboarding', 'Requirement Gathering', 'Configuration', 'Implementation', 'Testing and UAT', 'Awaiting Go-Live', 'Go Live Completed'];
  constructor(private readonly api: ProjectApiService, private readonly route: ActivatedRoute) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.api.getProject(this.route.snapshot.params['id']).subscribe((project) => (this.project = project)); }
  save(update: Partial<Project>): void { if (this.project) this.api.updateProject(this.project.id, update).subscribe(() => { this.editing = false; this.load(); }); }
  isDone(step: string): boolean { return this.steps.indexOf(step) <= this.steps.findIndex((item) => item.toLowerCase().includes(String(this.project?.projectStatus ?? '').toLowerCase().split('&')[0].trim())); }
}

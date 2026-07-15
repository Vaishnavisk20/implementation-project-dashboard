import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <form [formGroup]="form" class="form-grid" (ngSubmit)="save()">
      <mat-form-field><mat-label>Customer</mat-label><input matInput formControlName="customer" required></mat-form-field>
      <mat-form-field><mat-label>Project</mat-label><input matInput formControlName="projectName" required></mat-form-field>
      <mat-form-field><mat-label>Tier</mat-label><mat-select formControlName="customerTier"><mat-option value="Bronze">Bronze</mat-option><mat-option value="Silver">Silver</mat-option><mat-option value="Gold">Gold</mat-option><mat-option value="Platinum">Platinum</mat-option></mat-select></mat-form-field>
      <mat-form-field><mat-label>Status</mat-label><input matInput formControlName="projectStatus"></mat-form-field>
      <mat-form-field><mat-label>Competency</mat-label><input matInput formControlName="competency"></mat-form-field>
      <mat-form-field><mat-label>IC</mat-label><input matInput formControlName="ic"></mat-form-field>
      <mat-form-field><mat-label>Secondary IC</mat-label><input matInput formControlName="secondaryIc"></mat-form-field>
      <mat-form-field><mat-label>IC Lead</mat-label><input matInput formControlName="icLead"></mat-form-field>
      <mat-form-field><mat-label>Station Name</mat-label><input matInput formControlName="stationName"></mat-form-field>
      <mat-form-field><mat-label>Integration Type</mat-label><input matInput formControlName="integrationType"></mat-form-field>
      <mat-form-field><mat-label>Template Name</mat-label><input matInput formControlName="templateName"></mat-form-field>
      <mat-form-field><mat-label>Estimated Go-Live</mat-label><input matInput type="date" formControlName="estimatedGoLiveDate"></mat-form-field>
      <mat-form-field><mat-label>Engineering Due Date</mat-label><input matInput type="date" formControlName="engineeringDueDate"></mat-form-field>
      <mat-form-field><mat-label>Jira Ticket</mat-label><input matInput formControlName="jiraTicketNumber"></mat-form-field>
      <mat-form-field><mat-label>Developer</mat-label><input matInput formControlName="developerName"></mat-form-field>
      <mat-form-field><mat-label>Action Pending On</mat-label><input matInput formControlName="actionPendingOn"></mat-form-field>
      <mat-form-field><mat-label>Engineering Status</mat-label><input matInput formControlName="engineeringStatus"></mat-form-field>
      <mat-form-field><mat-label>HR Source</mat-label><input matInput formControlName="hrSource"></mat-form-field>
      <mat-form-field><mat-label>ITSM Source</mat-label><input matInput formControlName="itsmSource"></mat-form-field>
      <mat-form-field><mat-label>Directory Source</mat-label><input matInput formControlName="directorySource"></mat-form-field>
      <mat-form-field><mat-label>Downstream App</mat-label><input matInput formControlName="downstreamApp"></mat-form-field>
      <mat-form-field><mat-label>Use Case</mat-label><input matInput formControlName="useCase"></mat-form-field>
      <mat-form-field class="full"><mat-label>Product Detail</mat-label><textarea matInput rows="2" formControlName="productDetail"></textarea></mat-form-field>
      <mat-form-field class="full"><mat-label>Comment</mat-label><textarea matInput rows="3" formControlName="comment"></textarea></mat-form-field>
      <mat-checkbox formControlName="surgeTransferable">Surge transferable</mat-checkbox>
      <div class="full"><button mat-flat-button type="submit" [disabled]="form.invalid">{{ submitLabel }}</button></div>
    </form>
  `
})
export class ProjectFormComponent implements OnChanges {
  @Input() project?: Project | null;
  @Input() submitLabel = 'Save project';
  @Output() submitted = new EventEmitter<Partial<Project>>();

  private readonly builder = new FormBuilder();
  form = this.builder.group({
    customer: ['', Validators.required],
    projectName: ['', Validators.required],
    customerTier: [''],
    projectStatus: [''],
    ic: [''],
    secondaryIc: [''],
    icLead: [''],
    stationName: [''],
    competency: [''],
    integrationType: [''],
    templateName: [''],
    estimatedGoLiveDate: [''],
    engineeringDueDate: [''],
    engineeringStatus: [''],
    jiraTicketNumber: [''],
    developerName: [''],
    actionPendingOn: [''],
    hrSource: [''],
    itsmSource: [''],
    directorySource: [''],
    downstreamApp: [''],
    useCase: [''],
    productDetail: [''],
    comment: [''],
    surgeTransferable: [false]
  });
  ngOnChanges(): void {
    if (this.project) {
      this.form.patchValue({
        ...this.project,
        estimatedGoLiveDate: this.project.estimatedGoLiveDate?.slice(0, 10) ?? '',
        engineeringDueDate: this.project.engineeringDueDate?.slice(0, 10) ?? ''
      });
    }
  }

  save(): void {
    if (this.form.valid) this.submitted.emit(this.form.getRawValue() as Partial<Project>);
  }
}

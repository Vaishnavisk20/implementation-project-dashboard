import { JsonPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectApiService } from '../../core/project-api.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [JsonPipe, NgIf, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="page-head"><div><h1>CSV Import</h1><p>Upload updated project files, preview rows, validate data, and import into PostgreSQL.</p></div></div>
    <section class="split">
      <div class="card drop" (drop)="drop($event)" (dragover)="$event.preventDefault()">
        <div>
          <mat-icon>cloud_upload</mat-icon>
          <h2>{{ file?.name || 'Drop CSV here' }}</h2>
          <p>{{ file ? 'Ready to preview or import.' : 'Choose a file to preview, validate, and import.' }}</p>
          <input type="file" accept=".csv" (change)="pick($event)" />
        </div>
        <div class="toolbar-row import-actions">
          <button mat-flat-button [disabled]="!file || loading" (click)="preview()"><mat-icon>preview</mat-icon>Preview</button>
          <button mat-flat-button [disabled]="!file || loading" (click)="upload()"><mat-icon>upload_file</mat-icon>Import Upload</button>
          <button mat-stroked-button [disabled]="loading" (click)="seed()"><mat-icon>database</mat-icon>Import bundled CSV</button>
        </div>
        <mat-progress-bar *ngIf="loading" mode="indeterminate" />
      </div>
      <div class="card">
        <h3>Column Mapping</h3>
        <p>CSV headers are mapped to the Prisma Project model, with empty cells converted to null and Yes/No converted to booleans.</p>
        <p>Required fields: Project and Customer.</p>
        <h3>Data Actions</h3>
        <p>Clear removes all projects from every module. Restore clears everything first, then imports the bundled CSV again.</p>
        <div class="toolbar-row">
          <button mat-stroked-button class="danger" [disabled]="loading" (click)="clearData()"><mat-icon>delete_sweep</mat-icon>Clear all data</button>
          <button mat-stroked-button [disabled]="loading" (click)="resetData()"><mat-icon>restart_alt</mat-icon>Restore bundled CSV</button>
        </div>
      </div>
    </section>
    <section class="card" *ngIf="result">
      <h3>Import / Validation Result</h3>
      <pre>{{ result | json }}</pre>
    </section>
  `,
  styles: [`
    .drop {
      min-height: 340px;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 18px;
      text-align: center;
      border-style: dashed;
      background: #fbfdff;
    }
    .drop mat-icon { font-size: 58px; width: 58px; height: 58px; color: #0b66d8; }
    .drop h2 { margin: 8px 0 6px; font-size: 24px; }
    .drop p { margin: 0 0 16px; color: #667085; font-weight: 650; }
    .import-actions { justify-content: center; margin: 0; }
    pre { white-space: pre-wrap; max-height: 460px; overflow: auto; background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 16px; }
    .danger { color: #b42318; border-color: #f4b4ae; }
  `]
})
export class ImportComponent {
  file?: File;
  result?: unknown;
  loading = false;
  constructor(private readonly api: ProjectApiService) {}
  pick(event: Event): void { this.file = (event.target as HTMLInputElement).files?.[0]; }
  drop(event: DragEvent): void { event.preventDefault(); this.file = event.dataTransfer?.files?.[0]; }
  preview(): void { if (!this.file) return; this.run(this.api.previewCsv(this.file)); }
  upload(): void { if (!this.file) return; this.run(this.api.uploadCsv(this.file)); }
  seed(): void { this.run(this.api.seedImport()); }
  resetData(): void {
    const confirmed = prompt('Type RESTORE to clear current data and import the bundled CSV again.');
    if (confirmed === 'RESTORE') this.run(this.api.resetData());
  }
  clearData(): void {
    const confirmed = prompt('Type CLEAR to erase all project data from every module.');
    if (confirmed === 'CLEAR') this.run(this.api.clearData());
  }
  private run(request: ReturnType<ProjectApiService['seedImport']>): void {
    this.loading = true;
    request.subscribe({ next: (result) => { this.result = result; this.loading = false; }, error: (error) => { this.result = { error: error.message }; this.loading = false; } });
  }
}

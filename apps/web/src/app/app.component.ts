import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatSidenavModule, MatToolbarModule],
  template: `
    <mat-sidenav-container class="app-shell">
      <mat-sidenav mode="side" opened>
        <div class="brand">
          <mat-icon class="brand-mark">hub</mat-icon>
          <div>
            <strong>Implementation</strong>
            <span>Project Dashboard</span>
          </div>
        </div>
        <nav aria-label="Dashboard navigation">
          <span class="nav-section">Workspace</span>
          <a mat-button routerLink="/overview" routerLinkActive="active"><mat-icon>dashboard</mat-icon>Overview</a>
          <a mat-button routerLink="/portfolio" routerLinkActive="active"><mat-icon>table_chart</mat-icon>Portfolio</a>
          <a mat-button routerLink="/go-live" routerLinkActive="active"><mat-icon>event</mat-icon>Go-Live</a>
          <a mat-button routerLink="/workload" routerLinkActive="active"><mat-icon>groups</mat-icon>Workload</a>
          <span class="nav-section">Operations</span>
          <a mat-button routerLink="/engineering" routerLinkActive="active"><mat-icon>engineering</mat-icon>Engineering</a>
          <a mat-button routerLink="/data-quality" routerLinkActive="active"><mat-icon>fact_check</mat-icon>Data Quality</a>
          <a mat-button routerLink="/import" routerLinkActive="active"><mat-icon>upload_file</mat-icon>CSV Import</a>
        </nav>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          <div class="toolbar-title">
            <span>Implementation Project Dashboard</span>
            <small>Live portfolio control center</small>
          </div>
          <span class="spacer"></span>
          <a mat-stroked-button routerLink="/import"><mat-icon>add</mat-icon> Import CSV</a>
        </mat-toolbar>
        <main>
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class AppComponent {}

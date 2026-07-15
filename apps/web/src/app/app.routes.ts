import { Routes } from '@angular/router';
import { DataQualityComponent } from './pages/data-quality/data-quality.component';
import { EngineeringComponent } from './pages/engineering/engineering.component';
import { GoLiveComponent } from './pages/go-live/go-live.component';
import { ImportComponent } from './pages/import/import.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { WorkloadComponent } from './pages/workload/workload.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'go-live', component: GoLiveComponent },
  { path: 'workload', component: WorkloadComponent },
  { path: 'engineering', component: EngineeringComponent },
  { path: 'data-quality', component: DataQualityComponent },
  { path: 'import', component: ImportComponent },
  { path: 'projects/:id', component: ProjectDetailComponent }
];

export interface Project {
  id: string;
  projectName: string;
  customer: string;
  customerTier?: string | null;
  projectStatus?: string | null;
  competency?: string | null;
  ic?: string | null;
  secondaryIc?: string | null;
  icLead?: string | null;
  stationName?: string | null;
  estimatedGoLiveDate?: string | null;
  integrationType?: string | null;
  templateName?: string | null;
  surgeTransferable?: boolean | null;
  productDetail?: string | null;
  jiraTicketNumber?: string | null;
  developerName?: string | null;
  engineeringDueDate?: string | null;
  actionPendingOn?: string | null;
  engineeringStatus?: string | null;
  hrSource?: string | null;
  itsmSource?: string | null;
  directorySource?: string | null;
  downstreamApp?: string | null;
  useCase?: string | null;
  comment?: string | null;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistory[];
  riskExplanation?: string[];
}

export interface StatusHistory {
  id: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  changedBy?: string | null;
  changedAt: string;
  comment?: string | null;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface Analytics {
  kpis: Record<string, number>;
  charts: Record<string, ChartPoint[]>;
  planning: Record<string, Project[]>;
  workload: Array<{ name: string; total: number; active: number; highRisk: number; upcoming: number; surge: number; status: string }>;
  engineering: Record<string, Project[]>;
  dataQuality: {
    completenessPercentage: number;
    missingIcCount: number;
    missingGoLiveDateCount: number;
    missingEngineeringStatusCount: number;
    missingTemplateNameCount: number;
    missingProductDetailCount: number;
    missingDeveloperCount: number;
    missingCustomerTierCount: number;
    duplicateProjectCount: number;
    invalidDateCount: number;
    incompleteProjects: Array<{ id: string; projectName: string; customer: string; missingFields: string[]; score: number }>;
  };
}

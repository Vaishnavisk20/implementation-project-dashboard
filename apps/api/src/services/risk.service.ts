import type { Project } from '@prisma/client';
import { daysUntil } from '../utils/dates.js';

type RiskInput = Partial<Project>;

const activeStatuses = ['onboarding', 'implementation', 'testing', 'uat', 'awaiting go-live', 'future ready'];

export function isActiveStatus(status?: string | null): boolean {
  const normalized = status?.toLowerCase() ?? '';
  return activeStatuses.some((entry) => normalized.includes(entry));
}

export function calculateRisk(project: RiskInput): { riskScore: number; riskLevel: string; explanation: string[] } {
  let score = 0;
  const explanation: string[] = [];
  const days = daysUntil(project.estimatedGoLiveDate);
  const status = project.projectStatus?.toLowerCase() ?? '';
  const productDetail = project.productDetail?.toLowerCase() ?? '';
  const engineeringStatus = project.engineeringStatus?.toLowerCase() ?? '';

  if (days !== null && days < 0 && !status.includes('completed') && !status.includes('closed')) {
    score += 30;
    explanation.push('Go-live date is overdue.');
  } else if (days !== null && days <= 7 && isActiveStatus(project.projectStatus)) {
    score += 20;
    explanation.push('Go-live date is within 7 days.');
  } else if (days !== null && days <= 14 && isActiveStatus(project.projectStatus)) {
    score += 12;
    explanation.push('Go-live date is within 14 days.');
  }

  if (!project.estimatedGoLiveDate) {
    score += 12;
    explanation.push('Estimated go-live date is missing.');
  }
  if (!project.ic) {
    score += 10;
    explanation.push('Primary IC is missing.');
  }
  if (status.includes('hold') || status.includes('blocked')) {
    score += 22;
    explanation.push('Project is on hold or blocked.');
  }
  if (productDetail.includes('missing')) {
    score += 18;
    explanation.push('Product gaps are noted.');
  }
  if (project.jiraTicketNumber && !project.developerName && !engineeringStatus.includes('completed')) {
    score += 12;
    explanation.push('Engineering ticket exists without an assigned developer.');
  }
  if (engineeringStatus.includes('blocked')) {
    score += 20;
    explanation.push('Engineering work is blocked.');
  } else if (engineeringStatus.includes('in progress')) {
    score += 6;
    explanation.push('Engineering work is still in progress.');
  }
  if (project.actionPendingOn) {
    score += 8;
    explanation.push('Action is pending.');
  }

  const riskScore = Math.min(100, score);
  const riskLevel = riskScore >= 70 ? 'Critical' : riskScore >= 45 ? 'High' : riskScore >= 20 ? 'Medium' : 'Low';
  return { riskScore, riskLevel, explanation };
}

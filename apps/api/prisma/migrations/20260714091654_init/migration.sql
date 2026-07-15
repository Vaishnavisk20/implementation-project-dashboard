-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerTier" TEXT,
    "projectStatus" TEXT,
    "competency" TEXT,
    "ic" TEXT,
    "secondaryIc" TEXT,
    "icLead" TEXT,
    "stationName" TEXT,
    "estimatedGoLiveDate" TIMESTAMP(3),
    "integrationType" TEXT,
    "templateName" TEXT,
    "surgeTransferable" BOOLEAN,
    "productDetail" TEXT,
    "jiraTicketNumber" TEXT,
    "developerName" TEXT,
    "engineeringDueDate" TIMESTAMP(3),
    "actionPendingOn" TEXT,
    "engineeringStatus" TEXT,
    "hrSource" TEXT,
    "itsmSource" TEXT,
    "directorySource" TEXT,
    "downstreamApp" TEXT,
    "useCase" TEXT,
    "comment" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'Low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStatusHistory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "ProjectStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_customer_idx" ON "Project"("customer");

-- CreateIndex
CREATE INDEX "Project_projectStatus_idx" ON "Project"("projectStatus");

-- CreateIndex
CREATE INDEX "Project_estimatedGoLiveDate_idx" ON "Project"("estimatedGoLiveDate");

-- CreateIndex
CREATE INDEX "Project_ic_idx" ON "Project"("ic");

-- CreateIndex
CREATE INDEX "Project_customerTier_idx" ON "Project"("customerTier");

-- CreateIndex
CREATE INDEX "Project_riskLevel_idx" ON "Project"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectName_customer_integrationType_key" ON "Project"("projectName", "customer", "integrationType");

-- CreateIndex
CREATE INDEX "ProjectStatusHistory_projectId_idx" ON "ProjectStatusHistory"("projectId");

-- CreateIndex
CREATE INDEX "ProjectStatusHistory_changedAt_idx" ON "ProjectStatusHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "ProjectStatusHistory" ADD CONSTRAINT "ProjectStatusHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

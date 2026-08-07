-- CreateEnum
CREATE TYPE "ReportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ReportJob" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "resultData" TEXT,
    "rowCount" INTEGER,

    CONSTRAINT "ReportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "ScheduledJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportJob_requestedBy_requestedAt_idx" ON "ReportJob"("requestedBy", "requestedAt");

-- CreateIndex
CREATE INDEX "ReportJob_status_requestedAt_idx" ON "ReportJob"("status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJobRun_idempotencyKey_key" ON "ScheduledJobRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduledJobRun_jobName_startedAt_idx" ON "ScheduledJobRun"("jobName", "startedAt");

-- AddForeignKey
ALTER TABLE "ReportJob" ADD CONSTRAINT "ReportJob_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

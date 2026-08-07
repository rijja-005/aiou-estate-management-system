-- CreateEnum
CREATE TYPE "FlatAllocationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'TRANSFERRED', 'VACATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EmployeeGrade" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmployeeGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlatCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minimumGradeRank" INTEGER NOT NULL,
    "maximumGradeRank" INTEGER NOT NULL,
    "expectedInventory" INTEGER NOT NULL,
    "postRetirementMonths" INTEGER NOT NULL DEFAULT 6,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FlatCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "cnicNormalized" TEXT NOT NULL,
    "retirementDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlatDetail" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "block" TEXT NOT NULL,

    CONSTRAINT "FlatDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlatAllocation" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "FlatAllocationStatus" NOT NULL DEFAULT 'DRAFT',
    "allocationDate" TIMESTAMP(3) NOT NULL,
    "approvalDate" TIMESTAMP(3),
    "possessionDate" TIMESTAMP(3),
    "expectedVacationDate" TIMESTAMP(3) NOT NULL,
    "actualVacationDate" TIMESTAMP(3),
    "retirementDateSnapshot" TIMESTAMP(3) NOT NULL,
    "calculatedVacationDate" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlatAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetirementExtension" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "originalVacationDate" TIMESTAMP(3) NOT NULL,
    "revisedVacationDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvingAuthority" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetirementExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlatAllocationHistory" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "fromStatus" "FlatAllocationStatus",
    "toStatus" "FlatAllocationStatus" NOT NULL,
    "propertyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "vacationDateSnapshot" TIMESTAMP(3) NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlatAllocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGrade_code_key" ON "EmployeeGrade"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGrade_rank_key" ON "EmployeeGrade"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "FlatCategory_code_key" ON "FlatCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cnicNormalized_key" ON "Employee"("cnicNormalized");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_retirementDate_isActive_idx" ON "Employee"("retirementDate", "isActive");

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "Employee"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FlatDetail_propertyId_key" ON "FlatDetail"("propertyId");

-- CreateIndex
CREATE INDEX "FlatDetail_categoryId_block_idx" ON "FlatDetail"("categoryId", "block");

-- CreateIndex
CREATE UNIQUE INDEX "FlatAllocation_referenceNumber_key" ON "FlatAllocation"("referenceNumber");

-- CreateIndex
CREATE INDEX "FlatAllocation_propertyId_status_idx" ON "FlatAllocation"("propertyId", "status");

-- CreateIndex
CREATE INDEX "FlatAllocation_employeeId_status_idx" ON "FlatAllocation"("employeeId", "status");

-- CreateIndex
CREATE INDEX "FlatAllocation_expectedVacationDate_status_idx" ON "FlatAllocation"("expectedVacationDate", "status");

-- CreateIndex
CREATE INDEX "RetirementExtension_allocationId_approvedAt_idx" ON "RetirementExtension"("allocationId", "approvedAt");

-- CreateIndex
CREATE INDEX "FlatAllocationHistory_allocationId_createdAt_idx" ON "FlatAllocationHistory"("allocationId", "createdAt");

-- CreateIndex
CREATE INDEX "FlatAllocationHistory_employeeId_effectiveAt_idx" ON "FlatAllocationHistory"("employeeId", "effectiveAt");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "EmployeeGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatDetail" ADD CONSTRAINT "FlatDetail_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatDetail" ADD CONSTRAINT "FlatDetail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FlatCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatAllocation" ADD CONSTRAINT "FlatAllocation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatAllocation" ADD CONSTRAINT "FlatAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatAllocation" ADD CONSTRAINT "FlatAllocation_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetirementExtension" ADD CONSTRAINT "RetirementExtension_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "FlatAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetirementExtension" ADD CONSTRAINT "RetirementExtension_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatAllocationHistory" ADD CONSTRAINT "FlatAllocationHistory_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "FlatAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlatAllocationHistory" ADD CONSTRAINT "FlatAllocationHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "FlatAllocation_one_active_flat" ON "FlatAllocation"("propertyId") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "FlatAllocation_one_active_employee" ON "FlatAllocation"("employeeId") WHERE "status" = 'ACTIVE';
ALTER TABLE "FlatCategory" ADD CONSTRAINT "FlatCategory_grade_check" CHECK ("minimumGradeRank" <= "maximumGradeRank" AND "expectedInventory" >= 0 AND "postRetirementMonths" >= 0);
ALTER TABLE "FlatAllocation" ADD CONSTRAINT "FlatAllocation_dates_check" CHECK ("expectedVacationDate" >= "allocationDate" AND "calculatedVacationDate" >= "retirementDateSnapshot");
ALTER TABLE "RetirementExtension" ADD CONSTRAINT "RetirementExtension_dates_check" CHECK ("revisedVacationDate" > "originalVacationDate");

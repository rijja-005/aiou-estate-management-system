-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REVERSED', 'FAILED');

-- CreateTable
CREATE TABLE "ShopTenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnicNormalized" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopAgreement" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DECIMAL(14,2) NOT NULL,
    "securityDeposit" DECIMAL(14,2) NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "lateFeePercent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "annualEscalationPercent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementUtilityRule" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "utilityType" TEXT NOT NULL,
    "billingMode" TEXT NOT NULL,
    "fixedAmount" DECIMAL(14,2),
    "unitRate" DECIMAL(14,4),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AgreementUtilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "previousArrears" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillLine" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unitAmount" DECIMAL(14,4) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "BillLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "reversedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopTenant_cnicNormalized_key" ON "ShopTenant"("cnicNormalized");

-- CreateIndex
CREATE INDEX "ShopTenant_name_idx" ON "ShopTenant"("name");

-- CreateIndex
CREATE INDEX "ShopTenant_phoneNormalized_idx" ON "ShopTenant"("phoneNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "ShopAgreement_agreementNumber_key" ON "ShopAgreement"("agreementNumber");

-- CreateIndex
CREATE INDEX "ShopAgreement_propertyId_status_idx" ON "ShopAgreement"("propertyId", "status");

-- CreateIndex
CREATE INDEX "ShopAgreement_tenantId_status_idx" ON "ShopAgreement"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ShopAgreement_endDate_status_idx" ON "ShopAgreement"("endDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementUtilityRule_agreementId_utilityType_key" ON "AgreementUtilityRule"("agreementId", "utilityType");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_status_dueDate_idx" ON "Bill"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Bill_agreementId_issueDate_idx" ON "Bill"("agreementId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_agreementId_periodStart_periodEnd_key" ON "Bill"("agreementId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "BillLine_billId_idx" ON "BillLine"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_tenantId_receivedAt_idx" ON "Payment"("tenantId", "receivedAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "PaymentAllocation_billId_idx" ON "PaymentAllocation"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_billId_key" ON "PaymentAllocation"("paymentId", "billId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- AddForeignKey
ALTER TABLE "ShopAgreement" ADD CONSTRAINT "ShopAgreement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAgreement" ADD CONSTRAINT "ShopAgreement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ShopTenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAgreement" ADD CONSTRAINT "ShopAgreement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementUtilityRule" ADD CONSTRAINT "AgreementUtilityRule_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "ShopAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "ShopAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLine" ADD CONSTRAINT "BillLine_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ShopTenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversedBy_fkey" FOREIGN KEY ("reversedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ShopAgreement_one_active_property" ON "ShopAgreement"("propertyId") WHERE "status" IN ('ACTIVE', 'SUSPENDED');
ALTER TABLE "ShopAgreement" ADD CONSTRAINT "ShopAgreement_dates_check" CHECK ("endDate" >= "startDate");
ALTER TABLE "ShopAgreement" ADD CONSTRAINT "ShopAgreement_money_check" CHECK ("monthlyRent" >= 0 AND "securityDeposit" >= 0 AND "lateFeePercent" >= 0 AND "annualEscalationPercent" >= 0);
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_dates_check" CHECK ("periodEnd" >= "periodStart" AND "dueDate" >= "issueDate");
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_money_check" CHECK ("subtotal" >= 0 AND "previousArrears" >= 0 AND "totalAmount" >= 0 AND "paidAmount" >= 0 AND "balanceAmount" >= 0 AND "paidAmount" <= "totalAmount");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" > 0);
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_amount_check" CHECK ("amount" > 0);

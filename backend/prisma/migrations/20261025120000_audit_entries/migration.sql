-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "useCase" TEXT NOT NULL,
    "recordId" TEXT,
    "input" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEntry_recordedAt_idx" ON "AuditEntry"("recordedAt");

-- CreateIndex
CREATE INDEX "AuditEntry_userId_recordedAt_idx" ON "AuditEntry"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "AuditEntry_recordId_recordedAt_idx" ON "AuditEntry"("recordId", "recordedAt");

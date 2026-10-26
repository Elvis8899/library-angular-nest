-- CreateTable
CREATE TABLE "TokenRevocation" (
    "userId" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenRevocation_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "TokenRevocation_expiresAt_idx" ON "TokenRevocation"("expiresAt");

-- AddForeignKey
ALTER TABLE "TokenRevocation" ADD CONSTRAINT "TokenRevocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

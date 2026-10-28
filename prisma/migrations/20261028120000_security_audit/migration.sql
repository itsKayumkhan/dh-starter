-- DropIndex
DROP INDEX "session_userId_idx";

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "autoReplyEmailStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "notificationEmailStatus" TEXT NOT NULL DEFAULT 'pending';

-- Backfill: the old single status cannot tell which email failed, so both keep its value.
UPDATE "Inquiry" SET "notificationEmailStatus" = "emailStatus", "autoReplyEmailStatus" = "emailStatus";

ALTER TABLE "Inquiry" DROP COLUMN "emailStatus";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "deletePendingAt" TIMESTAMP(3),
ADD COLUMN     "deleteRequestIp" TEXT,
ADD COLUMN     "deleteRequestedBy" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "broadcastId" TEXT;

-- CreateTable
CREATE TABLE "SubscriptionCheckout" (
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCheckout_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ContactFormTokenClaim" (
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactFormTokenClaim_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "NotificationBroadcast" (
    "id" UUID NOT NULL,
    "actorId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "recipientIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingUpload" (
    "publicId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "expectedBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "uploadingAt" TIMESTAMP(3),

    CONSTRAINT "PendingUpload_pkey" PRIMARY KEY ("publicId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCheckout_attemptId_key" ON "SubscriptionCheckout"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCheckout_stripeSessionId_key" ON "SubscriptionCheckout"("stripeSessionId");

-- CreateIndex
CREATE INDEX "ContactFormTokenClaim_expiresAt_idx" ON "ContactFormTokenClaim"("expiresAt");

-- CreateIndex
CREATE INDEX "PendingUpload_ownerId_idx" ON "PendingUpload"("ownerId");

-- CreateIndex
CREATE INDEX "PendingUpload_expiresAt_idx" ON "PendingUpload"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx" ON "AuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Media_deletePendingAt_idx" ON "Media"("deletePendingAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_broadcastId_userId_key" ON "Notification"("broadcastId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "session_userId_updatedAt_idx" ON "session"("userId", "updatedAt");


-- CreateIndex
CREATE INDEX "AppRateLimit_resetAt_idx" ON "AppRateLimit"("resetAt");

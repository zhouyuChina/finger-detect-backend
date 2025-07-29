-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "targetUsers" TEXT NOT NULL DEFAULT 'all';

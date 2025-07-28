-- AlterTable
ALTER TABLE "news" ADD COLUMN     "category" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "types" TEXT[];

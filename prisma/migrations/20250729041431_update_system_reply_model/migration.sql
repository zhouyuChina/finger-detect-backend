/*
  Warnings:

  - You are about to drop the column `name` on the `system_replies` table. All the data in the column will be lost.
  - Added the required column `title` to the `system_replies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "system_replies" DROP COLUMN "name",
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "readCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "targetUsers" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 0;

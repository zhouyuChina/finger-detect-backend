/*
  Warnings:

  - You are about to drop the column `activity` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `detectionTime` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `photoCount` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `archiveName` on the `detections` table. All the data in the column will be lost.
  - Added the required column `archiveId` to the `detections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "archives" DROP COLUMN "activity",
DROP COLUMN "detectionTime",
DROP COLUMN "photoCount",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "lastDetectionTime" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "totalDetections" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "detections" DROP COLUMN "archiveName",
ADD COLUMN     "archiveId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "archives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

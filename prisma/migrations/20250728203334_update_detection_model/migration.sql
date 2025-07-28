/*
  Warnings:

  - Added the required column `archiveName` to the `detections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userNickname` to the `detections` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "detections" DROP CONSTRAINT "detections_userId_fkey";

-- AlterTable
ALTER TABLE "detections" ADD COLUMN     "archiveName" TEXT NOT NULL,
ADD COLUMN     "bodyPart" TEXT NOT NULL DEFAULT 'finger',
ADD COLUMN     "detectionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userNickname" TEXT NOT NULL;

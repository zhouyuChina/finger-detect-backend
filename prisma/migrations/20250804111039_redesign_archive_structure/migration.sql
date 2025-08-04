/*
  Warnings:

  - You are about to drop the column `activity` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `detectionTime` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `photoCount` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `archiveName` on the `detections` table. All the data in the column will be lost.

*/

-- Step 1: 为现有的detection记录创建对应的archive记录
INSERT INTO "archives" ("id", "subUserId", "archiveName", "bodyPart", "status", "startDate", "totalDetections", "lastDetectionTime", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  d."subUserId",
  d."archiveName",
  d."detectionType",
  'active',
  MIN(d."createdAt"),
  COUNT(*),
  MAX(d."createdAt"),
  MIN(d."createdAt"),
  MAX(d."createdAt")
FROM "detections" d
GROUP BY d."subUserId", d."archiveName", d."detectionType";

-- Step 2: 更新archives表结构
ALTER TABLE "archives" DROP COLUMN "activity",
DROP COLUMN "detectionTime",
DROP COLUMN "photoCount",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "lastDetectionTime" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "totalDetections" INTEGER NOT NULL DEFAULT 0;

-- Step 3: 为detections表添加archiveId字段（允许NULL）
ALTER TABLE "detections" ADD COLUMN "archiveId" TEXT;

-- Step 4: 更新detections表的archiveId
UPDATE "detections" d
SET "archiveId" = a."id"
FROM "archives" a
WHERE d."subUserId" = a."subUserId" 
  AND d."archiveName" = a."archiveName";

-- Step 5: 设置archiveId为NOT NULL并删除archiveName
ALTER TABLE "detections" ALTER COLUMN "archiveId" SET NOT NULL;
ALTER TABLE "detections" DROP COLUMN "archiveName";

-- Step 6: 添加外键约束
ALTER TABLE "detections" ADD CONSTRAINT "detections_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "archives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

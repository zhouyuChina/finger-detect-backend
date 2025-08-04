/*
  Warnings:

  - You are about to drop the column `userId` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `userNickname` on the `archives` table. All the data in the column will be lost.
  - You are about to drop the column `bodyPart` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `userNickname` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_coupons` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_system_info` table. All the data in the column will be lost.
  - You are about to drop the `user_ids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[subUserId,archiveName]` on the table `archives` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subUserId,couponId]` on the table `user_coupons` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatUserId]` on the table `user_system_info` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subUserId` to the `archives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subUserId` to the `detections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subUserId` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subUserId` to the `user_coupons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wechatUserId` to the `user_system_info` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_coupons" DROP CONSTRAINT "user_coupons_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_ids" DROP CONSTRAINT "user_ids_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_ids" DROP CONSTRAINT "user_ids_verifyAdminId_fkey";

-- DropForeignKey
ALTER TABLE "user_system_info" DROP CONSTRAINT "user_system_info_userId_fkey";

-- DropIndex
DROP INDEX "user_coupons_userId_couponId_key";

-- DropIndex
DROP INDEX "user_system_info_userId_key";

-- AlterTable
ALTER TABLE "archives" DROP COLUMN "userId",
DROP COLUMN "userNickname",
ADD COLUMN     "subUserId" TEXT NOT NULL,
ALTER COLUMN "bodyPart" SET DEFAULT 'left_hand_thumb';

-- AlterTable
ALTER TABLE "detections" DROP COLUMN "bodyPart",
DROP COLUMN "userId",
DROP COLUMN "userNickname",
ADD COLUMN     "detectionType" TEXT NOT NULL DEFAULT 'left_hand_thumb',
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "subUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "userId",
ADD COLUMN     "subUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_coupons" DROP COLUMN "userId",
ADD COLUMN     "subUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_system_info" DROP COLUMN "userId",
ADD COLUMN     "wechatUserId" TEXT NOT NULL;

-- DropTable
DROP TABLE "user_ids";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "wechat_users" (
    "id" TEXT NOT NULL,
    "openid" TEXT NOT NULL,
    "unionid" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "gender" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLogin" TIMESTAMP(3),
    "registerTime" TIMESTAMP(3),
    "appVersion" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wechat_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_users" (
    "id" TEXT NOT NULL,
    "wechatUserId" TEXT NOT NULL,
    "username" TEXT,
    "realName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "archives" INTEGER NOT NULL DEFAULT 0,
    "photos" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sub_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_user_verifications" (
    "id" TEXT NOT NULL,
    "wechatUserId" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "address" TEXT,
    "identity" TEXT NOT NULL DEFAULT '普通用户',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subUsers" INTEGER NOT NULL DEFAULT 0,
    "archives" INTEGER NOT NULL DEFAULT 0,
    "photos" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "unreadMessages" INTEGER NOT NULL DEFAULT 0,
    "idCardFront" TEXT,
    "idCardBack" TEXT,
    "idCardHand" TEXT,
    "verifyStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifyTime" TIMESTAMP(3),
    "rejectReason" TEXT,
    "verifyAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wechat_user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_read_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_read_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wechat_users_openid_key" ON "wechat_users"("openid");

-- CreateIndex
CREATE UNIQUE INDEX "wechat_users_unionid_key" ON "wechat_users"("unionid");

-- CreateIndex
CREATE UNIQUE INDEX "sub_users_username_key" ON "sub_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "wechat_user_verifications_wechatUserId_key" ON "wechat_user_verifications"("wechatUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_read_status_userId_articleId_key" ON "user_read_status"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "archives_subUserId_archiveName_key" ON "archives"("subUserId", "archiveName");

-- CreateIndex
CREATE UNIQUE INDEX "user_coupons_subUserId_couponId_key" ON "user_coupons"("subUserId", "couponId");

-- CreateIndex
CREATE UNIQUE INDEX "user_system_info_wechatUserId_key" ON "user_system_info"("wechatUserId");

-- AddForeignKey
ALTER TABLE "sub_users" ADD CONSTRAINT "sub_users_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_system_info" ADD CONSTRAINT "user_system_info_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_user_verifications" ADD CONSTRAINT "wechat_user_verifications_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_user_verifications" ADD CONSTRAINT "wechat_user_verifications_verifyAdminId_fkey" FOREIGN KEY ("verifyAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "sub_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archives" ADD CONSTRAINT "archives_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "sub_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "sub_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "sub_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

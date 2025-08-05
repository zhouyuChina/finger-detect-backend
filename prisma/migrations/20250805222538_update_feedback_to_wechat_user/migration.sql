/*
  Warnings:

  - You are about to drop the column `subUserId` on the `feedbacks` table. All the data in the column will be lost.
  - Added the required column `wechatUserId` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_subUserId_fkey";

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "subUserId",
ADD COLUMN     "wechatUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

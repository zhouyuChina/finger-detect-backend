/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "archives" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "photos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "realName" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "reports" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "openid" DROP NOT NULL,
ALTER COLUMN "gender" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

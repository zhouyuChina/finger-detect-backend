-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "registerTime" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_system_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT,
    "system" TEXT,
    "version" TEXT,
    "SDKVersion" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "windowWidth" INTEGER,
    "windowHeight" INTEGER,
    "pixelRatio" DOUBLE PRECISION,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_system_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_system_info_userId_key" ON "user_system_info"("userId");

-- AddForeignKey
ALTER TABLE "user_system_info" ADD CONSTRAINT "user_system_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "user_ids" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "idCardFront" TEXT,
    "idCardBack" TEXT,
    "idCardHand" TEXT,
    "verifyStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifyTime" TIMESTAMP(3),
    "rejectReason" TEXT,
    "verifyAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_ids_userId_key" ON "user_ids"("userId");

-- AddForeignKey
ALTER TABLE "user_ids" ADD CONSTRAINT "user_ids_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ids" ADD CONSTRAINT "user_ids_verifyAdminId_fkey" FOREIGN KEY ("verifyAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

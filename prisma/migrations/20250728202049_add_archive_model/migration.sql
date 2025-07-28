-- CreateTable
CREATE TABLE "archives" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userNickname" TEXT NOT NULL,
    "archiveName" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT 'medium',
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "bodyPart" TEXT NOT NULL DEFAULT 'finger',
    "detectionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archives_pkey" PRIMARY KEY ("id")
);

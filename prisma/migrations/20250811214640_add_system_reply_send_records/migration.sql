-- CreateTable
CREATE TABLE "system_reply_send_records" (
    "id" TEXT NOT NULL,
    "systemReplyId" TEXT NOT NULL,
    "targetOpenIds" TEXT[],
    "sendImmediately" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_reply_send_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_reply_send_records" ADD CONSTRAINT "system_reply_send_records_systemReplyId_fkey" FOREIGN KEY ("systemReplyId") REFERENCES "system_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

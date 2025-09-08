-- CreateTable
CREATE TABLE "SessionStaticVariable" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionStaticVariable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionStaticVariable" ADD CONSTRAINT "SessionStaticVariable_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

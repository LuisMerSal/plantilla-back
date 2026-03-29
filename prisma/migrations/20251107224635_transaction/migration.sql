-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

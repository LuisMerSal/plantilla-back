-- CreateTable
CREATE TABLE "top_bars" (
    "id" TEXT NOT NULL,
    "icon" VARCHAR(100),
    "description" VARCHAR(250),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "top_bars_pkey" PRIMARY KEY ("id")
);

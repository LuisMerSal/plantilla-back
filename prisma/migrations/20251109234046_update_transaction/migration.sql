-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data_json" JSONB,
ADD COLUMN     "error_count" INTEGER,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "success_count" INTEGER;

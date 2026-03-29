-- CreateTable
CREATE TABLE "penal_data" (
    "id" TEXT NOT NULL,
    "databook_consult_id" TEXT NOT NULL,
    "identity_number" TEXT NOT NULL,
    "denuncias" JSONB,
    "total" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "penal_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penal_data_identity_number_idx" ON "penal_data"("identity_number");

-- CreateIndex
CREATE INDEX "penal_data_databook_consult_id_idx" ON "penal_data"("databook_consult_id");

-- AddForeignKey
ALTER TABLE "penal_data" ADD CONSTRAINT "penal_data_databook_consult_id_fkey" FOREIGN KEY ("databook_consult_id") REFERENCES "databook_consults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

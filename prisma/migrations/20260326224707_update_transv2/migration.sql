-- CreateTable
CREATE TABLE "vehicle_data" (
    "id" TEXT NOT NULL,
    "databook_consult_id" TEXT NOT NULL,
    "identity_number" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "total_vehiculos" INTEGER NOT NULL DEFAULT 0,
    "vehiculos_consultados" INTEGER NOT NULL DEFAULT 0,
    "limite_consultas" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicle_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_data_identity_number_idx" ON "vehicle_data"("identity_number");

-- CreateIndex
CREATE INDEX "vehicle_data_databook_consult_id_idx" ON "vehicle_data"("databook_consult_id");

-- AddForeignKey
ALTER TABLE "vehicle_data" ADD CONSTRAINT "vehicle_data_databook_consult_id_fkey" FOREIGN KEY ("databook_consult_id") REFERENCES "databook_consults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TransitData" (
    "id" TEXT NOT NULL,
    "id_contrato" TEXT,
    "placa" TEXT,
    "id_persona" TEXT,
    "mensaje" TEXT,
    "fines_paid" JSONB,
    "fines_unpaid" JSONB,
    "databook_consult_id" TEXT NOT NULL,

    CONSTRAINT "TransitData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransitData" ADD CONSTRAINT "TransitData_databook_consult_id_fkey" FOREIGN KEY ("databook_consult_id") REFERENCES "databook_consults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

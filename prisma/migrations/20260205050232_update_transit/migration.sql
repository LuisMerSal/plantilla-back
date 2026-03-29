/*
  Warnings:

  - You are about to drop the `TransitData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TransitData" DROP CONSTRAINT "TransitData_databook_consult_id_fkey";

-- DropTable
DROP TABLE "TransitData";

-- CreateTable
CREATE TABLE "transit_data" (
    "id" TEXT NOT NULL,
    "id_contrato" TEXT,
    "placa" TEXT,
    "id_persona" TEXT,
    "mensaje" TEXT,
    "fines_paid" JSONB,
    "fines_unpaid" JSONB,
    "databook_consult_id" TEXT NOT NULL,

    CONSTRAINT "transit_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transit_data" ADD CONSTRAINT "transit_data_databook_consult_id_fkey" FOREIGN KEY ("databook_consult_id") REFERENCES "databook_consults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ruc_data" (
    "id" TEXT NOT NULL,
    "databook_consult_id" TEXT NOT NULL,
    "numero_ruc" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "estado_contribuyente_ruc" TEXT NOT NULL,
    "actividad_economica_principal" TEXT NOT NULL,
    "tipo_contribuyente" TEXT NOT NULL,
    "regimen" TEXT NOT NULL,
    "categoria" TEXT,
    "obligado_llevar_contabilidad" TEXT NOT NULL,
    "agente_retencion" TEXT NOT NULL,
    "contribuyente_especial" TEXT NOT NULL,
    "fecha_inicio_actividades" TIMESTAMPTZ,
    "fecha_cese" TIMESTAMPTZ,
    "fecha_reinicio_actividades" TIMESTAMPTZ,
    "fecha_actualizacion" TIMESTAMPTZ,
    "motivo_cancelacion_suspension" TEXT,
    "contribuyente_fantasma" TEXT NOT NULL,
    "transacciones_inexistente" TEXT NOT NULL,
    "clasificacion_mi_pyme" TEXT,
    "establecimientos" JSONB,
    "representantes_legales" JSONB,
    "error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ruc_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ruc_data_numero_ruc_idx" ON "ruc_data"("numero_ruc");

-- CreateIndex
CREATE INDEX "ruc_data_databook_consult_id_idx" ON "ruc_data"("databook_consult_id");

-- AddForeignKey
ALTER TABLE "ruc_data" ADD CONSTRAINT "ruc_data_databook_consult_id_fkey" FOREIGN KEY ("databook_consult_id") REFERENCES "databook_consults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

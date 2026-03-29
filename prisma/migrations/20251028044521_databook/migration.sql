-- CreateTable
CREATE TABLE "DatabookConsult" (
    "id" TEXT NOT NULL,
    "identity_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "civil_status" TEXT NOT NULL,
    "cargas" INTEGER NOT NULL,
    "dependence_name" TEXT NOT NULL,
    "dependence_start" TIMESTAMP(3) NOT NULL,
    "dependence_position" TEXT NOT NULL,
    "dependence_address" TEXT NOT NULL,
    "dependence_rango1" DOUBLE PRECISION NOT NULL,
    "dependence_rango2" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" VARCHAR(100),
    "created_by" VARCHAR(100),
    "deleted_by" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "DatabookConsult_pkey" PRIMARY KEY ("id")
);

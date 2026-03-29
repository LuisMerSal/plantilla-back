-- CreateTable
CREATE TABLE "factors" (
    "id" TEXT NOT NULL,
    "score_buro_minimo" INTEGER NOT NULL,
    "score_buro_maximo" INTEGER NOT NULL,
    "factor_promedio" DOUBLE PRECISION NOT NULL,
    "factor_sombra" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factors_pkey" PRIMARY KEY ("id")
);

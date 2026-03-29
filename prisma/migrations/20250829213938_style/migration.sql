-- CreateTable
CREATE TABLE "config_styles" (
    "id" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "font_family" TEXT,
    "font_size" INTEGER DEFAULT 14,
    "line_height" INTEGER DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_styles_pkey" PRIMARY KEY ("id")
);

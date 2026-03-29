/*
  Warnings:

  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `stores` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_productId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock",
ADD COLUMN     "bestandsaufnahmeId" TEXT,
ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "productId";

-- CreateTable
CREATE TABLE "stores_products" (
    "id" TEXT NOT NULL,
    "storeId" VARCHAR(100) NOT NULL,
    "productId" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),
    "deleted_by" VARCHAR(100),

    CONSTRAINT "stores_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bestandsaufnahmen" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(250),
    "slug" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bestandsaufnahmen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_products_storeId_productId_key" ON "stores_products"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "bestandsaufnahmen_slug_key" ON "bestandsaufnahmen"("slug");

-- AddForeignKey
ALTER TABLE "stores_products" ADD CONSTRAINT "stores_products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores_products" ADD CONSTRAINT "stores_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_bestandsaufnahmeId_fkey" FOREIGN KEY ("bestandsaufnahmeId") REFERENCES "bestandsaufnahmen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

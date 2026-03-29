/*
  Warnings:

  - You are about to drop the column `bestandsaufnahmeId` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_bestandsaufnahmeId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "bestandsaufnahmeId";

-- AlterTable
ALTER TABLE "stores_products" ADD COLUMN     "bestandsaufnahmeId" TEXT;

-- AddForeignKey
ALTER TABLE "stores_products" ADD CONSTRAINT "stores_products_bestandsaufnahmeId_fkey" FOREIGN KEY ("bestandsaufnahmeId") REFERENCES "bestandsaufnahmen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

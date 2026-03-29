/*
  Warnings:

  - You are about to drop the column `created_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `is_enabled` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_enabled` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_interactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `banners` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bestandsaufnahmen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cart_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `carts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `config_styles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `config_systems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stores_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `top_bars` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_cityId_fkey";

-- DropForeignKey
ALTER TABLE "ai_interactions" DROP CONSTRAINT "ai_interactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cartId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_userId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orderId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_module_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_addressId_fkey";

-- DropForeignKey
ALTER TABLE "stores_products" DROP CONSTRAINT "stores_products_bestandsaufnahmeId_fkey";

-- DropForeignKey
ALTER TABLE "stores_products" DROP CONSTRAINT "stores_products_productId_fkey";

-- DropForeignKey
ALTER TABLE "stores_products" DROP CONSTRAINT "stores_products_storeId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- DropIndex
DROP INDEX "roles_slug_key";

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "is_active",
DROP COLUMN "is_enabled",
DROP COLUMN "updated_at",
DROP COLUMN "updated_by",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "created_at",
DROP COLUMN "isActive",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "group",
DROP COLUMN "is_active",
DROP COLUMN "slug",
DROP COLUMN "updated_at",
DROP COLUMN "updated_by",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "birthDate",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "is_active",
DROP COLUMN "is_enabled",
DROP COLUMN "phone",
DROP COLUMN "state",
DROP COLUMN "updated_at",
DROP COLUMN "updated_by",
DROP COLUMN "zipCode",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "dni" SET DATA TYPE TEXT,
ALTER COLUMN "firstName" SET DATA TYPE TEXT,
ALTER COLUMN "lastName" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "addresses";

-- DropTable
DROP TABLE "ai_interactions";

-- DropTable
DROP TABLE "banners";

-- DropTable
DROP TABLE "bestandsaufnahmen";

-- DropTable
DROP TABLE "cart_items";

-- DropTable
DROP TABLE "carts";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "cities";

-- DropTable
DROP TABLE "config_styles";

-- DropTable
DROP TABLE "config_systems";

-- DropTable
DROP TABLE "modules";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "role_permissions";

-- DropTable
DROP TABLE "stores";

-- DropTable
DROP TABLE "stores_products";

-- DropTable
DROP TABLE "top_bars";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_code_key" ON "api_keys"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

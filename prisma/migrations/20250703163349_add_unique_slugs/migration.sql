/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `modules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `permissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `roles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MODERATOR');

-- AlterTable
ALTER TABLE "modules" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

/*
  Warnings:

  - The `profile_credit` column on the `databook_consults` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "databook_consults" ADD COLUMN     "shawdon_quota" DOUBLE PRECISION,
DROP COLUMN "profile_credit",
ADD COLUMN     "profile_credit" DOUBLE PRECISION;

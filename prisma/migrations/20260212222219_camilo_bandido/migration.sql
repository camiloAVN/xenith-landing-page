/*
  Warnings:

  - You are about to drop the column `taxId` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "taxId",
ADD COLUMN     "nit" TEXT,
ADD COLUMN     "rutUrl" TEXT;

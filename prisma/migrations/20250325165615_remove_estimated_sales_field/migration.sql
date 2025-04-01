/*
  Warnings:

  - You are about to drop the column `estimatedSales` on the `TicketSector` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GlobalParameters" ADD COLUMN     "fuelCostPerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "kmPerLiter" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "TicketSector" DROP COLUMN "estimatedSales";

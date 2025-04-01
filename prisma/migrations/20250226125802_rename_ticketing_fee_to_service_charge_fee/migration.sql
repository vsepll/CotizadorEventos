/*
  Warnings:

  - Added the required column `ticketingFee` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "ticketingFee" DOUBLE PRECISION NOT NULL;

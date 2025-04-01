/*
  Warnings:

  - The `paymentStatus` column on the `Quotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

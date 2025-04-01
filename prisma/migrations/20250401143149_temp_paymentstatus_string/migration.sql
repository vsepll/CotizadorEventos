/*
  Warnings:

  - The `paymentStatus` column on the `Quotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "PaymentStatus";

-- AlterTable
ALTER TABLE "GlobalParameters" ADD COLUMN     "monthlyFixedCosts" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "estimatedPaymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

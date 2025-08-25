-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "eventDurationDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "financialMetrics" JSONB,
ADD COLUMN     "roiMetrics" JSONB;

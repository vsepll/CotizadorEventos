-- CreateTable
CREATE TABLE "QuotationAdditionalService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "quotationId" TEXT NOT NULL,

    CONSTRAINT "QuotationAdditionalService_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationAdditionalService" ADD CONSTRAINT "QuotationAdditionalService_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

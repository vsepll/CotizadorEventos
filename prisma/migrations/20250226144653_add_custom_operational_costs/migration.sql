-- CreateTable
CREATE TABLE "CustomOperationalCost" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomOperationalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationCustomCost" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quotationId" TEXT NOT NULL,
    "customOperationalCostId" TEXT NOT NULL,

    CONSTRAINT "QuotationCustomCost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomOperationalCost" ADD CONSTRAINT "CustomOperationalCost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationCustomCost" ADD CONSTRAINT "QuotationCustomCost_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationCustomCost" ADD CONSTRAINT "QuotationCustomCost_customOperationalCostId_fkey" FOREIGN KEY ("customOperationalCostId") REFERENCES "CustomOperationalCost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

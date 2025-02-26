-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalParameters" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "defaultPlatformFee" DOUBLE PRECISION NOT NULL,
    "defaultTicketingFee" DOUBLE PRECISION NOT NULL,
    "defaultAdditionalServicesFee" DOUBLE PRECISION NOT NULL,
    "defaultCreditCardFee" DOUBLE PRECISION NOT NULL,
    "defaultDebitCardFee" DOUBLE PRECISION NOT NULL,
    "defaultCashFee" DOUBLE PRECISION NOT NULL,
    "defaultCredentialsCost" DOUBLE PRECISION NOT NULL,
    "defaultSupervisorsCost" DOUBLE PRECISION NOT NULL,
    "defaultOperatorsCost" DOUBLE PRECISION NOT NULL,
    "defaultMobilityCost" DOUBLE PRECISION NOT NULL,
    "palco4FeePerTicket" DOUBLE PRECISION NOT NULL,
    "lineCostPercentage" DOUBLE PRECISION NOT NULL,
    "ticketingCostPerTicket" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GlobalParameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "ticketPrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "ticketingFee" DOUBLE PRECISION NOT NULL,
    "additionalServices" DOUBLE PRECISION NOT NULL,
    "paywayFees" JSONB NOT NULL,
    "palco4Cost" DOUBLE PRECISION NOT NULL,
    "lineCost" DOUBLE PRECISION NOT NULL,
    "operationalCosts" JSONB NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalCosts" DOUBLE PRECISION NOT NULL,
    "grossMargin" DOUBLE PRECISION NOT NULL,
    "grossProfitability" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketVariation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sectorId" TEXT NOT NULL,

    CONSTRAINT "TicketVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketSector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedSales" DOUBLE PRECISION NOT NULL,
    "quotationId" TEXT NOT NULL,

    CONSTRAINT "TicketSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalCommission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalFixedExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalFixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketVariation" ADD CONSTRAINT "TicketVariation_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "TicketSector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSector" ADD CONSTRAINT "TicketSector_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { NextResponse } from "next/server"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import redis from "@/lib/redis"

const prisma = new PrismaClient()

// Define the schema for input validation
const QuotationInputSchema = z.object({
  eventType: z.enum(["A", "B", "C", "D"]),
  totalAmount: z.number().positive(),
  ticketPrice: z.number().positive(),
  platform: z.object({
    name: z.enum(["TICKET_PLUS", "PALCO4"]),
    percentage: z.number().min(0).max(100)
  }),
  serviceCharge: z.number().min(0).max(100),
  additionalServicesPercentage: z.number().min(0).max(100).optional(),
  paymentMethods: z.object({
    credit: z.object({
      percentage: z.number().min(0).max(100),
      chargedTo: z.enum(["US", "CLIENT", "CONSUMER"]).default("CONSUMER")
    }).optional(),
    debit: z.object({
      percentage: z.number().min(0).max(100),
      chargedTo: z.enum(["US", "CLIENT", "CONSUMER"]).default("CONSUMER")
    }).optional(),
    cash: z.object({
      percentage: z.number().min(0).max(100),
      chargedTo: z.enum(["US", "CLIENT", "CONSUMER"]).default("CONSUMER")
    }).optional()
  }),
  credentialsCost: z.number().nonnegative().optional(),
  supervisorsCost: z.number().nonnegative().optional(),
  operatorsCost: z.number().nonnegative().optional(),
  mobilityCost: z.number().nonnegative().optional(),
})

type QuotationInput = z.infer<typeof QuotationInputSchema>

function calculateQuotation(input: QuotationInput, globalParameters: any) {
  const {
    totalAmount,
    ticketPrice,
    platform,
    serviceCharge,
    additionalServicesPercentage = 0,
    paymentMethods,
    credentialsCost = globalParameters.defaultCredentialsCost,
    supervisorsCost = globalParameters.defaultSupervisorsCost,
    operatorsCost = globalParameters.defaultOperatorsCost,
    mobilityCost = globalParameters.defaultMobilityCost,
  } = input

  // Calculate total value
  const ticketQuantity = totalAmount
  const totalValue = ticketQuantity * ticketPrice

  // Calculate platform fee (as a cost)
  const platformFee = platform.name === "PALCO4" 
    ? ticketQuantity * globalParameters.palco4FeePerTicket 
    : totalValue * (platform.percentage / 100)

  // Calculate service charge and additional services (our revenue)
  const serviceChargeFee = totalValue * (serviceCharge / 100)
  const additionalServices = totalValue * (additionalServicesPercentage / 100)

  // Calculate payment fees
  const creditFee = paymentMethods.credit 
    ? totalValue * (paymentMethods.credit.percentage / 100)
    : 0
  const debitFee = paymentMethods.debit
    ? totalValue * (paymentMethods.debit.percentage / 100)
    : 0
  const cashFee = paymentMethods.cash
    ? totalValue * (paymentMethods.cash.percentage / 100)
    : 0

  // Calculate costs based on who absorbs the payment fees
  const ourPaymentCosts = (
    (paymentMethods.credit?.chargedTo === "US" ? creditFee : 0) +
    (paymentMethods.debit?.chargedTo === "US" ? debitFee : 0) +
    (paymentMethods.cash?.chargedTo === "US" ? cashFee : 0)
  )

  // Calculate Line cost (only if not using Palco4)
  const lineCost = platform.name === "PALCO4" ? 0 : totalValue * (globalParameters.lineCostPercentage / 100)

  // Calculate operational costs
  const operationalCosts = {
    credentials: Number(credentialsCost) || 0,
    ticketing: platform.name === "PALCO4" ? 0 : ticketQuantity * globalParameters.ticketingCostPerTicket,
    supervisors: Number(supervisorsCost) || 0,
    operators: Number(operatorsCost) || 0,
    mobility: Number(mobilityCost) || 0,
    total: 0
  }
  operationalCosts.total = 
    operationalCosts.credentials +
    operationalCosts.ticketing +
    operationalCosts.supervisors +
    operationalCosts.operators +
    operationalCosts.mobility

  // Format payment fees for response
  const paywayFees = {
    credit: creditFee,
    debit: debitFee,
    cash: cashFee,
    total: ourPaymentCosts
  }

  // Calculate total revenue (service charge + additional services)
  const totalRevenue = serviceChargeFee + additionalServices

  // Calculate total costs (platform fee + line cost + operational costs + our payment costs)
  const totalCosts = platformFee + lineCost + operationalCosts.total + ourPaymentCosts

  // Calculate gross margin and profitability
  const grossMargin = totalRevenue - totalCosts
  const grossProfitability = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0

  // Log calculations for debugging
  console.log('Calculation details:', {
    totalValue,
    serviceChargeFee,
    additionalServices,
    platformFee,
    lineCost,
    operationalCosts,
    paywayFees,
    totalRevenue,
    totalCosts,
    grossMargin,
    grossProfitability
  })

  return {
    ticketQuantity,
    platformFee,
    ticketingFee: serviceChargeFee,
    additionalServices,
    paywayFees,
    palco4Cost: platform.name === "PALCO4" ? platformFee : 0,
    lineCost,
    operationalCosts,
    totalRevenue,
    totalCosts,
    grossMargin,
    grossProfitability
  }
}

async function ensureGlobalParameters() {
  const parameters = await prisma.globalParameters.findFirst()
  if (!parameters) {
    return await prisma.globalParameters.create({
      data: {
        id: 1,
        defaultPlatformFee: 5,
        defaultTicketingFee: 3,
        defaultAdditionalServicesFee: 2,
        defaultCreditCardFee: 3.67,
        defaultDebitCardFee: 0.8,
        defaultCashFee: 0.5,
        defaultCredentialsCost: 216408,
        defaultSupervisorsCost: 60000,
        defaultOperatorsCost: 10000,
        defaultMobilityCost: 25000,
        palco4FeePerTicket: 180,
        lineCostPercentage: 0.41,
        ticketingCostPerTicket: 5,
      }
    })
  }
  return parameters
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received body:', body)

    const validatedInput = QuotationInputSchema.parse(body)
    console.log('Validated input:', validatedInput)

    // Generate a cache key based on the input
    const cacheKey = `quotation:${JSON.stringify(validatedInput)}`

    // Try to get the result from cache
    const cachedResult = await redis.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(JSON.parse(cachedResult))
    }

    // If not in cache, calculate the quotation
    const globalParameters = await ensureGlobalParameters()
    if (!globalParameters) {
      throw new Error("Failed to ensure global parameters")
    }

    const results = calculateQuotation(validatedInput, globalParameters)
    console.log('Calculation results:', results)

    // Store the result in cache with an expiration of 1 hour
    await redis.set(cacheKey, JSON.stringify(results), "EX", 3600)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Server error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }, { status: 500 })
  }
}


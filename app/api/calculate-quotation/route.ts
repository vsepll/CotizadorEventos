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
  platformPercentage: z.number().min(0).max(100).optional(),
  ticketingPercentage: z.number().min(0).max(100).optional(),
  additionalServicesPercentage: z.number().min(0).max(100).optional(),
  creditCardPercentage: z.number().min(0).max(100).optional(),
  debitCardPercentage: z.number().min(0).max(100).optional(),
  cashPercentage: z.number().min(0).max(100).optional(),
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
    platformPercentage = globalParameters.defaultPlatformFee,
    ticketingPercentage = globalParameters.defaultTicketingFee,
    additionalServicesPercentage = globalParameters.defaultAdditionalServicesFee,
    creditCardPercentage = globalParameters.defaultCreditCardFee,
    debitCardPercentage = globalParameters.defaultDebitCardFee,
    cashPercentage = globalParameters.defaultCashFee,
    credentialsCost = globalParameters.defaultCredentialsCost,
    supervisorsCost = globalParameters.defaultSupervisorsCost,
    operatorsCost = globalParameters.defaultOperatorsCost,
    mobilityCost = globalParameters.defaultMobilityCost,
  } = input

  // Calculate ticket quantity
  const ticketQuantity = Math.round(totalAmount / ticketPrice)

  // Calculate platform and ticketing fees
  const platformFee = totalAmount * (platformPercentage / 100)
  const ticketingFee = totalAmount * (ticketingPercentage / 100)

  // Calculate additional services
  const additionalServices = totalAmount * (additionalServicesPercentage / 100)

  // Calculate Payway fees
  const paywayFees = {
    credit: totalAmount * (creditCardPercentage / 100),
    debit: totalAmount * (debitCardPercentage / 100),
    cash: totalAmount * (cashPercentage / 100),
    total: 0,
  }
  paywayFees.total = paywayFees.credit + paywayFees.debit + paywayFees.cash

  // Calculate Palco 4 cost
  const palco4Cost = ticketQuantity * globalParameters.palco4FeePerTicket

  // Calculate Line cost
  const lineCost = totalAmount * (globalParameters.lineCostPercentage / 100)

  // Calculate operational costs
  const operationalCosts = {
    credentials: credentialsCost,
    ticketing: ticketQuantity * globalParameters.ticketingCostPerTicket,
    supervisors: supervisorsCost,
    operators: operatorsCost,
    mobility: mobilityCost,
    total: 0,
  }
  operationalCosts.total =
    operationalCosts.credentials +
    operationalCosts.ticketing +
    operationalCosts.supervisors +
    operationalCosts.operators +
    operationalCosts.mobility

  // Calculate total revenue
  const totalRevenue = platformFee + ticketingFee + additionalServices

  // Calculate total costs
  const totalCosts = paywayFees.total + palco4Cost + lineCost + operationalCosts.total

  // Calculate gross margin
  const grossMargin = totalRevenue - totalCosts

  // Calculate gross profitability
  const grossProfitability = (grossMargin / totalRevenue) * 100

  return {
    ticketQuantity,
    platformFee,
    ticketingFee,
    additionalServices,
    paywayFees,
    palco4Cost,
    lineCost,
    operationalCosts,
    totalRevenue,
    totalCosts,
    grossMargin,
    grossProfitability,
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


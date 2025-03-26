import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import redis, { getGlobalParametersVersion } from "@/lib/redis"

// Define schema for ticket variation
const TicketVariationSchema = z.object({
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive()
});

// Define schema for ticket sector
const TicketSectorSchema = z.object({
  name: z.string(),
  variations: z.array(TicketVariationSchema)
});

// Define the schema for input validation
const QuotationInputSchema = z.object({
  eventType: z.enum(["A", "B", "C", "D"]),
  totalAmount: z.number().positive().optional(),
  ticketPrice: z.number().positive().optional(),
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
  employees: z.array(z.object({
    employeeTypeId: z.string(),
    quantity: z.number().int().positive(),
    days: z.number().int().positive()
  })).optional().default([]),
  mobilityKilometers: z.number().nonnegative().optional(),
  numberOfTolls: z.number().int().nonnegative().optional(),
  tollsCost: z.number().nonnegative().optional(),
  customOperationalCosts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number().nonnegative()
  })).optional().default([]),
  ticketSectors: z.array(TicketSectorSchema).optional().default([])
})

type QuotationInput = z.infer<typeof QuotationInputSchema>

async function calculateQuotation(input: QuotationInput, globalParameters: any) {
  const {
    totalAmount = 0,
    ticketPrice = 0,
    platform,
    serviceCharge,
    additionalServicesPercentage = 0,
    paymentMethods,
    employees = [],
    mobilityKilometers = 0,
    numberOfTolls = 0,
    tollsCost = 0,
    customOperationalCosts = [],
    ticketSectors = []
  } = input

  // Calculate total ticket quantity and value based on sectors if available
  let ticketQuantity = totalAmount;
  let totalValue = ticketQuantity * ticketPrice;

  // If ticket sectors are defined, recalculate totalValue based on them
  if (ticketSectors.length > 0) {
    let calculatedTotalValue = 0;
    let calculatedTotalQuantity = 0;
    
    // Calculate total value from all sectors and their variations
    ticketSectors.forEach(sector => {
      sector.variations.forEach(variation => {
        calculatedTotalValue += variation.price * variation.quantity;
        calculatedTotalQuantity += variation.quantity;
      });
    });
    
    // Use the calculated values
    totalValue = calculatedTotalValue;
    ticketQuantity = calculatedTotalQuantity;
  }
  
  // Validar que tenemos valores válidos para continuar
  if (totalValue <= 0 || ticketQuantity <= 0) {
    throw new Error("No se ha definido una cantidad válida de tickets o precios. Por favor, revise los sectores de tickets.");
  }

  // Calculate platform fee (as a cost)
  const platformFee = platform.name === "PALCO4" 
    ? ticketQuantity * globalParameters.palco4FeePerTicket 
    : totalValue * (platform.percentage / 100)

  // Calculate service charge and additional services (our revenue)
  const ticketingFee = totalValue * (serviceCharge / 100)
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

  // Calculate employee costs
  let employeeCosts = 0
  if (employees.length > 0) {
    // Obtener todos los tipos de empleados necesarios
    const employeeTypes = await prisma.employeeType.findMany({
      where: {
        id: {
          in: employees.map(e => e.employeeTypeId)
        }
      }
    })

    // Calcular el costo total de empleados
    employeeCosts = employees.reduce((total, employee) => {
      const employeeType = employeeTypes.find(et => et.id === employee.employeeTypeId)
      if (employeeType) {
        return total + (employeeType.costPerDay * employee.quantity * employee.days)
      }
      return total
    }, 0)
  }

  // Calculate mobility costs
  const mobilityFuelCost = mobilityKilometers * (globalParameters.fuelCostPerLiter / globalParameters.kmPerLiter)
  const totalMobilityCost = mobilityFuelCost + (numberOfTolls * tollsCost)

  // Calculate custom operational costs total
  const customOperationalCostsTotal = customOperationalCosts.reduce((sum, cost) => sum + Number(cost.amount), 0)

  // Calculate operational costs
  const operationalCosts = {
    credentials: Number(globalParameters.defaultCredentialsCost) || 0,
    ticketing: platform.name === "PALCO4" ? 0 : ticketQuantity * globalParameters.ticketingCostPerTicket,
    employees: employeeCosts,
    mobility: totalMobilityCost,
    custom: customOperationalCosts,
    total: 0
  }

  // Calculate total operational costs including custom costs
  operationalCosts.total = 
    operationalCosts.credentials +
    operationalCosts.ticketing +
    operationalCosts.employees +
    operationalCosts.mobility +
    customOperationalCostsTotal

  // Format payment fees for response
  const paywayFees = {
    credit: creditFee,
    debit: debitFee,
    cash: cashFee,
    total: ourPaymentCosts
  }

  // Calculate total revenue (ticketing fee + additional services)
  const totalRevenue = ticketingFee + additionalServices

  // Calculate total costs (platform fee + line cost + operational costs + our payment costs)
  const totalCosts = platformFee + lineCost + operationalCosts.total + ourPaymentCosts

  // Calculate gross margin and profitability
  const grossMargin = totalRevenue - totalCosts
  const grossProfitability = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0

  // Log calculations for debugging
  console.log('Calculation details:', {
    totalValue,
    ticketQuantity,
    ticketingFee,
    additionalServices,
    platformFee,
    lineCost,
    operationalCosts,
    employeeCosts,
    mobilityFuelCost,
    totalMobilityCost,
    customOperationalCostsTotal,
    paywayFees,
    totalRevenue,
    totalCosts,
    grossMargin,
    grossProfitability
  })

  return {
    ticketQuantity,
    platformFee,
    ticketingFee,
    additionalServices,
    paywayFees,
    palco4Cost: platform.name === "PALCO4" ? platformFee : 0,
    lineCost,
    operationalCosts,
    totalRevenue,
    totalCosts,
    grossMargin,
    grossProfitability,
    ticketSectors: ticketSectors.map(sector => ({
      name: sector.name,
      variations: sector.variations.map(variation => ({
        name: variation.name,
        price: variation.price,
        quantity: variation.quantity
      }))
    }))
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
        defaultCredentialsCost: 0,
        defaultSupervisorsCost: 0,
        defaultOperatorsCost: 0,
        defaultMobilityCost: 0,
        palco4FeePerTicket: 180,
        lineCostPercentage: 0.41,
        ticketingCostPerTicket: 5,
        fuelCostPerLiter: 300,
        kmPerLiter: 10
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

    // Obtener la versión actual de los parámetros globales
    const currentParametersVersion = await getGlobalParametersVersion();

    // Generate a cache key based on the input and parameters version
    const cacheKey = `quotation:${JSON.stringify(validatedInput)}:pv:${currentParametersVersion || 'default'}`;
    console.log('Cache key:', cacheKey);

    // Try to get the result from cache
    const cachedResult = await redis.get(cacheKey)
    if (cachedResult) {
      console.log('Using cached result');
      return NextResponse.json(JSON.parse(cachedResult))
    }

    // Si no está en caché o la versión de los parámetros ha cambiado, recalcular
    console.log('Calculating new result');
    const globalParameters = await ensureGlobalParameters()
    if (!globalParameters) {
      throw new Error("Failed to ensure global parameters")
    }

    const results = await calculateQuotation(validatedInput, globalParameters)
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


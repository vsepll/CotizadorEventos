import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Define schema for ticket variation
const TicketVariationSchema = z.object({
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  serviceCharge: z.number().nonnegative(),
  serviceChargeType: z.enum(["fixed", "percentage"])
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
  additionalServiceItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    isPercentage: z.boolean()
  })).optional(),
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
    days: z.number().int().nonnegative().optional()
  })).optional().default([]),
  mobilityKilometers: z.number().nonnegative().optional(),
  numberOfTolls: z.number().int().nonnegative().optional(),
  tollsCost: z.number().nonnegative().optional(),
  customOperationalCosts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number().nonnegative(),
    calculationType: z.enum(["fixed", "percentage", "per_day", "per_day_per_person", "per_ticket_system", "per_ticket_sector"]).optional().default("fixed"),
    days: z.number().int().nonnegative().optional(),
    persons: z.number().int().nonnegative().optional(),
    sectors: z.array(z.string()).optional()
  })).optional().default([]),
  ticketSectors: z.array(TicketSectorSchema).optional().default([])
})

type QuotationInput = z.infer<typeof QuotationInputSchema>

async function calculateQuotation(input: QuotationInput, globalParameters: any) {
  const {
    totalAmount = 0,
    ticketPrice = 0,
    platform,
    additionalServiceItems = [],
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
  
  // Determine event days. If employees array is provided we will use the maximum number of days among them as a proxy.
  // Defaults to 1 if not definable.
  const eventDays = employees.length > 0
    ? employees.reduce((max, e) => Math.max(max, e.days ?? 0), 0)
    : 0;

  // Nota: Si se necesita el total de personas (audiencia) para algún cálculo futuro, usar ticketQuantity directamente.

  // Validar que tenemos valores válidos para continuar
  if (totalValue <= 0 || ticketQuantity <= 0) {
    throw new Error("No se ha definido una cantidad válida de tickets o precios. Por favor, revise los sectores de tickets.");
  }

  // Calculate platform fee (as a cost)
  const platformFee = platform.name === "PALCO4" 
    ? ticketQuantity * globalParameters.palco4FeePerTicket 
    : totalValue * (platform.percentage / 100)

  // Calculate service charge based on ticket variations
  let ticketingFee = 0;
  
  // If ticket sectors are defined, calculate service charge based on them
  if (ticketSectors.length > 0) {
    console.log('Calculando cargo de servicio basado en sectores de tickets:', JSON.stringify(ticketSectors, null, 2));
    
    ticketSectors.forEach(sector => {
      sector.variations.forEach(variation => {
        const serviceCharge = variation.serviceCharge || 0;
        const serviceChargeType = variation.serviceChargeType || "fixed";
        
        let charge = 0;
        if (serviceChargeType === "fixed") {
          // Fixed amount per ticket
          charge = serviceCharge * variation.quantity;
        } else {
          // Percentage of ticket price
          charge = (variation.price * variation.quantity) * (serviceCharge / 100);
        }
        
        console.log(`Variación: ${variation.name}, Tipo: ${serviceChargeType}, Valor: ${serviceCharge}, Cargo calculado: ${charge}`);
        ticketingFee += charge;
      });
    });
    
    console.log('Cargo de servicio total calculado:', ticketingFee);
  }
  
  // Calculate additional services from items (percentage is now handled within the item itself)
  const additionalServicesFromItems = additionalServiceItems.reduce((sum, item) => {
    if (item.isPercentage) {
      // Ensure totalValue is valid before calculation
      const baseValue = totalValue > 0 ? totalValue : 0;
      return sum + (baseValue * (item.amount / 100));
    }
    return sum + item.amount;
  }, 0);
  
  // Total additional services now comes solely from the items
  const additionalServices = additionalServicesFromItems;

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
        return total + (employeeType.costPerDay * employee.quantity * (employee.days ?? 0))
      }
      return total
    }, 0)
  }

  // Calculate mobility costs
  const mobilityFuelCost = mobilityKilometers * (globalParameters.fuelCostPerLiter / globalParameters.kmPerLiter)
  const totalMobilityCost = mobilityFuelCost + (numberOfTolls * tollsCost)

  // Helper to compute the monetary value of a custom operational cost according to its calculationType
  const computeCustomCostValue = (cost: any): number => {
    // Validamos que amount sea un número válido mayor a 0
    const amount = Number(cost.amount);
    if (isNaN(amount) || amount <= 0) return 0;

    switch (cost.calculationType) {
      case "percentage":
        return totalValue * (amount / 100);
      case "per_day":
        if (typeof cost.days !== "number" || cost.days <= 0) return 0;
        return cost.days * amount;
      case "per_day_per_person": {
        if (typeof cost.days !== "number" || cost.days <= 0 || 
            typeof cost.persons !== "number" || cost.persons <= 0) return 0;
        return cost.days * cost.persons * amount;
      }
      case "per_ticket_system":
        // Asegurarnos que hay tickets en el sistema
        if (ticketQuantity <= 0) return 0;
        return ticketQuantity * amount;
      case "per_ticket_sector": {
        if (!cost.sectors || cost.sectors.length === 0 || ticketSectors.length === 0) return 0;
        // Sum tickets for the selected sectors only
        let ticketsInSelectedSectors = 0;
        ticketSectors.forEach(sector => {
          if (cost.sectors!.includes(sector.name)) {
            sector.variations.forEach(variation => {
              ticketsInSelectedSectors += variation.quantity;
            });
          }
        });
        // Verificar que hay tickets en los sectores seleccionados
        if (ticketsInSelectedSectors <= 0) return 0;
        return ticketsInSelectedSectors * amount;
      }
      case "fixed":
      default:
        return amount; // Ya validamos que amount es un número válido
    }
  };

  // Calculate totals with the new helper
  const customOperationalCostsTotal = customOperationalCosts.reduce((sum, cost) => {
    return sum + computeCustomCostValue(cost);
  }, 0);

  const computedCustomOperationalCosts = customOperationalCosts.map(cost => ({
    ...cost,
    calculatedAmount: computeCustomCostValue(cost)
  }));

  // Calculate operational costs
  const operationalCosts = {
    credentials: Number(globalParameters.defaultCredentialsCost) || 0,
    ticketing: platform.name === "PALCO4" ? 0 : ticketQuantity * globalParameters.ticketingCostPerTicket,
    employees: employeeCosts,
    mobility: totalMobilityCost,
    custom: computedCustomOperationalCosts,
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

  // Calculate total revenue -> incluir servicios adicionales como ingreso
  const totalRevenue = ticketingFee + additionalServices;

  // Calculate total costs (platform fee + line cost + operational costs + our payment costs)
  const totalCosts = platformFee + lineCost + operationalCosts.total + ourPaymentCosts

  // Calculate gross margin and profitability
  const grossMargin = totalRevenue - totalCosts
  // Cálculo de la rentabilidad basado en el costo total
  const grossProfitability = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0

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

  console.log('Final Calculation Results:', { ticketQuantity, totalValue, platformFee, ticketingFee, additionalServices, paywayFees, lineCost, operationalCosts, totalRevenue, totalCosts, grossMargin, grossProfitability });

  return {
    ticketQuantity,
    ticketPrice,
    totalValue,
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
        quantity: variation.quantity,
        serviceCharge: variation.serviceCharge,
        serviceChargeType: variation.serviceChargeType
      }))
    })),
    additionalServiceItems
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
        defaultAdditionalServicesFee: 0,
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
        kmPerLiter: 10,
        monthlyFixedCosts: 0
      } as any
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

    // Ya no usamos caché para los resultados
    console.log('Calculating new result');
    const globalParameters = await ensureGlobalParameters()
    if (!globalParameters) {
      throw new Error("Failed to ensure global parameters")
    }

    const results = await calculateQuotation(validatedInput, globalParameters)
    console.log('Calculation results:', results)

    // Ya no guardamos resultados en caché

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

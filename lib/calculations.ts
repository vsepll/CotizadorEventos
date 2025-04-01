interface QuotationInput {
  eventType: string
  totalAmount: number
  ticketPrice: number
  platformPercentage: number
  ticketingPercentage: number
  additionalServicesPercentage: number
  creditCardPercentage: number
  debitCardPercentage: number
  cashPercentage: number
  credentialsCost: number
  supervisorsCost: number
  operatorsCost: number
  mobilityCost: number
}

export interface QuotationResults {
  ticketQuantity: number
  platformFee: number
  ticketingFee: number
  additionalServices: number
  paywayFees: {
    credit: number
    debit: number
    cash: number
    total: number
  }
  palco4Cost: number
  lineCost: number
  operationalCosts: {
    credentials: number
    ticketing: number
    supervisors: number
    operators: number
    mobility: number
    custom: Array<{
      id: string
      name: string
      amount: number
    }>
    total: number
  }
  totalRevenue: number
  totalCosts: number
  grossMargin: number
  grossProfitability: number
}

export function calculateQuotation(input: QuotationInput): QuotationResults {
  const {
    eventType,
    totalAmount,
    ticketPrice,
    platformPercentage,
    ticketingPercentage,
    additionalServicesPercentage,
    creditCardPercentage,
    debitCardPercentage,
    cashPercentage,
    credentialsCost,
    supervisorsCost,
    operatorsCost,
    mobilityCost,
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
  const palco4Cost = ticketQuantity * 0.15 * 1200

  // Calculate Line cost
  const lineCost = totalAmount * 0.0041

  // Calculate operational costs
  const operationalCosts = {
    credentials: credentialsCost,
    ticketing: ticketQuantity * 5, // Assuming 5 per ticket for ticketing
    supervisors: supervisorsCost,
    operators: operatorsCost,
    mobility: mobilityCost,
    custom: [],
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


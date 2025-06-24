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
  eventDurationDays?: number
}

export interface ROIMetrics {
  basicROI: number
  roiPerTicket: number
  investmentMultiplier: number
  contributionMargin: number
  breakEvenTickets: number
}

export interface FinancialMetrics {
  profitMarginOnSales: number
  operationalEfficiency: number
  costPerTicket: number
  revenuePerTicket: number
  operationalCostRatio: number
  platformCostRatio: number
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
  roiMetrics: ROIMetrics
  financialMetrics: FinancialMetrics
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
    eventDurationDays = 1,
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
  const grossProfitability = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0

  // ========== NUEVOS CÁLCULOS DE ROI Y MÉTRICAS FINANCIERAS ==========

  // Cálculo de métricas ROI
  const roiMetrics: ROIMetrics = {
    basicROI: grossProfitability,
    roiPerTicket: ticketQuantity > 0 ? grossMargin / ticketQuantity : 0,
    investmentMultiplier: totalCosts > 0 ? (totalRevenue / totalCosts) : 0,
    contributionMargin: totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0,
    breakEvenTickets: ticketPrice > 0 ? Math.ceil(totalCosts / (ticketPrice * (ticketingPercentage / 100))) : 0,
  }

  // Cálculo de métricas financieras adicionales
  const financialMetrics: FinancialMetrics = {
    profitMarginOnSales: totalAmount > 0 ? (grossMargin / totalAmount) * 100 : 0,
    operationalEfficiency: operationalCosts.total > 0 ? (totalRevenue / operationalCosts.total) : 0,
    costPerTicket: ticketQuantity > 0 ? totalCosts / ticketQuantity : 0,
    revenuePerTicket: ticketQuantity > 0 ? totalRevenue / ticketQuantity : 0,
    operationalCostRatio: totalCosts > 0 ? (operationalCosts.total / totalCosts) * 100 : 0,
    platformCostRatio: totalCosts > 0 ? ((palco4Cost + lineCost) / totalCosts) * 100 : 0,
  }

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
    roiMetrics,
    financialMetrics,
  }
}


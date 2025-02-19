import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"

interface QuotationResultsProps {
  results: {
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
      total: number
    }
    totalRevenue: number
    totalCosts: number
    grossMargin: number
    grossProfitability: number
  }
}

export function QuotationResults({ results }: QuotationResultsProps) {
  if (!results) {
    return null
  }

  const revenueData = [
    { name: "Comisión de Plataforma", value: results.platformFee },
    { name: "Comisión de Ticketing", value: results.ticketingFee },
    { name: "Servicios Adicionales", value: results.additionalServices },
  ]

  const costsData = [
    { name: "Comisiones de Pago", value: results.paywayFees.total },
    { name: "Palco 4", value: results.palco4Cost },
    { name: "Costo de Línea", value: results.lineCost },
    { name: "Costos Operativos", value: results.operationalCosts.total },
  ]

  const profitabilityData = [
    { name: "Ingresos", value: results.totalRevenue },
    { name: "Costos", value: results.totalCosts },
    { name: "Margen Bruto", value: results.grossMargin },
  ]

  return (
    <div className="mt-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Quotation Results</CardTitle>
          <CardDescription>Overview of the financial breakdown for the event</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="revenue">Ingresos</TabsTrigger>
              <TabsTrigger value="costs">Costos</TabsTrigger>
              <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.totalCosts.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.grossMargin.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profitability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.grossProfitability.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                      costs: { label: "Costs", color: "hsl(var(--chart-2))" },
                      margin: { label: "Gross Margin", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-80"
                  >
                    <BarChart data={profitabilityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-revenue)" name="Amount" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      platformFee: { label: "Platform Fee", color: "hsl(var(--chart-1))" },
                      ticketingFee: { label: "Ticketing Fee", color: "hsl(var(--chart-2))" },
                      additionalServices: { label: "Additional Services", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-80"
                  >
                    <PieChart>
                      <Pie
                        data={revenueData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="var(--color-platformFee)"
                        label
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.platformFee.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticketing Fee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.ticketingFee.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Additional Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.additionalServices.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Costs Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      paywayFees: { label: "Payway Fees", color: "hsl(var(--chart-1))" },
                      palco4: { label: "Palco 4", color: "hsl(var(--chart-2))" },
                      lineCost: { label: "Line Cost", color: "hsl(var(--chart-3))" },
                      operationalCosts: { label: "Operational Costs", color: "hsl(var(--chart-4))" },
                    }}
                    className="h-80"
                  >
                    <BarChart data={costsData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-paywayFees)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comisiones de Medios de Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">${results.paywayFees.total.toFixed(2)}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Tarjeta de Crédito:</span>
                        <span className="font-medium">${results.paywayFees.credit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tarjeta de Débito:</span>
                        <span className="font-medium">${results.paywayFees.debit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Efectivo:</span>
                        <span className="font-medium">${results.paywayFees.cash.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Costos Operativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">${results.operationalCosts.total.toFixed(2)}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Credenciales:</span>
                        <span className="font-medium">${results.operationalCosts.credentials.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Ticketing:</span>
                        <span className="font-medium">${results.operationalCosts.ticketing.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Supervisores:</span>
                        <span className="font-medium">${results.operationalCosts.supervisors.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Operadores:</span>
                        <span className="font-medium">${results.operationalCosts.operators.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Movilidad:</span>
                        <span className="font-medium">${results.operationalCosts.mobility.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Costos Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Palco 4:</span>
                        <span className="font-medium">${results.palco4Cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Costo de Línea:</span>
                        <span className="font-medium">${results.lineCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Información de Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Cantidad de Tickets:</span>
                        <span className="font-medium">{results.ticketQuantity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Costo por Ticket:</span>
                        <span className="font-medium">${(results.operationalCosts.ticketing / results.ticketQuantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="profitability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                      costs: { label: "Costs", color: "hsl(var(--chart-2))" },
                      margin: { label: "Gross Margin", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-80"
                  >
                    <LineChart data={profitabilityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="value" stroke="var(--color-revenue)" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${results.grossMargin.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profitability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.grossProfitability.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


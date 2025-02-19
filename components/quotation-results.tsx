import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ArrowDown, ArrowUp, DollarSign, Percent, Activity, CreditCard, Building, Users, LucideIcon } from "lucide-react"

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
  comparisonResults?: {
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

interface StatCardProps {
  title: string;
  value: number;
  trend?: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
}

interface DetailCardItem {
  label: string;
  value: number;
}

interface DetailCardProps {
  title: string;
  items: DetailCardItem[];
  icon: LucideIcon;
}

export function QuotationResults({ results, comparisonResults }: QuotationResultsProps) {
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
    { name: "Line", value: results.lineCost },
    { name: "Costos Operativos", value: results.operationalCosts.total },
  ]

  const profitabilityData = [
    { name: "Ingresos", value: results.totalRevenue },
    { name: "Costos", value: results.totalCosts },
    { name: "Margen Bruto", value: results.grossMargin },
  ]

  const getPercentageDifference = (value1: number, value2: number) => {
    if (value1 === 0) return 0
    return ((value2 - value1) / value1) * 100
  }

  const StatCard = ({ title, value, trend = 0, prefix = "$", suffix = "", icon: Icon }: StatCardProps) => (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {prefix}{typeof value === 'number' ? value.toFixed(2) : '0.00'}{suffix}
            </p>
            {trend !== 0 && (
              <p className={`text-sm flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {Math.abs(trend)}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const DetailCard = ({ title, items, icon: Icon }: DetailCardProps) => (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-medium">
                ${typeof item.value === 'number' ? item.value.toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderComparison = () => {
    if (!comparisonResults) return null

    const differences = {
      revenue: getPercentageDifference(results.totalRevenue, comparisonResults.totalRevenue),
      costs: getPercentageDifference(results.totalCosts, comparisonResults.totalCosts),
      margin: getPercentageDifference(results.grossMargin, comparisonResults.grossMargin),
      profitability: comparisonResults.grossProfitability - results.grossProfitability
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Primera Cotización */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cotización Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ingresos Totales</div>
                    <div className="text-2xl font-bold">${results.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Costos Totales</div>
                    <div className="text-2xl font-bold">${results.totalCosts.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Margen Bruto</div>
                    <div className="text-2xl font-bold">${results.grossMargin.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Rentabilidad</div>
                    <div className="text-2xl font-bold">{results.grossProfitability.toFixed(2)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda Cotización */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cotización Comparada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ingresos Totales</div>
                    <div className="text-2xl font-bold">${comparisonResults.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Costos Totales</div>
                    <div className="text-2xl font-bold">${comparisonResults.totalCosts.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Margen Bruto</div>
                    <div className="text-2xl font-bold">${comparisonResults.grossMargin.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Rentabilidad</div>
                    <div className="text-2xl font-bold">{comparisonResults.grossProfitability.toFixed(2)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Análisis Comparativo */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Comparativo</CardTitle>
            <CardDescription>Diferencias principales entre las cotizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              {/* Diferencias Generales */}
              <div className="space-y-4">
                <h3 className="font-semibold">Diferencias Porcentuales</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Ingresos:</span>
                    <span className={differences.revenue >= 0 ? "text-green-600" : "text-red-600"}>
                      {differences.revenue > 0 ? "+" : ""}{differences.revenue.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Costos:</span>
                    <span className={differences.costs <= 0 ? "text-green-600" : "text-red-600"}>
                      {differences.costs > 0 ? "+" : ""}{differences.costs.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Margen:</span>
                    <span className={differences.margin >= 0 ? "text-green-600" : "text-red-600"}>
                      {differences.margin > 0 ? "+" : ""}{differences.margin.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rentabilidad:</span>
                    <span className={differences.profitability >= 0 ? "text-green-600" : "text-red-600"}>
                      {differences.profitability > 0 ? "+" : ""}{differences.profitability.toFixed(2)} puntos
                    </span>
                  </div>
                </div>
              </div>

              {/* Diferencias en Costos */}
              <div className="space-y-4">
                <h3 className="font-semibold">Diferencias en Costos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Comisiones:</span>
                    <span className={comparisonResults.paywayFees.total - results.paywayFees.total <= 0 ? "text-green-600" : "text-red-600"}>
                      ${(comparisonResults.paywayFees.total - results.paywayFees.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Operativos:</span>
                    <span className={comparisonResults.operationalCosts.total - results.operationalCosts.total <= 0 ? "text-green-600" : "text-red-600"}>
                      ${(comparisonResults.operationalCosts.total - results.operationalCosts.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Palco 4:</span>
                    <span className={comparisonResults.palco4Cost - results.palco4Cost <= 0 ? "text-green-600" : "text-red-600"}>
                      ${(comparisonResults.palco4Cost - results.palco4Cost).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Line:</span>
                    <span className={comparisonResults.lineCost - results.lineCost <= 0 ? "text-green-600" : "text-red-600"}>
                      ${(comparisonResults.lineCost - results.lineCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Análisis Financiero del Evento</CardTitle>
          <CardDescription>Desglose detallado de ingresos, costos y rentabilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-4 p-1 bg-muted rounded-lg">
              <TabsTrigger value="summary" className="font-medium">
                Resumen
              </TabsTrigger>
              <TabsTrigger value="revenue" className="font-medium">
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="costs" className="font-medium">
                Costos
              </TabsTrigger>
              <TabsTrigger value="profitability" className="font-medium">
                Rentabilidad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  title="Ingresos Totales"
                  value={results.totalRevenue}
                  icon={DollarSign}
                />
                <StatCard
                  title="Costos Totales"
                  value={results.totalCosts}
                  icon={DollarSign}
                />
                <StatCard
                  title="Margen Bruto"
                  value={results.grossMargin}
                  icon={DollarSign}
                />
                <StatCard
                  title="Rentabilidad"
                  value={results.grossProfitability}
                  prefix=""
                  suffix="%"
                  icon={Percent}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <DetailCard
                  title="Comisiones de Medios de Pago"
                  icon={CreditCard}
                  items={[
                    { label: "Tarjeta de Crédito", value: results.paywayFees.credit },
                    { label: "Tarjeta de Débito", value: results.paywayFees.debit },
                    { label: "Efectivo", value: results.paywayFees.cash },
                    { label: "Total Comisiones", value: results.paywayFees.total },
                  ]}
                />
                <DetailCard
                  title="Costos Operativos"
                  icon={Building}
                  items={[
                    { label: "Credenciales", value: results.operationalCosts.credentials },
                    { label: "Ticketing", value: results.operationalCosts.ticketing },
                    { label: "Supervisores", value: results.operationalCosts.supervisors },
                    { label: "Operadores", value: results.operationalCosts.operators },
                    { label: "Movilidad", value: results.operationalCosts.mobility },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <DetailCard
                  title="Costos Adicionales"
                  icon={Activity}
                  items={[
                    { label: "Palco 4", value: results.palco4Cost },
                    { label: "Line", value: results.lineCost },
                  ]}
                />
                <DetailCard
                  title="Información de Tickets"
                  icon={Users}
                  items={[
                    { label: "Cantidad de Tickets", value: results.ticketQuantity },
                    { label: "Costo por Ticket", value: results.operationalCosts.ticketing / results.ticketQuantity },
                  ]}
                />
              </div>
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
                        <span>Line:</span>
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

      {/* Render comparison if it exists */}
      {comparisonResults && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Análisis Comparativo</CardTitle>
            <CardDescription>Comparación detallada entre cotizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {renderComparison()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


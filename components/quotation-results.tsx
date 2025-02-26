import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell, Tooltip } from "recharts"
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
      custom?: { name: string; amount: number }[]
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

  const COLOR_PALETTE = {
    revenue: {
      service: "#3B82F6",
      additional: "#8B5CF6",
    },
    costs: {
      platform: "#F43F5E",
      payway: "#F43F5E",
      palco4: "#F59E0B",
      line: "#6366F1",
      operational: "#14B8A6",
    },
    profitability: {
      revenue: "#10B981",
      costs: "#F43F5E",
      margin: "#8B5CF6",
    }
  }

  const revenueData = [
    { 
      name: "Cargo por Servicio", 
      value: Number(results.ticketingFee) || 0,
      color: COLOR_PALETTE.revenue.service 
    },
    { 
      name: "Servicios Adicionales", 
      value: Number(results.additionalServices) || 0,
      color: COLOR_PALETTE.revenue.additional 
    },
  ]

  const costsData = [
    { 
      name: "Palco 4", 
      value: Number(results.palco4Cost) || 0,
      color: COLOR_PALETTE.costs.platform 
    },
    { 
      name: "Comisiones de Pago", 
      value: Number(results.paywayFees?.total) || 0,
      color: COLOR_PALETTE.costs.payway 
    },
    ...(results.lineCost > 0 ? [{
      name: "Line", 
      value: Number(results.lineCost) || 0,
      color: COLOR_PALETTE.costs.line 
    }] : []),
    { 
      name: "Costos Operativos", 
      value: Number(results.operationalCosts?.total) || 0,
      color: COLOR_PALETTE.costs.operational 
    },
  ].filter(item => item.value > 0)

  const profitabilityData = [
    { 
      name: "Ingresos", 
      value: Number(results.totalRevenue) || 0,
      color: COLOR_PALETTE.profitability.revenue 
    },
    { 
      name: "Costos", 
      value: Number(results.totalCosts) || 0,
      color: COLOR_PALETTE.profitability.costs 
    },
    { 
      name: "Margen Bruto", 
      value: Number(results.grossMargin) || 0,
      color: COLOR_PALETTE.profitability.margin 
    },
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
              {prefix}{value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
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
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-black text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.filter(item => item.value > 0).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-lg font-semibold text-white">
                ${item.value.toLocaleString('es-AR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2,
                  useGrouping: true 
                })}
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

  // Update PieChart rendering to use custom colors
  const CustomPieChart = ({ data, title }: { data: any[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <PieChart width={300} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Valor"]}
            labelFormatter={(name) => name}
          />
        </PieChart>
      </CardContent>
    </Card>
  )

  // Update BarChart rendering to use custom colors
  const CustomBarChart = ({ data, title }: { data: any[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart width={400} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Valor"]}
            labelFormatter={(name) => name}
          />
          <Bar dataKey="value" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </CardContent>
    </Card>
  )

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Solo mostrar la sección de costos operativos si hay algún costo */}
              {Object.values(results.operationalCosts).some(cost => 
                (typeof cost === 'number' && cost > 0) || 
                (Array.isArray(cost) && cost.length > 0)
              ) && (
                <div className="grid grid-cols-1 gap-6">
                  <DetailCard
                    title="Costos Operativos"
                    icon={Building}
                    items={[
                      ...(results.operationalCosts.credentials > 0 ? [{ label: "Credenciales", value: results.operationalCosts.credentials }] : []),
                      ...(results.operationalCosts.ticketing > 0 ? [{ label: "Ticketing", value: results.operationalCosts.ticketing }] : []),
                      ...(results.operationalCosts.supervisors > 0 ? [{ label: "Supervisores", value: results.operationalCosts.supervisors }] : []),
                      ...(results.operationalCosts.operators > 0 ? [{ label: "Operadores", value: results.operationalCosts.operators }] : []),
                      ...(results.operationalCosts.mobility > 0 ? [{ label: "Movilidad", value: results.operationalCosts.mobility }] : []),
                      ...(results.operationalCosts.custom?.map(cost => ({
                        label: cost.name,
                        value: cost.amount
                      })) || []),
                      { label: "Total Operativo", value: results.operationalCosts.total },
                    ].filter(item => item.value > 0)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Solo mostrar costos de plataforma si hay costos de Palco 4 o Line */}
                {(results.palco4Cost > 0 || results.lineCost > 0) && (
                  <DetailCard
                    title="Costos de Plataforma"
                    icon={Activity}
                    items={[
                      ...(results.palco4Cost > 0 ? [{ 
                        label: "Palco 4",
                        value: results.palco4Cost 
                      }] : []),
                      ...(results.lineCost > 0 ? [{ 
                        label: "Line", 
                        value: results.lineCost 
                      }] : [])
                    ].filter(item => item.value > 0)}
                  />
                )}
                
                {/* Solo mostrar información de tickets si hay datos relevantes */}
                {(results.ticketQuantity > 0 || results.ticketingFee > 0 || results.additionalServices > 0) && (
                  <DetailCard
                    title="Información de Tickets"
                    icon={Users}
                    items={[
                      ...(results.ticketQuantity > 0 ? [{ label: "Cantidad de Tickets", value: results.ticketQuantity }] : []),
                      ...(results.ticketingFee > 0 ? [{ label: "Cargo por Servicio", value: results.ticketingFee }] : []),
                      ...(results.additionalServices > 0 ? [{ label: "Servicios Adicionales", value: results.additionalServices }] : [])
                    ].filter(item => item.value > 0)}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <CustomPieChart data={revenueData} title="Desglose de Ingresos" />
              <div className="grid grid-cols-3 gap-4">
                {revenueData.map((item, index) => (
                  <Card key={index} style={{ borderLeftColor: item.color, borderLeftWidth: '4px' }}>
                    <CardContent className="pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-lg font-bold">${(Number(item.value) || 0).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="costs" className="space-y-4">
              <CustomBarChart data={costsData} title="Desglose de Costos" />
              <div className="grid grid-cols-2 gap-4">
                {costsData.map((item, index) => (
                  <Card key={index} style={{ borderLeftColor: item.color, borderLeftWidth: '4px' }}>
                    <CardContent className="pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-lg font-bold">${(Number(item.value) || 0).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="profitability" className="space-y-4">
              <CustomPieChart data={profitabilityData} title="Análisis de Rentabilidad" />
              <div className="grid grid-cols-3 gap-4">
                {profitabilityData.map((item, index) => (
                  <Card key={index} style={{ borderLeftColor: item.color, borderLeftWidth: '4px' }}>
                    <CardContent className="pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-lg font-bold">${(Number(item.value) || 0).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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


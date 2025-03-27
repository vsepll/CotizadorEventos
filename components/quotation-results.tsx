import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, DollarSign, Percent, Activity, CreditCard, Building, Users, LucideIcon, TrendingDown, TrendingUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useMemo } from "react"

interface QuotationResultsProps {
  results: any; // Usar un tipo más flexible para evitar problemas de compatibilidad
  comparisonResults?: any | null;
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

interface ResultCardProps {
  title: string;
  value: number;
  trend?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
  icon: LucideIcon;
}

const formatNumber = (value: number | null | undefined, options = {}) => {
  if (value === null || value === undefined) return '0,00';
  return value.toLocaleString('es-AR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2,
    ...options
  });
}

const calculateTrend = (current: number, previous: number | undefined | null): number => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

// Memoized tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-2 border rounded shadow">
      <p className="font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: ${formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function QuotationResults({ results, comparisonResults }: QuotationResultsProps) {
  if (!results) {
    return null
  }
  
  console.log('Datos recibidos en QuotationResults:', {
    ticketingFee: results.ticketingFee,
    totalRevenue: results.totalRevenue,
    ticketSectors: results.ticketSectors,
    completeResults: results
  });

  const COLOR_PALETTE = useMemo(() => ({
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
  }), []);

  const revenueData = useMemo(() => {
    console.log('Construyendo revenueData con:', {
      ticketingFee: results.ticketingFee,
      additionalServices: results.additionalServices
    });
    
    return [
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
    ];
  }, [results.ticketingFee, results.additionalServices, COLOR_PALETTE]);

  const costsData = useMemo(() => {
    // Make sure we have valid data
    const validatedResults = results || {};
    
    console.log('Construyendo costsData con:', {
      palco4Cost: validatedResults.palco4Cost,
      paywayFees: validatedResults.paywayFees,
      lineCost: validatedResults.lineCost,
      operationalCosts: validatedResults.operationalCosts
    });
    
    // Create array with all possible cost items
    const allCosts = [
      { 
        name: "Palco 4", 
        value: Number(validatedResults.palco4Cost) || 0,
        color: COLOR_PALETTE.costs.platform 
      },
      { 
        name: "Comisiones de Pago", 
        value: Number(validatedResults.paywayFees?.total) || 0,
        color: COLOR_PALETTE.costs.payway 
      },
      { 
        name: "Line", 
        value: Number(validatedResults.lineCost) || 0,
        color: COLOR_PALETTE.costs.line 
      },
      { 
        name: "Costos Operativos", 
        value: Number(validatedResults.operationalCosts?.total) || 0,
        color: COLOR_PALETTE.costs.operational 
      },
    ];
    
    // Filter out zero-value costs and sort by value (largest first)
    return allCosts
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [results?.palco4Cost, results?.paywayFees?.total, results?.lineCost, results?.operationalCosts?.total, COLOR_PALETTE]);

  const profitabilityData = useMemo(() => [
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
  ], [results.totalRevenue, results.totalCosts, results.grossMargin, COLOR_PALETTE]);

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
              {prefix}{formatNumber(value)}{suffix}
            </p>
            {trend !== 0 && (
              <p className={`text-sm flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {formatNumber(Math.abs(trend), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
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
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                  labelLine={true}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F1F1F", borderRadius: "4px", border: "none" }}
                  formatter={(value: number, name: string, props: any) => [`$${formatNumber(value)}`, name]}
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Update BarChart rendering to use custom colors
  const CustomBarChart = ({ data, title }: { data: any[], title: string }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No hay datos de costos para mostrar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical"
                barCategoryGap={12}
                margin={{ top: 10, right: 30, bottom: 10, left: 120 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, 'dataMax']} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis 
                  type="category" 
                  width={115}
                  dataKey="name" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F1F1F", borderRadius: "4px", border: "none" }}
                  formatter={(value: number) => [`$${formatNumber(value)}`, ""]}
                  cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[4, 4, 4, 4]} 
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Convert number to currency format
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { 
      style: 'currency',
      currency: 'ARS',
    });
  }

  // Safer approach to get operational costs
  const getOperationalCosts = () => {
    const opCosts = results.operationalCosts || {};
    
    return {
      credentials: {
        total: typeof opCosts.credentials === 'number' ? opCosts.credentials : 0
      },
      employees: {
        // If employees is just a number (total), use that number for operators
        operators: typeof opCosts.employees === 'number' ? opCosts.employees : opCosts.employees?.operators || 0,
        supervisors: opCosts.employees?.supervisors || 0
      },
      mobility: {
        total: typeof opCosts.mobility === 'number' ? opCosts.mobility : 0
      },
      // Handle both custom and customCosts array structures
      customCosts: Array.isArray(opCosts.custom) 
        ? opCosts.custom 
        : (Array.isArray(opCosts.customCosts) ? opCosts.customCosts : []),
      total: opCosts.total || 0
    };
  };

  const operationalCosts = getOperationalCosts();

  // Calculate operations cost breakdown
  const operationalCostsBreakdown = [
    ...(operationalCosts.credentials.total > 0 ? [{
      label: "Credenciales",
      value: operationalCosts.credentials.total,
      color: "#0EA5E9" // Light Blue
    }] : []),
    ...(operationalCosts.employees.operators > 0 ? [{
      label: "Operadores",
      value: operationalCosts.employees.operators,
      color: "#EAB308" // Yellow
    }] : []),
    ...(operationalCosts.employees.supervisors > 0 ? [{
      label: "Supervisores",
      value: operationalCosts.employees.supervisors,
      color: "#f59e0b" // Amber
    }] : []),
    ...(operationalCosts.mobility.total > 0 ? [{
      label: "Movilidad",
      value: operationalCosts.mobility.total,
      color: "#84cc16" // Lime
    }] : []),
    ...(Array.isArray(operationalCosts.customCosts) && operationalCosts.customCosts.length > 0 
      ? operationalCosts.customCosts.map((cost, index) => ({
        label: cost.name || `Costo personalizado ${index + 1}`,
        value: cost.amount || 0,
        color: ["#0891b2", "#0d9488", "#14b8a6", "#06b6d4"][index % 4] // Cycle through colors
      }))
      : [])
  ].filter(item => item.value > 0)

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ResultCard
                  title="Ingresos Totales"
                  value={results.totalRevenue}
                  trend={calculateTrend(results.totalRevenue, comparisonResults?.totalRevenue)}
                  prefix="$"
                  icon={TrendingUp}
                />
                <ResultCard
                  title="Costos Totales"
                  value={results.totalCosts}
                  trend={calculateTrend(results.totalCosts, comparisonResults?.totalCosts)}
                  prefix="$"
                  icon={TrendingDown}
                />
                <ResultCard
                  title="Margen Bruto"
                  value={results.grossMargin}
                  trend={calculateTrend(results.grossMargin, comparisonResults?.grossMargin)}
                  prefix="$"
                  icon={TrendingUp}
                />
                <ResultCard
                  title="Rentabilidad"
                  value={results.grossProfitability}
                  trend={calculateTrend(results.grossProfitability, comparisonResults?.grossProfitability)}
                  suffix="%"
                  icon={TrendingUp}
                />
              </div>

              {/* Solo mostrar la sección de costos operativos si hay algún costo */}
              {operationalCosts.total > 0 && (
                <div className="grid grid-cols-1 gap-6">
                  <DetailCard
                    title="Costos Operativos"
                    icon={Building}
                    items={operationalCostsBreakdown}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Solo mostrar costos de plataforma si hay costos de Palco 4 */}
                {(results.palco4Cost > 0) && (
                  <DetailCard
                    title="Costos de Plataforma"
                    icon={Activity}
                    items={[
                      ...(results.palco4Cost > 0 ? [{ 
                        label: "Palco 4",
                        value: results.palco4Cost 
                      }] : [])
                    ].filter(item => item.value > 0)}
                  />
                )}
                
                {/* Solo mostrar información de tickets si hay datos relevantes */}
                {(results.ticketQuantity > 0 || results.ticketingFee > 0 || results.additionalServices > 0 || results.lineCost > 0) && (
                  <DetailCard
                    title="Información de Tickets"
                    icon={Users}
                    items={[
                      ...(results.ticketQuantity > 0 ? [{ label: "Cantidad de Tickets", value: results.ticketQuantity }] : []),
                      ...(results.ticketingFee > 0 ? [{ label: "Cargo por Servicio", value: results.ticketingFee }] : []),
                      ...(results.additionalServices > 0 ? [{ label: "Servicios Adicionales", value: results.additionalServices }] : []),
                      ...(results.lineCost > 0 ? [{ label: "Line", value: results.lineCost }] : [])
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

function ResultCard({ title, value, trend = 0, prefix = "", suffix = "", description, icon: Icon }: ResultCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-2xl font-bold">
            {prefix}{formatNumber(value)}{suffix}
          </p>
          {trend !== 0 && (
            <p className={`text-sm flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {formatNumber(Math.abs(trend), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </p>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}


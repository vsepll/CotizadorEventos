import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, DollarSign, Percent, Activity, CreditCard, Building, Users, LucideIcon, TrendingDown, TrendingUp, CheckCircle, XCircle, Send } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"

interface QuotationResultsProps {
  id: string;
  results: any; // Usar un tipo más flexible para evitar problemas de compatibilidad
  comparisonResults?: any | null;
  status?: 'draft' | 'review' | 'approved' | 'rejected';
  onStatusChange: (id: string, newStatus: 'review' | 'approved' | 'rejected') => Promise<void>;
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
  value: string; // Changed to string to hold pre-formatted value
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

export interface QuotationResults {
  ticketQuantity: number;
  platformFee: number;
  ticketingFee: number;
  additionalServices: number;
  additionalServicesFromPercentage?: number;
  additionalServicesFromItems?: number;
  additionalServiceItems?: Array<{
    id: string;
    name: string;
    amount: number;
    isPercentage: boolean;
  }>;
  paywayFees: {
    credit: number;
    debit: number;
    cash: number;
    total: number;
  };
  // ... existing fields ...
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

export function QuotationResults({ id, results, comparisonResults, status = 'draft', onStatusChange }: QuotationResultsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const StatCard = ({ title, value, trend, prefix = "$", suffix = "", icon: Icon }: StatCardProps) => (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xl font-bold">
              {prefix}{formatNumber(value)}{suffix}
            </p>
            {trend !== undefined && trend !== 0 && (
              <p className={`text-xs flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {formatNumber(Math.abs(trend), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const DetailCard = ({ title, items, icon: Icon }: DetailCardProps) => (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.filter(item => item.value !== "$0,00" && item.value !== "0").map((item, index) => ( // Filter out zero values represented as strings
            <div key={index} className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground flex-shrink whitespace-nowrap">
                {item.label}
              </span>
              <span className="text-base font-semibold text-foreground whitespace-nowrap">
                {/* Render the pre-formatted string value */} 
                {item.value}
              </span>
            </div>
          ))}
          {items.every(item => item.value === "$0,00" || item.value === "0") && (
            <p className="text-sm text-muted-foreground text-center py-2">Sin datos</p>
          )}
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
    const custom = Array.isArray(opCosts.custom) 
        ? opCosts.custom 
        : (Array.isArray(opCosts.customCosts) ? opCosts.customCosts : []);
    const customTotal = custom.reduce((sum: number, cost: any) => {
      const value = cost?.calculatedAmount != null ? Number(cost.calculatedAmount) : Number(cost?.amount) || 0;
      return sum + value;
    }, 0);

    return {
      credentials: typeof opCosts.credentials === 'number' ? opCosts.credentials : 0,
      // Assuming 'employees' on results is the total employee cost calculated in the backend
      employees: typeof opCosts.employees === 'number' ? opCosts.employees : 0,
      mobility: typeof opCosts.mobility === 'number' ? opCosts.mobility : 0,
      // Include ticketing cost if available
      ticketing: typeof opCosts.ticketing === 'number' ? opCosts.ticketing : 0, 
      customTotal: customTotal,
      // Preserve the original custom costs array for detailed breakdown
      custom: custom,
      total: opCosts.total || 0 // Use total if available, otherwise sum might be needed
    };
  };
  
  // --- Define getTicketInfo function --- 
  const getTicketInfo = () => {
    const ticketItems: DetailCardItem[] = [];
    
    // Format Ticket Quantity as integer string
    if (results.ticketQuantity != null && results.ticketQuantity > 0) {
      ticketItems.push({ 
        label: "Cantidad de Tickets", 
        value: results.ticketQuantity.toLocaleString('es-AR') // Format as plain number
      });
    }
    // Format others as currency strings
    if (results.ticketingFee != null && results.ticketingFee > 0) {
      ticketItems.push({ label: "Cargo por Servicio Total", value: `$${formatNumber(results.ticketingFee)}` });
    }
    if (results.additionalServices != null && results.additionalServices > 0) {
      if (results.additionalServiceItems && results.additionalServiceItems.length > 0) {
        results.additionalServiceItems.forEach((service: {
          id: string;
          name: string;
          amount: number;
          isPercentage: boolean;
        }) => {
          // Use results.totalValue (total ticket sales value) as the base for percentage calculation
          const amount = service.isPercentage 
            ? (service.amount / 100) * (results.totalValue || 0) // Use totalValue, fallback to 0
            : service.amount;
          
          // Ensure amount is a valid number before formatting
          const formattedAmount = isNaN(amount) ? "$NaN" : `$${formatNumber(amount)}`;

          ticketItems.push({ 
            // Modify label for percentage items
            label: `${service.name} ${service.isPercentage ? `(${service.amount}% s/ Venta Total)` : ''}`,
            value: formattedAmount
          });
        });
      } else {
        ticketItems.push({ 
          label: "Servicios Adicionales", 
          value: `$${formatNumber(results.additionalServices)}` 
        });
      }
    }
    if (results.lineCost != null && results.lineCost > 0) {
      ticketItems.push({ label: "Costo \"Line\"", value: `$${formatNumber(results.lineCost)}` });
    }
     if (results.palco4Cost != null && results.palco4Cost > 0) {
      ticketItems.push({ label: "Costo Palco4", value: `$${formatNumber(results.palco4Cost)}` });
    }

    return ticketItems;
  }
  // --- End define getTicketInfo --- 

  // Get operational costs including custom costs  
  const operationalCostsObject = useMemo(() => {
    const opCosts = results.operationalCosts || {};
    const custom = Array.isArray(opCosts.custom) 
        ? opCosts.custom 
        : (Array.isArray(opCosts.customCosts) ? opCosts.customCosts : []);
    const customTotal = custom.reduce((sum: number, cost: any) => {
      const value = cost?.calculatedAmount != null ? Number(cost.calculatedAmount) : Number(cost?.amount) || 0;
      return sum + value;
    }, 0);

    return {
      credentials: typeof opCosts.credentials === 'number' ? opCosts.credentials : 0,
      employees: typeof opCosts.employees === 'number' ? opCosts.employees : 0,
      mobility: typeof opCosts.mobility === 'number' ? opCosts.mobility : 0,
      ticketing: typeof opCosts.ticketing === 'number' ? opCosts.ticketing : 0, 
      customTotal: customTotal,
      custom: custom,
      total: opCosts.total || 0
    };
  }, [results]);
    
  const ticketInfo = useMemo(() => getTicketInfo(), [results]);
  
  // --- Transform operationalCosts for DetailCard --- 
  const operationalCostsForCard: DetailCardItem[] = useMemo(() => {
    const items: DetailCardItem[] = [];
    if (operationalCostsObject.credentials > 0) {
      items.push({ label: "Credenciales", value: `$${formatNumber(operationalCostsObject.credentials)}` });
    }
     if (operationalCostsObject.ticketing > 0) { // Added ticketing
      items.push({ label: "Ticketing", value: `$${formatNumber(operationalCostsObject.ticketing)}` });
    }
    if (operationalCostsObject.employees > 0) {
      items.push({ label: "Personal", value: `$${formatNumber(operationalCostsObject.employees)}` });
    }
    if (operationalCostsObject.mobility > 0) {
      items.push({ label: "Movilidad", value: `$${formatNumber(operationalCostsObject.mobility)}` });
    }
     if (operationalCostsObject.customTotal > 0) {
      items.push({ label: "Costos Op. Personalizados", value: `$${formatNumber(operationalCostsObject.customTotal)}` });
    }
    // Comisiones de Pago
    if (results.paywayFees?.total != null && results.paywayFees.total > 0) {
      items.push({ label: "Comisiones Pago", value: `$${formatNumber(results.paywayFees.total)}` });
    }
    // Add other operational costs if they are separate properties in the object
    return items;
  }, [operationalCostsObject, results]);
  // --- End transform --- 
  
  // --- Get Custom Operational Costs Breakdown ---  
  const customOperationalCostsForCard: DetailCardItem[] = useMemo(() => {
    const items: DetailCardItem[] = [];
    // Use the custom costs from operationalCostsObject
    const customCosts = operationalCostsObject.custom || [];
        
    if (Array.isArray(customCosts) && customCosts.length > 0) {
      customCosts.forEach(cost => {
        // Use calculatedAmount if available, otherwise fall back to amount
        const amount = cost?.calculatedAmount != null 
          ? Number(cost.calculatedAmount) 
          : Number(cost?.amount) || 0;
                  
        if (amount > 0) {
          // Format cost description based on calculation type if available
          let label = cost.name;
          if (cost.calculationType) {
            switch (cost.calculationType) {
              case "percentage":
                label = `${cost.name} (${cost.amount}%)`;
                break;
              case "per_day":
                label = `${cost.name} (${cost.days || 1} días)`;
                break;
              case "per_day_per_person":
                label = `${cost.name} (${cost.days || 1} días × ${cost.persons || 1} pers.)`;
                break;
              case "per_ticket_system":
                label = `${cost.name} (por ticket)`;
                break;
              case "per_ticket_sector":
                const sectorCount = cost.sectors?.length || 0;
                label = `${cost.name} (${sectorCount} sector${sectorCount !== 1 ? 'es' : ''})`;
                break;
              default:
                // Fixed amount or unknown type
                break;
            }
          }
                    
          items.push({ 
            label: label,
            value: `$${formatNumber(amount)}` 
          });
        }
      });
    }
        
    return items;
  }, [operationalCostsObject.custom]);
  // --- End Custom Operational Costs Breakdown ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-700'
      case 'review':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador'
      case 'review':
        return 'En Revisión'
      case 'approved':
        return 'Aprobada'
      case 'rejected':
        return 'Rechazada'
      default:
        return 'Borrador'
    }
  }

  // --- Status Change Handlers ---
  const handleStatusUpdate = async (newStatus: 'review' | 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await onStatusChange(id, newStatus);
      // Optionally add success feedback here (e.g., toast notification)
    } catch (error) {
      console.error("Error updating status:", error);
      // Optionally add error feedback here
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Status Change Handlers ---

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Resultados</h2>
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
          
          {/* Action Buttons based on status - Eliminado el botón "Enviar a Revisión" */}
          {status === 'review' && (
            <>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                 {isSubmitting ? 'Rechazando...' : 'Rechazar'}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate('approved')}
                disabled={isSubmitting}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                 {isSubmitting ? 'Aprobando...' : 'Aprobar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {status === 'review' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p>Esta cotización está en revisión. Los valores no afectarán a las métricas generales hasta su aprobación.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard 
          title="Ingresos Totales" 
          value={results.totalRevenue || 0} 
          icon={DollarSign} 
          trend={comparisonResults ? calculateTrend(results.totalRevenue, comparisonResults.totalRevenue) : undefined}
        />
        <StatCard 
          title="Costos Totales" 
          value={results.totalCosts || 0} 
          icon={TrendingDown}
          trend={comparisonResults ? calculateTrend(results.totalCosts, comparisonResults.totalCosts) : undefined} 
        />
        <StatCard 
          title="Margen Bruto" 
          value={results.grossMargin || 0} 
          icon={TrendingUp}
          trend={comparisonResults ? calculateTrend(results.grossMargin, comparisonResults.grossMargin) : undefined}
        />
        <StatCard 
          title="Rentabilidad" 
          value={results.grossProfitability || 0} 
          icon={Percent} 
          prefix=""
          suffix="%" 
          trend={comparisonResults ? results.grossProfitability - comparisonResults.grossProfitability : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {operationalCostsForCard.length > 0 && (
          <DetailCard 
            title="Costos Operativos" 
            items={operationalCostsForCard} 
            icon={Building}
          />
        )}
        {operationalCostsObject.custom && operationalCostsObject.custom.length > 0 && (
          <DetailCard 
            title="Desglose de Costos Operativos Personalizados" 
            items={customOperationalCostsForCard} 
            icon={DollarSign}
          />
        )}
        {ticketInfo.length > 0 && (
          <DetailCard 
            title="Información de Plataforma y Tickets" 
            items={ticketInfo} 
            icon={Activity}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis Gráfico</CardTitle>
          <CardDescription>Visualización de ingresos, costos y rentabilidad.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="costs-pie">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="costs-pie">Costos (Torta)</TabsTrigger>
              <TabsTrigger value="revenue-pie">Ingresos (Torta)</TabsTrigger>
              <TabsTrigger value="profit-bar">Rentabilidad (Barras)</TabsTrigger>
            </TabsList>
            <TabsContent value="costs-pie" className="mt-4">
              <CustomPieChart data={costsData} title="Desglose de Costos" />
            </TabsContent>
            <TabsContent value="revenue-pie" className="mt-4">
              <CustomPieChart data={revenueData} title="Desglose de Ingresos" />
            </TabsContent>
             <TabsContent value="profit-bar" className="mt-4">
                <p className="text-center text-muted-foreground p-8">Gráfico de Rentabilidad (Barras) no implementado aún.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {comparisonResults && (
         <Card>
           <CardHeader>
             <CardTitle>Análisis Comparativo</CardTitle>
             <CardDescription>Comparación con cotización anterior.</CardDescription>
           </CardHeader>
           <CardContent>
             {renderComparison()}
           </CardContent>
         </Card>
      )}
    </div>
  );
}



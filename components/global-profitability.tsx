"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { format, startOfMonth } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Calendar, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

// Define the structure for cost breakdown
interface CostBreakdown {
  platform: number
  line: number
  paywayFees: number
  credentials: number
  ticketing: number
  employees: number
  mobility: number
  customOperational: number
}

interface QuotationForTable {
  id: string
  name: string
  eventType: string
  totalRevenue: number
  totalCosts: number
  grossMargin: number
  grossProfitability: number
  createdAt: string
  estimatedPaymentDate: string | null
  paymentStatus: string
  user: {
    name: string | null
    email: string
  } | null
}

interface GlobalProfitabilityData {
  totalRevenue: number
  totalOperationalCosts: number // This seems unused now, consider removing from backend?
  monthlyFixedCosts: number
  totalFixedCosts: number
  totalCosts: number
  profit: number
  profitability: number
  costBreakdown: CostBreakdown // Added cost breakdown
  quotationCount: number
  timeframeInMonths: number
  quotations: Array<QuotationForTable> // Use the specific type
}

interface MetricCardProps {
  title: string
  value: string
  change?: number // This seems unused, consider removing
  icon: React.ReactNode
  isLoading?: boolean
}

const MetricCard = ({ title, value, change, icon, isLoading }: MetricCardProps) => {
  if (isLoading) {
    // Simplified Skeleton for MetricCard
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
          <Skeleton className="h-6 w-6" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><Skeleton className="h-8 w-3/4" /></div>
          {change !== undefined && <p className="text-xs text-muted-foreground"><Skeleton className="h-4 w-1/2" /></p>}
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* Adjusted icon styling to match dashboard */} 
        <div className="h-6 w-6 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
         {/* Removed 'vs mes anterior' as change prop seems unused */}
         {/* {change !== undefined && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium flex items-center",
                change >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(change)}%
              </span>
            </div>
          )} */} 
      </CardContent>
    </Card>
  )
}

// Helper function to format cost category keys
function formatCostCategory(key: string): string {
  switch (key) {
    case 'platform': return 'Plataforma (Palco4)';
    case 'line': return 'Line';
    case 'paywayFees': return 'Comisiones de Pago';
    case 'credentials': return 'Credenciales';
    case 'ticketing': return 'Ticketing';
    case 'employees': return 'Empleados';
    case 'mobility': return 'Movilidad';
    case 'customOperational': return 'Costos Operativos Personalizados';
    default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Add spaces and capitalize
  }
}

export function GlobalProfitability() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<GlobalProfitabilityData | null>(null)
  const { toast } = useToast()
  
  const now = new Date()
  const firstDayOfMonth = startOfMonth(now)
  
  const [dateFrom, setDateFrom] = useState<string>(
    format(firstDayOfMonth, "yyyy-MM-dd")
  )
  const [dateTo, setDateTo] = useState<string>(
    format(now, "yyyy-MM-dd")
  )
  
  const [mode, setMode] = useState<"creation" | "payment">("creation")
  const [status, setStatus] = useState<"ALL" | "PENDING" | "PAID">("ALL")
  
  const fetchProfitabilityData = async () => {
    // Reset data to null when refetching to ensure loading state works correctly
    setData(null) 
    setIsLoading(true)
    try {
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      
      const params = new URLSearchParams({
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
        mode,
        status,
      })
      
      const response = await fetch(`/api/dashboard/global-profitability?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to get error details
        throw new Error(errorData.error || "Error al cargar datos de rentabilidad global")
      }
      
      const result = await response.json()
      setData(result)
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron cargar los datos"
      })
      setData(null) // Ensure data is null on error
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos cuando los filtros cambien
  useEffect(() => {
    // Validate dates before fetching
    if (dateFrom && dateTo && new Date(dateFrom) <= new Date(dateTo)) {
       fetchProfitabilityData()
    } else if (dateFrom && dateTo) {
       // Optionally show a toast if dates are invalid
        toast({
           variant: "destructive",
           title: "Fechas inválidas",
           description: "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'."
       })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, mode, status]) // REMOVED monthlyFixedCosts from dependency array

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>
      case "PENDING":
      // Consider adding "CONFIRMED" if used
      // case "CONFIRMED": 
      //   return <Badge className="bg-blue-500 hover:bg-blue-600">Confirmado</Badge>
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    // Handle null/undefined input
    if (value == null) return "N/A"; 
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Análisis</CardTitle>
          <CardDescription>Ajusta el período, modo de fecha y estado de pago para el análisis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Row 1: Dates */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="dateFrom">Desde:</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="dateTo">Hasta:</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          {/* Filter Row 2: Mode & Status */}
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1 space-y-1">
                <Label htmlFor="mode">Modo de Fecha:</Label>
                <Select value={mode} onValueChange={(value) => setMode(value as "creation" | "payment")}>
                  <SelectTrigger id="mode" className="w-full">
                    <SelectValue placeholder="Modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creation">Fecha de Cotización</SelectItem>
                    <SelectItem value="payment">Fecha de Cobro Estimada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="status">Estado de Pago:</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | "PENDING" | "PAID")}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="PAID">Pagados</SelectItem>
                    {/* Add CONFIRMED if needed */}
                  </SelectContent>
                </Select>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Tabs Section --- */} 
      <Tabs defaultValue="profitability" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profitability">Rentabilidad Global</TabsTrigger>
          <TabsTrigger value="reports">Informes de Costos</TabsTrigger>
        </TabsList>
        
        {/* --- Rentabilidad Global Tab --- */}
        <TabsContent value="profitability" className="mt-6 space-y-6">
          {isLoading ? (
            // Skeleton for Profitability Tab
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <MetricCard key={i} title="" value="" icon={<></>} isLoading={true} />)}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                  <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </>
          ) : data ? (
            // Actual Profitability Content
            <>
              {/* Display Fetched Fixed Costs */}
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm text-muted-foreground">
                  Cálculos realizados utilizando costos fijos mensuales de <span className="font-semibold text-foreground">{formatCurrency(data.monthlyFixedCosts)}</span> (prorrateados a {formatCurrency(data.totalFixedCosts)} para el período). Este valor se configura en <a href="/admin/settings" className="underline hover:text-primary">Ajustes Globales</a>.
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard 
                  title="Ingresos Totales" 
                  value={formatCurrency(data.totalRevenue)} 
                  icon={<DollarSign size={18} />} 
                />
                <MetricCard 
                  title="Costos Totales (Op. + Fijos)" 
                  value={formatCurrency(data.totalCosts)} 
                  icon={<BarChart3 size={18} />} 
                />
                <MetricCard 
                  title="Ganancia Neta" 
                  value={formatCurrency(data.profit)} 
                  icon={<DollarSign size={18} />} 
                />
                <MetricCard 
                  title="Rentabilidad Neta" 
                  value={`${data.profitability != null ? data.profitability.toFixed(2) : 'N/A'}%`}
                  icon={<TrendingUp size={18} />} 
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Cotizaciones ({data.quotationCount})</CardTitle>
                  <CardDescription>
                    Cotizaciones consideradas en este análisis ({format(new Date(dateFrom), "dd/MM/yy")} - {format(new Date(dateTo), "dd/MM/yy")}).
                    {data.totalFixedCosts > 0 && ` Se incluyeron ${formatCurrency(data.totalFixedCosts)} de costos fijos prorrateados.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Evento</TableHead>
                          <TableHead>Usuario</TableHead>
                          {/* <TableHead>Tipo</TableHead> */}
                          <TableHead>Creada</TableHead>
                          <TableHead>Cobro Est.</TableHead>
                          <TableHead>Estado Pago</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">Costos Op.</TableHead>
                          <TableHead className="text-right">Rent. Bruta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.quotations.length > 0 ? (
                          data.quotations.map((quotation) => (
                            <TableRow key={quotation.id}>
                              <TableCell className="font-medium max-w-xs truncate" title={quotation.name}>{quotation.name}</TableCell>
                              <TableCell className="whitespace-nowrap">{quotation.user?.name || quotation.user?.email || 'N/A'}</TableCell>
                              {/* <TableCell>Tipo {quotation.eventType}</TableCell> */}
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(quotation.createdAt), "dd/MM/yy")}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {quotation.estimatedPaymentDate ? format(new Date(quotation.estimatedPaymentDate), "dd/MM/yy") : '-'}
                              </TableCell>
                              <TableCell>{getStatusBadge(quotation.paymentStatus)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatCurrency(quotation.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatCurrency(quotation.totalCosts)} 
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <span className={cn(
                                  "font-medium",
                                  quotation.grossProfitability >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                  {quotation.grossProfitability != null ? `${quotation.grossProfitability.toFixed(2)}%` : 'N/A'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No se encontraron cotizaciones que coincidan con los filtros seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
             // Error/No Data state for Profitability Tab 
            <div className="text-center py-12 text-muted-foreground">
               No se pudieron cargar los datos de rentabilidad.
             </div>
          )}
        </TabsContent>

        {/* --- Informes Tab (Cost Breakdown) --- */}
        <TabsContent value="reports" className="mt-6">
         {isLoading ? (
            // Skeleton for Reports Tab
            <Card>
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-56" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border p-4 rounded-md">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ))}
              </CardContent>
            </Card>
         ) : data && data.costBreakdown ? (
            // Actual Reports Content
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Costos Operativos Totales</CardTitle>
                <CardDescription>
                  Suma de los costos operativos de las {data.quotationCount} cotizaciones seleccionadas.
                  {/* Updated description to reference fetched fixed costs */}
                  Los costos fijos mensuales ({formatCurrency(data.monthlyFixedCosts)} desde Ajustes Globales) no se incluyen aquí.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.costBreakdown)
                      .filter(([_, value]) => value > 0) // Only show categories with costs > 0
                      .sort(([, a], [, b]) => b - a) // Sort by value descending
                      .map(([key, value]) => (
                      <div key={key} className="border p-4 rounded-lg shadow-sm bg-card">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {formatCostCategory(key)} 
                        </p>
                        <p className="text-xl font-bold">{formatCurrency(value)}</p>
                      </div>
                    ))}
                    {/* Message if all costs are zero */}
                    {Object.values(data.costBreakdown).every(v => v === 0) && (
                       <p className="text-muted-foreground col-span-full text-center py-6">
                         No se registraron costos operativos para las cotizaciones en este período.
                       </p>
                    )}
                  </div>
              </CardContent>
            </Card>
          ) : (
             // Error/No Data state for Reports Tab
             <div className="text-center py-12 text-muted-foreground">
               No se pudieron cargar los datos de desglose de costos.
             </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Fallback message if data is null after loading (error state) */}
      {!isLoading && !data && (
         <div className="text-center py-12">
           <p className="text-muted-foreground">No hay datos disponibles o ocurrió un error al cargarlos.</p>
         </div>
      )}
    </div>
  )
} 
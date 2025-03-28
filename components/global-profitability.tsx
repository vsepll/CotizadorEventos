"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { format, addMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { CalendarIcon, ArrowUp, ArrowDown } from "lucide-react"
import { BarChart3 } from "lucide-react"

interface GlobalProfitabilityData {
  totalRevenue: number
  totalOperationalCosts: number
  monthlyFixedCosts: number
  totalFixedCosts: number
  totalCosts: number
  profit: number
  profitability: number
  quotationCount: number
  timeframeInMonths: number
  quotations: Array<{
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
  }>
}

interface MetricCardProps {
  title: string
  value: string
  change?: number
  icon: React.ReactNode
  isLoading?: boolean
}

const MetricCard = ({ title, value, change, icon, isLoading }: MetricCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex animate-pulse space-y-3">
            <div className="h-6 w-1/2 rounded bg-muted"></div>
            <div className="h-8 w-3/4 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium flex items-center",
                change >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function GlobalProfitability() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<GlobalProfitabilityData | null>(null)
  const { toast } = useToast()
  
  // Configuración inicial: primer día del mes actual hasta hoy
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
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState<number>(50000)
  
  const fetchProfitabilityData = async () => {
    setIsLoading(true)
    try {
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      
      const params = new URLSearchParams({
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
        mode,
        status,
        monthlyFixedCosts: monthlyFixedCosts.toString()
      })
      
      const response = await fetch(`/api/dashboard/global-profitability?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error("Error al cargar datos de rentabilidad global")
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de rentabilidad global"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos cuando los filtros cambien
  useEffect(() => {
    fetchProfitabilityData()
  }, [dateFrom, dateTo, mode, status, monthlyFixedCosts])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500">Pagado</Badge>
      case "PENDING":
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-xl font-semibold">Rentabilidad Global</h3>
            <p className="text-muted-foreground">Análisis de rentabilidad considerando costos fijos mensuales</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex gap-3 items-center">
              <div className="space-y-1">
                <Label htmlFor="dateFrom">Desde:</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="dateTo">Hasta:</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={mode} onValueChange={(value) => setMode(value as "creation" | "payment")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creation">Fecha de Cotización</SelectItem>
                  <SelectItem value="payment">Fecha de Cobro Estimada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | "PENDING" | "PAID")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="PAID">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Label htmlFor="monthlyFixedCosts" className="min-w-32">Costos Fijos Mensuales</Label>
            <div className="flex items-center w-full sm:w-auto">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <Input
                id="monthlyFixedCosts"
                type="number"
                min="0"
                step="100"
                value={monthlyFixedCosts}
                onChange={(e) => setMonthlyFixedCosts(parseFloat(e.target.value) || 0)}
                className="max-w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Ingresos Totales" 
              value={formatCurrency(data.totalRevenue)} 
              icon={<DollarSign size={18} />} 
              isLoading={isLoading}
            />
            <MetricCard 
              title="Costos Totales" 
              value={formatCurrency(data.totalCosts)} 
              icon={<BarChart3 size={18} />} 
              isLoading={isLoading}
            />
            <MetricCard 
              title="Ganancia" 
              value={formatCurrency(data.profit)} 
              icon={<DollarSign size={18} />} 
              isLoading={isLoading}
            />
            <MetricCard 
              title="Rentabilidad Global" 
              value={`${(data.profitability * 100).toFixed(2)}%`}
              icon={<TrendingUp size={18} />} 
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Cotizaciones</CardTitle>
              <CardDescription>
                Cotizaciones incluidas en el análisis de rentabilidad global
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Detalle de Cotizaciones</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Costos</TableHead>
                        <TableHead className="text-right">Rentabilidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.quotations.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell className="font-medium">{quotation.name}</TableCell>
                          <TableCell>{quotation.user?.name || quotation.user?.email || 'N/A'}</TableCell>
                          <TableCell>Tipo {quotation.eventType}</TableCell>
                          <TableCell>
                            {format(new Date(quotation.createdAt), "dd/MM/yyyy")}
                            {quotation.estimatedPaymentDate && (
                              <div className="text-xs text-muted-foreground">
                                Cobro est.: {format(new Date(quotation.estimatedPaymentDate), "dd/MM/yyyy")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(quotation.paymentStatus)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(quotation.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(quotation.totalCosts)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              quotation.grossProfitability >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {quotation.grossProfitability.toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!data?.quotations || data.quotations.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No se encontraron cotizaciones para el período seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </div>
      )}
    </div>
  )
} 
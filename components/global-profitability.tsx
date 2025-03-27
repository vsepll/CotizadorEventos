"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
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

interface DateRange {
  from: Date
  to: Date
}

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
  }>
}

export function GlobalProfitability() {
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  })
  const [mode, setMode] = useState<"creation" | "payment">("creation")
  const [status, setStatus] = useState<"ALL" | "PENDING" | "PAID">("ALL")
  const [data, setData] = useState<GlobalProfitabilityData | null>(null)
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState<number>(() => {
    // Intentar obtener el valor guardado en localStorage, o usar 0 como valor por defecto
    try {
      const savedValue = localStorage.getItem('monthlyFixedCosts') 
      return savedValue ? parseFloat(savedValue) : 0
    } catch (e) {
      return 0
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    localStorage.setItem('monthlyFixedCosts', monthlyFixedCosts.toString())
  }, [monthlyFixedCosts])

  useEffect(() => {
    fetchProfitabilityData()
  }, [date, mode, status, monthlyFixedCosts])

  const fetchProfitabilityData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        dateFrom: date.from.toISOString(),
        dateTo: date.to.toISOString(),
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

  const formattedDate = date.from && date.to
    ? `${format(date.from, 'dd/MM/yyyy', { locale: es })} - ${format(date.to, 'dd/MM/yyyy', { locale: es })}`
    : "Selecciona un rango de fechas"

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-xl font-semibold">Rentabilidad Global</h3>
            <p className="text-muted-foreground">Análisis de rentabilidad considerando costos fijos mensuales</p>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <DatePickerWithRange date={date} setDate={setDate} />
            <div className="flex space-x-2">
              <Select value={mode} onValueChange={(value) => setMode(value as "creation" | "payment")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creation">Fecha de Cotización</SelectItem>
                  <SelectItem value="payment">Fecha de Cobro Estimada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | "PENDING" | "PAID")}>
                <SelectTrigger className="w-[180px]">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.totalRevenue.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.quotationCount} cotizaciones en {formattedDate}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.totalCosts.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Operativos: ${data.totalOperationalCosts.toLocaleString('es-AR', { minimumFractionDigits: 2 })} | 
                  Fijos: ${data.totalFixedCosts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancia</CardTitle>
                <ArrowDownCircle className={`h-4 w-4 ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.profit.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Período de {data.timeframeInMonths.toFixed(1)} meses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rentabilidad Global</CardTitle>
                <TrendingUp className={`h-4 w-4 ${data.profitability >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.profitability.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Costos fijos mensuales: ${data.monthlyFixedCosts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Cotizaciones</CardTitle>
              <CardDescription>
                Cotizaciones incluidas en el análisis de rentabilidad global
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Costos</TableHead>
                    <TableHead className="text-right">Rentabilidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">{quotation.name}</TableCell>
                      <TableCell>{quotation.eventType}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {mode === "creation" 
                            ? new Date(quotation.createdAt).toLocaleDateString('es-AR') 
                            : quotation.estimatedPaymentDate 
                              ? new Date(quotation.estimatedPaymentDate).toLocaleDateString('es-AR')
                              : "No definida"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quotation.paymentStatus === "PAID" ? "default" : "secondary"}>
                          {quotation.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${quotation.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${quotation.totalCosts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={quotation.grossProfitability >= 0 ? "text-green-600" : "text-red-600"}>
                          {quotation.grossProfitability.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.quotations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No hay cotizaciones para el período seleccionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
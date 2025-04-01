"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowUpRight, 
  BarChart3, 
  DollarSign, 
  FileText, 
  MoreHorizontal, 
  ShoppingCart, 
  Users,
  TrendingUp,
  Calendar,
  ChartPieIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { GlobalProfitability } from "@/components/global-profitability"

interface QuotationStats {
  totalQuotations: number
  totalRevenue: number
  totalCosts: number
  averageProfitability: number
  recentQuotations: Array<{
    id: string
    name: string
    eventType: string
    createdAt: string
    grossProfitability: number
    status: string
  }>
}

interface SummaryCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  isLoading?: boolean
}

function SummaryCard({ title, value, description, icon, trend, isLoading }: SummaryCardProps) {
  if (isLoading) {
    return <Skeleton className="h-32" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
      {trend && (
        <CardFooter className="p-2">
          <Badge variant={trend.positive ? "default" : "destructive"} className="h-5 px-2">
            {trend.positive ? "↑" : "↓"} {trend.value}
          </Badge>
        </CardFooter>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QuotationStats | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/quotations/stats", {
          credentials: "include"
        })
        if (!response.ok) {
          throw new Error("Error al cargar las estadísticas")
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
        })
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchStats()
    }
  }, [status, router, toast])

  const getStatusBadge = (profitability: number) => {
    if (profitability > 0) {
      return <Badge className="bg-green-500">{profitability.toFixed(2)}%</Badge>
    } else if (profitability < 0) {
      return <Badge variant="destructive">{profitability.toFixed(2)}%</Badge>
    } else {
      return <Badge variant="outline">0%</Badge>
    }
  }

  // Helper function to display status with badges
  const getQuotationStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Borrador</Badge>
      case 'REVIEW':
        return <Badge variant="outline">En Revisión</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-500">Aprobada</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rechazada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderOverview = () => {
    if (status === "loading" || loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Ingresos Totales"
            value={`$${stats?.totalRevenue.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`}
            description="Ingresos acumulados"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            title="Costos Totales"
            value={`$${stats?.totalCosts.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`}
            description="Costos acumulados"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            title="Rentabilidad Promedio"
            value={`${stats?.averageProfitability.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}%`}
            description="Promedio de cotizaciones"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            title="Total Cotizaciones"
            value={`${stats?.totalQuotations.toLocaleString()}`}
            description="Cotizaciones generadas"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones Recientes</CardTitle>
            <CardDescription>
              Últimas cotizaciones generadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Rentabilidad</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.eventType}</TableCell>
                    <TableCell>{quotation.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(quotation.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getQuotationStatusBadge(quotation.status)}</TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(quotation.grossProfitability)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/quotations/${quotation.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bienvenido, {session?.user?.name}
          </h2>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tus cotizaciones
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/quotation">
              <FileText className="mr-2 h-4 w-4" />
              Nueva cotización
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Resumen</span>
          </TabsTrigger>
          {session?.user?.role === "ADMIN" && (
            <TabsTrigger value="profitability" className="flex items-center space-x-2">
              <ChartPieIcon className="h-4 w-4" />
              <span>Rentabilidad Global</span>
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>
        {session?.user?.role === "ADMIN" && (
          <TabsContent value="profitability" className="space-y-4">
            <GlobalProfitability />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 
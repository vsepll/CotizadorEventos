"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalProfitability } from "@/components/global-profitability"
import {
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  BarChart3,
  ChartPieIcon,
} from "lucide-react"

interface QuotationStats {
  totalQuotations: number
  totalRevenue: number
  totalCosts: number
  averageProfitability: number
  recentQuotations: Array<{
    id: string
    eventType: string
    createdAt: string
    grossProfitability: number
  }>
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
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Ingresos totales</h3>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                ${stats?.totalRevenue.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Costos totales</h3>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                ${stats?.totalCosts.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Rentabilidad promedio</h3>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stats?.averageProfitability.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}%
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Total de cotizaciones</h3>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stats?.totalQuotations.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Últimas cotizaciones</h3>
          <div className="grid gap-4">
            {stats?.recentQuotations.map((quotation) => (
              <Card key={quotation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/quotations/${quotation.id}`}
                      className="font-medium hover:underline"
                    >
                      {quotation.eventType}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quotation.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {quotation.grossProfitability.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
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
            <Link href="/quotation">Nueva cotización</Link>
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
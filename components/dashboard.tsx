"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  TrendingUp,
  Calendar,
  Building
} from "lucide-react"
import Link from "next/link"

interface QuotationStats {
  totalQuotations: number
  totalRevenue: number
  averageProfitability: number
  recentQuotations: Array<{
    id: string
    name: string
    eventType: string
    totalAmount: number
    createdAt: string
    grossProfitability: number
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<QuotationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/quotations/stats")
        if (!response.ok) {
          throw new Error("Error al obtener estadísticas")
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchStats()
    }
  }, [session, toast])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24 mt-4" />
              <Skeleton className="h-8 w-full mt-2" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-6 w-48" />
          <div className="mt-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Cotizaciones
              </p>
              <h3 className="text-2xl font-bold">
                {stats?.totalQuotations || 0}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-full dark:bg-green-900">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </p>
              <h3 className="text-2xl font-bold">
                ${(stats?.totalRevenue || 0).toLocaleString("es-MX")}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Rentabilidad Promedio
              </p>
              <h3 className="text-2xl font-bold">
                {(stats?.averageProfitability || 0).toFixed(2)}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cotizaciones Recientes</h2>
        <div className="space-y-4">
          {stats?.recentQuotations.map((quotation) => (
            <Link
              key={quotation.id}
              href={`/quotations/${quotation.id}`}
              className="block"
            >
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{quotation.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{quotation.eventType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(quotation.createdAt).toLocaleDateString(
                            "es-MX",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${quotation.totalAmount.toLocaleString("es-MX")}
                    </p>
                    <p
                      className={`text-sm ${
                        quotation.grossProfitability >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {quotation.grossProfitability.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
} 
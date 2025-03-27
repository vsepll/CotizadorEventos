import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { differenceInDays } from "date-fns"

const prisma = new PrismaClient()

// Si no podemos usar el campo monthlyFixedCosts, lo obtenemos de localStorage o usamos un valor por defecto
async function getMonthlyFixedCosts() {
  try {
    // Intentamos recuperar el valor de una fuente alternativa
    // Por ejemplo, podrías tener una tabla separada o usar un servicio externo
    
    // Por ahora, retornamos un valor por defecto, que luego se puede cambiar desde el frontend
    return 0; // Valor por defecto para demostración
  } catch (error) {
    console.error("Error retrieving monthly fixed costs:", error);
    return 0;
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Obtener parámetros de la consulta
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom") 
      ? new Date(searchParams.get("dateFrom") as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const dateTo = searchParams.get("dateTo") 
      ? new Date(searchParams.get("dateTo") as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    const mode = searchParams.get("mode") || "creation"
    const status = searchParams.get("status") || "ALL"
    const monthlyFixedCosts = parseFloat(searchParams.get("monthlyFixedCosts") || "0") || await getMonthlyFixedCosts()

    // Ajustar el fin del día para dateTo
    dateTo.setHours(23, 59, 59, 999)

    // Construir la consulta para filtrar cotizaciones
    const whereClause: any = {
      userId: session.user.id
    }

    // Filtrar por fecha según el modo
    if (mode === "creation") {
      whereClause.createdAt = {
        gte: dateFrom,
        lte: dateTo
      }
    } else {
      // Filtrar por fecha estimada de pago
      whereClause.estimatedPaymentDate = {
        gte: dateFrom,
        lte: dateTo
      }
    }

    // Filtrar por estado de pago
    if (status !== "ALL") {
      whereClause.paymentStatus = status
    }

    // Obtener todas las cotizaciones que cumplen los criterios
    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      orderBy: { 
        createdAt: "desc"
      },
    })

    // Calcular el número de meses en el rango de fechas
    const daysDifference = differenceInDays(dateTo, dateFrom) + 1
    const timeframeInMonths = daysDifference / 30.44 // Promedio de días por mes

    // Calcular los costos fijos totales para el período
    const totalFixedCosts = monthlyFixedCosts * timeframeInMonths

    // Calcular estadísticas
    const totalRevenue = quotations.reduce((sum, q) => sum + q.totalRevenue, 0)
    const totalOperationalCosts = quotations.reduce((sum, q) => sum + q.totalCosts, 0)
    const totalCosts = totalOperationalCosts + totalFixedCosts
    const profit = totalRevenue - totalCosts
    const profitability = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Preparar lista de cotizaciones para la respuesta
    const quotationList = quotations.map(q => ({
      id: q.id,
      name: q.name,
      eventType: q.eventType,
      totalRevenue: q.totalRevenue,
      totalCosts: q.totalCosts,
      grossMargin: q.grossMargin,
      grossProfitability: q.grossProfitability,
      createdAt: q.createdAt,
      estimatedPaymentDate: q.estimatedPaymentDate,
      paymentStatus: q.paymentStatus
    }))

    return NextResponse.json({
      totalRevenue,
      totalOperationalCosts,
      monthlyFixedCosts,
      totalFixedCosts,
      totalCosts,
      profit,
      profitability,
      quotationCount: quotations.length,
      timeframeInMonths,
      quotations: quotationList,
    })
  } catch (error) {
    console.error("Error fetching global profitability:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de rentabilidad global" },
      { status: 500 }
    )
  }
} 
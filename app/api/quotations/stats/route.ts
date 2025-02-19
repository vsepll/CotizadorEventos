import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Obtener todas las cotizaciones del usuario
    const quotations = await prisma.quotation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // Calcular estadísticas
    const totalQuotations = quotations.length
    const totalRevenue = quotations.reduce((sum, q) => sum + q.totalRevenue, 0)
    const averageProfitability = quotations.length > 0
      ? quotations.reduce((sum, q) => sum + q.grossProfitability, 0) / quotations.length
      : 0

    // Obtener las 5 cotizaciones más recientes
    const recentQuotations = quotations.slice(0, 5).map(q => ({
      id: q.id,
      name: q.name,
      eventType: q.eventType,
      totalAmount: q.totalAmount,
      createdAt: q.createdAt,
      grossProfitability: q.grossProfitability,
    }))

    return NextResponse.json({
      totalQuotations,
      totalRevenue,
      averageProfitability,
      recentQuotations,
    })
  } catch (error) {
    console.error("Error fetching quotation stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
} 
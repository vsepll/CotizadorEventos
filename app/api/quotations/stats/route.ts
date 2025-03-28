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
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Fetch quotations based on user role
    const quotations = await prisma.quotation.findMany({
      where: user?.role === "ADMIN" ? undefined : { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Calculate statistics
    const totalQuotations = quotations.length
    const totalRevenue = quotations.reduce((sum, q) => sum + q.totalRevenue, 0)
    const totalCosts = quotations.reduce((sum, q) => sum + q.totalCosts, 0)
    const averageProfitability = quotations.length > 0
      ? quotations.reduce((sum, q) => sum + q.grossProfitability, 0) / quotations.length
      : 0

    // Get the 5 most recent quotations with user info
    const recentQuotations = quotations.slice(0, 5).map(q => ({
      id: q.id,
      name: q.name,
      eventType: q.eventType,
      totalAmount: q.totalAmount,
      createdAt: q.createdAt,
      grossProfitability: q.grossProfitability,
      paymentStatus: q.paymentStatus,
      user: q.user
    }))

    return NextResponse.json({
      totalQuotations,
      totalRevenue,
      totalCosts,
      averageProfitability,
      recentQuotations,
      isAdmin: user?.role === "ADMIN"
    })
  } catch (error) {
    console.error("Error fetching quotation stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// Usar cliente Prisma compartido

// These should match the enum values in the schema.prisma file
const STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

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

    // Fetch all quotations for recent list with status included
    const allQuotations = await prisma.quotation.findMany({
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
    }) as Array<any> // Type assertion to avoid TypeScript errors
    
    // Fetch only approved quotations for statistics
    // Note: Using 'any' cast because the schema migration hasn't been applied yet
    const approvedQuotations = allQuotations.filter(q => 
      q.status === STATUS.APPROVED
    );

    // Calculate statistics from approved quotations only
    const totalQuotations = approvedQuotations.length
    const totalRevenue = approvedQuotations.reduce((sum, q) => sum + q.totalRevenue, 0)
    const totalCosts = approvedQuotations.reduce((sum, q) => sum + q.totalCosts, 0)
    const averageProfitability = approvedQuotations.length > 0
      ? approvedQuotations.reduce((sum, q) => sum + q.grossProfitability, 0) / approvedQuotations.length
      : 0

    // Get the 5 most recent quotations with user info
    const recentQuotations = allQuotations.slice(0, 5).map(q => ({
      id: q.id,
      name: q.name,
      eventType: q.eventType,
      totalAmount: q.totalAmount,
      createdAt: q.createdAt,
      grossProfitability: q.grossProfitability,
      paymentStatus: q.paymentStatus,
      status: q.status || STATUS.DRAFT, // Include status in the response, default to DRAFT if not set
      user: q.user
    }))
    
    // Get counts by status
    const statusCounts = {
      draft: allQuotations.filter(q => q.status === STATUS.DRAFT || !q.status).length,
      review: allQuotations.filter(q => q.status === STATUS.REVIEW).length,
      approved: allQuotations.filter(q => q.status === STATUS.APPROVED).length,
      rejected: allQuotations.filter(q => q.status === STATUS.REJECTED).length,
    }

    return NextResponse.json({
      totalQuotations,
      totalRevenue,
      totalCosts,
      averageProfitability,
      statusCounts,
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
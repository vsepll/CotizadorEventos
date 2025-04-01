import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { differenceInDays, startOfDay, endOfDay } from "date-fns"

const prisma = new PrismaClient()

// REMOVED unused getMonthlyFixedCosts function

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado - Debe iniciar sesión" },
      { status: 401 }
    )
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado - Se requiere rol de administrador" },
      { status: 403 }
    )
  }

  try {
    // --- Fetch Monthly Fixed Costs from Global Parameters --- 
    let monthlyFixedCosts = 0; // Default value
    try {
      // Assuming settings are stored in a way that can be fetched like this.
      // Adjust the model name ('globalParameters') and where clause if needed.
      const settings = await prisma.globalParameters.findFirst(); // Corrected model name to plural
      if (settings && typeof settings.monthlyFixedCosts === 'number') {
        monthlyFixedCosts = settings.monthlyFixedCosts;
      } else {
        console.warn("Monthly Fixed Costs not found or invalid in GlobalParameter. Defaulting to 0.");
      }
    } catch (dbError) {
      console.error("Error fetching monthlyFixedCosts from DB:", dbError);
      // Decide if you want to throw an error or proceed with 0
      // return NextResponse.json({ error: "Error interno al leer costos fijos" }, { status: 500 });
    }
    // --- End Fetch --- 

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom") 
      ? startOfDay(new Date(searchParams.get("dateFrom") as string))
      : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const dateTo = searchParams.get("dateTo") 
      ? endOfDay(new Date(searchParams.get("dateTo") as string))
      : endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
    const mode = searchParams.get("mode") || "creation"
    const status = searchParams.get("status") || "ALL"
    // REMOVED: monthlyFixedCosts is now fetched from DB, not query params
    // const monthlyFixedCostsParam = parseFloat(searchParams.get("monthlyFixedCosts") || "0") || await getMonthlyFixedCosts()

    const whereClause: any = {}

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
      // Solo incluir cotizaciones con fecha de pago estimada cuando se filtra por fecha de pago
      whereClause.estimatedPaymentDate = {
        not: null,
        ...whereClause.estimatedPaymentDate
      }
    }

    // Filtrar por estado de pago
    if (status !== "ALL") {
      whereClause.paymentStatus = status
    }

    // Always filter for APPROVED quotations in global profitability
    whereClause.status = 'APPROVED';

    console.log('Filtros aplicados:', {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      mode,
      status,
      whereClause
    });

    // Obtener todas las cotizaciones que cumplen los criterios
    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      orderBy: { 
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`Se encontraron ${quotations.length} cotizaciones`);

    // Calcular el número de meses en el rango de fechas
    const daysDifference = differenceInDays(dateTo, dateFrom) + 1
    // Ensure timeframe is at least a fraction of a month if dates are same day
    const timeframeInMonths = Math.max(daysDifference / 30.44, 1/30.44) // Use average days in month

    // Calcular los costos fijos totales para el período
    const totalFixedCosts = monthlyFixedCosts * timeframeInMonths

    // Calcular estadísticas
    const totalRevenue = quotations.reduce((sum, q) => sum + q.totalRevenue, 0)
    const totalOperationalCosts = quotations.reduce((sum, q) => sum + q.totalCosts, 0)
    const totalCosts = totalOperationalCosts + totalFixedCosts
    const profit = totalRevenue - totalCosts
    const profitability = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Calculate cost breakdown
    const costBreakdown = {
      platform: 0,
      line: 0,
      paywayFees: 0,
      credentials: 0,
      ticketing: 0,
      employees: 0,
      mobility: 0,
      customOperational: 0,
    };

    quotations.forEach(q => {
      // Assuming these fields exist directly on the Quotation model
      costBreakdown.platform += q.palco4Cost || 0; 
      costBreakdown.line += q.lineCost || 0;

      // Assuming paywayFees is stored as JSON with a 'total' field
      // Need to handle potential parsing errors if it's stored as a string
      try {
        const fees = typeof q.paywayFees === 'string' ? JSON.parse(q.paywayFees) : q.paywayFees;
        costBreakdown.paywayFees += fees?.total || 0;
      } catch (e) {
        console.error(`Error parsing paywayFees for quotation ${q.id}:`, e);
      }
      
      // Assuming operationalCosts is stored as JSON
      // Need to handle potential parsing errors if it's stored as a string
      try {
        const opCosts = typeof q.operationalCosts === 'string' ? JSON.parse(q.operationalCosts) : q.operationalCosts;
        if (opCosts) {
          costBreakdown.credentials += opCosts.credentials || 0;
          costBreakdown.ticketing += opCosts.ticketing || 0;
          costBreakdown.employees += opCosts.employees || 0;
          costBreakdown.mobility += opCosts.mobility || 0;
          
          // Sum custom operational costs if they exist and are an array
          if (Array.isArray(opCosts.custom)) {
            costBreakdown.customOperational += opCosts.custom.reduce((sum: number, customCost: any) => sum + (Number(customCost?.amount) || 0), 0);
          }
        }
      } catch (e) {
        console.error(`Error parsing operationalCosts for quotation ${q.id}:`, e);
      }
    });

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
      paymentStatus: q.paymentStatus,
      user: q.user ? {
        name: q.user.name,
        email: q.user.email
      } : null,
      profit,
      profitability,
      costBreakdown,
    }))

    return NextResponse.json({
      totalRevenue,
      totalOperationalCosts,
      monthlyFixedCosts,
      totalFixedCosts,
      totalCosts,
      profit,
      profitability,
      costBreakdown,
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
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

const QuotationSchema = z.object({
  name: z.string(),
  eventType: z.string(),
  totalAmount: z.number(),
  ticketPrice: z.number(),
  platformFee: z.number(),
  ticketingFee: z.number(),
  serviceChargeFee: z.number(),
  additionalServices: z.number(),
  paywayFees: z.object({
    credit: z.number(),
    debit: z.number(),
    cash: z.number(),
    total: z.number(),
  }),
  palco4Cost: z.number(),
  lineCost: z.number(),
  operationalCosts: z.object({
    credentials: z.number(),
    ticketing: z.number(),
    supervisors: z.number(),
    operators: z.number(),
    mobility: z.number(),
    total: z.number(),
  }),
  totalRevenue: z.number(),
  totalCosts: z.number(),
  grossMargin: z.number(),
  grossProfitability: z.number(),
})

export async function GET() {
  const session = await getServerSession()

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const quotations = await prisma.quotation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(quotations)
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  console.log('Session in API:', session)

  if (!session?.user?.id) {
    console.log('No session or user ID')
    return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
  }

  // Verificar si el usuario tiene el rol adecuado
  console.log('User role:', session.user.role)
  
  // Permitir a usuarios con rol ADMIN o USER (en mayúsculas, como está definido en el enum de Prisma)
  if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
    console.log('Invalid role:', session.user.role)
    return NextResponse.json({ 
      error: `Only authorized users can save quotations. Current role: ${session.user.role}` 
    }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log('Raw request body:', body);
    
    // Asegurarnos de que ambos campos tengan el mismo valor
    if (body.serviceChargeFee !== undefined && body.ticketingFee === undefined) {
      body.ticketingFee = body.serviceChargeFee;
    } else if (body.ticketingFee !== undefined && body.serviceChargeFee === undefined) {
      body.serviceChargeFee = body.ticketingFee;
    }
    
    // Asegurarnos de que ambos campos tengan un valor
    if (body.ticketingFee === undefined) {
      return NextResponse.json({
        error: "ticketingFee is required"
      }, { status: 400 });
    }
    
    // Asignar el mismo valor a ambos campos
    body.serviceChargeFee = body.ticketingFee;
    
    console.log('Body before validation:', body);
    const validatedData = QuotationSchema.parse(body);
    console.log('Validated data before save:', validatedData);

    const savedQuotation = await prisma.quotation.create({
      data: {
        ...validatedData,
        user: {
          connect: {
            id: session.user.id
          }
        }
      },
    });

    return NextResponse.json(savedQuotation)
  } catch (error) {
    console.error("Error saving quotation:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 })
  }
}


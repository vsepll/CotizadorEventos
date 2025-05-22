import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { invalidateQuotationCache } from "@/lib/redis"

const prisma = new PrismaClient()

const ParametersSchema = z.object({
  defaultPlatformFee: z.number().min(0).max(100),
  defaultTicketingFee: z.number().min(0).max(100),
  defaultAdditionalServicesFee: z.number().min(0).max(100),
  defaultCreditCardFee: z.number().min(0).max(100),
  defaultDebitCardFee: z.number().min(0).max(100),
  defaultCashFee: z.number().min(0).max(100),
  defaultCredentialsCost: z.number().nonnegative(),
  defaultSupervisorsCost: z.number().nonnegative(),
  defaultOperatorsCost: z.number().nonnegative(),
  defaultMobilityCost: z.number().nonnegative(),
  palco4FeePerTicket: z.number().nonnegative(),
  lineCostPercentage: z.number().min(0).max(100),
  ticketingCostPerTicket: z.number().nonnegative(),
  fuelCostPerLiter: z.number().nonnegative().default(0),
  kmPerLiter: z.number().positive().default(10),
  monthlyFixedCosts: z.number().nonnegative().default(0)
})

const defaultParameters = {
  defaultPlatformFee: 5,
  defaultTicketingFee: 3,
  defaultAdditionalServicesFee: 2,
  defaultCreditCardFee: 3.67,
  defaultDebitCardFee: 0.8,
  defaultCashFee: 0.5,
  defaultCredentialsCost: 0,
  defaultSupervisorsCost: 0,
  defaultOperatorsCost: 0,
  defaultMobilityCost: 0,
  palco4FeePerTicket: 180,
  lineCostPercentage: 0.41,
  ticketingCostPerTicket: 5,
  fuelCostPerLiter: 300,
  kmPerLiter: 10,
  monthlyFixedCosts: 0
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verificar si existen parámetros
    let parameters = await prisma.globalParameters.findFirst()
    
    // Si no existen o están desactualizados, crear/actualizar con valores por defecto
    if (!parameters) {
      parameters = await prisma.globalParameters.create({
        data: {
          id: 1,
          ...defaultParameters
        }
      })
    } else {
      // Actualizar con valores por defecto si las credenciales son 216408
      if (parameters.defaultCredentialsCost === 216408) {
        parameters = await prisma.globalParameters.update({
          where: { id: 1 },
          data: defaultParameters
        })
      }
    }
    
    return NextResponse.json(parameters)
  } catch (error) {
    console.error("Error fetching global parameters:", error)
    return NextResponse.json({ error: "Failed to fetch global parameters" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = ParametersSchema.parse(body)
    
    // Obtener los valores actuales antes de actualizar
    const currentParameters = await prisma.globalParameters.findFirst()
    
    if (!currentParameters) {
      return NextResponse.json({ error: "No parameters found" }, { status: 404 })
    }

    // Actualizar los parámetros
    const updatedParameters = await prisma.globalParameters.update({
      where: { id: 1 },
      data: validatedData
    })

    // Invalidar el caché de cotizaciones después de actualizar los parámetros
    const cacheInvalidationResult = await invalidateQuotationCache();
    console.log('Resultado de invalidación de caché:', cacheInvalidationResult);

    return NextResponse.json({ 
      ...updatedParameters, 
      cacheInvalidation: cacheInvalidationResult 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating global parameters:", error)
    return NextResponse.json({ error: "Failed to update global parameters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = ParametersSchema.parse(body)

    const updatedParameters = await prisma.globalParameters.upsert({
      where: { id: 1 },
      update: validatedData,
      create: validatedData,
    })

    // Invalidar el caché de cotizaciones después de actualizar los parámetros
    const cacheInvalidationResult = await invalidateQuotationCache();
    console.log('Resultado de invalidación de caché:', cacheInvalidationResult);

    return NextResponse.json({ 
      ...updatedParameters, 
      cacheInvalidation: cacheInvalidationResult 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating parameters:", error)
    return NextResponse.json({ error: "Failed to update parameters" }, { status: 500 })
  }
}


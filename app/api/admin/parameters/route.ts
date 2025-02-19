import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

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
})

export async function GET() {
  const session = await getServerSession()

  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parameters = await prisma.globalParameters.findFirst()
    return NextResponse.json(parameters)
  } catch (error) {
    console.error("Error fetching parameters:", error)
    return NextResponse.json({ error: "Failed to fetch parameters" }, { status: 500 })
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

    return NextResponse.json(updatedParameters)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating parameters:", error)
    return NextResponse.json({ error: "Failed to update parameters" }, { status: 500 })
  }
}


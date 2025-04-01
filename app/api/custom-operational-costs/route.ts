import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

// Schema para crear un nuevo concepto operativo
const CreateCustomOperationalCostSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
})

// Schema para actualizar un concepto existente
const UpdateCustomOperationalCostSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const customCosts = await prisma.customOperationalCost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(customCosts)
  } catch (error) {
    console.error("Error al obtener costos personalizados:", error)
    return NextResponse.json(
      { error: "Error al obtener costos personalizados" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = CreateCustomOperationalCostSchema.parse(body)

    const customCost = await prisma.customOperationalCost.create({
      data: {
        ...validatedData,
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    })

    return NextResponse.json(customCost)
  } catch (error) {
    console.error("Error al crear costo personalizado:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear costo personalizado" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateCustomOperationalCostSchema.parse(body)

    // Verificar que el costo pertenece al usuario
    const existingCost = await prisma.customOperationalCost.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: "Costo personalizado no encontrado" },
        { status: 404 }
      )
    }

    const updatedCost = await prisma.customOperationalCost.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(updatedCost)
  } catch (error) {
    console.error("Error al actualizar costo personalizado:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al actualizar costo personalizado" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    // Verificar que el costo pertenece al usuario
    const existingCost = await prisma.customOperationalCost.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: "Costo personalizado no encontrado" },
        { status: 404 }
      )
    }

    await prisma.customOperationalCost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar costo personalizado:", error)
    return NextResponse.json(
      { error: "Error al eliminar costo personalizado" },
      { status: 500 }
    )
  }
} 
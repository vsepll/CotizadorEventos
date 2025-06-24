import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Helper function to safely parse JSON fields
function parseJsonFields(quotation: any) {
  try {
    // Parse JSON fields if they are strings
    const paywayFees = typeof quotation.paywayFees === 'string' 
      ? JSON.parse(quotation.paywayFees) 
      : quotation.paywayFees || {}
    
    const operationalCosts = typeof quotation.operationalCosts === 'string' 
      ? JSON.parse(quotation.operationalCosts) 
      : quotation.operationalCosts || {}
    
    return {
      ...quotation,
      paywayFees,
      operationalCosts
    }
  } catch (error) {
    console.error('Error parsing JSON fields:', error)
    return {
      ...quotation,
      paywayFees: {},
      operationalCosts: {}
    }
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    console.log('No session or user ID')
    return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
  }

  try {
    console.log('Fetching quotation with ID:', params.id)
    console.log('User ID:', session.user.id)
    
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        ticketSectors: {
          include: {
            variations: true
          }
        }
      }
    })

    if (!quotation) {
      console.log('Quotation not found')
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    console.log('Found quotation:', quotation)
    console.log('Quotation user ID:', quotation.userId)

    // Verificar permisos: debe ser el propietario o un administrador
    if (quotation.userId !== session.user.id && session.user.role !== "ADMIN") {
      console.log('User ID mismatch and not admin')
      return NextResponse.json({ error: "Unauthorized - Not your quotation" }, { status: 401 })
    }

    // Calculate actual monetary amount
    const monetaryAmount = quotation.ticketSectors.reduce((total, sector) => {
      return total + sector.variations.reduce((sectorTotal, variation) => {
        return sectorTotal + (variation.price * variation.quantity);
      }, 0);
    }, 0);
    
    // Transform the data for the frontend
    const transformedQuotation = {
      ...quotation,
      // In our database, totalAmount stores the number of tickets
      ticketQuantity: quotation.totalAmount,
      // Replace totalAmount with actual monetary value for display purposes
      totalAmount: monetaryAmount || 0
    };

    // Parse JSON fields before sending to frontend
    const parsedQuotation = parseJsonFields(transformedQuotation)

    return NextResponse.json(parsedQuotation)
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Verificar permisos: debe ser el propietario o un administrador
    if (quotation.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Not your quotation" }, { status: 401 })
    }

    await prisma.quotation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Quotation deleted successfully" })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { paymentStatus } = await request.json()

    // Verificar que el estado sea válido
    if (!["PENDING", "CONFIRMED", "PAID"].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Estado de pago inválido" },
        { status: 400 }
      )
    }

    // Obtener la cotización actual para verificar permisos
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    // Verificar permisos (solo el creador o un admin pueden modificar)
    if (quotation.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado para modificar esta cotización" },
        { status: 403 }
      )
    }

    // Actualizar el estado
    const updatedQuotation = await prisma.quotation.update({
      where: { id: params.id },
      data: { paymentStatus },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error("Error updating quotation:", error)
    return NextResponse.json(
      { error: "Error al actualizar la cotización" },
      { status: 500 }
    )
  }
}


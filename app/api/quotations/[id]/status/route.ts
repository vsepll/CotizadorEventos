import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Usar cliente Prisma compartido

// Schema for validating status update requests
const statusUpdateSchema = z.object({
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "REJECTED"])
})

/**
 * Update the status of a quotation
 * 
 * @param request The incoming request
 * @param params The route parameters containing the quotation ID
 * @returns A response with the updated quotation or an error
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate the request body
    const { status } = statusUpdateSchema.parse(body)

    // Get the current quotation to check permissions
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    // Return 404 if quotation not found
    if (!quotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    // Check if user has permission to update this quotation (creator or admin)
    if (quotation.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado para modificar esta cotización" },
        { status: 403 }
      )
    }

    // Update the status
    const updatedQuotation = await prisma.quotation.update({
      where: { id: params.id },
      data: { status },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Estado de cotización actualizado correctamente",
      quotation: updatedQuotation
    })
  } catch (error) {
    console.error("Error updating quotation status:", error)
    
    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Error de validación", 
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error al actualizar el estado de la cotización" },
      { status: 500 }
    )
  }
} 
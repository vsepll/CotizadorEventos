import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

    if (quotation.userId !== session.user.id) {
      console.log('User ID mismatch')
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

    return NextResponse.json(transformedQuotation)
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

    if (quotation.userId !== session.user.id) {
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


import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const employeeTypes = await prisma.employeeType.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(employeeTypes)
  } catch (error) {
    console.error("Error fetching employee types:", error)
    return NextResponse.json({ error: "Failed to fetch employee types" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  console.log('Session:', session)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    console.log('Unauthorized. User:', session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, isOperator, costPerDay } = body

    if (!name || typeof costPerDay !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // Find an admin user to associate with the employee type
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    if (!adminUser) {
      console.error('No admin user found in the database')
      return NextResponse.json({ error: "No admin user found" }, { status: 500 })
    }

    console.log('Creating employee type with data:', {
      name,
      isOperator,
      costPerDay,
      createdBy: adminUser.id
    })

    const employeeType = await prisma.employeeType.create({
      data: {
        name,
        isOperator: isOperator ?? true,
        costPerDay,
        createdBy: adminUser.id
      }
    })

    console.log('Created employee type:', employeeType)
    return NextResponse.json(employeeType)
  } catch (error) {
    console.error("Error creating employee type:", error)
    return NextResponse.json({ 
      error: "Failed to create employee type",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, isOperator, costPerDay } = body

    if (!id || !name || typeof costPerDay !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const employeeType = await prisma.employeeType.update({
      where: { id },
      data: {
        name,
        isOperator,
        costPerDay,
      }
    })

    return NextResponse.json(employeeType)
  } catch (error) {
    console.error("Error updating employee type:", error)
    return NextResponse.json({ error: "Failed to update employee type" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    await prisma.employeeType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting employee type:", error)
    return NextResponse.json({ error: "Failed to delete employee type" }, { status: 500 })
  }
} 
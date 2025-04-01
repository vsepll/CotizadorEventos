import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Clave para almacenar en localStorage
const GLOBAL_MONTHLY_COSTS_KEY = 'globalMonthlyCosts'

// Esquema de validación
const MonthlyFixedCostsSchema = z.object({
  value: z.number().nonnegative()
})

// Endpoint para obtener el valor de costos fijos mensuales
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // En un entorno real, buscaría este valor en una base de datos
    // Pero para esta implementación, usaremos un valor por defecto
    
    return NextResponse.json({ 
      value: 0 // Valor por defecto
    })
  } catch (error) {
    console.error("Error fetching monthly fixed costs:", error)
    return NextResponse.json({ error: "Failed to fetch monthly fixed costs" }, { status: 500 })
  }
}

// Endpoint para actualizar el valor de costos fijos mensuales
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = MonthlyFixedCostsSchema.parse(body)
    
    // En un entorno real, actualizaría este valor en una base de datos
    // Para esta implementación, simplemente devolvemos el valor que nos enviaron
    
    return NextResponse.json({
      value: validatedData.value,
      message: "Monthly fixed costs updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating monthly fixed costs:", error)
    return NextResponse.json({ error: "Failed to update monthly fixed costs" }, { status: 500 })
  }
} 
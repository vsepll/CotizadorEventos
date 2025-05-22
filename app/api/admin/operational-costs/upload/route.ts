import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
// @ts-ignore — la librería no incluye tipos completos en el entorno Next.
import * as XLSX from "xlsx"

const prisma = new PrismaClient()

// Estructura esperada del Excel:
// Hoja 1 ("OperationalCosts")
// | Nombre | Monto | TipoCalculo |
// Hoja 2 ("AdditionalServices")
// | Nombre | Monto | EsPorcentaje (TRUE/FALSE) |

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convertir a Buffer para xlsx
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = XLSX.read(buffer, { type: "buffer" })

    // Procesar hoja de costos operativos personalizados
    const operationalSheetName = workbook.SheetNames[0]
    const operationalSheet = workbook.Sheets[operationalSheetName]
    const operationalJson: any[] = XLSX.utils.sheet_to_json(operationalSheet, { header: 1 })

    // Ignorar header (primera fila) y mapear
    const operationalCosts = operationalJson.slice(1).map((row) => {
      const [name, amount, calculationType] = row
      if (!name) return null
      return {
        name: String(name),
        amount: Number(amount ?? 0),
        calculationType: calculationType ? String(calculationType).toLowerCase() : "fixed",
      }
    }).filter(Boolean)

    // Procesar hoja de servicios adicionales personalizados si existe
    let additionalServices: any[] = []
    if (workbook.SheetNames.length > 1) {
      const additionalSheet = workbook.Sheets[workbook.SheetNames[1]]
      const additionalJson: any[] = XLSX.utils.sheet_to_json(additionalSheet, { header: 1 })
      additionalServices = additionalJson.slice(1).map((row) => {
        const [name, amount, isPercentage] = row
        if (!name) return null
        return {
          name: String(name),
          amount: Number(amount ?? 0),
          isPercentage: String(isPercentage).toLowerCase() === "true" || isPercentage === 1
        }
      }).filter(Boolean)
    }

    // Guardar en la tabla GlobalParameters (id = 1)
    const updatedParameters = await prisma.globalParameters.update({
      where: { id: 1 },
      data: {
        // @ts-ignore — Campos agregados recientemente al schema
        customOperationalCosts: operationalCosts as any,
        // @ts-ignore
        customAdditionalServices: additionalServices as any,
      } as any,
    })

    return NextResponse.json({ success: true, updatedParameters })
  } catch (error) {
    console.error("Error uploading operational costs Excel:", error)
    return NextResponse.json({ error: "Failed to process Excel" }, { status: 500 })
  }
} 
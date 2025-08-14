import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// @ts-ignore — la librería no incluye tipos completos en el entorno Next.
import * as XLSX from "xlsx"

// Usar cliente Prisma compartido

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
        calculationType: ((): string => {
          // Normalizar el valor recibido
          const val = (calculationType ?? "").toString().toLowerCase();

          // Reglas explícitas por valor de celda
          if (["fixed", "fijo", "$ fijo"].includes(val)) return "fixed";
          if (["percentage", "%", "% sobre venta", "porcentaje"].includes(val)) return "percentage";
          if (["per_day", "$/día", "$/dia", "por día", "dia"].includes(val)) return "per_day";
          if ([
            "per_day_per_person",
            "$/día x persona",
            "$/dia x persona",
            "dia x persona",
            "día x persona",
            "dia por persona",
            "día por persona"
          ].includes(val)) return "per_day_per_person";
          if ([
            "per_ticket_system",
            "$/ticket (sistema)",
            "$/ticket sistema",
            "ticket sistema",
            "ticket x sistema",
            "ticket por sistema",
            "tickets sistema",
            "tickets x sistema"
          ].includes(val)) return "per_ticket_system";
          if (["per_ticket_sector", "$/ticket x sector", "$/ticket sector"].includes(val)) return "per_ticket_sector";

          // Heurísticas basadas en el nombre cuando el tipo no es explícito o no coincide
          const normalizedName = String(name).toLowerCase();
          if (/alquiler.*celular/.test(normalizedName) || /vi[aá]ticos/.test(normalizedName) || /hoteler[íi]a/.test(normalizedName)) {
            return "per_day_per_person";
          }
          if (/facturante/.test(normalizedName) || (/costo de sistema/.test(normalizedName) && /deporte/.test(normalizedName))) {
            return "per_ticket_system";
          }

          // Por defecto asumimos costo fijo
          return "fixed";
        })(),
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
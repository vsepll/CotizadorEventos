import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { findUserById } from "@/lib/activity.js"

const prismaClient = new PrismaClient()

// Definir esquemas de validación
const TicketVariationSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number()
});

const TicketSectorSchema = z.object({
  name: z.string(),
  variations: z.array(TicketVariationSchema)
});

// Actualizado para coincidir con el formato de datos del frontend
const QuotationSchema = z.object({
  name: z.string().optional().default(`Cotización ${new Date().toLocaleDateString()}`),
  eventType: z.string(),
  totalAmount: z.number(),
  ticketPrice: z.number(),
  platform: z.object({
    name: z.string(),
    percentage: z.number()
  }),
  serviceCharge: z.number(),
  additionalServicesPercentage: z.number().optional(),
  paymentMethods: z.object({
    credit: z.object({
      percentage: z.number(),
      chargedTo: z.string()
    }),
    debit: z.object({
      percentage: z.number(),
      chargedTo: z.string()
    }),
    cash: z.object({
      percentage: z.number(),
      chargedTo: z.string()
    })
  }),
  credentialsCost: z.number().optional(),
  employees: z.array(z.object({
    employeeTypeId: z.string(),
    quantity: z.number(),
    days: z.number()
  })).optional(),
  mobilityKilometers: z.number().optional(),
  numberOfTolls: z.number().optional(),
  tollsCost: z.number().optional(),
  customOperationalCosts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number()
  })).optional(),
  ticketSectors: z.array(TicketSectorSchema)
});

export async function GET() {
  const session = await getServerSession()

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const quotations = await prismaClient.quotation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        ticketSectors: {
          include: {
            variations: true
          }
        }
      }
    })
    
    // Transform the data for the frontend
    const transformedQuotations = quotations.map(quotation => {
      // Calculate actual monetary amount
      const monetaryAmount = quotation.ticketSectors.reduce((total, sector) => {
        return total + sector.variations.reduce((sectorTotal, variation) => {
          return sectorTotal + (variation.price * variation.quantity);
        }, 0);
      }, 0);
      
      return {
        ...quotation,
        // In our database, totalAmount stores the number of tickets
        // Add an explicit ticketQuantity field for the frontend
        ticketQuantity: quotation.totalAmount,
        // Replace totalAmount with actual monetary value for display purposes
        totalAmount: monetaryAmount || 0
      };
    });
    
    return NextResponse.json(transformedQuotations)
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  console.log('Session in API:', session)

  if (!session?.user?.id) {
    console.log('No session or user ID')
    return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
  }

  // Verificar si el usuario existe en nuestro sistema hardcodeado
  const user = findUserById(session.user.id)
  if (!user) {
    console.log('User not found in hardcoded user list:', session.user.id)
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Verificar si el usuario tiene el rol adecuado
  console.log('User role:', session.user.role)
  
  // Permitir a usuarios con rol ADMIN o USER
  if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
    console.log('Invalid role:', session.user.role)
    return NextResponse.json({ 
      error: `Only authorized users can save quotations. Current role: ${session.user.role}` 
    }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log('Raw request body:', body);
    
    // Verificar que tenga al menos un sector de tickets válido
    if (!body.ticketSectors || !body.ticketSectors.length) {
      return NextResponse.json({
        error: "Al menos un sector de tickets es requerido"
      }, { status: 400 });
    }
    
    // Definir interfaces para los tipos
    interface TicketVariation {
      name: string;
      price: number;
      quantity: number;
    }
    
    interface TicketSector {
      name: string;
      variations: TicketVariation[];
    }
    
    // Verificar que tenga al menos una variación válida
    const hasValidVariation = body.ticketSectors.some((sector: TicketSector) => 
      sector.variations && sector.variations.some((v: TicketVariation) => 
        v.name && v.price > 0 && v.quantity > 0
      )
    );
    
    if (!hasValidVariation) {
      return NextResponse.json({
        error: "Al menos una variación de ticket válida es requerida"
      }, { status: 400 });
    }
    
    console.log('Body before validation:', body);
    
    try {
      const validatedData = QuotationSchema.parse(body);
      console.log('Validated data before save:', validatedData);
      
      // Extraer los sectores de tickets para crear relaciones
      const { ticketSectors, ...quotationData } = validatedData;

      // Use calculation results if available (from the results object sent by the client),
      // or calculate them if they're not provided
      let platformFee, ticketingFee, additionalServices, paywayFees, operationalCosts, 
          totalRevenue, totalCosts, grossMargin, grossProfitability, palco4Cost, lineCost;
      
      if (body.platformFee !== undefined && body.ticketingFee !== undefined) {
        // If we have calculation results, use them
        platformFee = body.platformFee;
        ticketingFee = body.ticketingFee;
        additionalServices = body.additionalServices || 0;
        paywayFees = body.paywayFees || { credit: 0, debit: 0, cash: 0, total: 0 };
        operationalCosts = body.operationalCosts || { 
          credentials: 0, ticketing: 0, employees: 0, mobility: 0, custom: [], total: 0 
        };
        totalRevenue = body.totalRevenue || 0;
        totalCosts = body.totalCosts || 0;
        grossMargin = body.grossMargin || 0;
        grossProfitability = body.grossProfitability || 0;
        palco4Cost = body.palco4Cost || 0;
        lineCost = body.lineCost || 0;
      } else {
        // Otherwise, calculate them from form data
        platformFee = quotationData.platform.percentage;
        ticketingFee = quotationData.serviceCharge;
        additionalServices = quotationData.additionalServicesPercentage || 0;
        
        // Calcular tarifas de medios de pago
        paywayFees = {
          credit: quotationData.paymentMethods.credit.percentage || 0,
          debit: quotationData.paymentMethods.debit.percentage || 0,
          cash: quotationData.paymentMethods.cash.percentage || 0,
          total: 0
        };
        
        // Calcular el total de tarifas
        paywayFees.total = paywayFees.credit + paywayFees.debit + paywayFees.cash;
        
        // Calcular costos operativos
        operationalCosts = {
          credentials: quotationData.credentialsCost || 0,
          ticketing: 0, // Este valor se calculará en la lógica de negocios
          employees: 0, // Se calculará basado en empleados
          mobility: 0, // Se calculará basado en movilidad
          custom: quotationData.customOperationalCosts || [],
          total: 0
        };
        
        // Set defaults for other calculated values
        totalRevenue = 0;
        totalCosts = 0;
        grossMargin = 0;
        grossProfitability = 0;
        palco4Cost = 0;
        lineCost = 0;
      }
      
      // Crear la cotización con todos los campos requeridos por el modelo Prisma
      const savedQuotation = await prismaClient.quotation.create({
        data: {
          name: body.name || `Cotización ${new Date().toLocaleDateString()}`,
          eventType: quotationData.eventType,
          // totalAmount should store the actual ticket quantity (number of tickets)
          // Calculate total ticket quantity from ticket sectors, or use the one from body if available
          totalAmount: body.ticketQuantity || ticketSectors.reduce((total, sector) => {
            return total + sector.variations.reduce((sectorTotal, variation) => {
              return sectorTotal + variation.quantity;
            }, 0);
          }, 0),
          ticketPrice: quotationData.ticketPrice,
          platformFee: platformFee,
          ticketingFee: ticketingFee,
          additionalServices: additionalServices,
          paywayFees: paywayFees as any, // Convertir a JSON para Prisma
          operationalCosts: operationalCosts as any, // Convertir a JSON para Prisma
          totalRevenue: totalRevenue, 
          totalCosts: totalCosts, 
          grossMargin: grossMargin, 
          grossProfitability: grossProfitability, 
          palco4Cost: palco4Cost, 
          lineCost: lineCost,
          userId: session.user.id,
          // Crear sectores de tickets como relaciones anidadas
          ticketSectors: {
            create: ticketSectors.map((sector: TicketSector) => ({
              name: sector.name,
              // Crear variaciones de tickets para cada sector
              variations: {
                create: sector.variations.map((variation: TicketVariation) => ({
                  name: variation.name,
                  price: variation.price,
                  quantity: variation.quantity
                }))
              }
            }))
          }
        },
        // Incluir sectores y variaciones en la respuesta
        include: {
          ticketSectors: {
            include: {
              variations: true
            }
          }
        }
      });

      return NextResponse.json(savedQuotation)
    } catch (zodError) {
      console.error("Zod validation error:", zodError);
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error saving quotation:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 })
  }
}


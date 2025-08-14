import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient, Prisma, QuotationStatus } from "@prisma/client"
import { z } from "zod"
import { findUserById } from "@/lib/activity.js"

const prismaClient = new PrismaClient()

// Definir esquemas de validación
const TicketVariationSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  serviceCharge: z.number().optional(),
  serviceChargeType: z.enum(["fixed", "percentage"]).optional()
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
    amount: z.number(),
    calculationType: z.enum(["fixed", "percentage", "per_day", "per_day_per_person", "per_ticket_system", "per_ticket_sector"]).optional().default("fixed"),
    sectors: z.array(z.string()).optional(),
    days: z.number().optional()
  })).optional(),
  ticketSectors: z.array(TicketSectorSchema),
  estimatedPaymentDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "PAID"]).default("PENDING")
});

// No modificar el esquema original QuotationInputSchema, solo agregar uno nuevo para los servicios adicionales
const QuotationAdditionalServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  isPercentage: z.boolean()
});

// Modificar el esquema original para incluir additionalServiceItems
const QuotationInputSchema = z.object({
  name: z.string().optional(),
  eventType: z.string(),
  totalAmount: z.number(),
  ticketPrice: z.number(),
  platformFee: z.number(),
  ticketingFee: z.number().optional(),
  additionalServices: z.number().optional(),
  paywayFees: z.any().optional(),
  palco4Cost: z.number().optional(),
  lineCost: z.number().optional(),
  operationalCosts: z.any().optional(),
  totalRevenue: z.number().optional(),
  totalCosts: z.number().optional(),
  grossMargin: z.number().optional(),
  grossProfitability: z.number().optional(),
  ticketQuantity: z.number().optional(),
  // Agregar additionalServiceItems
  additionalServiceItems: z.array(QuotationAdditionalServiceSchema).optional(),
  // Resto de campos existentes
  customOperationalCosts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    calculationType: z.enum(["fixed", "percentage", "per_day", "per_day_per_person", "per_ticket_system", "per_ticket_sector"]).optional().default("fixed"),
    sectors: z.array(z.string()).optional(),
    days: z.number().optional()
  })).optional(),
  ticketSectors: z.array(TicketSectorSchema),
  estimatedPaymentDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "PAID"]).default("PENDING"),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "REJECTED"]).default("DRAFT"),
});

const createQuotationSchema = z.object({
  name: z.string().optional().default(`Cotización ${new Date().toLocaleDateString()}`),
  eventType: z.string(),
  totalAmount: z.number(),
  ticketPrice: z.number(),
  platform: z.object({
    name: z.string(),
    percentage: z.number()
  }),
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
    amount: z.number(),
    calculationType: z.enum(["fixed", "percentage", "per_day", "per_day_per_person", "per_ticket_system", "per_ticket_sector"]).optional().default("fixed"),
    sectors: z.array(z.string()).optional(),
    days: z.number().optional()
  })).optional(),
  ticketSectors: z.array(TicketSectorSchema),
  estimatedPaymentDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "PAID"]).default("PENDING"),
  additionalServices: z.number().optional(),
  additionalServiceItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    isPercentage: z.boolean()
  })).optional(),
});

// Define a type for Quotation with included relations for GET request
/*
type QuotationWithDetails = Prisma.QuotationGetPayload<{
  include: {
    user: { select: { name: true, email: true } },
    ticketSectors: { include: { variations: true } },
    additionalServiceItems: true
  }
}>
*/

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    
    // Parse status parameter (could be a comma-separated list of statuses)
    const statuses = statusParam ? statusParam.split(',').map(s => s.trim().toUpperCase()) : null;
    
    // Validate status values if provided
    if (statuses && statuses.length > 0) {
      const validStatuses = ["DRAFT", "REVIEW", "APPROVED", "REJECTED"];
      const invalidStatuses = statuses.filter(s => !validStatuses.includes(s));
      
      if (invalidStatuses.length > 0) {
        return NextResponse.json({ 
          error: `Invalid status values: ${invalidStatuses.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Get user role
    const user = await prismaClient.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Build where condition
    const whereCondition = {
      // Filter by user ID unless admin
      ...(user?.role !== "ADMIN" ? { userId: session.user.id } : {}),
      // Filter by status if provided
      ...(statuses && statuses.length > 0 ? {
        status: {
          in: statuses as any[] // Cast to any to avoid TypeScript issues with enum
        }
      } : {})
    };

    // Fetch quotations based on filters - Ensure include is correct
    const quotations = await prisma.quotation.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        ticketSectors: {
          include: {
            variations: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        additionalServiceItems: true
      }
    })
    
    // Transform the data for the frontend - Revert to using 'any' for now
    const transformedQuotations = quotations.map((quotation: any) => {
      // Calculate actual monetary amount
      const monetaryAmount = quotation.ticketSectors.reduce((total: number, sector: any) => {
        return total + sector.variations.reduce((sectorTotal: number, variation: any) => {
          return sectorTotal + (variation.price * variation.quantity);
        }, 0);
      }, 0);
      
      return {
        ...quotation,
        // In our database, totalAmount stores the number of tickets
        ticketQuantity: quotation.totalAmount,
        // Replace totalAmount with actual monetary value for display purposes
        totalAmount: monetaryAmount || 0,
        // Include user information if it exists
        user: quotation.user ? {
          name: quotation.user.name,
          email: quotation.user.email
        } : undefined
      };
    });
    
    return NextResponse.json({
      quotations: transformedQuotations,
      isAdmin: user?.role === "ADMIN"
    })
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
      // Validate the entire input body
      const validatedInput = QuotationInputSchema.parse(body);
      console.log('Validated input data:', validatedInput);
      
      const { ticketSectors, ...quotationData } = validatedInput;

      // Use validated fields or defaults
      const platformFee = validatedInput.platformFee ?? 0;
      const ticketingFee = validatedInput.ticketingFee ?? 0;
      const additionalServices = validatedInput.additionalServices ?? 0;
      const additionalServiceItems = validatedInput.additionalServiceItems ?? [];
      const paywayFees = validatedInput.paywayFees ?? { credit: 0, debit: 0, cash: 0, total: 0 };
      const operationalCosts = validatedInput.operationalCosts ?? { 
        credentials: 0, ticketing: 0, employees: 0, mobility: 0, custom: [], total: 0 
      };
      const totalRevenue = validatedInput.totalRevenue ?? 0;
      const totalCosts = validatedInput.totalCosts ?? 0;
      const grossMargin = validatedInput.grossMargin ?? 0;
      const grossProfitability = validatedInput.grossProfitability ?? 0;
      const palco4Cost = validatedInput.palco4Cost ?? 0;
      const lineCost = validatedInput.lineCost ?? 0;
      const paymentStatusValue = validatedInput.paymentStatus;
      const ticketQuantity = validatedInput.ticketQuantity ?? ticketSectors.reduce((total, sector) => {
         return total + sector.variations.reduce((sectorTotal, variation) => {
           return sectorTotal + variation.quantity;
         }, 0);
       }, 0);

      // Create quotation transaction
      const savedQuotation = await prisma.$transaction(async (tx) => {
        // Create the quotation
        const newQuotation = await tx.quotation.create({
          data: {
            // Ensure name has a default value
            name: validatedInput.name || `Cotización Sin Nombre ${new Date().toLocaleDateString()}`,
            eventType: validatedInput.eventType,
            totalAmount: ticketQuantity, 
            ticketPrice: validatedInput.ticketPrice,
            platformFee: platformFee,
            ticketingFee: ticketingFee,
            additionalServices,
            paywayFees: paywayFees as any, 
            operationalCosts: operationalCosts as any,
            totalRevenue: totalRevenue, 
            totalCosts: totalCosts, 
            grossMargin: grossMargin, 
            grossProfitability: grossProfitability, 
            palco4Cost: palco4Cost, 
            lineCost: lineCost,
            userId: session.user.id,
            estimatedPaymentDate: validatedInput.estimatedPaymentDate ? new Date(validatedInput.estimatedPaymentDate) : null,
            paymentStatus: paymentStatusValue,
            status: QuotationStatus.REVIEW, // Keep explicit REVIEW status
            ticketSectors: {
               create: ticketSectors.map((sector) => ({ // Type inference should work here
                 name: sector.name,
                 variations: {
                   create: sector.variations.map((variation: any) => ({
                     name: variation.name,
                     price: variation.price,
                     quantity: variation.quantity
                   }))
                 }
               }))
             }
          },
          include: {
            ticketSectors: {
              include: {
                variations: true
              }
            }
          }
        });
        
        // Add additional service items if any
        if (additionalServiceItems.length > 0) {
          await tx.quotationAdditionalService.createMany({
            data: additionalServiceItems.map(service => ({
              name: service.name,
              amount: service.amount,
              isPercentage: service.isPercentage,
              quotationId: newQuotation.id
            }))
          });
        }
        
        return newQuotation;
      });

      return NextResponse.json(savedQuotation)
    } catch (zodError) {
      console.error("Zod validation error:", zodError);
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      // Re-throw if it's not a ZodError to be caught by the outer catch block
      throw zodError; 
    }
  } catch (error) {
    console.error("Error saving quotation:", error)
    // Check if it's a Prisma error (potentially from the create operation)
    if (error instanceof Error && 'code' in error) {
       // Handle known Prisma errors if needed, otherwise return a generic message
       return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 })
  }
}


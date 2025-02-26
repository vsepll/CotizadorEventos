import { NextResponse } from "next/server"
import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"

const prisma = new PrismaClient()

// Validation schema
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole)
})

export async function POST(req: Request) {
  console.log("Registration request received")
  
  try {
    const body = await req.json()
    console.log("Request body:", body)
    
    // Validate input
    const validatedData = RegisterSchema.parse(body)
    console.log("Validated data:", validatedData)
    
    const { name, email, password, role } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`User with email ${email} already exists`)
      return NextResponse.json({ error: "El correo electrónico ya está registrado" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully")

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })

    console.log(`User created successfully: ${user.id}`)

    // Return user info without password
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    }, { status: 201 })

  } catch (error) {
    console.error("Full registration error:", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors)
      return NextResponse.json({ 
        error: "Datos de registro inválidos", 
        details: error.errors 
      }, { status: 400 })
    }

    // Handle other errors
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      message: error instanceof Error ? error.message : "Error desconocido" 
    }, { status: 500 })
  }
}


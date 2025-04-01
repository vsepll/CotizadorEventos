import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cacheGlobalSettings } from "@/lib/redis";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixedExpenses = await prisma.globalFixedExpense.findMany();
    return NextResponse.json(fixedExpenses);
  } catch (error) {
    console.error("Error fetching global fixed expenses:", error);
    return NextResponse.json({ error: "Failed to fetch global fixed expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixedExpenses = await request.json();

    // Eliminar todos los gastos fijos existentes
    await prisma.globalFixedExpense.deleteMany();

    // Crear nuevos gastos fijos
    const newFixedExpenses = await prisma.globalFixedExpense.createMany({
      data: fixedExpenses.map((expense: any) => ({
        name: expense.name,
        amount: expense.amount,
        isDefault: expense.isDefault
      }))
    });

    // Actualizar caché
    await cacheGlobalSettings();

    return NextResponse.json(newFixedExpenses, { status: 201 });
  } catch (error) {
    console.error("Error saving global fixed expenses:", error);
    return NextResponse.json({ error: "Failed to save global fixed expenses" }, { status: 500 });
  }
} 
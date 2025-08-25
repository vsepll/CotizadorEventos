import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cacheGlobalSettings } from "@/lib/redis";

// Usar cliente Prisma compartido

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const commissions = await prisma.globalCommission.findMany();
    return NextResponse.json(commissions);
  } catch (error) {
    console.error("Error fetching global commissions:", error);
    return NextResponse.json({ error: "Failed to fetch global commissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const commissions = await request.json();

    // Eliminar todas las comisiones existentes
    await prisma.globalCommission.deleteMany();

    // Crear nuevas comisiones
    const newCommissions = await prisma.globalCommission.createMany({
      data: commissions.map((commission: any) => ({
        name: commission.name,
        percentage: commission.percentage,
        isDefault: commission.isDefault
      }))
    });

    // Actualizar caché
    await cacheGlobalSettings();

    return NextResponse.json(newCommissions, { status: 201 });
  } catch (error) {
    console.error("Error saving global commissions:", error);
    return NextResponse.json({ error: "Failed to save global commissions" }, { status: 500 });
  }
} 
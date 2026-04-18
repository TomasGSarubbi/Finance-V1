import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rates = await prisma.exchangeRate.findMany();
  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currency, buyRate, sellRate } = await req.json();

  if (!currency || !buyRate || !sellRate) {
    return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
  }

  const rate = await prisma.exchangeRate.upsert({
    where: { currency },
    create: { currency, buyRate: parseFloat(buyRate), sellRate: parseFloat(sellRate) },
    update: { buyRate: parseFloat(buyRate), sellRate: parseFloat(sellRate) },
  });

  return NextResponse.json(rate);
}

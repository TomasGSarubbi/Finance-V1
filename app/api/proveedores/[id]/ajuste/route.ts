import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { currency, amount, type, description } = await req.json();
    const amountNum = parseFloat(amount);

    if (!currency || isNaN(amountNum) || amountNum <= 0 || !type) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const delta = type === "IN" ? amountNum : -amountNum;

    await prisma.$transaction([
      prisma.providerMovement.create({
        data: {
          providerId: params.id,
          currency,
          amount: amountNum,
          type,
          description: description || (type === "IN" ? "Recarga manual" : "Retiro manual"),
        },
      }),
      prisma.providerBalance.upsert({
        where: { providerId_currency: { providerId: params.id, currency } },
        create: { providerId: params.id, currency, amount: delta },
        update: { amount: { increment: delta } },
      }),
    ]);

    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: { balances: true },
    });

    return NextResponse.json(provider);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

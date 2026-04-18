import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [balances, todayMovements, recentMovements] = await Promise.all([
    prisma.cashBalance.findMany(),
    prisma.cashMovement.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.cashMovement.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        operation: { select: { type: true, currency: true } },
        adjustment: { select: { reason: true, user: { select: { name: true } } } },
      },
    }),
  ]);

  const currencies = ["USD", "ARS", "USDT", "EUR", "BRL"];
  const summary = currencies.map((currency) => {
    const balance = balances.find((b) => b.currency === currency);
    const movements = todayMovements.filter((m) => m.currency === currency);
    const inflow = movements
      .filter((m) => m.type === "IN")
      .reduce((s, m) => s + parseFloat(m.amount.toString()), 0);
    const outflow = movements
      .filter((m) => m.type === "OUT")
      .reduce((s, m) => s + parseFloat(m.amount.toString()), 0);
    return {
      currency,
      balance: balance ? parseFloat(balance.amount.toString()) : 0,
      inflow,
      outflow,
    };
  });

  return NextResponse.json({ summary, recentMovements });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { currency, amount, type, reason } = await req.json();

    if (!currency || !amount || !type || !reason) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const adjustment = await tx.cashAdjustment.create({
        data: {
          currency,
          amount: amountNum,
          type,
          reason,
          userId: session.userId,
        },
      });

      await tx.cashMovement.create({
        data: {
          currency,
          amount: amountNum,
          type: "ADJUSTMENT",
          description: reason,
          adjustmentId: adjustment.id,
        },
      });

      if (type === "IN") {
        await tx.cashBalance.upsert({
          where: { currency },
          create: { currency, amount: amountNum },
          update: { amount: { increment: amountNum } },
        });
      } else {
        await tx.cashBalance.upsert({
          where: { currency },
          create: { currency, amount: -amountNum },
          update: { amount: { decrement: amountNum } },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

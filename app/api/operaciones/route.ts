import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const currency = searchParams.get("currency");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.OperationWhereInput = {};
  if (currency) where.currency = currency as Prisma.EnumCurrencyFilter;
  if (type) where.type = type as Prisma.EnumOperationTypeFilter;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const [operations, total] = await Promise.all([
    prisma.operation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.operation.count({ where }),
  ]);

  return NextResponse.json({ operations, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { type, currency, amount, rate, method, notes } = body;

    if (!type || !currency || !amount || !rate || !method) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(rate);

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const arsAmount = amountNum * rateNum;

    let profit = 0;
    if (type === "BUY") {
      const lastSell = await prisma.operation.findFirst({
        where: { type: "SELL", currency },
        orderBy: { createdAt: "desc" },
      });
      if (lastSell) {
        profit = (parseFloat(lastSell.rate.toString()) - rateNum) * amountNum;
      }
    } else {
      const lastBuy = await prisma.operation.findFirst({
        where: { type: "BUY", currency },
        orderBy: { createdAt: "desc" },
      });
      if (lastBuy) {
        profit = (rateNum - parseFloat(lastBuy.rate.toString())) * amountNum;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const operation = await tx.operation.create({
        data: {
          type,
          currency,
          amount: amountNum,
          rate: rateNum,
          method,
          notes,
          profit,
          userId: session.userId,
        },
        include: { user: { select: { name: true } } },
      });

      if (type === "BUY") {
        await tx.cashMovement.createMany({
          data: [
            {
              currency,
              amount: amountNum,
              type: "IN",
              description: `Compra ${currency} @ ${rateNum}`,
              operationId: operation.id,
            },
            {
              currency: "ARS",
              amount: arsAmount,
              type: "OUT",
              description: `Pago compra ${currency}`,
              operationId: operation.id,
            },
          ],
        });

        await tx.cashBalance.upsert({
          where: { currency },
          create: { currency, amount: amountNum },
          update: { amount: { increment: amountNum } },
        });
        await tx.cashBalance.upsert({
          where: { currency: "ARS" },
          create: { currency: "ARS", amount: -arsAmount },
          update: { amount: { decrement: arsAmount } },
        });
      } else {
        await tx.cashMovement.createMany({
          data: [
            {
              currency,
              amount: amountNum,
              type: "OUT",
              description: `Venta ${currency} @ ${rateNum}`,
              operationId: operation.id,
            },
            {
              currency: "ARS",
              amount: arsAmount,
              type: "IN",
              description: `Cobro venta ${currency}`,
              operationId: operation.id,
            },
          ],
        });

        await tx.cashBalance.upsert({
          where: { currency },
          create: { currency, amount: -amountNum },
          update: { amount: { decrement: amountNum } },
        });
        await tx.cashBalance.upsert({
          where: { currency: "ARS" },
          create: { currency: "ARS", amount: arsAmount },
          update: { amount: { increment: arsAmount } },
        });
      }

      return operation;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

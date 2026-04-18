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

  const [balances, todayOperations, recentOperations] = await Promise.all([
    prisma.cashBalance.findMany(),
    prisma.operation.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: { user: { select: { name: true } } },
    }),
    prisma.operation.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const dailyProfit = todayOperations.reduce(
    (sum, op) => sum + parseFloat(op.profit.toString()),
    0
  );

  const todayIn = todayOperations.reduce((sum, op) => {
    if (op.type === "BUY") return sum + parseFloat(op.amount.toString()) * parseFloat(op.rate.toString());
    return sum;
  }, 0);

  const todayOut = todayOperations.reduce((sum, op) => {
    if (op.type === "SELL") return sum + parseFloat(op.amount.toString());
    return sum;
  }, 0);

  const alerts: string[] = [];
  for (const b of balances) {
    if (parseFloat(b.amount.toString()) < 0) {
      alerts.push(`Saldo negativo en ${b.currency}`);
    }
  }

  return NextResponse.json({
    balances,
    dailyProfit,
    todayOperationsCount: todayOperations.length,
    todayIn,
    todayOut,
    recentOperations,
    alerts,
  });
}

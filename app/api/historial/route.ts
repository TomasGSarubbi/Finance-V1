import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
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

  const profitTotal = operations.reduce(
    (s, op) => s + parseFloat(op.profit.toString()),
    0
  );

  return NextResponse.json({ operations, total, page, limit, profitTotal });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const providers = await prisma.provider.findMany({
    where: { active: true },
    include: { balances: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(providers);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { name, notes, initialBalances } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const provider = await prisma.$transaction(async (tx) => {
      const p = await tx.provider.create({
        data: { name: name.trim(), notes: notes || null },
      });

      if (initialBalances && Array.isArray(initialBalances)) {
        for (const b of initialBalances) {
          const amount = parseFloat(b.amount);
          if (!isNaN(amount) && amount !== 0) {
            await tx.providerBalance.create({
              data: { providerId: p.id, currency: b.currency, amount },
            });
            await tx.providerMovement.create({
              data: {
                providerId: p.id,
                currency: b.currency,
                amount: Math.abs(amount),
                type: amount >= 0 ? "IN" : "OUT",
                description: "Saldo inicial",
              },
            });
          }
        }
      }

      return tx.provider.findUnique({
        where: { id: p.id },
        include: { balances: true },
      });
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

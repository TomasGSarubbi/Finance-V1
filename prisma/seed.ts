import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Usuarios
  const adminPassword = await bcrypt.hash("admin123", 10);
  const operPassword = await bcrypt.hash("oper123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Administrador",
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const operador = await prisma.user.upsert({
    where: { username: "operador" },
    update: {},
    create: {
      name: "Operador",
      username: "operador",
      password: operPassword,
      role: "OPERATOR",
    },
  });

  // Tipos de cambio base
  await prisma.exchangeRate.upsert({
    where: { currency: "USD" },
    update: {},
    create: { currency: "USD", buyRate: 1150, sellRate: 1200 },
  });

  await prisma.exchangeRate.upsert({
    where: { currency: "USDT" },
    update: {},
    create: { currency: "USDT", buyRate: 1145, sellRate: 1195 },
  });

  await prisma.exchangeRate.upsert({
    where: { currency: "EUR" },
    update: {},
    create: { currency: "EUR", buyRate: 1250, sellRate: 1310 },
  });

  // Saldos iniciales de caja
  await prisma.cashBalance.upsert({
    where: { currency: "ARS" },
    update: {},
    create: { currency: "ARS", amount: 500000 },
  });

  await prisma.cashBalance.upsert({
    where: { currency: "USD" },
    update: {},
    create: { currency: "USD", amount: 1000 },
  });

  await prisma.cashBalance.upsert({
    where: { currency: "USDT" },
    update: {},
    create: { currency: "USDT", amount: 500 },
  });

  // Operaciones de prueba
  const ops = [
    { type: "BUY" as const, currency: "USD" as const, amount: 500, rate: 1148, method: "CASH" as const, profit: 0, userId: admin.id },
    { type: "SELL" as const, currency: "USD" as const, amount: 300, rate: 1198, method: "CASH" as const, profit: 150, userId: operador.id },
    { type: "BUY" as const, currency: "USD" as const, amount: 1000, rate: 1150, method: "TRANSFER" as const, profit: 0, userId: admin.id },
    { type: "SELL" as const, currency: "USD" as const, amount: 200, rate: 1195, method: "CASH" as const, profit: 90, userId: operador.id },
    { type: "BUY" as const, currency: "USDT" as const, amount: 300, rate: 1143, method: "TRANSFER" as const, profit: 0, userId: admin.id },
  ];

  for (const op of ops) {
    const arsTotal = op.amount * op.rate;
    const operation = await prisma.operation.create({
      data: op,
    });

    if (op.type === "BUY") {
      await prisma.cashMovement.createMany({
        data: [
          { currency: op.currency, amount: op.amount, type: "IN", description: `Compra ${op.currency}`, operationId: operation.id },
          { currency: "ARS", amount: arsTotal, type: "OUT", description: `Pago compra ${op.currency}`, operationId: operation.id },
        ],
      });
    } else {
      await prisma.cashMovement.createMany({
        data: [
          { currency: op.currency, amount: op.amount, type: "OUT", description: `Venta ${op.currency}`, operationId: operation.id },
          { currency: "ARS", amount: arsTotal, type: "IN", description: `Cobro venta ${op.currency}`, operationId: operation.id },
        ],
      });
    }
  }

  console.log("✅ Seed completado");
  console.log("👤 Admin: usuario=admin, password=admin123");
  console.log("👤 Operador: usuario=operador, password=oper123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

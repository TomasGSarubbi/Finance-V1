import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency: string = "ARS"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$ 0,00";

  const formatted = Math.abs(num).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency === "ARS" ? "$" : currency;
  const sign = num < 0 ? "-" : "";
  return `${sign}${symbol} ${formatted}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const CURRENCY_LABELS: Record<string, string> = {
  USD: "Dólar (USD)",
  ARS: "Peso (ARS)",
  USDT: "USDT",
  EUR: "Euro (EUR)",
  BRL: "Real (BRL)",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "USD",
  ARS: "$",
  USDT: "USDT",
  EUR: "EUR",
  BRL: "BRL",
};

export const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
};

export const OPERATION_LABELS: Record<string, string> = {
  BUY: "Compra",
  SELL: "Venta",
};

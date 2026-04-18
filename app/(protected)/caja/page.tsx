"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToastContainer } from "@/components/ui/toast";
import { formatCurrency, formatDate, CURRENCY_SYMBOLS } from "@/lib/utils";

interface CurrencySummary {
  currency: string;
  balance: number;
  inflow: number;
  outflow: number;
}

interface Movement {
  id: string;
  currency: string;
  amount: string;
  type: string;
  description: string | null;
  createdAt: string;
  operation?: { type: string; currency: string } | null;
  adjustment?: { reason: string; user: { name: string } } | null;
}

const CURRENCIES = ["USD", "ARS", "USDT", "EUR", "BRL"];

function BalanceCard({ data }: { data: CurrencySummary }) {
  const isNegative = data.balance < 0;
  const sym = CURRENCY_SYMBOLS[data.currency] || data.currency;

  return (
    <Card className={isNegative ? "border-red-200" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                isNegative ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              }`}
            >
              {sym.slice(0, 3)}
            </div>
            <span className="font-semibold text-gray-700">{data.currency}</span>
          </div>
          {isNegative && (
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              NEGATIVO
            </span>
          )}
        </div>

        <p
          className={`text-2xl font-bold mb-3 ${
            isNegative ? "text-red-600" : "text-gray-900"
          }`}
        >
          {data.currency === "ARS"
            ? formatCurrency(data.balance, "ARS")
            : `${sym} ${data.balance.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Entradas</span>
            </div>
            <p className="text-sm font-semibold text-emerald-700">
              {data.inflow.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Salidas</span>
            </div>
            <p className="text-sm font-semibold text-red-700">
              {data.outflow.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CajaPage() {
  const [summary, setSummary] = useState<CurrencySummary[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);

  const [form, setForm] = useState({
    currency: "ARS",
    amount: "",
    type: "IN",
    reason: "",
  });

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/caja");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setMovements(data.recentMovements);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAjuste(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.reason) {
      addToast("Completa todos los campos", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        addToast("Ajuste registrado", "success");
        setForm({ currency: "ARS", amount: "", type: "IN", reason: "" });
        setDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        addToast(data.error || "Error", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const movementTypeLabel: Record<string, string> = {
    IN: "Entrada",
    OUT: "Salida",
    ADJUSTMENT: "Ajuste",
  };

  const movementTypeBadge: Record<string, "success" | "destructive" | "warning"> = {
    IN: "success",
    OUT: "destructive",
    ADJUSTMENT: "warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Balance por Moneda (hoy)
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Ajuste de Caja
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajuste Manual de Caja</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAjuste} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "IN" }))}
                    className={`h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                      form.type === "IN"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-400"
                    }`}
                  >
                    + Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "OUT" }))}
                    className={`h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                      form.type === "OUT"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-400"
                    }`}
                  >
                    - Egreso
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Motivo (requerido)</Label>
                  <Textarea
                    placeholder="Ej: Fondo inicial de caja, retiro de dueño, etc."
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registrando..." : "Registrar Ajuste"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summary.map((s) => (
          <BalanceCard key={s.currency} data={s} />
        ))}
      </div>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No hay movimientos
            </p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.type === "IN"
                        ? "bg-emerald-100 text-emerald-600"
                        : m.type === "OUT"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {(CURRENCY_SYMBOLS[m.currency] || m.currency).slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.description || (m.operation ? `${m.operation.type === "BUY" ? "Compra" : "Venta"} ${m.operation.currency}` : "Movimiento")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(m.createdAt)}
                      {m.adjustment?.user && ` · ${m.adjustment.user.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        m.type === "IN"
                          ? "text-emerald-600"
                          : m.type === "OUT"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "~"}
                      {m.currency === "ARS"
                        ? formatCurrency(m.amount, "ARS")
                        : `${CURRENCY_SYMBOLS[m.currency] || m.currency} ${parseFloat(m.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                  <Badge variant={movementTypeBadge[m.type]}>
                    {movementTypeLabel[m.type]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

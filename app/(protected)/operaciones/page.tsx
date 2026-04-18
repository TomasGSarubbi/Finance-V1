"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
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
import { ToastContainer } from "@/components/ui/toast";
import {
  formatDate,
  formatCurrency,
  CURRENCY_SYMBOLS,
  OPERATION_LABELS,
  METHOD_LABELS,
} from "@/lib/utils";

interface Operation {
  id: string;
  type: string;
  currency: string;
  amount: string;
  rate: string;
  method: string;
  notes: string | null;
  profit: string;
  createdAt: string;
  user: { name: string };
}

interface ExchangeRate {
  currency: string;
  buyRate: string;
  sellRate: string;
}

const CURRENCIES = ["USD", "USDT", "EUR", "BRL"];

function OperationRow({ op }: { op: Operation }) {
  const isBuy = op.type === "BUY";
  const arsTotal = parseFloat(op.amount) * parseFloat(op.rate);

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
          isBuy ? "bg-emerald-100" : "bg-red-100"
        }`}
      >
        {isBuy ? (
          <ArrowDownRight className="h-5 w-5 text-emerald-600" />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {OPERATION_LABELS[op.type]} {op.currency}
          </p>
          <Badge variant={isBuy ? "success" : "destructive"} className="text-xs">
            {OPERATION_LABELS[op.type]}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {METHOD_LABELS[op.method]}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {op.user.name} · {formatDate(op.createdAt)}
        </p>
        {op.notes && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{op.notes}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {CURRENCY_SYMBOLS[op.currency]}{" "}
          {parseFloat(op.amount).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-xs text-gray-400">
          @ {parseFloat(op.rate).toLocaleString("es-AR")} = {formatCurrency(arsTotal, "ARS")}
        </p>
      </div>
      <div className="text-right shrink-0 w-28">
        <p
          className={`text-sm font-bold ${
            parseFloat(op.profit) >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {parseFloat(op.profit) >= 0 ? "+" : ""}
          {formatCurrency(op.profit, "ARS")}
        </p>
        <p className="text-xs text-gray-400">ganancia</p>
      </div>
    </div>
  );
}

export default function OperacionesPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);

  const [form, setForm] = useState({
    type: "BUY",
    currency: "USD",
    amount: "",
    rate: "",
    method: "CASH",
    notes: "",
  });

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operaciones?limit=30");
      if (res.ok) {
        const data = await res.json();
        setOperations(data.operations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    const res = await fetch("/api/config/tipos-cambio");
    if (res.ok) {
      const data = await res.json();
      setRates(data);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
    fetchRates();
  }, [fetchOperations, fetchRates]);

  function applyRate() {
    const rate = rates.find((r) => r.currency === form.currency);
    if (rate) {
      const rateValue = form.type === "BUY" ? rate.buyRate : rate.sellRate;
      setForm((f) => ({ ...f, rate: parseFloat(rateValue).toString() }));
    }
  }

  const arsTotal = form.amount && form.rate
    ? parseFloat(form.amount) * parseFloat(form.rate)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.rate) {
      addToast("Completa monto y tipo de cambio", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/operaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        addToast("Operación registrada correctamente", "success");
        setForm((f) => ({ ...f, amount: "", rate: "", notes: "" }));
        fetchOperations();
      } else {
        const data = await res.json();
        addToast(data.error || "Error al registrar", "error");
      }
    } catch {
      addToast("Error de conexión", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Operación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: "BUY" }))}
                  className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-semibold text-sm transition-all ${
                    form.type === "BUY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <ArrowDownRight className="h-5 w-5" />
                  Compra
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: "SELL" }))}
                  className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-semibold text-sm transition-all ${
                    form.type === "SELL"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <ArrowUpRight className="h-5 w-5" />
                  Venta
                </button>
              </div>

              {/* Moneda */}
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
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Monto */}
              <div className="space-y-1.5">
                <Label>Monto ({form.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Tipo de cambio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Tipo de cambio (ARS)</Label>
                  <button
                    type="button"
                    onClick={applyRate}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Usar cotización base
                  </button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Total en ARS */}
              {arsTotal > 0 && (
                <div
                  className={`rounded-lg p-3 ${
                    form.type === "BUY" ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <p className="text-xs text-gray-500">Total en pesos</p>
                  <p
                    className={`text-xl font-bold ${
                      form.type === "BUY" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(arsTotal, "ARS")}
                  </p>
                </div>
              )}

              {/* Medio */}
              <div className="space-y-1.5">
                <Label>Medio de pago</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["CASH", "TRANSFER"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, method: m }))}
                      className={`h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                        form.method === m
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {m === "CASH" ? "Efectivo" : "Transferencia"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Opcional..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant={form.type === "BUY" ? "success" : "destructive"}
                disabled={submitting}
              >
                {submitting
                  ? "Registrando..."
                  : `Registrar ${OPERATION_LABELS[form.type]}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Operaciones Recientes</CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchOperations}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && operations.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
              </div>
            ) : operations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                No hay operaciones. Registrá la primera.
              </p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {operations.map((op) => (
                  <OperationRow key={op.id} op={op} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

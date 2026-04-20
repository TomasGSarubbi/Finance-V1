"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ToastContainer } from "@/components/ui/toast";
import { formatCurrency, CURRENCY_SYMBOLS } from "@/lib/utils";

const CURRENCIES = ["USD", "USDT", "EUR", "BRL", "ARS"];

interface ProviderBalance {
  currency: string;
  amount: string;
}

interface Provider {
  id: string;
  name: string;
  notes: string | null;
  balances: ProviderBalance[];
}

function AmountInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!value) setDisplay("");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Keep only digits and one comma for decimals
    const cleaned = e.target.value.replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    const intPart = parts[0];
    const decPart = parts.length > 1 ? parts[1].slice(0, 2) : null;

    // Format integer part with thousands dots
    const intNum = intPart === "" ? null : parseInt(intPart, 10);
    const formattedInt = intNum === null ? "" : intNum.toLocaleString("es-AR");
    const newDisplay = decPart !== null ? formattedInt + "," + decPart : formattedInt;

    setDisplay(newDisplay);
    const raw = intPart + (decPart !== null ? "." + decPart : "");
    onChange(intPart === "" ? "" : raw);
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm select-none">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        className="pl-7 text-right font-semibold tabular-nums"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
      />
    </div>
  );
}

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    notes: "",
    initialBalances: CURRENCIES.map((c) => ({ currency: c, amount: "" })),
  });
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [editForm, setEditForm] = useState({ name: "", notes: "" });
  const [editing, setEditing] = useState(false);

  // Adjust dialog
  const [adjustProvider, setAdjustProvider] = useState<Provider | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    currency: "ARS",
    amount: "",
    type: "IN",
    description: "",
  });
  const [adjusting, setAdjusting] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proveedores");
      if (res.ok) setProviders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) { addToast("El nombre es requerido", "error"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          notes: createForm.notes,
          initialBalances: createForm.initialBalances.filter((b) => b.amount !== ""),
        }),
      });
      if (res.ok) {
        addToast("Proveedor creado", "success");
        setShowCreate(false);
        setCreateForm({ name: "", notes: "", initialBalances: CURRENCIES.map((c) => ({ currency: c, amount: "" })) });
        fetchProviders();
      } else {
        const d = await res.json();
        addToast(d.error || "Error al crear", "error");
      }
    } catch { addToast("Error de conexión", "error"); }
    finally { setCreating(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProvider) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/proveedores/${editProvider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        addToast("Proveedor actualizado", "success");
        setEditProvider(null);
        fetchProviders();
      } else addToast("Error al actualizar", "error");
    } catch { addToast("Error de conexión", "error"); }
    finally { setEditing(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proveedor?")) return;
    const res = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
    if (res.ok) { addToast("Proveedor eliminado", "success"); fetchProviders(); }
    else addToast("Error al eliminar", "error");
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustProvider) return;
    setAdjusting(true);
    try {
      const res = await fetch(`/api/proveedores/${adjustProvider.id}/ajuste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustForm),
      });
      if (res.ok) {
        addToast("Saldo ajustado", "success");
        setAdjustProvider(null);
        fetchProviders();
      } else {
        const d = await res.json();
        addToast(d.error || "Error al ajustar", "error");
      }
    } catch { addToast("Error de conexión", "error"); }
    finally { setAdjusting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de proveedores y sus saldos disponibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchProviders}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo proveedor
          </Button>
        </div>
      </div>

      {loading && providers.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay proveedores</p>
            <p className="text-gray-400 text-sm mt-1">
              Agregá tu primer proveedor para empezar a gestionar saldos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((p) => {
            const arsBalance = p.balances.find((b) => b.currency === "ARS");
            const arsAmount = arsBalance ? parseFloat(arsBalance.amount) : 0;
            const otherBalances = p.balances.filter((b) => b.currency !== "ARS" && parseFloat(b.amount) !== 0);

            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditProvider(p);
                          setEditForm({ name: p.name, notes: p.notes || "" });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* ARS balance */}
                  <div
                    className={`rounded-lg p-3 ${
                      arsAmount >= 0 ? "bg-emerald-50" : "bg-red-50"
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-0.5">Saldo ARS</p>
                    <p
                      className={`text-xl font-bold ${
                        arsAmount >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(arsAmount, "ARS")}
                    </p>
                  </div>

                  {/* Other currencies */}
                  {otherBalances.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {otherBalances.map((b) => {
                        const val = parseFloat(b.amount);
                        return (
                          <Badge
                            key={b.currency}
                            variant={val >= 0 ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {CURRENCY_SYMBOLS[b.currency]}{" "}
                            {val.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setAdjustProvider(p);
                      setAdjustForm({ currency: "ARS", amount: "", type: "IN", description: "" });
                    }}
                  >
                    Ajustar saldo
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Banco Nación, Juan Pérez..."
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="CBU, alias, contacto..."
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Saldos iniciales (opcional)</Label>
              {createForm.initialBalances.map((b, i) => (
                <div key={b.currency} className="flex items-center gap-2">
                  <span className="w-12 text-sm font-medium text-gray-600">{b.currency}</span>
                  <AmountInput
                    value={b.amount}
                    onChange={(raw) =>
                      setCreateForm((f) => ({
                        ...f,
                        initialBalances: f.initialBalances.map((bal, idx) =>
                          idx === i ? { ...bal, amount: raw } : bal
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creando..." : "Crear proveedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProvider} onOpenChange={() => setEditProvider(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditProvider(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editing}>
                {editing ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust dialog */}
      <Dialog open={!!adjustProvider} onOpenChange={() => setAdjustProvider(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar saldo — {adjustProvider?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["IN", "OUT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdjustForm((f) => ({ ...f, type: t }))}
                    className={`flex items-center justify-center gap-2 h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                      adjustForm.type === t
                        ? t === "IN"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {t === "IN" ? (
                      <><TrendingUp className="h-4 w-4" /> Ingreso</>
                    ) : (
                      <><TrendingDown className="h-4 w-4" /> Egreso</>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={adjustForm.currency}
                onValueChange={(v) => setAdjustForm((f) => ({ ...f, currency: v }))}
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
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <AmountInput
                value={adjustForm.amount}
                onChange={(raw) => setAdjustForm((f) => ({ ...f, amount: raw }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input
                placeholder="Motivo del ajuste..."
                value={adjustForm.description}
                onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAdjustProvider(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={adjusting}>
                {adjusting ? "Ajustando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

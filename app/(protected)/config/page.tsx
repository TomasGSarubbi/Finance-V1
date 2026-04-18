"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, DollarSign, Plus, Check, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToastContainer } from "@/components/ui/toast";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface ExchangeRate {
  id: string;
  currency: string;
  buyRate: string;
  sellRate: string;
  updatedAt: string;
}

const CURRENCIES = ["USD", "USDT", "EUR", "BRL"];

export default function ConfigPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);
  const [userDialog, setUserDialog] = useState(false);
  const [rateDialog, setRateDialog] = useState(false);

  const [userForm, setUserForm] = useState({ name: "", username: "", password: "", role: "OPERATOR" });
  const [rateForm, setRateForm] = useState({ currency: "USD", buyRate: "", sellRate: "" });
  const [submitting, setSubmitting] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/config/usuarios");
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchRates = useCallback(async () => {
    const res = await fetch("/api/config/tipos-cambio");
    if (res.ok) setRates(await res.json());
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRates();
  }, [fetchUsers, fetchRates]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/config/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        addToast("Usuario creado", "success");
        setUserForm({ name: "", username: "", password: "", role: "OPERATOR" });
        setUserDialog(false);
        fetchUsers();
      } else {
        const data = await res.json();
        addToast(data.error || "Error", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleUser(id: string, active: boolean) {
    const res = await fetch("/api/config/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (res.ok) {
      addToast(`Usuario ${active ? "activado" : "desactivado"}`, "success");
      fetchUsers();
    }
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/config/tipos-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rateForm),
      });
      if (res.ok) {
        addToast("Cotización guardada", "success");
        setRateForm({ currency: "USD", buyRate: "", sellRate: "" });
        setRateDialog(false);
        fetchRates();
      } else {
        const data = await res.json();
        addToast(data.error || "Error", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cotizaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cotizaciones Base
            </CardTitle>
            <Dialog open={rateDialog} onOpenChange={setRateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nueva cotización
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Definir Cotización Base</DialogTitle>
                </DialogHeader>
                <form onSubmit={saveRate} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Moneda</Label>
                    <Select
                      value={rateForm.currency}
                      onValueChange={(v) => setRateForm((f) => ({ ...f, currency: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Compra (ARS)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={rateForm.buyRate}
                        onChange={(e) => setRateForm((f) => ({ ...f, buyRate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Venta (ARS)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={rateForm.sellRate}
                        onChange={(e) => setRateForm((f) => ({ ...f, sellRate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Guardando..." : "Guardar cotización"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No hay cotizaciones configuradas
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {rates.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                    {r.currency}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{r.currency}</p>
                    <p className="text-xs text-gray-400">
                      Actualizado: {new Date(r.updatedAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Compra</p>
                      <p className="text-sm font-bold text-emerald-600">
                        $ {parseFloat(r.buyRate).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Venta</p>
                      <p className="text-sm font-bold text-red-600">
                        $ {parseFloat(r.sellRate).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Spread</p>
                      <p className="text-sm font-bold text-blue-600">
                        $ {(parseFloat(r.sellRate) - parseFloat(r.buyRate)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios del Sistema
            </CardTitle>
            <Dialog open={userDialog} onOpenChange={setUserDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <form onSubmit={createUser} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Nombre completo</Label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={userForm.name}
                      onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Usuario</Label>
                    <Input
                      placeholder="Ej: juanperez"
                      value={userForm.username}
                      onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={userForm.password}
                      onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(v) => setUserForm((f) => ({ ...f, role: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERATOR">Operador</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creando..." : "Crear usuario"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No hay usuarios</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {u.role === "ADMIN" ? "Admin" : "Operador"}
                  </Badge>
                  <Badge variant={u.active ? "success" : "outline"}>
                    {u.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <button
                    onClick={() => toggleUser(u.id, !u.active)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                      u.active
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
                    }`}
                    title={u.active ? "Desactivar" : "Activar"}
                  >
                    {u.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </button>
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

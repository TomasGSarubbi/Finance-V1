"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Filter } from "lucide-react";
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

const LIMIT = 25;

export default function HistorialPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [total, setTotal] = useState(0);
  const [profitTotal, setProfitTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    currency: "",
    type: "",
    from: "",
    to: "",
  });
  const [applied, setApplied] = useState(filters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() });
      if (applied.currency) params.set("currency", applied.currency);
      if (applied.type) params.set("type", applied.type);
      if (applied.from) params.set("from", applied.from);
      if (applied.to) params.set("to", applied.to);

      const res = await fetch(`/api/historial?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOperations(data.operations);
        setTotal(data.total);
        setProfitTotal(data.profitTotal);
      }
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function applyFilters() {
    setPage(1);
    setApplied(filters);
  }

  function clearFilters() {
    const empty = { currency: "", type: "", from: "", to: "" };
    setFilters(empty);
    setApplied(empty);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={filters.currency || "ALL"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, currency: v === "ALL" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {["USD", "ARS", "USDT", "EUR", "BRL"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={filters.type || "ALL"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, type: v === "ALL" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="BUY">Compra</SelectItem>
                  <SelectItem value="SELL">Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Aplicar filtros</Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total operaciones</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Ganancia total</p>
            <p className={`text-2xl font-bold ${profitTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(profitTotal, "ARS")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Página</p>
            <p className="text-2xl font-bold text-gray-900">
              {page} / {totalPages || 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : operations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">
              No hay operaciones con estos filtros
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                        Fecha
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Tipo
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Moneda
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Monto
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        T. Cambio
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Total ARS
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Ganancia
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Medio
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                        Usuario
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {operations.map((op) => {
                      const isBuy = op.type === "BUY";
                      const arsTotal = parseFloat(op.amount) * parseFloat(op.rate);
                      const profit = parseFloat(op.profit);
                      return (
                        <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(op.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {isBuy ? (
                                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <Badge
                                variant={isBuy ? "success" : "destructive"}
                                className="text-xs"
                              >
                                {OPERATION_LABELS[op.type]}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-700">
                              {op.currency}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {CURRENCY_SYMBOLS[op.currency]}{" "}
                              {parseFloat(op.amount).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {parseFloat(op.rate).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700 font-medium">
                            {formatCurrency(arsTotal, "ARS")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-sm font-semibold ${
                                profit >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {profit >= 0 ? "+" : ""}
                              {formatCurrency(profit, "ARS")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs">
                              {METHOD_LABELS[op.method]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {op.user.name}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                <p className="text-sm text-gray-500">
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

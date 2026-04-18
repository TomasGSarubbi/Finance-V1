"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  CURRENCY_SYMBOLS,
  OPERATION_LABELS,
  METHOD_LABELS,
} from "@/lib/utils";

interface Balance {
  currency: string;
  amount: string;
}

interface Operation {
  id: string;
  type: string;
  currency: string;
  amount: string;
  rate: string;
  method: string;
  profit: string;
  createdAt: string;
  user: { name: string };
}

interface DashboardData {
  balances: Balance[];
  dailyProfit: number;
  todayOperationsCount: number;
  recentOperations: Operation[];
  alerts: string[];
}

const MAIN_CURRENCIES = ["USD", "ARS", "USDT"];

function CurrencyCard({ currency, amount }: { currency: string; amount: number }) {
  const isNegative = amount < 0;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <Card className={isNegative ? "border-red-200 bg-red-50" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                isNegative
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {symbol.slice(0, 3)}
            </div>
            <span className="text-sm font-medium text-gray-500">{currency}</span>
          </div>
          {isNegative && (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <p
          className={`text-2xl font-bold ${
            isNegative ? "text-red-600" : "text-gray-900"
          }`}
        >
          {currency === "ARS"
            ? formatCurrency(amount, "ARS")
            : `${symbol} ${Math.abs(amount).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
        {isNegative && (
          <p className="text-xs text-red-500 mt-1 font-medium">⚠ Saldo negativo</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdate(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const balanceMap: Record<string, number> = {};
  (data?.balances || []).forEach((b) => {
    balanceMap[b.currency] = parseFloat(b.amount);
  });

  const profitPositive = (data?.dailyProfit || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="font-semibold text-red-700">Alertas</p>
          </div>
          <ul className="space-y-1">
            {data.alerts.map((alert, i) => (
              <li key={i} className="text-sm text-red-600">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Caja por moneda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Caja Actual
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              className="h-7 w-7"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MAIN_CURRENCIES.map((currency) => (
            <CurrencyCard
              key={currency}
              currency={currency}
              amount={balanceMap[currency] || 0}
            />
          ))}
        </div>
      </div>

      {/* Métricas del día */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  profitPositive ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {profitPositive ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <span className="text-sm text-gray-500">Resultado del día</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                profitPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data?.dailyProfit || 0, "ARS")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Operaciones hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data?.todayOperationsCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Otras monedas</span>
            </div>
            <div className="flex gap-3">
              {["EUR", "BRL"].map((c) => (
                <div key={c}>
                  <p className="text-xs text-gray-400">{c}</p>
                  <p className="text-base font-semibold text-gray-700">
                    {(balanceMap[c] || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas operaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimas Operaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.recentOperations?.length ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No hay operaciones registradas
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentOperations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      op.type === "BUY"
                        ? "bg-emerald-100"
                        : "bg-red-100"
                    }`}
                  >
                    {op.type === "BUY" ? (
                      <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {OPERATION_LABELS[op.type]} {op.currency}
                    </p>
                    <p className="text-xs text-gray-400">
                      {op.user.name} · {METHOD_LABELS[op.method]}
                    </p>
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
                      @ {parseFloat(op.rate).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <p
                      className={`text-xs font-medium ${
                        parseFloat(op.profit) >= 0
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {formatCurrency(op.profit, "ARS")}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(op.createdAt)}</p>
                  </div>
                  <Badge
                    variant={op.type === "BUY" ? "success" : "destructive"}
                    className="shrink-0"
                  >
                    {OPERATION_LABELS[op.type]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

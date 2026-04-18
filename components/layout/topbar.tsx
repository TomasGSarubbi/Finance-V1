"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/operaciones": "Operaciones",
  "/caja": "Caja",
  "/historial": "Historial",
  "/config": "Configuración",
};

interface TopbarProps {
  user?: { name: string; role: string } | null;
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const title = Object.entries(titles).find(([k]) =>
    pathname.startsWith(k)
  )?.[1] ?? "Cueva";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-gray-600">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role === "ADMIN" ? "Administrador" : "Operador"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

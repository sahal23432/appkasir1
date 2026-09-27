import React from "react";
import Link from "next/link";
import { UserRole } from "@/types";

interface SidebarProps {
  role?: UserRole;
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  return (
    <aside className="w-64 border-r bg-gray-50 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-2 font-bold text-gray-700 uppercase tracking-wider text-xs">
          Menu ({role ? role.toUpperCase() : "GUEST"})
        </div>

        <nav className="space-y-1">
          {(!role || role === "kasir" || role === "admin") && (
            <Link
              href="/kasir"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200"
            >
              Kasir (POS)
            </Link>
          )}

          {(!role || role === "admin") && (
            <Link
              href="/admin"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200"
            >
              Admin (Kelola Data & Saldo)
            </Link>
          )}

          {(!role || role === "admin") && (
            <Link
              href="/supervisor"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200"
            >
              Laporan Penjualan
            </Link>
          )}
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/login"
          className="block px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
        >
          Keluar / Ganti Akun
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

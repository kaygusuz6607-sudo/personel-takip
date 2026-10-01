"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Coins, FileText } from "lucide-react";
import SupplierCariPanel from "@/app/giderler/components/SupplierCariPanel";

export default function TedarikciCarilerPage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/giderler"
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <Coins className="w-4 h-4 text-teal-700" />
            <span>Okul Giderleri & Aylık Ödeme Listesi</span>
          </Link>

          <span className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-700 text-white shadow-xs flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Tedarikçi & Ürün Carileri (Alınan / Ödenen)</span>
          </span>

          <Link
            href="/cari"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Personel Cari & Ekstreler</span>
          </Link>
        </div>
      </div>

      <SupplierCariPanel
        onNavigateToMonthExpense={(ym) => {
          router.push(`/giderler?month=${encodeURIComponent(ym)}`);
        }}
      />
    </div>
  );
}

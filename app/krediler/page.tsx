"use client";

import { Suspense } from "react";
import BankLoansTracker from "@/components/BankLoansTracker";

function KredilerFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Kredi Takip Ekranı Yükleniyor...</span>
      </div>
    </div>
  );
}

export default function KredilerPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 p-3 sm:p-6 space-y-5 animate-in fade-in duration-200">
      <Suspense fallback={<KredilerFallback />}>
        <BankLoansTracker />
      </Suspense>
    </div>
  );
}

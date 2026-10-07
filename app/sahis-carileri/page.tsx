"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Scale, Users, Building2, ReceiptText, ArrowRight } from "lucide-react";
import ThirdPartyLedger from "@/app/cari/components/ThirdPartyLedger";

export default function SahisCarileriPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. ÜST BAŞLIK VE HIZLI GEÇİŞLER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-sm shadow-indigo-700/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Şahıs & 3. Kişi Borç-Alacak Carileri
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                  Emanet, Ortak & Şahıs Carileri
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Orhan Kayaalp, şirket ortakları ve 3. şahıslara ait emanet, borç alımları, SGK/masraf ödemeleri ve yürüyen bakiye takibi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/tedarikci-cariler"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Tedarikçi Carileri</span>
          </Link>
          <Link
            href="/cari"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Personel Carileri</span>
          </Link>
          <Link
            href="/giderler"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <ReceiptText className="w-3.5 h-3.5 text-slate-300" />
            <span>Okul Giderleri →</span>
          </Link>
        </div>
      </div>

      {/* 2. ŞAHIS CARİ VE YÜRÜYEN BAKİYE TABLOLARI */}
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Şahıs carileri yükleniyor...</div>}>
        <ThirdPartyLedger />
      </Suspense>
    </div>
  );
}

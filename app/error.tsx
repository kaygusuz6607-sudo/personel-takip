"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uygulama Hatası:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Bir Hata Oluştu</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistemde geçici bir işlem hatası oluştu. Lütfen yeniden deneyin veya ana sayfaya dönün.
          </p>
          {error?.message && (
            <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yeniden Dene</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-slate-700">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white">İstemci İşlem Hatası</h2>
          <p className="text-xs text-slate-400">
            Tarayıcı tarafında bir bileşen yüklenirken hata oluştu.
          </p>
          {error?.message && (
            <div className="text-xs text-rose-300 font-mono bg-slate-950 p-3 rounded-xl overflow-x-auto text-left border border-rose-900/50">
              {error.message}
            </div>
          )}
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Yeniden Dene
            </button>
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

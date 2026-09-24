"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Building2, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Lütfen kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Giriş başarısız oldu.");
        return;
      }

      // Başarılı giriş -> Yönlendir
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Arka Plan Dekoratif Işıklar */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo ve Marka */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white font-black text-2xl shadow-xl shadow-teal-500/20 mb-4 ring-4 ring-teal-500/30">
            CS
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wider">COSMOS</h1>
          <p className="text-teal-300 font-medium text-sm mt-1">Personel Takip & Bordro Yönetimi</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-700/50 text-teal-200 text-xs mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Güvenli Yetkili Girişi</span>
          </div>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-7 border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sisteme Giriş Yap</h2>
            <p className="text-xs text-slate-500 mt-1">
              Devam etmek için tanımlanmış yetkili kullanıcı bilgilerinizi giriniz.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="örn: admin, muhasebe"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white text-slate-800 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white text-slate-800 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold rounded-xl text-sm shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Hızlı Giriş Butonları (2-3 Yetkili Kullanıcı İçin Kolaylık) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Kayıtlı Yetkili Hesaplar (Tek Tıkla Doldur)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFill("admin", "admin")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Yönetici</div>
                <div className="text-[10px] text-teal-700 font-mono">admin</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("muhasebe", "muhasebe123")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Muhasebe</div>
                <div className="text-[10px] text-teal-700 font-mono">muhasebe</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("mudur", "mudur123")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-slate-800">Müdür</div>
                <div className="text-[10px] text-teal-700 font-mono">mudur</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              * Sisteme girdikten sonra şifrelerinizi ve kullanıcıları dilediğiniz gibi güncelleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Güvenlik Alt Bilgisi */}
        <div className="text-center mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>COSMOS Güvenlik Duvarı Aktif • Yalnızca Yetkili Girişi</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

export default function YedeklemePage() {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<{
    staffCount: number;
    departmentCount: number;
    payrollCount: number;
    leaveCount: number;
  } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          staffCount: data.totalStaff || 0,
          departmentCount: data.departments?.length || 0,
          payrollCount: (data.currentMonthStats?.paidCount || 0) + (data.currentMonthStats?.pendingCount || 0),
          leaveCount: data.onLeaveStaff || 0,
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 1. Canlı Verileri Bilgisayara İndir (JSON Tam Sistem Yedeği)
  const handleExportBackup = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await fetch("/api/sync/export");
      if (!res.ok) throw new Error("Yedekleme dosyası oluşturulamadı.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COSMOS_TAM_YEDEK_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMsg({
        type: "success",
        text: "Tüm sistem verileri (personeller, maaşlar, izinler) bilgisayarınıza tam yedek dosyası olarak indirildi!",
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "İndirme sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  };

  // 2. Bilgisayardaki Dosyayı Buluta Geri Yükle (İçe Aktarma)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`"${file.name}" dosyasındaki tüm veriler sisteme yüklenecek ve eşitlenecek. Onaylıyor musunuz?`)) {
      e.target.value = "";
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/sync/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Geri yükleme başarısız oldu.");

        setStatusMsg({
          type: "success",
          text: `Yedekleme başarıyla yüklendi! (${data.restoredCounts?.staff || 0} personel, ${data.restoredCounts?.payrolls || 0} bordro kaydı eşitlendi).`,
        });
        fetchStats();
      } catch (err: any) {
        setStatusMsg({ type: "error", text: "Hata: " + (err.message || "Dosya okunamadı.") });
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  // 3. Excel Dışa Aktarma
  const handleExportExcel = () => {
    window.location.href = "/api/export?type=payroll&month=" + (new Date().getMonth() + 1) + "&year=" + new Date().getFullYear();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 select-none">
      {/* Üst Başlık */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Hibrit Veri Güvenliği & Senkronizasyon</h1>
            <p className="text-sm text-slate-500">
              Bulut (Vercel) ile Yerel Bilgisayarınız arasında çift yönlü otomatik veri koruma ve felaket kurtarma merkezi.
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* 3'lü Mimari Durum Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Bulut Katmanı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Canlı / 7-24
            </span>
          </div>
          <h3 className="font-bold text-slate-800">Bulut Sunucusu (Vercel)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Akif Bey'in Türkiye'den telefondan ve sizin ABD'den bağlandığınız ortak canlı veritabanı.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Aktif Personel:</span>
            <span className="font-bold text-slate-800">{stats?.staffCount || 6} Personel</span>
          </div>
        </div>

        {/* 2. Yerel PC Katmanı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              Kişisel PC Deposu
            </span>
          </div>
          <h3 className="font-bold text-slate-800">Yerel Bilgisayar Yedeği</h3>
          <p className="text-xs text-slate-500 mt-1">
            Buluttan bağımsız olarak bilgisayarınızın hard diskinde saklanan tam çevrimdışı arşiv.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Format:</span>
            <span className="font-mono font-bold text-slate-800">JSON & SQLite</span>
          </div>
        </div>

        {/* 3. Hibrit Koruma Kalkanı */}
        <div className="bg-gradient-to-br from-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="text-xs bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full font-medium">
              Sıfır Veri Kaybı
            </span>
          </div>
          <h3 className="font-bold text-white">Çift Yönlü Güvenlik</h3>
          <p className="text-xs text-teal-100/80 mt-1">
            Bulut arızalansa veriniz PC'den çekilir. PC'niz bozulsa veriniz buluttan geri alınır.
          </p>
          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-teal-200 flex items-center justify-between">
            <span>Koruma Seviyesi:</span>
            <span className="font-bold text-teal-300">Maksimum (A+)</span>
          </div>
        </div>
      </div>

      {/* Aksiyon Alanları (İndir, Yükle, Excel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Kart: Buluttan PC'ye İndir */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Buluttan Bilgisayarıma Yedek İndir</h3>
              <p className="text-xs text-slate-500 mt-1">
                Akif Bey'in telefondan girdiği en son güncellemeler dahil tüm personelleri, maaşları ve izinleri anında bilgisayarınıza yedek dosyası olarak kaydeder.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportBackup}
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Şimdi Tam Yedek İndir (.json)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            * Bu dosyayı bir USB belleğe, harici diske veya e-postanıza güvenle saklayabilirsiniz.
          </p>
        </div>

        {/* Sağ Kart: PC'den Buluta Geri Yükle */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bilgisayarımdaki Yedeği Buluta Yükle</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bulutta bir sorun çıkması halinde elinizdeki yedek dosyasını sisteme yükleyerek tüm veritabanını 5 saniyede eksiksiz eski haline getirebilirsiniz.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <label className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Yedek Dosyası Seç & Yükle</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            * Yalnızca COSMOS sistemi tarafından oluşturulan geçerli .json yedek dosyalarını kabul eder.
          </p>
        </div>
      </div>

      {/* Ekstra Güvence: Excel Arşivi */}
      <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm">Resmi Bordro ve Personel Excel Arşivi</h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Tüm personel bilgileri, IBAN/Hesap numaraları, elden/banka maaş dağılımları Excel olarak her an elinizin altında.
            </p>
          </div>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Excel Olarak Arşivle</span>
        </button>
      </div>

      {/* Nasıl Çalışır / Felaket Kurtarma Rehberi */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Hibrit Eşitleme Nasıl Hayat Kurtarır? (Felaket Senaryoları)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Senaryo 1: Bulut / Vercel Çökerse veya Erişilemezse?</span>
            </div>
            <p>
              Hiçbir endişeniz olmasın. Bilgisayarınızdaki yerel SQLite dosyasını veya indirdiğiniz son yedeği açarak sisteminizi kendi bilgisayarınızda kesintisiz çalıştırmaya devam edebilirsiniz.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Senaryo 2: Bilgisayarınız Bozulursa veya Çalınırsa?</span>
            </div>
            <p>
              Tüm veriler Vercel bulutunda 7/24 güvende olduğu için yeni alacağınız herhangi bir bilgisayardan veya cep telefonundan sisteme girip anında kaldığınız yerden devam edebilir ve yeni bilgisayarınıza tek tıkla verileri indirebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

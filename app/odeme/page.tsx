"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Banknote,
  Briefcase,
} from "lucide-react";
import { calculateDuration } from "@/lib/date-utils";

interface PayrollItem {
  id: string;
  year: number;
  month: number;
  grossTotal: number;
  totalDeductions: number;
  netTotal: number;
  officialAmount: number;
  unofficialAmount: number;
  isPaid: boolean;
  paidDate: string | null;
  staff: {
    id: string;
    fullName: string;
    tcNo: string;
    iban: string | null;
    title: string | null;
    phone: string | null;
    hireDate: string | null;
    sgkStartDate: string | null;
    unofficialWorkPeriod: string | null;
    departments: { department: { name: string } }[];
  };
}

interface PaymentTotals {
  brütToplam: number;
  toplamKesinti: number;
  netOdeme: number;
  resmiToplam: number;
  eldenToplam: number;
  odenenTutar: number;
  bekleyenTutar: number;
  toplamPersonel: number;
  odenenPersonel: number;
}

export default function PersonelOdemePage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PAID, PENDING
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [totals, setTotals] = useState<PaymentTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const months = [
    { num: 1, name: "Ocak" },
    { num: 2, name: "Şubat" },
    { num: 3, name: "Mart" },
    { num: 4, name: "Nisan" },
    { num: 5, name: "Mayıs" },
    { num: 6, name: "Haziran" },
    { num: 7, name: "Temmuz" },
    { num: 8, name: "Ağustos" },
    { num: 9, name: "Eylül" },
    { num: 10, name: "Ekim" },
    { num: 11, name: "Kasım" },
    { num: 12, name: "Aralık" },
  ];

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/odeme?year=${year}&month=${month}&status=${statusFilter}`);
      const data = await res.json();
      if (data.payrolls) {
        setPayrolls(data.payrolls);
        setTotals(data.totals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [year, month, statusFilter]);

  const togglePaidStatus = async (item: PayrollItem) => {
    const nextStatus = !item.isPaid;
    setPayrolls((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, isPaid: nextStatus } : p))
    );

    try {
      const res = await fetch("/api/odeme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isPaid: nextStatus }),
      });
      if (res.ok) {
        fetchPayments();
      }
    } catch (err) {
      fetchPayments();
    }
  };

  const copyIban = (iban: string, id: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  return (
    <div className="pb-40 min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-5">
        {/* Üst Başlık & Kontroller */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personel Ödeme</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Banka havalesi, <strong>Elden Ödenecek Gayriresmî Tutar</strong> ve ödeme takibi
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Yıl ve Ay Seçici */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-2.5 py-1 text-xs font-semibold bg-transparent text-slate-800 focus:outline-none"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>

              <span className="text-slate-300">/</span>

              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-2.5 py-1 text-xs font-semibold bg-transparent text-teal-800 focus:outline-none"
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Excel İndir */}
            <a
              href={`/api/export?type=payroll&year=${year}&month=${month}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </a>
          </div>
        </div>

        {/* Resmî Banka vs Elden Ödeme Özet Kartı */}
        {totals && (
          <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                🏛️
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Resmî Bankadan Ödenecek</p>
                <p className="text-base font-bold text-teal-800">{formatCurrency(totals.resmiToplam)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                💵
              </div>
              <div>
                <p className="text-[11px] text-amber-800 font-medium">Elden (Gayriresmî) Ödenecek</p>
                <p className="text-base font-bold text-amber-900">{formatCurrency(totals.eldenToplam)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Durum Filtre Sekmeleri */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "PAID", label: "Ödenenler" },
            { id: "PENDING", label: "Bekleyenler" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Edutime Ekran Görüntüsüne Birebir Uyan Tablo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Ödemeler yükleniyor...</div>
          ) : payrolls.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Bu ay için ödeme kaydı bulunamadı.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Başlık Satırı */}
              <div className="bg-slate-50/90 px-4 py-3 grid grid-cols-12 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <div className="col-span-6 sm:col-span-7">Personel & Çalışma Durumu</div>
                <div className="col-span-6 sm:col-span-5 text-right">Ödeme Tutarları</div>
              </div>

              {/* Personel Satırları */}
              {payrolls.map((item) => {
                // Otomatik hesaplanan gayriresmi süre
                const calculatedDuration = calculateDuration(
                  item.staff.hireDate,
                  item.staff.sgkStartDate
                );

                return (
                  <div
                    key={item.id}
                    className="px-4 py-3.5 grid grid-cols-12 items-center hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Sol Kolon: Personel Adı, "Ödendi" Durumu ve Gayriresmî Süre */}
                    <div className="col-span-6 sm:col-span-7 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm tracking-tight">
                          {item.staff.fullName}
                        </span>

                        {/* Ödendi / Bekliyor Etiketi */}
                        <button
                          onClick={() => togglePaidStatus(item)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all border ${
                            item.isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                          }`}
                          title="Durumu değiştirmek için tıkla"
                        >
                          {item.isPaid ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Ödendi</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Bekliyor</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Otomatik Gayriresmi Çalışma Süresi Rozeti */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                        {calculatedDuration !== "—" && calculatedDuration !== "0 gün" && (
                          <span className="inline-flex items-center gap-1 bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
                            <Briefcase className="w-3 h-3 text-amber-700" />
                            <span>Gayriresmî: {calculatedDuration}</span>
                          </span>
                        )}

                        {/* IBAN Kopyalama */}
                        {item.staff.iban && (
                          <button
                            onClick={() => copyIban(item.staff.iban!, item.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-teal-700 font-mono"
                            title="IBAN Kopyala"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{item.staff.iban.substring(0, 14)}...</span>
                            {copiedId === item.id && (
                              <span className="text-emerald-600 font-bold ml-1">Kopyalandı!</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sağ Kolon: Net Ödeme ve Elden Ödenecek Tutar Kırılımı */}
                    <div className="col-span-6 sm:col-span-5 text-right space-y-1">
                      <span className="font-extrabold text-blue-600 sm:text-base text-sm tracking-tight block">
                        {formatCurrency(item.netTotal)}
                      </span>

                        {/* Elden ve Banka Dağılımı */}
                        {item.unofficialAmount > 0 && item.officialAmount > 0 ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-2xs">
                              <Banknote className="w-3.5 h-3.5 text-amber-700" />
                              <span>💵 Elden (Atama Öncesi): {formatCurrency(item.unofficialAmount)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">
                              <span>🏛️ Banka (Atama Sonrası): {formatCurrency(item.officialAmount)}</span>
                            </span>
                          </>
                        ) : item.unofficialAmount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-2xs">
                            <Banknote className="w-3.5 h-3.5 text-amber-700" />
                            <span>💵 Elden (Gayriresmî): {formatCurrency(item.unofficialAmount)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">
                            <span>🏛️ Banka (Resmî): {formatCurrency(item.officialAmount)}</span>
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}

              {/* Ara Toplam Satırı (Görseldeki Toplam ₺621.804,43) */}
              {totals && (
                <div className="px-4 py-3.5 bg-slate-50/80 grid grid-cols-12 items-center font-bold text-slate-800 border-t border-slate-200">
                  <div className="col-span-6 sm:col-span-7 text-sm">Genel Toplam</div>
                  <div className="col-span-6 sm:col-span-5 text-right text-sm sm:text-base text-slate-900">
                    {formatCurrency(totals.netOdeme)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alt Sabit Çubuk: Edutime Görselindeki 3 Renkli Özet Kartı */}
      {totals && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-2 sm:gap-6 text-center">
            {/* Brüt Toplam */}
            <div className="bg-emerald-50/60 sm:bg-transparent rounded-xl p-2 sm:p-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Brüt Toplam</p>
              <p className="text-xs sm:text-lg font-bold text-teal-600 mt-0.5">
                {formatCurrency(totals.brütToplam)}
              </p>
            </div>

            {/* Toplam Kesinti */}
            <div className="bg-rose-50/60 sm:bg-transparent rounded-xl p-2 sm:p-0 border-x sm:border-x-0 border-slate-200">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Toplam Kesinti</p>
              <p className="text-xs sm:text-lg font-bold text-rose-500 mt-0.5">
                - {formatCurrency(totals.toplamKesinti)}
              </p>
            </div>

            {/* Net Ödeme */}
            <div className="bg-blue-50/60 sm:bg-transparent rounded-xl p-2 sm:p-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Net Ödeme</p>
              <p className="text-xs sm:text-lg font-extrabold text-blue-600 mt-0.5">
                {formatCurrency(totals.netOdeme)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

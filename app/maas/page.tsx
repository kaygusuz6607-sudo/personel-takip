"use client";

import { useState, useEffect } from "react";
import {
  Calculator,
  Save,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  MinusCircle,
  Sliders,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { calculatePayroll } from "@/lib/payroll-calculator";

interface PayrollRow {
  staffId: string;
  fullName: string;
  tcNo: string;
  title: string | null;
  departments: string[];
  salaryType: string;
  monthlySalary: number;
  hourlyRate: number;
  dailyRate: number;
  payroll: {
    id?: string;
    year: number;
    month: number;
    workDays: number;
    reportDays: number;
    unpaidLeaveDays: number;
    lessonHours: number;
    dailyWorkDays: number;
    holidayWorkDays: number;
    holidayChoice: string;
    bonusAmount: number;
    bonusDescription: string;
    deductionAmount: number;
    deductionDescription: string;
    baseEarned: number;
    hourlyEarned: number;
    dailyEarned: number;
    holidayEarned: number;
    grossTotal: number;
    sgkEmployee: number;
    unemploymentEmployee: number;
    incomeTax: number;
    stampTax: number;
    isManualTax: boolean;
    totalDeductions: number;
    netTotal: number;
    officialAmount: number;
    unofficialAmount: number;
    isPaid: boolean;
    notes?: string;
  };
}

export default function MaasTahakkukPage() {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(8);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [activeModalStaff, setActiveModalStaff] = useState<PayrollRow | null>(null);

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

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/maas?year=${year}&month=${month}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [year, month]);

  // Hücre değiştiğinde satırın hesaplamasını anlık güncelle
  const handleInputChange = (staffId: string, field: string, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.staffId !== staffId) return row;

        const updatedPayroll = { ...row.payroll, [field]: value };

        // Anlık yeniden hesapla
        const calc = calculatePayroll({
          salaryType: row.salaryType,
          monthlySalary: row.monthlySalary,
          hourlyRate: row.hourlyRate,
          dailyRate: row.dailyRate,
          workDays: Number(updatedPayroll.workDays) || 30,
          reportDays: Number(updatedPayroll.reportDays) || 0,
          unpaidLeaveDays: Number(updatedPayroll.unpaidLeaveDays) || 0,
          lessonHours: Number(updatedPayroll.lessonHours) || 0,
          dailyWorkDays: Number(updatedPayroll.dailyWorkDays) || 0,
          holidayWorkDays: Number(updatedPayroll.holidayWorkDays) || 0,
          holidayChoice: updatedPayroll.holidayChoice || "LEAVE_1_TO_1",
          bonusAmount: Number(updatedPayroll.bonusAmount) || 0,
          bonusDescription: updatedPayroll.bonusDescription || "",
          deductionAmount: Number(updatedPayroll.deductionAmount) || 0,
          deductionDescription: updatedPayroll.deductionDescription || "",
          isManualTax: updatedPayroll.isManualTax,
          manualSgkEmployee: updatedPayroll.sgkEmployee,
          manualUnemployment: updatedPayroll.unemploymentEmployee,
          manualIncomeTax: updatedPayroll.incomeTax,
          manualStampTax: updatedPayroll.stampTax,
        });

        const newRow = {
          ...row,
          payroll: {
            ...updatedPayroll,
            ...calc,
          },
        };

        if (activeModalStaff && activeModalStaff.staffId === staffId) {
          setActiveModalStaff(newRow);
        }

        return newRow;
      })
    );
  };

  const handleSavePayroll = async (row: PayrollRow) => {
    try {
      setSavingId(row.staffId);
      const res = await fetch("/api/maas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: row.staffId,
          ...row.payroll,
          year,
          month,
        }),
      });

      if (res.ok) {
        setSavedSuccessId(row.staffId);
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        alert("Kaydedilemedi");
      }
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setSavingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Başlık ve Dönem Seçimi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maaş & Tahakkuk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ders saati, 30 gün standardı, rapor düşüşü, esnek ek ücretler ve kesintiler
          </p>
        </div>

        {/* Yıl ve Ay Seçici */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>

          <span className="text-slate-300">|</span>

          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm font-semibold bg-transparent text-teal-800 focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bilgilendirme Kartı */}
      <div className="bg-teal-50/70 border border-teal-200/60 rounded-xl p-4 flex items-start gap-3 text-teal-900 text-xs">
        <HelpCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-teal-950">
            Hesaplama Kuralları & Otomasyonlar:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-teal-800">
            <li>
              <strong>Aylık Maaşlı:</strong> SGK kuralı gereği ay 30 gün kabul edilir. Günlük yevmiye = Maaş / 30. Girilen rapor günleri bu tutardan otomatik düşülür.
            </li>
            <li>
              <strong>Ders Saatli:</strong> Girilen ders saati $\times$ Saat ücreti anında hesaplanır.
            </li>
            <li>
              <strong>Ek Ücretler (+) & Kesintiler (-):</strong> Prim, avans, yol vb. kalemler için açıklama ve tutar girildiğinde <strong>Net Ödeme otomatik hesaplanır</strong>.
            </li>
            <li>
              <strong>Resmi Tatilde Çalışma:</strong> &ldquo;1&apos;e 1 İzin&rdquo; seçilirse personele izin havuzunda +1 gün eklenir; &ldquo;Çift Yevmiye&rdquo; seçilirse bordroya eklenir.
            </li>
          </ul>
        </div>
      </div>

      {/* Tahakkuk Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Tahakkuk kayıtları yükleniyor...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aktif personel bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Personel</th>
                  <th className="py-3 px-3">Ücret Modeli</th>
                  <th className="py-3 px-2 text-center">Çalışma Günü</th>
                  <th className="py-3 px-2 text-center">Rapor Günü</th>
                  <th className="py-3 px-2 text-center">Ders Saati</th>
                  <th className="py-3 px-2 text-center">Resmi Tatil</th>
                  <th className="py-3 px-3 text-right">Brüt Hakediş</th>
                  <th className="py-3 px-3 text-center">Ek Ücret / Kesinti</th>
                  <th className="py-3 px-3 text-right font-bold text-teal-900">Net Ödeme</th>
                  <th className="py-3 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const p = row.payroll;
                  const isMonthly = row.salaryType === "MONTHLY" || row.salaryType === "HYBRID";
                  const isHourly = row.salaryType === "HOURLY" || row.salaryType === "HYBRID";
                  const isDaily = row.salaryType === "DAILY";

                  return (
                    <tr key={row.staffId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Personel Bilgisi */}
                      <td className="py-3 px-3 min-w-[160px]">
                        <p className="font-bold text-slate-800 text-sm">{row.fullName}</p>
                        <p className="text-[11px] text-slate-400">{row.title || row.departments[0]}</p>
                      </td>

                      {/* Ücret Tipi */}
                      <td className="py-3 px-3 min-w-[130px]">
                        {isMonthly && (
                          <span className="font-semibold text-teal-800 block">
                            {formatCurrency(row.monthlySalary)} / ay
                          </span>
                        )}
                        {isHourly && (
                          <span className="text-blue-700 font-semibold block">
                            {row.hourlyRate} TL / saat
                          </span>
                        )}
                        {isDaily && (
                          <span className="text-purple-700 font-semibold block">
                            {row.dailyRate} TL / gün
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {row.salaryType === "MONTHLY"
                            ? "Aylık Sabit"
                            : row.salaryType === "HOURLY"
                            ? "Ders Saatli"
                            : row.salaryType === "DAILY"
                            ? "Günlük"
                            : "Karma"}
                        </span>
                      </td>

                      {/* Çalışma Günü (SGK Standardı 30) */}
                      <td className="py-3 px-2 text-center">
                        {isMonthly ? (
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={p.workDays}
                            onChange={(e) =>
                              handleInputChange(row.staffId, "workDays", parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 px-1 bg-slate-50 border border-slate-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600"
                            title="Standart 30 gün"
                          />
                        ) : isDaily ? (
                          <input
                            type="number"
                            min="0"
                            value={p.dailyWorkDays}
                            onChange={(e) =>
                              handleInputChange(row.staffId, "dailyWorkDays", parseInt(e.target.value) || 0)
                            }
                            placeholder="Gün"
                            className="w-14 text-center py-1 px-1 bg-slate-50 border border-slate-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Rapor Günü (Maaştan Düşüş) */}
                      <td className="py-3 px-2 text-center">
                        {isMonthly ? (
                          <input
                            type="number"
                            min="0"
                            value={p.reportDays}
                            onChange={(e) =>
                              handleInputChange(row.staffId, "reportDays", parseInt(e.target.value) || 0)
                            }
                            className="w-12 text-center py-1 px-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded focus:outline-none focus:ring-1 focus:ring-rose-500"
                            title="Raporlu gün sayısı (Maaştan otomatik düşer)"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Ders Saati */}
                      <td className="py-3 px-2 text-center">
                        {isHourly ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={p.lessonHours}
                            onChange={(e) =>
                              handleInputChange(row.staffId, "lessonHours", parseFloat(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 px-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Saat"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Resmi Tatil Mesaisi */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.holidayWorkDays}
                            onChange={(e) =>
                              handleInputChange(row.staffId, "holidayWorkDays", parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-10 text-center py-1 px-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded focus:outline-none"
                            title="Resmi tatil çalışılan gün"
                          />
                          {p.holidayWorkDays > 0 && (
                            <select
                              value={p.holidayChoice}
                              onChange={(e) =>
                                handleInputChange(row.staffId, "holidayChoice", e.target.value)
                              }
                              className="text-[10px] bg-amber-100/70 border border-amber-300 text-amber-900 py-1 px-1 rounded font-medium"
                            >
                              <option value="LEAVE_1_TO_1">1&apos;e 1 İzin</option>
                              <option value="DOUBLE_PAY">Çift Yevmiye</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Brüt Hakediş (Rapor düşüşü yansımış) */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-800 min-w-[100px]">
                        {formatCurrency(p.grossTotal)}
                      </td>

                      {/* Ek Ücret (+) & Kesinti (-) Giriş / Düzenleme Butonu */}
                      <td className="py-3 px-3 text-center min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => setActiveModalStaff(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-teal-600 bg-white hover:bg-teal-50 transition-all text-slate-700 hover:text-teal-800 shadow-xs"
                          title="Açıklama ve Tutar Gir"
                        >
                          <Sliders className="w-3.5 h-3.5 text-teal-600" />
                          <div className="text-left leading-tight">
                            {p.bonusAmount > 0 && (
                              <span className="text-[11px] text-emerald-600 font-bold block">
                                +{formatCurrency(p.bonusAmount)}
                              </span>
                            )}
                            {p.totalDeductions > 0 && (
                              <span className="text-[11px] text-rose-600 font-bold block">
                                -{formatCurrency(p.totalDeductions)}
                              </span>
                            )}
                            {p.bonusAmount === 0 && p.totalDeductions === 0 && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Düzenle
                              </span>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Net Ödeme */}
                      <td className="py-3 px-3 text-right font-extrabold text-teal-800 text-sm min-w-[105px]">
                        {formatCurrency(p.netTotal)}
                      </td>

                      {/* Kaydet Butonu */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSavePayroll(row)}
                          disabled={savingId === row.staffId}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            savedSuccessId === row.staffId
                              ? "bg-emerald-600 text-white"
                              : "bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                          }`}
                        >
                          {savedSuccessId === row.staffId ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Kaydedildi</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingId === row.staffId ? "..." : "Kaydet"}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ek Ücret & Kesinti Düzenleme Modalı (Açıklama + Tutar) */}
      {activeModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ek Ücret & Kesinti Girişi</h3>
                <p className="text-xs text-slate-500">
                  {activeModalStaff.fullName} — {year}/{month}
                </p>
              </div>
              <button
                onClick={() => setActiveModalStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Brüt Hakediş Özeti */}
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 font-medium">Temel Çalışma Hakedişi:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(
                    activeModalStaff.payroll.baseEarned +
                      activeModalStaff.payroll.hourlyEarned +
                      activeModalStaff.payroll.dailyEarned +
                      activeModalStaff.payroll.holidayEarned
                  )}
                </span>
              </div>

              {/* 1. Ek Ücret (+) Bölümü (Prim, Yol, İkramiye vb.) */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Ek Ücret / Prim / Yol Yardımı (+)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-emerald-900 mb-1">
                      Ek Ücret Tutarı (TL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={activeModalStaff.payroll.bonusAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          activeModalStaff.staffId,
                          "bonusAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-emerald-900 mb-1">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={activeModalStaff.payroll.bonusDescription || ""}
                      onChange={(e) =>
                        handleInputChange(
                          activeModalStaff.staffId,
                          "bonusDescription",
                          e.target.value
                        )
                      }
                      placeholder="Örn: Başarı Primi, Yol Desteği"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Kesinti (-) Bölümü (Avans, Ceza, Eksik Gün vb.) */}
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/70 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <span>Kesinti / Avans / Ceza (-)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-rose-900 mb-1">
                      Kesinti Tutarı (TL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={activeModalStaff.payroll.deductionAmount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          activeModalStaff.staffId,
                          "deductionAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-sm font-bold text-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-rose-900 mb-1">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={activeModalStaff.payroll.deductionDescription || ""}
                      onChange={(e) =>
                        handleInputChange(
                          activeModalStaff.staffId,
                          "deductionDescription",
                          e.target.value
                        )
                      }
                      placeholder="Örn: Maaş Avansı, Ceza Kesintisi"
                      className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Net Ödeme Özeti */}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-950 text-sm block">Hesaplanan Net Ödeme:</span>
                  <span className="text-[10px] text-teal-700">Tutar ve açıklama değiştikçe anında güncellenir</span>
                </div>
                <span className="text-lg font-extrabold text-teal-800">
                  {formatCurrency(activeModalStaff.payroll.netTotal)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModalStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSavePayroll(activeModalStaff);
                  setActiveModalStaff(null);
                }}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Kaydet ve Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Plus,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { calculatePayroll } from "@/lib/payroll-calculator";

export interface AdjustmentItem {
  id: string;
  amount: number;
  description: string;
}

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
    bonusItems?: string | null;
    deductionAmount: number;
    deductionDescription: string;
    deductionItems?: string | null;
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

function parseAdjustmentItems(
  raw: string | null | undefined,
  fallbackAmount: number,
  fallbackDesc: string | null | undefined
): AdjustmentItem[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `item_${idx}_${Date.now()}`,
          amount: Number(item.amount) || 0,
          description: item.description || "",
        }));
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }
  if (fallbackAmount > 0 || (fallbackDesc && fallbackDesc.trim())) {
    return [
      {
        id: "default_1",
        amount: fallbackAmount,
        description: fallbackDesc || "",
      },
    ];
  }
  return [
    {
      id: "default_1",
      amount: 0,
      description: "",
    },
  ];
}

export default function MaasTahakkukPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [activeModalStaff, setActiveModalStaff] = useState<PayrollRow | null>(null);

  // Çoklu Ek Ücret ve Kesinti Kalemleri
  const [bonusList, setBonusList] = useState<AdjustmentItem[]>([]);
  const [deductionList, setDeductionList] = useState<AdjustmentItem[]>([]);

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

  // Çoklu kalem değişikliklerini hem satıra hem modal state'ine anında uygula
  const handleMultiFieldChange = (staffId: string, changes: Record<string, any>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.staffId !== staffId) return row;

        const updatedPayroll = { ...row.payroll, ...changes };

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

  // Modalı Aç ve Kalemleri Yükle
  const openAdjustmentModal = (row: PayrollRow) => {
    const bonuses = parseAdjustmentItems(
      row.payroll.bonusItems,
      row.payroll.bonusAmount || 0,
      row.payroll.bonusDescription
    );
    const deductions = parseAdjustmentItems(
      row.payroll.deductionItems,
      row.payroll.deductionAmount || 0,
      row.payroll.deductionDescription
    );
    setBonusList(bonuses);
    setDeductionList(deductions);
    setActiveModalStaff(row);
  };

  // Ek Ücret Kalemi Ekle
  const addBonusItem = (presetDesc?: string) => {
    const newItem: AdjustmentItem = {
      id: `bonus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: 0,
      description: presetDesc || "",
    };
    const updated = [...bonusList, newItem];
    setBonusList(updated);
    updateBonusState(updated);
  };

  // Ek Ücret Kalemi Güncelle
  const updateBonusItem = (id: string, field: "amount" | "description", val: any) => {
    const updated = bonusList.map((item) =>
      item.id === id ? { ...item, [field]: field === "amount" ? (parseFloat(val) || 0) : val } : item
    );
    setBonusList(updated);
    updateBonusState(updated);
  };

  // Ek Ücret Kalemi Sil
  const removeBonusItem = (id: string) => {
    const updated = bonusList.filter((item) => item.id !== id);
    const finalList = updated.length > 0 ? updated : [{ id: `bonus_${Date.now()}`, amount: 0, description: "" }];
    setBonusList(finalList);
    updateBonusState(finalList);
  };

  // Ek Ücret Hesaplamasını Satıra Yansıt
  const updateBonusState = (items: AdjustmentItem[]) => {
    if (!activeModalStaff) return;
    const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const desc = items
      .filter((i) => i.description.trim())
      .map((i) => (i.amount > 0 ? `${i.description} (₺${i.amount})` : i.description))
      .join(" + ");

    handleMultiFieldChange(activeModalStaff.staffId, {
      bonusAmount: total,
      bonusDescription: desc,
      bonusItems: JSON.stringify(items),
    });
  };

  // Kesinti Kalemi Ekle
  const addDeductionItem = (presetDesc?: string) => {
    const newItem: AdjustmentItem = {
      id: `ded_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: 0,
      description: presetDesc || "",
    };
    const updated = [...deductionList, newItem];
    setDeductionList(updated);
    updateDeductionState(updated);
  };

  // Kesinti Kalemi Güncelle
  const updateDeductionItem = (id: string, field: "amount" | "description", val: any) => {
    const updated = deductionList.map((item) =>
      item.id === id ? { ...item, [field]: field === "amount" ? (parseFloat(val) || 0) : val } : item
    );
    setDeductionList(updated);
    updateDeductionState(updated);
  };

  // Kesinti Kalemi Sil
  const removeDeductionItem = (id: string) => {
    const updated = deductionList.filter((item) => item.id !== id);
    const finalList = updated.length > 0 ? updated : [{ id: `ded_${Date.now()}`, amount: 0, description: "" }];
    setDeductionList(finalList);
    updateDeductionState(finalList);
  };

  // Kesinti Hesaplamasını Satıra Yansıt
  const updateDeductionState = (items: AdjustmentItem[]) => {
    if (!activeModalStaff) return;
    const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const desc = items
      .filter((i) => i.description.trim())
      .map((i) => (i.amount > 0 ? `${i.description} (₺${i.amount})` : i.description))
      .join(" + ");

    handleMultiFieldChange(activeModalStaff.staffId, {
      deductionAmount: total,
      deductionDescription: desc,
      deductionItems: JSON.stringify(items),
    });
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
            Ders saati, 30 gün standardı, rapor düşüşü, sınırsız esnek ek ücretler ve kesintiler
          </p>
        </div>

        {/* Yıl ve Ay Seçici */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bordro Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Tahakkuk verileri hesaplanıyor...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Personel bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Personel</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3 text-center">Çalışma Gün / Saat</th>
                  <th className="py-3 px-3 text-center">Rapor / Ücretsiz</th>
                  <th className="py-3 px-3 text-right">Temel Hakediş</th>
                  <th className="py-3 px-3 text-center">Ek Ücret & Kesinti</th>
                  <th className="py-3 px-3 text-right">Net Ödenecek</th>
                  <th className="py-3 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const p = row.payroll;
                  return (
                    <tr key={row.staffId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Personel */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block text-sm">{row.fullName}</span>
                        <span className="text-[11px] text-slate-400 block">{row.title || row.departments[0] || "Personel"}</span>
                      </td>

                      {/* Ücret Modeli */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 block">
                          {row.salaryType === "MONTHLY"
                            ? "Aylık Maaş"
                            : row.salaryType === "HOURLY"
                            ? "Ders Saatli"
                            : row.salaryType === "DAILY"
                            ? "Günlük"
                            : "Karma"}
                        </span>
                        <span className="text-[11px] text-teal-700 font-medium">
                          {row.salaryType === "MONTHLY"
                            ? formatCurrency(row.monthlySalary)
                            : row.salaryType === "HOURLY"
                            ? `${row.hourlyRate} TL/saat`
                            : row.salaryType === "DAILY"
                            ? `${row.dailyRate} TL/gün`
                            : `${formatCurrency(row.monthlySalary)} + ${row.hourlyRate} TL/saat`}
                        </span>
                      </td>

                      {/* Çalışma / Saat Girişi */}
                      <td className="py-3 px-3 text-center">
                        {row.salaryType === "HOURLY" ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.lessonHours}
                              onChange={(e) =>
                                handleInputChange(
                                  row.staffId,
                                  "lessonHours",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2 py-1 bg-teal-50/50 border border-teal-200 rounded text-center font-bold text-teal-900"
                            />
                            <span className="text-slate-500">saat</span>
                          </div>
                        ) : row.salaryType === "DAILY" ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="31"
                              value={p.dailyWorkDays}
                              onChange={(e) =>
                                handleInputChange(
                                  row.staffId,
                                  "dailyWorkDays",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-14 px-2 py-1 bg-teal-50/50 border border-teal-200 rounded text-center font-bold text-teal-900"
                            />
                            <span className="text-slate-500">gün</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="31"
                              value={p.workDays}
                              onChange={(e) =>
                                handleInputChange(
                                  row.staffId,
                                  "workDays",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-800"
                            />
                            <span className="text-slate-500">gün</span>
                          </div>
                        )}
                      </td>

                      {/* Rapor / Ücretsiz İzin */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.reportDays > 0 ? "bg-amber-100 text-amber-900" : "text-slate-400"
                            }`}
                            title="Rapor Gün Sayısı"
                          >
                            {p.reportDays}g rapor
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.unpaidLeaveDays > 0 ? "bg-rose-100 text-rose-900" : "text-slate-400"
                            }`}
                            title="Ücretsiz İzin Sayısı"
                          >
                            {p.unpaidLeaveDays}g ü.izin
                          </span>
                        </div>
                      </td>

                      {/* Temel Hakediş */}
                      <td className="py-3 px-3 text-right font-bold text-slate-800 min-w-[110px]">
                        {formatCurrency(p.grossTotal)}
                      </td>

                      {/* Ek Ücret (+) & Kesinti (-) Giriş / Düzenleme Butonu */}
                      <td className="py-3 px-3 text-center min-w-[150px]">
                        <button
                          type="button"
                          onClick={() => openAdjustmentModal(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-600 bg-white hover:bg-teal-50 transition-all text-slate-700 hover:text-teal-800 shadow-2xs group"
                          title="Çoklu Ek Ücret ve Kesinti Girişi Yap"
                        >
                          <Sliders className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
                          <div className="text-left leading-tight">
                            {p.bonusAmount > 0 && (
                              <span className="text-[11px] text-emerald-600 font-extrabold block">
                                +{formatCurrency(p.bonusAmount)}
                              </span>
                            )}
                            {p.totalDeductions > 0 && (
                              <span className="text-[11px] text-rose-600 font-extrabold block">
                                -{formatCurrency(p.totalDeductions)}
                              </span>
                            )}
                            {p.bonusAmount === 0 && p.totalDeductions === 0 && (
                              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Ekle / Düzenle
                              </span>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Net Ödeme */}
                      <td className="py-3 px-3 text-right min-w-[130px]">
                        <span className="font-extrabold text-teal-800 text-sm block">
                          {formatCurrency(p.netTotal)}
                        </span>
                        {p.unofficialAmount > 0 && (
                          <span
                            className="text-[10px] text-amber-900 bg-amber-100/80 border border-amber-300 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5"
                            title="Elden Ödenecek Gayriresmî Tutar"
                          >
                            💵 Elden: {formatCurrency(p.unofficialAmount)}
                          </span>
                        )}
                      </td>

                      {/* Kaydet İşlemi */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSavePayroll(row)}
                          disabled={savingId === row.staffId}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            savedSuccessId === row.staffId
                              ? "bg-emerald-600 text-white"
                              : "bg-teal-700 hover:bg-teal-800 text-white"
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

      {/* Sınırsız Çoklu Ek Ücret & Kesinti Düzenleme Modalı */}
      {activeModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Başlığı */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Ek Ücret & Kesinti Girişi</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    Çoklu Kalem
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalStaff.fullName} — {year}/{month} Dönemi
                </p>
              </div>
              <button
                onClick={() => setActiveModalStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Brüt Hakediş Özeti */}
              <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between border border-slate-100">
                <span className="text-slate-600 font-semibold">Temel Çalışma Hakedişi:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatCurrency(
                    activeModalStaff.payroll.baseEarned +
                      activeModalStaff.payroll.hourlyEarned +
                      activeModalStaff.payroll.dailyEarned +
                      activeModalStaff.payroll.holidayEarned
                  )}
                </span>
              </div>

              {/* 1. Ek Ücret (+) Bölümü (Sınırsız Çoklu Kalem) */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                    <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ek Ücret / Prim / Yol Yardımı (+)</span>
                    {bonusList.reduce((s, i) => s + (Number(i.amount) || 0), 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                        +{formatCurrency(bonusList.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addBonusItem()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Yeni Ek Ücret Ekle</span>
                  </button>
                </div>

                {/* Hızlı Öneri Etiketleri */}
                <div className="flex flex-wrap gap-1 items-center pt-0.5">
                  <span className="text-[10px] text-emerald-800 font-semibold">Hızlı Şablon:</span>
                  {[
                    "Başarı Primi",
                    "Yol Yardımı",
                    "Yemek Desteği",
                    "Nöbet / Etüt Ücreti",
                    "Bayram İkramiyesi",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addBonusItem(preset)}
                      className="px-2 py-0.5 text-[10px] bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md font-medium transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Ek Ücret Kalemleri Listesi */}
                <div className="space-y-2">
                  {bonusList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200/70 shadow-2xs"
                    >
                      <div className="w-28 sm:w-36 shrink-0">
                        <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">
                          Tutar (TL)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount || ""}
                          onChange={(e) => updateBonusItem(item.id, "amount", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 rounded-lg text-xs font-extrabold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">
                          Açıklama / Sebep
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateBonusItem(item.id, "description", e.target.value)}
                          placeholder="Örn: Başarı Primi, Yol Desteği"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      {bonusList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBonusItem(item.id)}
                          title="Bu ek ücreti sil"
                          className="self-end p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Kesinti (-) Bölümü (Sınırsız Çoklu Kalem) */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                    <MinusCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Kesinti / Avans / Ceza (-)</span>
                    {deductionList.reduce((s, i) => s + (Number(i.amount) || 0), 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800">
                        -{formatCurrency(deductionList.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addDeductionItem()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Yeni Kesinti Ekle</span>
                  </button>
                </div>

                {/* Hızlı Öneri Etiketleri */}
                <div className="flex flex-wrap gap-1 items-center pt-0.5">
                  <span className="text-[10px] text-rose-800 font-semibold">Hızlı Şablon:</span>
                  {[
                    "Rezidans Ücreti",
                    "Nakit Avans",
                    "Kira / Lojman",
                    "Eksik Gün Kesintisi",
                    "Ceza Kesintisi",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addDeductionItem(preset)}
                      className="px-2 py-0.5 text-[10px] bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-md font-medium transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Kesinti Kalemleri Listesi */}
                <div className="space-y-2">
                  {deductionList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-rose-200/70 shadow-2xs"
                    >
                      <div className="w-28 sm:w-36 shrink-0">
                        <label className="block text-[10px] font-bold text-rose-900 mb-0.5">
                          Kesinti Tutarı (TL)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount || ""}
                          onChange={(e) => updateDeductionItem(item.id, "amount", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 bg-rose-50/40 border border-rose-300 rounded-lg text-xs font-extrabold text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-rose-900 mb-0.5">
                          Açıklama / Sebep
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateDeductionItem(item.id, "description", e.target.value)}
                          placeholder="Örn: 9. Ay Rezidans Ücreti, Maaş Avansı"
                          className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      {deductionList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeductionItem(item.id)}
                          title="Bu kesintiyi sil"
                          className="self-end p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Net Ödeme Özeti */}
              <div className="p-3.5 bg-teal-50/90 rounded-2xl border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-950 text-sm block">Hesaplanan Net Ödeme:</span>
                  <span className="text-[10px] text-teal-700">Tüm ek ücret ve kesintiler anında güncellenir</span>
                </div>
                <span className="text-xl font-black text-teal-800">
                  {formatCurrency(activeModalStaff.payroll.netTotal)}
                </span>
              </div>
            </div>

            {/* Modal Aksiyon Butonları */}
            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModalStaff(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSavePayroll(activeModalStaff);
                  setActiveModalStaff(null);
                }}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
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

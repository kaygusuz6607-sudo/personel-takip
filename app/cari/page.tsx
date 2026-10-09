"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  PlusCircle,
  MinusCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Copy,
  Check,
  Sparkles,
  ArrowUpDown,
  Filter,
  FileSpreadsheet,
  Download,
  X,
  ReceiptText,
  UserMinus,
  Trash2,
  Loader2,
} from "lucide-react";
import { calculateDuration } from "@/lib/date-utils";

export interface PaymentItem {
  id: string;
  amount: number;
  type: "CASH" | "BANK";
  date: string;
  notes?: string | null;
}

interface StaffSummary {
  id: string;
  fullName: string;
  tcNo: string;
  title: string;
  status: string;
  hireDate: string | null;
  terminationDate?: string | null;
  totalNet: number;
  totalPaid: number;
  totalPending: number;
  totalBank: number;
  totalCash: number;
  totalBankPaid?: number;
  totalCashPaid?: number;
  payrollCount: number;
}

interface SelectedStaff {
  id: string;
  fullName: string;
  tcNo: string;
  phone: string | null;
  email: string | null;
  iban: string | null;
  accountNumber: string | null;
  title: string | null;
  status: string;
  hireDate: string | null;
  terminationDate?: string | null;
  mebAssignmentDate: string | null;
  mebAssignmentEndDate?: string | null;
  isMebPermanent?: boolean;
  sgkStartDate: string | null;
  unofficialWorkPeriod: string | null;
  departments: string[];
  salaryConfig: {
    salaryType: string;
    monthlySalary: number;
    hourlyRate: number;
    dailyRate: number;
    officialSalaryPart: number;
  } | null;
}

interface PayrollRecord {
  id: string;
  year: number;
  month: number;
  workDays: number;
  reportDays: number;
  unpaidLeaveDays: number;
  lessonHours: number;
  dailyWorkDays: number;
  holidayWorkDays: number;
  holidayChoice: string;
  baseEarned: number;
  hourlyEarned: number;
  dailyEarned: number;
  holidayEarned: number;
  bonusAmount: number;
  bonusDescription: string | null;
  bonusItems?: string | null;
  deductionAmount: number;
  deductionDescription: string | null;
  deductionItems?: string | null;
  grossTotal: number;
  totalDeductions: number;
  netTotal: number;
  officialAmount: number;
  unofficialAmount: number;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
  // Parça ödeme ve ayrıştırılmış durumlar
  paidBankAmount?: number;
  paidCashAmount?: number;
  totalPaidAmount?: number;
  remainingBankAmount?: number;
  remainingCashAmount?: number;
  remainingTotalAmount?: number;
  isBankPaid?: boolean;
  isCashPaid?: boolean;
  isFullyPaid?: boolean;
  isPartiallyPaid?: boolean;
  paymentItems?: PaymentItem[];
}

interface AllTimeTotals {
  totalGross: number;
  totalNet: number;
  totalBank: number;
  totalCash: number;
  totalBonus: number;
  totalDeduction: number;
  totalPaid: number;
  totalPending: number;
  totalBankPaid?: number;
  totalCashPaid?: number;
  payrollCount: number;
  paidCount: number;
  partialCount?: number;
  pendingCount: number;
}

const MONTH_NAMES = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function CariContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStaffId = searchParams.get("staffId") || "";
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "sahis") {
      router.replace("/sahis-carileri");
    }
  }, [tabParam, router]);

  const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<SelectedStaff | null>(null);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [allTimeTotals, setAllTimeTotals] = useState<AllTimeTotals | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtreleme State'leri
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL"); // ALL, PAID, PENDING
  const [copiedIban, setCopiedIban] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Ödeme & Parça Ödeme Modalı State'leri
  const [paymentModalPayroll, setPaymentModalPayroll] = useState<PayrollRecord | null>(null);
  const [paymentType, setPaymentType] = useState<"CASH" | "BANK">("CASH");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const fetchCariData = async (targetId?: string) => {
    try {
      setLoading(true);
      const url = targetId ? `/api/cari?staffId=${targetId}` : "/api/cari";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data.staffSummaries) setStaffSummaries(data.staffSummaries);
      if (data.selectedStaff) setSelectedStaff(data.selectedStaff);
      if (data.payrolls) {
        setPayrolls(data.payrolls);
        // Açık olan ödeme modalını güncel verilerle senkronize et
        setPaymentModalPayroll((cur) => {
          if (!cur) return null;
          return data.payrolls.find((p: PayrollRecord) => p.id === cur.id) || null;
        });
      }
      if (data.allTimeTotals) setAllTimeTotals(data.allTimeTotals);
    } catch (err) {
      console.error("Cari verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCariData(initialStaffId);
  }, [initialStaffId]);

  const handleSelectStaff = (id: string) => {
    router.push(`/cari?staffId=${id}`);
    fetchCariData(id);
  };

  // Parça Ödeme Ekleme
  const handleAddPayment = async () => {
    if (!paymentModalPayroll) return;
    const num = parseFloat(paymentAmount.replace(",", "."));
    if (isNaN(num) || num <= 0) {
      alert("Lütfen geçerli bir ödeme tutarı giriniz.");
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: paymentModalPayroll.id,
          action: "ADD_PAYMENT",
          amount: num,
          type: paymentType,
          date: paymentDate,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ödeme kaydedilemedi.");
        return;
      }

      setPaymentAmount("");
      setPaymentNotes("");
      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
      alert("İşlem sırasında hata oluştu.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Parça Ödeme Silme
  const handleDeletePaymentItem = async (paymentItemId: string) => {
    if (!paymentModalPayroll) return;
    if (!confirm("Bu ödeme kaydını silmek istediğinize emin misiniz? Bakiye geri açılacaktır.")) return;

    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: paymentModalPayroll.id,
          action: "DELETE_PAYMENT",
          paymentItemId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ödeme silinemedi.");
        return;
      }

      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
      alert("Silme işlemi başarısız.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Tek tıkla banka payını kapat
  const handleQuickPayBank = async (payroll: PayrollRecord) => {
    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: payroll.id,
          action: "PAY_BANK_FULL",
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
        return;
      }
      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Tek tıkla nakit payını kapat
  const handleQuickPayCash = async (payroll: PayrollRecord) => {
    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: payroll.id,
          action: "PAY_CASH_FULL",
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
        return;
      }
      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Tek tıkla tümünü kapat
  const handleQuickPayFull = async (payroll: PayrollRecord) => {
    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: payroll.id,
          action: "PAY_FULL",
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
        return;
      }
      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Tüm ödemeleri sıfırla
  const handleResetPayments = async (payroll: PayrollRecord) => {
    if (!confirm("Bu döneme ait tüm ödeme kayıtlarını sıfırlamak istediğinize emin misiniz?")) return;
    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payrollId: payroll.id,
          action: "RESET_PAYMENTS",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "İşlem başarısız.");
        return;
      }
      await fetchCariData(selectedStaff?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrelenmiş Bordro / İşlem Listesi
  const filteredPayrolls = payrolls.filter((p) => {
    if (selectedYear !== "ALL" && String(p.year) !== selectedYear) return false;
    const isFull = p.isFullyPaid || (p.isPaid && !p.isPartiallyPaid);
    if (selectedStatus === "PAID" && !isFull) return false;
    if (selectedStatus === "PENDING" && isFull) return false;
    return true;
  });

  // İşten ayrılan / pasif personel kontrolü
  const isStaffTerminated = (s: StaffSummary) => {
    return s.status === "PASSIVE" || s.status === "TERMINATED" || Boolean(s.terminationDate);
  };

  // Filtrelenmiş Personel Listesi (Arama)
  const filteredStaffSummaries = staffSummaries.filter(
    (s) =>
      s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.tcNo.includes(staffSearch) ||
      s.title.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const activeStaffSummaries = filteredStaffSummaries.filter((s) => !isStaffTerminated(s));
  const terminatedStaffSummaries = filteredStaffSummaries.filter((s) => isStaffTerminated(s));

  // Mevcut yıllar listesi
  const availableYears = Array.from(new Set(payrolls.map((p) => p.year))).sort((a, b) => b - a);

  // Güvenli çalışma süresi hesabı (İşten ayrılanlar için çıkış tarihine kadar)
  const totalWorkPeriod = selectedStaff?.hireDate
    ? calculateDuration(
        selectedStaff.hireDate,
        selectedStaff.terminationDate || new Date().toISOString()
      )
    : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Üst Bilgi & Hızlı Bağlantılar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl text-xs font-black bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            <span>Personel Cari & Ekstreler ({staffSummaries.length} Personel)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sahis-carileri"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Şahıs & 3. Kişi Carileri →</span>
          </Link>
          <Link
            href="/giderler"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
            <span>Okul Giderleri & Taksit Takibi →</span>
          </Link>
        </div>
      </div>

      {/* 1. Üst Başlık & Çıktı Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personel Cari & Hesap Takibi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              Personel Ekstresi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Personelin işe başladığı günden bugüne banka, elden ve kesinti hareketlerinin ayrıntılı dökümü.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel İndir (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF Ekstre Al</span>
          </button>
        </div>
      </div>

      {/* 2. Ana Düzen: Sol Personel Seçici & Sağ Cari Ekstre */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SOL: Personel Listesi & Seçici (Yazdırmada gizlenir) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 h-fit print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-700" />
              <span>Personel Seçimi</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {activeStaffSummaries.length} Aktif{terminatedStaffSummaries.length > 0 ? ` • ${terminatedStaffSummaries.length} Ayrılan` : ""}
            </span>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Personel veya TC ara..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Personel Listesi */}
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {activeStaffSummaries.length === 0 && terminatedStaffSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Personel bulunamadı.</p>
            ) : (
              <>
                {/* 1. AKTİF PERSONELLER */}
                {activeStaffSummaries.map((s) => {
                  const isSelected = selectedStaff?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStaff(s.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-300 text-teal-950 shadow-2xs font-semibold"
                          : "border-transparent hover:bg-slate-50 text-slate-700 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate max-w-[170px]">{s.fullName}</span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-teal-700" : "text-slate-300"}`} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="truncate max-w-[120px]">{s.title}</span>
                        <span className={`font-mono font-bold ${s.totalPending > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {s.totalPending > 0 ? `Kalan: ${formatCurrency(s.totalPending)}` : "Ödendi ✓"}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* 2. İŞTEN AYRILAN / PASİF PERSONELLER */}
                {terminatedStaffSummaries.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md block mb-1.5">
                      İşten Ayrılan Personeller ({terminatedStaffSummaries.length})
                    </span>
                    {terminatedStaffSummaries.map((s) => {
                      const isSelected = selectedStaff?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStaff(s.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all border mb-1 ${
                            isSelected
                              ? "bg-rose-50/80 border-rose-300 text-rose-950 shadow-2xs font-semibold"
                              : "border-rose-100/60 bg-rose-50/20 hover:bg-rose-50/50 text-slate-700 hover:border-rose-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs truncate max-w-[170px] text-slate-900">{s.fullName}</span>
                            <UserMinus className="w-3 h-3 text-rose-500 shrink-0" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="text-rose-600 font-semibold truncate max-w-[120px]">
                              Ayrıldı {s.terminationDate ? `(${new Date(s.terminationDate).toLocaleDateString("tr-TR")})` : ""}
                            </span>
                            <span className={`font-mono font-bold ${s.totalPending > 0 ? "text-rose-700" : "text-emerald-600"}`}>
                              {s.totalPending > 0 ? formatCurrency(s.totalPending) : "0 ₺"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* SAĞ: Seçilen Personelin Ayrıntılı Cari Ekstresi */}
        <div className="lg:col-span-3 space-y-5">
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Veriler yükleniyor...
            </div>
          ) : !selectedStaff ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Lütfen sol menüden bir personel seçiniz.
            </div>
          ) : (
            <>
              {/* Personel Künye & Durum Kartı */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {selectedStaff.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                          {selectedStaff.fullName}
                        </h2>
                        {(selectedStaff.status === "PASSIVE" ||
                          selectedStaff.status === "TERMINATED" ||
                          Boolean(selectedStaff.terminationDate)) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                            <UserMinus className="w-3 h-3 text-rose-600" />
                            <span>İşten Ayrıldı</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                          {selectedStaff.title || "Personel"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          TC: {selectedStaff.tcNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedStaff.departments.join(", ") || "Departman Atanmamış"}
                        {selectedStaff.phone && ` • Tel: ${selectedStaff.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Tarihler & Süre */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">İşe Giriş:</span>
                      <span className="font-bold text-slate-800">
                        {selectedStaff.hireDate ? new Date(selectedStaff.hireDate).toLocaleDateString("tr-TR") : "—"}
                      </span>
                    </div>

                    {selectedStaff.terminationDate && (
                      <>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-[10px] text-rose-500 block font-medium">Ayrılış Tarihi:</span>
                          <span className="font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {new Date(selectedStaff.terminationDate).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Toplam Çalışma:</span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                        {totalWorkPeriod}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Kayıtlı Güncel Maaş:</span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                        {selectedStaff.salaryConfig?.salaryType === "HOURLY"
                          ? `${selectedStaff.salaryConfig.hourlyRate} TL/saat`
                          : selectedStaff.salaryConfig?.salaryType === "DAILY"
                          ? `${selectedStaff.salaryConfig.dailyRate} TL/gün`
                          : selectedStaff.salaryConfig?.salaryType === "HYBRID"
                          ? `${formatCurrency(selectedStaff.salaryConfig.monthlySalary)} + ${selectedStaff.salaryConfig.hourlyRate} TL/saat`
                          : formatCurrency(selectedStaff.salaryConfig?.monthlySalary || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banka & IBAN Detayı */}
                {selectedStaff.iban && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-700" />
                      <span className="font-mono font-bold text-slate-900">{selectedStaff.iban}</span>
                      {selectedStaff.accountNumber && (
                        <span className="text-slate-400">(Hesap: {selectedStaff.accountNumber})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyIban(selectedStaff.iban!)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIban ? "Kopyalandı" : "IBAN Kopyala"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Tüm Zamanlar Finansal Özet Sayaçları (Kariyer Özeti - 6 Kart) */}
              {allTimeTotals && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Toplam Net Hakediş */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Toplam Net Hakediş
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      {formatCurrency(allTimeTotals.totalNet)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {allTimeTotals.payrollCount} Dönem Boyunca
                    </span>
                  </div>

                  {/* Bankadan Yatan */}
                  <div className="bg-white p-3.5 rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/50 to-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                        Bankadan Yatan
                      </span>
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <span className="text-base font-black text-teal-800 mt-1 block">
                      {formatCurrency(allTimeTotals.totalBankPaid || 0)}
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium truncate block" title={`Toplam Hakediş: ${formatCurrency(allTimeTotals.totalBank)}`}>
                      Hakediş: {formatCurrency(allTimeTotals.totalBank)}
                    </span>
                  </div>

                  {/* Elden / Nakit Ödenen */}
                  <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 to-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                        Elden / Nakit
                      </span>
                      <Banknote className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-base font-black text-amber-800 mt-1 block">
                      {formatCurrency(allTimeTotals.totalCashPaid || 0)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium truncate block" title={`Toplam Hakediş: ${formatCurrency(allTimeTotals.totalCash)}`}>
                      Hakediş: {formatCurrency(allTimeTotals.totalCash)}
                    </span>
                  </div>

                  {/* Toplam Ek Ücret / Prim */}
                  <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Toplam Prim (+)
                      </span>
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-base font-black text-emerald-700 mt-1 block">
                      +{formatCurrency(allTimeTotals.totalBonus)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Prim, Yol, İkramiye</span>
                  </div>

                  {/* Toplam Kesinti & Avans */}
                  <div className="bg-white p-3.5 rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 to-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                        Toplam Kesinti (-)
                      </span>
                      <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-base font-black text-rose-700 mt-1 block">
                      -{formatCurrency(allTimeTotals.totalDeduction)}
                    </span>
                    <span className="text-[10px] text-rose-700 font-medium">Rezidans, Avans, Ceza</span>
                  </div>

                  {/* Bekleyen / Kalan Bakiye */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Kalan Bakiye
                    </span>
                    <span
                      className={`text-base font-black mt-1 block ${
                        allTimeTotals.totalPending > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(allTimeTotals.totalPending)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate block">
                      {allTimeTotals.totalPending > 0 ? `Ödenen: ${formatCurrency(allTimeTotals.totalPaid)}` : "Tamamı Ödendi ✓"}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Filtreleme Çubuğu */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-teal-700" />
                    <span>Dönem Filtreleri:</span>
                  </span>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="ALL">Tüm Yıllar ({payrolls.length} Ay)</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={String(yr)}>
                        {yr} Yılı
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="ALL">Tüm Ödeme Durumları</option>
                    <option value="PAID">Sadece Tamamen Ödenenler</option>
                    <option value="PENDING">Bekleyenler & Kısmi Ödenenler</option>
                  </select>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Gösterilen: <span className="text-slate-900 font-bold">{filteredPayrolls.length}</span> / {payrolls.length} Dönem
                </div>
              </div>

              {/* 5. Ayrıntılı Kronolojik Cari Ekstre Tablosu */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
                {/* Yazdırma Başlığı */}
                <div className="hidden print:block p-4 border-b border-slate-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">COSMOS — PERSONEL CARİ HESAP EKSTRESİ</h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Personel: <strong>{selectedStaff.fullName}</strong> (TC: {selectedStaff.tcNo}) — İşe Giriş:{" "}
                        {selectedStaff.hireDate ? new Date(selectedStaff.hireDate).toLocaleDateString("tr-TR") : "—"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      Rapor Tarihi: {new Date().toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Dönem</th>
                        <th className="py-3 px-3 text-right">Temel Hakediş</th>
                        <th className="py-3 px-3 text-left">Ek Ücret (+)</th>
                        <th className="py-3 px-3 text-left">Kesinti / Avans (-)</th>
                        <th className="py-3 px-3 text-right">Net Ödenecek</th>
                        <th className="py-3 px-3 text-right">Banka (Resmî)</th>
                        <th className="py-3 px-3 text-right">Elden (Nakit)</th>
                        <th className="py-3 px-3 text-center">Durum</th>
                        <th className="py-3 px-3 text-center print:hidden">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayrolls.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            Filtrelere uygun cari hareket bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredPayrolls.map((p) => {
                          const isFull = p.isFullyPaid || (p.isPaid && !p.isPartiallyPaid);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Dönem */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {p.year} / {MONTH_NAMES[p.month] || p.month}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.workDays} gün {p.lessonHours > 0 && `• ${p.lessonHours} saat`}
                                </span>
                              </td>

                              {/* Temel Hakediş */}
                              <td className="py-3 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                                {formatCurrency(p.grossTotal)}
                              </td>

                              {/* Ek Ücret (+) */}
                              <td className="py-3 px-3 text-left max-w-[160px]">
                                {p.bonusAmount > 0 ? (
                                  <div>
                                    <span className="text-emerald-700 font-bold text-xs block">
                                      +{formatCurrency(p.bonusAmount)}
                                    </span>
                                    <span
                                      className="text-[10px] text-slate-500 block truncate"
                                      title={p.bonusDescription || "Ek Ücret"}
                                    >
                                      {p.bonusDescription || "Ek Ücret"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              {/* Kesinti / Avans (-) */}
                              <td className="py-3 px-3 text-left max-w-[160px]">
                                {p.deductionAmount > 0 ? (
                                  <div>
                                    <span className="text-rose-700 font-bold text-xs block">
                                      -{formatCurrency(p.deductionAmount)}
                                    </span>
                                    <span
                                      className="text-[10px] text-slate-500 block truncate"
                                      title={p.deductionDescription || "Kesinti"}
                                    >
                                      {p.deductionDescription || "Kesinti / Avans"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              {/* Net Ödenecek */}
                              <td className="py-3 px-3 text-right font-black text-slate-900 text-xs whitespace-nowrap">
                                {formatCurrency(p.netTotal)}
                              </td>

                              {/* Banka (Resmî) */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {p.officialAmount > 0 ? (
                                  <div>
                                    <span className="text-teal-800 font-extrabold text-xs block">
                                      {formatCurrency(p.officialAmount)}
                                    </span>
                                    {p.isBankPaid ? (
                                      <span className="inline-block mt-0.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                        ✓ Banka Ödendi
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-500 font-medium block">
                                        Kalan: {formatCurrency(p.remainingBankAmount ?? p.officialAmount)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">₺0,00</span>
                                )}
                              </td>

                              {/* Elden (Nakit) */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {p.unofficialAmount > 0 ? (
                                  <div>
                                    <span className="text-amber-800 font-extrabold text-xs block bg-amber-50 px-1.5 py-0.5 rounded">
                                      💵 {formatCurrency(p.unofficialAmount)}
                                    </span>
                                    {p.isCashPaid ? (
                                      <span className="inline-block mt-0.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                        ✓ Nakit Ödendi
                                      </span>
                                    ) : (p.paidCashAmount || 0) > 0 ? (
                                      <span className="inline-block mt-0.5 text-[9.5px] font-bold text-amber-900 bg-amber-100/70 border border-amber-300 px-1.5 py-0.2 rounded text-left leading-tight">
                                        Ödenen: {formatCurrency(p.paidCashAmount || 0)} <br />
                                        Kalan: {formatCurrency(p.remainingCashAmount ?? p.unofficialAmount)}
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">
                                        Kalan: {formatCurrency(p.remainingCashAmount ?? p.unofficialAmount)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">₺0,00</span>
                                )}
                              </td>

                              {/* Durum */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {isFull ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Tamamı Ödendi</span>
                                  </span>
                                ) : p.isPartiallyPaid ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        Kısmi Ödendi (%{Math.round(((p.totalPaidAmount || 0) / (p.netTotal || 1)) * 100)})
                                      </span>
                                    </span>
                                    <span className="text-[9.5px] text-indigo-700 font-semibold mt-0.5">
                                      Kalan: {formatCurrency(p.remainingTotalAmount || 0)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    <Clock className="w-3 h-3" />
                                    <span>Bekliyor</span>
                                  </span>
                                )}
                                {p.paidDate && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    {new Date(p.paidDate).toLocaleDateString("tr-TR")}
                                  </span>
                                )}
                              </td>

                              {/* Hızlı Ödeme & Detay Butonu */}
                              <td className="py-3 px-3 text-center whitespace-nowrap print:hidden">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentModalPayroll(p);
                                    setPaymentAmount("");
                                    setPaymentNotes("");
                                    setPaymentType("CASH");
                                    setPaymentDate(new Date().toISOString().slice(0, 10));
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-[11px] font-bold shadow-2xs transition-all hover:scale-105"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Ödeme Yap</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {/* Tablo Alt Toplam Satırı */}
                    {filteredPayrolls.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                          <td className="py-3 px-3">GENEL TOPLAM</td>
                          <td className="py-3 px-3 text-right">
                            {formatCurrency(filteredPayrolls.reduce((s, p) => s + p.grossTotal, 0))}
                          </td>
                          <td className="py-3 px-3 text-left text-emerald-800">
                            +{formatCurrency(filteredPayrolls.reduce((s, p) => s + p.bonusAmount, 0))}
                          </td>
                          <td className="py-3 px-3 text-left text-rose-800">
                            -{formatCurrency(filteredPayrolls.reduce((s, p) => s + p.deductionAmount, 0))}
                          </td>
                          <td className="py-3 px-3 text-right text-xs">
                            {formatCurrency(filteredPayrolls.reduce((s, p) => s + p.netTotal, 0))}
                          </td>
                          <td className="py-3 px-3 text-right text-teal-900">
                            {formatCurrency(filteredPayrolls.reduce((s, p) => s + p.officialAmount, 0))}
                          </td>
                          <td className="py-3 px-3 text-right text-amber-900">
                            {formatCurrency(filteredPayrolls.reduce((s, p) => s + p.unofficialAmount, 0))}
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-center text-xs">
                            Toplam Kalan:{" "}
                            <span className="text-rose-700 font-black">
                              {formatCurrency(filteredPayrolls.reduce((s, p) => s + (p.remainingTotalAmount ?? (!p.isPaid ? p.netTotal : 0)), 0))}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Yazdırma Modu İmza Alanları */}
                <div className="hidden print:grid grid-cols-2 gap-12 mt-12 p-6 pt-12 border-t border-slate-300 text-xs">
                  <div className="text-center space-y-12">
                    <p className="font-bold text-slate-900">Personel İmzası</p>
                    <p className="text-slate-400 text-[10px]">Teslim aldım / Mutabıkım</p>
                  </div>
                  <div className="text-center space-y-12">
                    <p className="font-bold text-slate-900">Kurum Yetkilisi / Kaşe</p>
                    <p className="text-slate-400 text-[10px]">Onaylandı</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= MODAL: ÖDEME İŞLEMLERİ & PARÇA ÖDEME ================= */}
      {paymentModalPayroll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Başlık */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Ödeme İşlemleri & Parça Ödeme
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedStaff?.fullName} • <strong>{paymentModalPayroll.year} / {MONTH_NAMES[paymentModalPayroll.month] || paymentModalPayroll.month} Dönemi</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalPayroll(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* 3 KPI Durum Kartı */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Net Hakediş */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Net Hakediş
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {formatCurrency(paymentModalPayroll.netTotal)}
                  </span>
                  <div className="text-[10.5px] mt-1 space-y-0.5 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Ödenen:</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(paymentModalPayroll.totalPaidAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalan:</span>
                      <span className="font-bold text-rose-700">
                        {formatCurrency(paymentModalPayroll.remainingTotalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resmî Banka */}
                <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                      🏛️ Resmî Banka
                    </span>
                    {paymentModalPayroll.isBankPaid && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                        ✓ Ödendi
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-teal-900 mt-0.5 block">
                    {formatCurrency(paymentModalPayroll.officialAmount)}
                  </span>
                  <div className="text-[10.5px] mt-1 space-y-0.5 text-teal-800 font-medium">
                    <div className="flex justify-between">
                      <span>Ödenen:</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(paymentModalPayroll.paidBankAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalan:</span>
                      <span className="font-bold text-teal-950">
                        {formatCurrency(paymentModalPayroll.remainingBankAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Elden Nakit */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      💵 Elden Nakit
                    </span>
                    {paymentModalPayroll.isCashPaid && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                        ✓ Ödendi
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-amber-900 mt-0.5 block">
                    {formatCurrency(paymentModalPayroll.unofficialAmount)}
                  </span>
                  <div className="text-[10.5px] mt-1 space-y-0.5 text-amber-800 font-medium">
                    <div className="flex justify-between">
                      <span>Ödenen:</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(paymentModalPayroll.paidCashAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalan:</span>
                      <span className="font-bold text-amber-950">
                        {formatCurrency(paymentModalPayroll.remainingCashAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hızlı Kapatma Butonları */}
              <div className="p-3 bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700">Hızlı İşlemler:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(paymentModalPayroll.remainingBankAmount || 0) > 0 && (
                    <button
                      type="button"
                      disabled={submittingPayment}
                      onClick={() => handleQuickPayBank(paymentModalPayroll)}
                      className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Bankayı Kapat ({formatCurrency(paymentModalPayroll.remainingBankAmount || 0)})</span>
                    </button>
                  )}

                  {(paymentModalPayroll.remainingCashAmount || 0) > 0 && (
                    <button
                      type="button"
                      disabled={submittingPayment}
                      onClick={() => handleQuickPayCash(paymentModalPayroll)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Nakiti Kapat ({formatCurrency(paymentModalPayroll.remainingCashAmount || 0)})</span>
                    </button>
                  )}

                  {(paymentModalPayroll.remainingTotalAmount || 0) > 0 && (
                    <button
                      type="button"
                      disabled={submittingPayment}
                      onClick={() => handleQuickPayFull(paymentModalPayroll)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tümünü Öde ({formatCurrency(paymentModalPayroll.remainingTotalAmount || 0)})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Parça Ödeme Formu */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-teal-700" />
                    <span>Yeni Parça Ödeme Girişi</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    İstediğiniz tutarda parça ödeme yapabilirsiniz
                  </span>
                </div>

                {/* Tür Seçimi: Elden / Nakit vs Banka */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("CASH")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentType === "CASH"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>💵 Elden / Nakit Ödeme</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType("BANK")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentType === "BANK"
                        ? "bg-teal-700 text-white border-teal-800 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>🏦 Banka Transferi / EFT</span>
                  </button>
                </div>

                {/* Hızlı Tutar Çipleri */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Önerilen:</span>
                  {[5000, 10000, 15000, 20000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPaymentAmount(String(val))}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold transition-colors"
                    >
                      {val.toLocaleString("tr-TR")} ₺
                    </button>
                  ))}
                  {(paymentModalPayroll.remainingCashAmount || 0) > 0 && paymentType === "CASH" && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(paymentModalPayroll.remainingCashAmount || 0))}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10.5px] font-bold transition-colors"
                    >
                      Kalan Nakit: {formatCurrency(paymentModalPayroll.remainingCashAmount || 0)}
                    </button>
                  )}
                  {(paymentModalPayroll.remainingBankAmount || 0) > 0 && paymentType === "BANK" && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(paymentModalPayroll.remainingBankAmount || 0))}
                      className="px-2 py-0.5 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[10.5px] font-bold transition-colors"
                    >
                      Kalan Banka: {formatCurrency(paymentModalPayroll.remainingBankAmount || 0)}
                    </button>
                  )}
                </div>

                {/* Tutar, Tarih, Açıklama Inputları */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ödenen Tutar (TL) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0,00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 font-bold">₺</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ödeme Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Açıklama / Not
                    </label>
                    <input
                      type="text"
                      placeholder={paymentType === "CASH" ? "Örn: Elden 1. taksit..." : "Örn: Akbank maaş EFT..."}
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={submittingPayment || !paymentAmount}
                    onClick={handleAddPayment}
                    className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    {submittingPayment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Ödemeyi Kaydet</span>
                  </button>
                </div>
              </div>

              {/* Ödeme Geçmişi Listesi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs">
                    Bu Döneme Yapılan Ödemeler ({paymentModalPayroll.paymentItems?.length || 0})
                  </span>
                  {paymentModalPayroll.paymentItems && paymentModalPayroll.paymentItems.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-800">
                      Toplam: {formatCurrency(paymentModalPayroll.totalPaidAmount || 0)}
                    </span>
                  )}
                </div>

                {!paymentModalPayroll.paymentItems || paymentModalPayroll.paymentItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    Bu döneme ait henüz yapılmış bir parça ödeme kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {paymentModalPayroll.paymentItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold text-[11px] w-4">{idx + 1}.</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  item.type === "BANK"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {item.type === "BANK" ? "🏦 Banka Transferi" : "💵 Elden Nakit"}
                              </span>
                              <span className="font-mono text-slate-500 text-[11px]">
                                {new Date(item.date).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900 text-xs">
                            {formatCurrency(item.amount)}
                          </span>
                          <button
                            type="button"
                            disabled={submittingPayment}
                            onClick={() => handleDeletePaymentItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Bu ödemeyi sil (Bakiye geri açılır)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Alt Kısım */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {paymentModalPayroll.paymentItems && paymentModalPayroll.paymentItems.length > 0 ? (
                <button
                  type="button"
                  disabled={submittingPayment}
                  onClick={() => handleResetPayments(paymentModalPayroll)}
                  className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Tüm Ödemeleri Sıfırla</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setPaymentModalPayroll(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXCEL İNDİRME SEÇENEKLERİ ================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Excel İndirme Seçenekleri</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStaff ? selectedStaff.fullName : "Tüm Personeller"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {selectedStaff && (
                <>
                  {/* 1. Seçili Personel Hesap Dökümü */}
                  <a
                    href={`/api/export?type=cari&staffId=${selectedStaff.id}`}
                    download
                    onClick={() => setExportModalOpen(false)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group block"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>1. Personel Hesap Dökümü (.xlsx)</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {selectedStaff.fullName} personelinin işe başladığı günden bugüne tüm hakediş, elden nakit, banka ve kesinti dökümü.
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                  </a>

                  {/* 2. Seçili Personel İzin Dökümü */}
                  <a
                    href={`/api/export?type=leave&staffId=${selectedStaff.id}`}
                    download
                    onClick={() => setExportModalOpen(false)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all flex items-center justify-between group block"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-sky-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-600" />
                        <span>2. Personel İzin & Rapor Dökümü (.xlsx)</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Yıllık izin, mazeret ve hastalık raporu günlerinin tarih aralıkları ve onay durumları.
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 ml-2" />
                  </a>

                  {/* 3. Tam Kapsamlı Personel Dosyası (Hepsi) */}
                  <a
                    href={`/api/export?type=full&staffId=${selectedStaff.id}`}
                    download
                    onClick={() => setExportModalOpen(false)}
                    className="p-3.5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 hover:border-emerald-600 transition-all flex items-center justify-between group block"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>3. Tam Personel Dosyası (Hepsi - Tek Excelde 3 Sayfa)</span>
                      </span>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Personel Künyesi & Özeti + Cari Hesap Dökümü + İzin Dökümü tek Excel kitabında 3 ayrı sekme.
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />
                  </a>
                </>
              )}

              {/* 4. Tüm Personellerin Genel Cari Dökümü */}
              <a
                href="/api/export?type=all_cari"
                download
                onClick={() => setExportModalOpen(false)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-between group block"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>4. Tüm Personellerin Cari Dökümü (.xlsx) (Kurum Geneli)</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Kurumdaki bütün personellerin genel hakediş, bankadan yatan, elden ödenen ve kalan bakiye tablosu.
                  </p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 ml-2" />
              </a>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CariPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cari hesap yükleniyor...</div>}>
      <CariContent />
    </Suspense>
  );
}

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
} from "lucide-react";
import { calculateDuration } from "@/lib/date-utils";

interface StaffSummary {
  id: string;
  fullName: string;
  tcNo: string;
  title: string;
  status: string;
  hireDate: string | null;
  totalNet: number;
  totalPaid: number;
  totalPending: number;
  totalBank: number;
  totalCash: number;
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
  payrollCount: number;
  paidCount: number;
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

  const fetchCariData = async (targetId?: string) => {
    try {
      setLoading(true);
      const url = targetId ? `/api/cari?staffId=${targetId}` : "/api/cari";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data.staffSummaries) setStaffSummaries(data.staffSummaries);
      if (data.selectedStaff) setSelectedStaff(data.selectedStaff);
      if (data.payrolls) setPayrolls(data.payrolls);
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

  const togglePaymentStatus = async (payrollId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(payrollId);
      const res = await fetch("/api/cari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId, isPaid: !currentStatus }),
      });
      if (res.ok) {
        // Yerel state güncelle
        setPayrolls((prev) =>
          prev.map((p) =>
            p.id === payrollId ? { ...p, isPaid: !currentStatus, paidDate: !currentStatus ? new Date().toISOString() : null } : p
          )
        );
        // İstatistikleri güncelle
        if (selectedStaff) fetchCariData(selectedStaff.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
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
    if (selectedStatus === "PAID" && !p.isPaid) return false;
    if (selectedStatus === "PENDING" && p.isPaid) return false;
    return true;
  });

  // Filtrelenmiş Personel Listesi (Arama)
  const filteredStaffSummaries = staffSummaries.filter(
    (s) =>
      s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.tcNo.includes(staffSearch) ||
      s.title.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // Mevcut yıllar listesi
  const availableYears = Array.from(new Set(payrolls.map((p) => p.year))).sort((a, b) => b - a);

  // Güvenli çalışma süresi hesabı
  const totalWorkPeriod = selectedStaff?.hireDate
    ? calculateDuration(selectedStaff.hireDate, new Date().toISOString())
    : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Üst Sekmeler: Personel Cari & Okul Giderleri */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
        <Link
          href="/cari"
          className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-700 text-white shadow-xs flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Personel Cari & Ekstreler</span>
        </Link>
        <Link
          href="/giderler"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          <span>Okul Giderleri & Taksit Takibi</span>
        </Link>
      </div>

      {/* 1. Üst Başlık & Çıktı Butonu (Yazdırmada gizlenmez) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Muhasebe & Cari Hesap</h1>
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
            <span className="text-[11px] font-semibold text-slate-400">
              {staffSummaries.length} Kişi
            </span>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="İsim veya TC ile ara..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Liste */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredStaffSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Personel bulunamadı.</p>
            ) : (
              filteredStaffSummaries.map((s) => {
                const isSelected = selectedStaff?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStaff(s.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-teal-50/90 border-teal-500 shadow-2xs ring-1 ring-teal-500/20"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-teal-950" : "text-slate-800"}`}>
                        {s.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {s.title} • {s.payrollCount} Dönem
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-extrabold text-teal-800 block">
                        {formatCurrency(s.totalNet)}
                      </span>
                      {s.totalPending > 0 && (
                        <span className="text-[9px] text-rose-600 font-bold block">
                          Bekleyen: {formatCurrency(s.totalPending)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Seçilen Personelin Ayrıntılı Cari Ekstresi */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Cari hesap hareketleri yükleniyor...
            </div>
          ) : !selectedStaff ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Lütfen sol menüden bir personel seçiniz.
            </div>
          ) : (
            <>
              {/* Personel Künye & Sözleşme Kartı */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {selectedStaff.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                          {selectedStaff.fullName}
                        </h2>
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

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Toplam Çalışma:</span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                        {totalWorkPeriod}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">MEB Atama:</span>
                      <span className="font-bold text-slate-800">
                        {selectedStaff.isMebPermanent !== false ? (
                          <span className="text-teal-700">♾️ Süresiz</span>
                        ) : selectedStaff.mebAssignmentEndDate ? (
                          <span className="text-amber-700">
                            📅 Bitiş: {new Date(selectedStaff.mebAssignmentEndDate).toLocaleDateString("tr-TR")}
                          </span>
                        ) : (
                          "Belirli Süreli"
                        )}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">SGK Başlangıç:</span>
                      <span className="font-bold text-slate-800">
                        {selectedStaff.sgkStartDate
                          ? new Date(selectedStaff.sgkStartDate).toLocaleDateString("tr-TR")
                          : "Elden / Kayıtsız"}
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
                      {formatCurrency(allTimeTotals.totalBank)}
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium">Resmî SGK Hesabına</span>
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
                      {formatCurrency(allTimeTotals.totalCash)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Elden Teslim Edilen</span>
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
                    <span className="text-[10px] text-slate-400 font-medium">
                      {allTimeTotals.totalPending > 0 ? "Ödenmeyi Bekliyor" : "Tamamı Ödendi ✓"}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Filtreleme Çubuğu (Yazdırmada gizlenir) */}
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
                    <option value="PAID">Sadece Ödenenler</option>
                    <option value="PENDING">Sadece Bekleyenler</option>
                  </select>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Gösterilen: <span className="text-slate-900 font-bold">{filteredPayrolls.length}</span> / {payrolls.length} Dönem
                </div>
              </div>

              {/* 5. Ayrıntılı Kronolojik Cari Ekstre Tablosu */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
                {/* Yazdırma Başlığı (Sadece print modunda görünür) */}
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
                        filteredPayrolls.map((p) => (
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
                                <span className="text-teal-800 font-extrabold text-xs block">
                                  {formatCurrency(p.officialAmount)}
                                </span>
                              ) : (
                                <span className="text-slate-300">₺0,00</span>
                              )}
                            </td>

                            {/* Elden (Nakit) */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {p.unofficialAmount > 0 ? (
                                <span className="text-amber-800 font-extrabold text-xs block bg-amber-50 px-1.5 py-0.5 rounded">
                                  💵 {formatCurrency(p.unofficialAmount)}
                                </span>
                              ) : (
                                <span className="text-slate-300">₺0,00</span>
                              )}
                            </td>

                            {/* Durum */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {p.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Ödendi</span>
                                </span>
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

                            {/* Hızlı Ödeme Durumu Değiştir (Printte gizlenir) */}
                            <td className="py-3 px-3 text-center whitespace-nowrap print:hidden">
                              <button
                                type="button"
                                disabled={updatingId === p.id}
                                onClick={() => togglePaymentStatus(p.id, p.isPaid)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  p.isPaid
                                    ? "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700"
                                    : "bg-teal-700 hover:bg-teal-800 text-white shadow-2xs"
                                }`}
                              >
                                {updatingId === p.id ? "..." : p.isPaid ? "İptal Et" : "Ödendi Yap"}
                              </button>
                            </td>
                          </tr>
                        ))
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
                            {filteredPayrolls.filter((p) => p.isPaid).length} / {filteredPayrolls.length} Ay Ödendi
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Yazdırma Modu İmza Alanları (Sadece print sırasında görünür) */}
                <div className="hidden print:grid grid-cols-2 gap-12 mt-12 p-6 pt-12 border-t border-slate-300 text-xs">
                  <div className="text-center space-y-8">
                    <p className="font-bold text-slate-800">PERSONEL MUTABAKAT BEYANI</p>
                    <p className="text-[11px] text-slate-500">
                      Yukarıdaki cari hesap dökümünde yer alan hakediş, banka ve elden nakit ödemelerimi eksiksiz olarak teslim aldım.
                    </p>
                    <div className="pt-8">
                      <p className="font-bold">{selectedStaff.fullName}</p>
                      <p className="text-slate-400">İmza: _______________________</p>
                    </div>
                  </div>

                  <div className="text-center space-y-8">
                    <p className="font-bold text-slate-800">KURUM / MUHASEBE ONAYI</p>
                    <p className="text-[11px] text-slate-500">
                      İşbu cari ekstre kurum kayıtları ile karşılaştırılmış olup doğruluğu onaylanmıştır.
                    </p>
                    <div className="pt-8">
                      <p className="font-bold">Yetkili Kaşe & İmza</p>
                      <p className="text-slate-400">İmza: _______________________</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Excel İndirme Seçenekleri Modalı */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Excel Raporu & Döküm İndir</h3>
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

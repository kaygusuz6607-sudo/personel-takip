"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  Banknote,
  GraduationCap,
  FileText,
  Landmark,
  Calendar,
  Layers,
  Trash2,
  Edit2,
  Check,
  X,
  Printer,
  Download,
  DollarSign,
  ArrowUpDown,
  History,
  Coins,
  Smartphone,
  Tv,
  BellRing,
  Car,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CreditCard as CardIcon,
  PhoneCall,
} from "lucide-react";

interface PaymentHistoryItem {
  date: string;
  amount: number;
  note: string;
}

interface SchoolExpense {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  period: string | null;
  installmentInfo: string | null;
  dueDate: string | null;
  dueDateStr: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  periodStatus: string | null;
  description: string | null;
  paymentHistory: string | null;
  isCommitment?: boolean;
  commitmentEndDate?: string | null;
  commitmentMonths?: number | null;
  paymentMethod?: string;
  cardHolder?: string | null;
  cardBank?: string | null;
  monthIndex?: number | null;
  phoneLines?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  createdAt: string;
}

interface AssetTrackingItem {
  id: string;
  title: string;
  assetType: string;
  owner: string | null;
  inspectionDate: string | null;
  insuranceDate: string | null;
  kaskoDate: string | null;
  housingDate: string | null;
  notes: string | null;
  inspDays?: number | null;
  insDays?: number | null;
  kaskoDays?: number | null;
  houseDays?: number | null;
  hasWarning?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; badgeBg: string }> = {
  RENT: { label: "Kira", icon: Building2, color: "text-amber-700", badgeBg: "bg-amber-50 text-amber-800 border-amber-200" },
  INVOICE: { label: "Fatura", icon: ReceiptText, color: "text-blue-700", badgeBg: "bg-blue-50 text-blue-800 border-blue-200" },
  CREDIT_CARD: { label: "Kredi Kartı", icon: CreditCard, color: "text-purple-700", badgeBg: "bg-purple-50 text-purple-800 border-purple-200" },
  LOAN: { label: "Banka Kredisi", icon: Landmark, color: "text-indigo-700", badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  STUDENT_REFUND: { label: "Kayıt Silme İadesi", icon: GraduationCap, color: "text-rose-700", badgeBg: "bg-rose-50 text-rose-800 border-rose-200" },
  CHEQUE: { label: "Çek Ödemesi", icon: FileText, color: "text-emerald-700", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  TAX_SGK: { label: "SGK & Vergi", icon: Landmark, color: "text-cyan-700", badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  SALARY: { label: "Maaş", icon: Banknote, color: "text-teal-700", badgeBg: "bg-teal-50 text-teal-800 border-teal-200" },
  COMPENSATION: { label: "Tazminat", icon: Coins, color: "text-orange-700", badgeBg: "bg-orange-50 text-orange-800 border-orange-200" },
  OTHER: { label: "Diğer", icon: ReceiptText, color: "text-slate-700", badgeBg: "bg-slate-50 text-slate-800 border-slate-200" },
};

function formatSafeDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return typeof d === "string" ? d : "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "-";
  }
}

function GiderlerPageContent() {
  // SSR Hydration koruması
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Aktif Sekme: EXPENSES (Okul Giderleri) | ASSETS (Araç / Mülk Sigorta & Kasko)
  const [activeMainTab, setActiveMainTab] = useState<"EXPENSES" | "ASSETS">("EXPENSES");

  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [rolloverExpenses, setRolloverExpenses] = useState<SchoolExpense[]>([]);
  const [cardHoldersSummary, setCardHoldersSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [installmentOnly, setInstallmentOnly] = useState(false);
  const [commitmentsOnly, setCommitmentsOnly] = useState(false);
  const [chequesOnly, setChequesOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);

  // Ay Bazında Takip: 7 (Temmuz), 8 (Ağustos), 9 (Eylül), 10 (Ekim), ALL (Tümü)
  const [selectedMonth, setSelectedMonth] = useState<string>("9");
  // Ödeme Yöntemi Filtresi: ALL, CASH, CREDIT_CARD, CHEQUE
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");
  // Kart Sahibi Filtresi: ALL, Ahmet Taymaz, Duygu Köse, vb.
  const [selectedCardHolder, setSelectedCardHolder] = useState<string>("ALL");

  // Varlıklar (Araç & Mülk Muayene/Kasko)
  const [assets, setAssets] = useState<AssetTrackingItem[]>([]);
  const [assetWarningCount, setAssetWarningCount] = useState(0);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetTrackingItem | null>(null);
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetForm, setAssetForm] = useState({
    title: "",
    assetType: "VEHICLE",
    owner: "",
    inspectionDate: "",
    insuranceDate: "",
    kaskoDate: "",
    housingDate: "",
    notes: "",
  });

  // Yeni / Düzenle Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SchoolExpense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "INVOICE",
    subCategory: "",
    dueDateStr: "",
    dueDate: "",
    monthIndex: 9,
    amountDue: "",
    description: "",
    entryType: "SINGLE", // "SINGLE" | "INSTALLMENT" | "COMMITMENT"
    isInstallment: false,
    installmentCount: 12,
    currentInstallment: 1,
    amountMode: "TOTAL", // "TOTAL" | "MONTHLY"
    isCommitment: false,
    commitmentMonths: 12,
    paymentMethod: "CASH", // CASH, CREDIT_CARD, CHEQUE
    cardHolder: "",
    cardBank: "",
    chequeNo: "",
    chequeBank: "",
  });

  // Çoklu Telefon Hatları Giriş Listesi (Tek faturada 5 hat vb.)
  const [phoneLinesList, setPhoneLinesList] = useState<{ number: string; title: string; commitmentEnd: string }[]>([]);

  // Parçalı Ödeme Modalı
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentExpense, setActivePaymentExpense] = useState<SchoolExpense | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Kart detayları akordeonu
  const [showCardSummary, setShowCardSummary] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory && selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (installmentOnly) params.set("installmentOnly", "true");
      if (commitmentsOnly) params.set("commitmentsOnly", "true");
      if (chequesOnly) params.set("chequesOnly", "true");
      if (selectedMonth && selectedMonth !== "ALL") params.set("month", selectedMonth);
      if (selectedPaymentMethod && selectedPaymentMethod !== "ALL") params.set("paymentMethod", selectedPaymentMethod);
      if (selectedCardHolder && selectedCardHolder !== "ALL") params.set("cardHolder", selectedCardHolder);

      const res = await fetch(`/api/giderler?${params.toString()}`);
      const data = await res.json();
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
      if (data.rolloverExpenses && Array.isArray(data.rolloverExpenses)) {
        setRolloverExpenses(data.rolloverExpenses);
      } else {
        setRolloverExpenses([]);
      }
      if (data.cardHoldersSummary) {
        setCardHoldersSummary(data.cardHoldersSummary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.assets && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
      if (typeof data.warningCount === "number") {
        setAssetWarningCount(data.warningCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    search,
    selectedCategory,
    selectedStatus,
    installmentOnly,
    commitmentsOnly,
    chequesOnly,
    selectedMonth,
    selectedPaymentMethod,
    selectedCardHolder,
  ]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const stats = useMemo(() => {
    const totalDue = expenses.reduce((sum, e) => sum + e.amountDue, 0);
    const totalPaid = expenses.reduce((sum, e) => sum + e.amountPaid, 0);
    const totalRemaining = expenses.reduce((sum, e) => sum + e.amountRemaining, 0);
    const countPending = expenses.filter((e) => e.status === "PENDING").length;
    const countPartial = expenses.filter((e) => e.status === "PARTIAL").length;
    const countPaid = expenses.filter((e) => e.status === "PAID").length;
    const countInstallment = expenses.filter((e) => Boolean(e.installmentInfo)).length;
    const countCommitment = expenses.filter((e) => Boolean(e.isCommitment)).length;
    const countCheques = expenses.filter((e) => e.category === "CHEQUE" || e.paymentMethod === "CHEQUE").length;
    return {
      totalDue,
      totalPaid,
      totalRemaining,
      countPending,
      countPartial,
      countPaid,
      countInstallment,
      countCommitment,
      countCheques,
    };
  }, [expenses]);

  // Taahhüt Bitişi Yaklaşanlar (Son 45 gün)
  const expiringCommitments = useMemo(() => {
    if (!isMounted) return [];
    const now = new Date();
    const map = new Map<string, { exp: SchoolExpense; daysLeft: number }>();
    expenses.forEach((e) => {
      if (e.isCommitment && e.commitmentEndDate) {
        try {
          const end = new Date(e.commitmentEndDate);
          if (!isNaN(end.getTime())) {
            const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 45) {
              if (!map.has(e.title)) {
                map.set(e.title, { exp: e, daysLeft: diffDays });
              }
            }
          }
        } catch {}
      }
    });
    return Array.from(map.values());
  }, [expenses, isMounted]);

  // Bugün veya Vadesi Geçmiş Olan Faturalar & Kartlar
  const dueTodayOrOverdue = useMemo(() => {
    if (!isMounted) return [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return expenses.filter((e) => {
      if (e.status === "PAID" || !e.dueDate) return false;
      try {
        const d = new Date(e.dueDate);
        if (isNaN(d.getTime())) return false;
        return d.getTime() <= today.getTime();
      } catch {
        return false;
      }
    });
  }, [expenses, isMounted]);

  // Tabloda gösterilecek liste (Bugün filtresi etkinse sadece vadesi gelenler)
  const displayedExpenses = useMemo(() => {
    if (!dueTodayOnly || !isMounted) return expenses;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return expenses.filter((e) => {
      if (e.status === "PAID" || !e.dueDate) return false;
      try {
        const d = new Date(e.dueDate);
        if (isNaN(d.getTime())) return false;
        return d.getTime() <= today.getTime();
      } catch {
        return false;
      }
    });
  }, [expenses, dueTodayOnly, isMounted]);

  const openNewModal = () => {
    setEditingExpense(null);
    const todayStr = new Date().toISOString().split("T")[0];
    setPhoneLinesList([
      { number: "", title: "1. Hat", commitmentEnd: "" },
    ]);
    setForm({
      title: "",
      category: "INVOICE",
      subCategory: "",
      dueDateStr: "",
      dueDate: todayStr,
      monthIndex: selectedMonth !== "ALL" ? parseInt(selectedMonth) : 9,
      amountDue: "",
      description: "",
      entryType: "SINGLE",
      isInstallment: false,
      installmentCount: 12,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: false,
      commitmentMonths: 12,
      paymentMethod: "CASH",
      cardHolder: "",
      cardBank: "",
      chequeNo: "",
      chequeBank: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (expense: SchoolExpense) => {
    setEditingExpense(expense);
    let parsedLines: any[] = [];
    try {
      if (expense.phoneLines) {
        parsedLines = JSON.parse(expense.phoneLines);
      }
    } catch (e) {}

    setPhoneLinesList(parsedLines.length > 0 ? parsedLines : [{ number: "", title: "1. Hat", commitmentEnd: "" }]);
    setForm({
      title: expense.title,
      category: expense.category,
      subCategory: expense.subCategory || "",
      dueDateStr: expense.dueDateStr || "",
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split("T")[0] : "",
      monthIndex: expense.monthIndex || 9,
      amountDue: String(expense.amountDue),
      description: expense.description || "",
      entryType: expense.isCommitment ? "COMMITMENT" : expense.installmentInfo ? "INSTALLMENT" : "SINGLE",
      isInstallment: Boolean(expense.installmentInfo),
      installmentCount: 1,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: Boolean(expense.isCommitment),
      commitmentMonths: expense.commitmentMonths || 12,
      paymentMethod: expense.paymentMethod || "CASH",
      cardHolder: expense.cardHolder || "",
      cardBank: expense.cardBank || "",
      chequeNo: expense.chequeNo || "",
      chequeBank: expense.chequeBank || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingExpense ? `/api/giderler/${editingExpense.id}` : "/api/giderler";
      const method = editingExpense ? "PUT" : "POST";

      const isCommitment = form.entryType === "COMMITMENT";
      const isInstallment = form.entryType === "INSTALLMENT";

      const filteredLines = phoneLinesList.filter((p) => p.number.trim() !== "");

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          isCommitment,
          isInstallment,
          amountDue: Number(form.amountDue) || 0,
          phoneLines: filteredLines.length > 0 ? filteredLines : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "İşlem başarısız");
        return;
      }

      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" gider kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/giderler/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch (e) {
      alert("Silinemedi");
    }
  };

  const handleMarkPaid = async (expense: SchoolExpense) => {
    if (!confirm(`"${expense.title}" ödemesinin tamamını ödendi olarak işaretlemek istiyor musunuz?`)) return;
    try {
      const res = await fetch(`/api/giderler/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_PAID" }),
      });
      if (res.ok) fetchExpenses();
    } catch (e) {
      alert("İşlem yapılamadı");
    }
  };

  const openPaymentModal = (expense: SchoolExpense) => {
    setActivePaymentExpense(expense);
    setPaymentAmount(String(expense.amountRemaining));
    setPaymentNote("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentExpense) return;
    try {
      setPaymentSubmitting(true);
      const res = await fetch(`/api/giderler/${activePaymentExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PAYMENT",
          amount: Number(paymentAmount) || 0,
          date: paymentDate,
          note: paymentNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Ödeme eklenemedi");
        return;
      }

      setPaymentModalOpen(false);
      fetchExpenses();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Varlık Ekle / Düzenle
  const openNewAssetModal = () => {
    setEditingAsset(null);
    setAssetForm({
      title: "",
      assetType: "VEHICLE",
      owner: "Cosmos Koleji",
      inspectionDate: "",
      insuranceDate: "",
      kaskoDate: "",
      housingDate: "",
      notes: "",
    });
    setAssetModalOpen(true);
  };

  const openEditAssetModal = (asset: AssetTrackingItem) => {
    setEditingAsset(asset);
    setAssetForm({
      title: asset.title,
      assetType: asset.assetType,
      owner: asset.owner || "",
      inspectionDate: asset.inspectionDate ? new Date(asset.inspectionDate).toISOString().split("T")[0] : "",
      insuranceDate: asset.insuranceDate ? new Date(asset.insuranceDate).toISOString().split("T")[0] : "",
      kaskoDate: asset.kaskoDate ? new Date(asset.kaskoDate).toISOString().split("T")[0] : "",
      housingDate: asset.housingDate ? new Date(asset.housingDate).toISOString().split("T")[0] : "",
      notes: asset.notes || "",
    });
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssetSubmitting(true);
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "İşlem başarısız");
        return;
      }

      setAssetModalOpen(false);
      fetchAssets();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string, title: string) => {
    if (!confirm(`"${title}" varlık kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) fetchAssets();
    } catch (e) {
      alert("Silinemedi");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  const exportToCSV = () => {
    const headers = ["Cari / Kurum", "Tür", "Alt Tür", "Dönem / Taksit", "Tarih / Vade", "Ödenecek", "Ödenen", "Kalan", "Durum", "Ödeme Yöntemi", "Açıklama"];
    const rows = expenses.map((e) => [
      `"${e.title}"`,
      `"${CATEGORY_MAP[e.category]?.label || e.category}"`,
      `"${e.subCategory || ""}"`,
      `"${e.installmentInfo || e.period || ""}"`,
      `"${e.dueDateStr || ""}"`,
      e.amountDue,
      e.amountPaid,
      e.amountRemaining,
      `"${e.status === "PAID" ? "Ödendi" : e.status === "PARTIAL" ? "Kısmi" : "Bekliyor"}"`,
      `"${e.paymentMethod || "Nakit"}"`,
      `"${e.description || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Okul_Giderleri_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Üst Sekmeler: Okul Giderleri | Araç & Mülk Takibi | Personel Cari */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab("EXPENSES")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "EXPENSES"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Okul Giderleri & Taksit Takibi</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeMainTab === "EXPENSES" ? "bg-teal-800 text-teal-100" : "bg-slate-200 text-slate-700"}`}>
              {stats.countPending + stats.countPartial} Bekleyen
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("ASSETS")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "ASSETS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Car className="w-4 h-4 text-amber-500" />
            <span>Araç & Mülk Muayene / Kasko Takibi</span>
            {assetWarningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-600 text-white animate-pulse">
                {assetWarningCount} Acil Uyarı
              </span>
            )}
          </button>

          <Link
            href="/cari"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Personel Cari & Ekstreler</span>
          </Link>
        </div>

        {activeMainTab === "EXPENSES" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Yazdır</span>
            </button>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Gider / Taksit Ekle</span>
            </button>
          </div>
        )}

        {activeMainTab === "ASSETS" && (
          <button
            type="button"
            onClick={openNewAssetModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Araç / Mülk Ekle</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* SEKME 1: OKUL GİDERLERİ & BORÇ TAKİBİ                          */}
      {/* ============================================================== */}
      {activeMainTab === "EXPENSES" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Okul Gider & Borç Takibi</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  9. Ay & Cari Takvim
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Kiralar, krediler, kredi kartları, veli iadeleri, tedarikçi çekleri ve telefon hatları
              </p>
            </div>

            {/* Ay Bazında Hızlı Gezinme Butonları */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ay:
              </span>
              {[
                { key: "ALL", label: "Tüm Aylar" },
                { key: "7", label: "7. Ay (Temmuz)" },
                { key: "8", label: "8. Ay (Ağustos)" },
                { key: "9", label: "9. Ay (Eylül)" },
                { key: "10", label: "10. Ay (Ekim)" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMonth(m.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMonth === m.key
                      ? "bg-white text-teal-800 shadow-xs border border-teal-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 🔴 GEÇMİŞ AYLARDAN KALAN ÖDENMEMİŞ BORÇLAR / DEVREDEN KİRALAR (Özdemirler & İlyas Bey) */}
          {rolloverExpenses.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 text-rose-950 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-extrabold text-sm text-rose-950">
                    🔴 Geçmiş Aylardan Kalan Ödenmemiş Borçlar ({rolloverExpenses.length} Kalem Devreden)
                  </h3>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-rose-200 text-rose-900 rounded-full">
                  Toplam Devreden: {formatCurrency(rolloverExpenses.reduce((s, e) => s + e.amountRemaining, 0))}
                </span>
              </div>
              <p className="text-xs text-rose-800">
                Seçilen aydan önceki dönemlerden kalan ve henüz kapatılmamış kiralar/ödemeler:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {rolloverExpenses.map((re) => (
                  <div key={re.id} className="p-2.5 bg-white border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{re.title}</p>
                      <p className="text-[11px] text-slate-500">{re.period || "Önceki Ay"} • Vade: {re.dueDateStr || "-"}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-600 block">{formatCurrency(re.amountRemaining)}</span>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(re)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        Ödeme Yap →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Taahhüt Bitişi Yaklaşanlar Erken Uyarı Bildirimi */}
          {expiringCommitments.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-amber-700 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-amber-950">
                    ⚠️ Dikkat: Taahhüt Süresi Dolan / Yaklaşan Abonelikler ({expiringCommitments.length} Kurum)
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Fatura Katlanma Riski
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Taahhüdü biten telefon veya internet aboneliklerinde indirimler sona erer ve faturalar katlanır:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {expiringCommitments.map(({ exp, daysLeft }) => (
                    <div
                      key={exp.id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{exp.title}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          daysLeft <= 0
                            ? "bg-rose-100 text-rose-800"
                            : daysLeft <= 15
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {daysLeft <= 0 ? "Süre Doldu!" : `${daysLeft} Gün Kaldı`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4 Özet Finans Kartı (Tıklanabilir Filtreleme) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Toplam Ödenecek */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Toplam Ödenecek</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(stats.totalDue)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} işlem kaydı</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            {/* Toplam Ödenen (Tıklayınca Ödenenleri Filtreler) */}
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "PAID" ? "ALL" : "PAID")}
              className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                selectedStatus === "PAID"
                  ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                  : "bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-emerald-700">Toplam Ödenen</p>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded font-extrabold">Tıkla: Filtrele</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{stats.countPaid} tamamlanan</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </button>

            {/* Kalan Net Borç (Tıklayınca Kalanları Filtreler) */}
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "PENDING" ? "ALL" : "PENDING")}
              className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                selectedStatus === "PENDING"
                  ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
                  : "bg-white border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/30 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-rose-700">Kalan Net Borç</p>
                  <span className="text-[10px] text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded font-extrabold">Tıkla: Filtrele</span>
                </div>
                <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(stats.totalRemaining)}</p>
                <p className="text-[11px] text-rose-700 font-medium mt-0.5">{stats.countPending + stats.countPartial} bekleyen</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </button>

            {/* Taksit & Taahhüt & Çek */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700">Taksit, Taahhüt & Çek</p>
                <p className="text-2xl font-extrabold text-purple-700 mt-1">{stats.countInstallment + stats.countCommitment + stats.countCheques} Kalem</p>
                <p className="text-[11px] text-purple-600 mt-0.5">
                  {stats.countInstallment} Taksit • {stats.countCommitment} Taahhüt • {stats.countCheques} Çek
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Son Ödeme Günü Gelen / Geciken Faturalar ve Kartlar Uyarısı */}
          {dueTodayOrOverdue.length > 0 && !dueTodayOnly && (
            <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  🔔
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-950 text-sm">
                    Bugün veya Vadesi Gelmiş {dueTodayOrOverdue.length} Kalem Fatura & Borç Ödemesi Var!
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Son ödeme tarihi bugün olan veya günü geçmiş bekleyen faturaları ve kredi kartlarını tek tıkla listeleyin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDueTodayOnly(true)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                Günü Gelenleri Listele ({dueTodayOrOverdue.length}) →
              </button>
            </div>
          )}

          {/* 💳 KREDİ KARTLARI & ŞAHIS KARTLARI DETAY PANOSU (Ahmet Taymaz - Akbank / Halkbank / Vakıfbank) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCardSummary(!showCardSummary)}
              className="w-full p-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-indigo-700" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    💳 Kişi & Şirket Kredi Kartları Harcama Özeti (Ahmet Taymaz, Duygu Köse vb.)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kişilerin farklı banka kartlarından yapılan harcamaların tek çatı altında toplanması
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                  {Object.keys(cardHoldersSummary).length} Kart Sahibi
                </span>
                {showCardSummary ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {showCardSummary && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-200/60 bg-white animate-in fade-in duration-200">
                {Object.entries(cardHoldersSummary).map(([holderName, summary]: [string, any]) => (
                  <div
                    key={holderName}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          {holderName ? holderName.substring(0, 2).toUpperCase() : "KT"}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{holderName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCardHolder(selectedCardHolder === holderName ? "ALL" : holderName)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          selectedCardHolder === holderName
                            ? "bg-indigo-700 text-white border-indigo-700"
                            : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        {selectedCardHolder === holderName ? "Seçildi ✓" : "Listede Filtrele"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-slate-500">Toplam Borç:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(summary.totalDue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700">Ödenen Tutar:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(summary.totalPaid)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-600 font-bold">Kalan Net Borç:</span>
                      <span className="font-extrabold text-rose-600">{formatCurrency(summary.totalRemaining)}</span>
                    </div>

                    {/* Banka Dağılımı */}
                    <div className="pt-2 border-t border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Bankalar:</span>
                      {Object.entries(summary.banks || {}).map(([bName, bData]: [string, any]) => (
                        <div key={bName} className="flex items-center justify-between text-[11px] bg-white p-1 rounded-md border border-slate-100">
                          <span className="font-semibold text-slate-700">{bName}</span>
                          <span className="font-bold text-slate-900">{formatCurrency(bData.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtreleme ve Arama Çubuğu */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari, kişi, veli, elektrik, telefon veya açıklama ara..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              {/* Hızlı Filtre Butonları */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Taksitliler */}
                <button
                  type="button"
                  onClick={() => {
                    setInstallmentOnly(!installmentOnly);
                    if (!installmentOnly) {
                      setCommitmentsOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    installmentOnly
                      ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Taksitliler ({stats.countInstallment})</span>
                </button>

                {/* Taahhütlüler */}
                <button
                  type="button"
                  onClick={() => {
                    setCommitmentsOnly(!commitmentsOnly);
                    if (!commitmentsOnly) {
                      setInstallmentOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    commitmentsOnly
                      ? "bg-blue-700 text-white border-blue-700 shadow-2xs"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Taahhütlüler ({stats.countCommitment})</span>
                </button>

                {/* Çekler */}
                <button
                  type="button"
                  onClick={() => {
                    setChequesOnly(!chequesOnly);
                    if (!chequesOnly) {
                      setInstallmentOnly(false);
                      setCommitmentsOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    chequesOnly
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Verilen Çekler ({stats.countCheques})</span>
                </button>

                {/* Son Ödeme Günü Gelenler / Bugün Ödenecekler */}
                <button
                  type="button"
                  onClick={() => {
                    setDueTodayOnly(!dueTodayOnly);
                    if (!dueTodayOnly) {
                      setInstallmentOnly(false);
                      setCommitmentsOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    dueTodayOnly
                      ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Son Günü Gelenler ({dueTodayOrOverdue.length})</span>
                </button>

                {/* Ödeme Yöntemi Filtresi */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { key: "ALL", label: "Tüm Türler" },
                    { key: "CASH", label: "💵 Nakit/Banka" },
                    { key: "CREDIT_CARD", label: "💳 Kredi Kartı" },
                  ].map((pm) => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedPaymentMethod === pm.key
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {/* Durum Filtreleri */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { key: "ALL", label: "Tümü" },
                    { key: "PENDING", label: "Bekleyenler" },
                    { key: "PARTIAL", label: "Kısmi" },
                    { key: "PAID", label: "Ödenenler" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSelectedStatus(st.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedStatus === st.key
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Kategori Butonları */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tüm Kategoriler
              </button>
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                const Icon = cat.icon;
                const count = expenses.filter((e) => e.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 flex items-center gap-1.5 transition-colors border ${
                      selectedCategory === key
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedCategory === key ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giderler Tablosu (Vade Takvim Sıralı) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Giderler yükleniyor...</div>
            ) : displayedExpenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                {dueTodayOnly ? "Bugün veya vadesi geçmiş bekleyen ödeme bulunmuyor. Harika! 🎉" : "Kayıt bulunamadı."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Cari / Kurum / Kişi</th>
                      <th className="py-3 px-3">Tür & Ödeme Şekli</th>
                      <th className="py-3 px-3 text-center">Dönem / Taksit</th>
                      <th className="py-3 px-3">Vade / Tarih</th>
                      <th className="py-3 px-3 text-right">Ödenecek</th>
                      <th className="py-3 px-3 text-right">Ödenen</th>
                      <th className="py-3 px-3 text-right">Kalan</th>
                      <th className="py-3 px-3 text-center">Durum</th>
                      <th className="py-3 px-3 text-center min-w-[130px]">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedExpenses.map((exp) => {
                      const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                      const Icon = cat.icon;

                      // Çoklu Hat Ayrıştırması
                      let phoneLines: any[] = [];
                      if (exp.phoneLines) {
                        try {
                          const parsed = typeof exp.phoneLines === "string" ? JSON.parse(exp.phoneLines) : exp.phoneLines;
                          if (Array.isArray(parsed)) phoneLines = parsed;
                        } catch (e) {}
                      }

                      // Ödeme Geçmişi Ayrıştırması
                      let paymentHistoryList: any[] = [];
                      if (exp.paymentHistory) {
                        try {
                          const parsed = typeof exp.paymentHistory === "string" ? JSON.parse(exp.paymentHistory) : exp.paymentHistory;
                          if (Array.isArray(parsed)) paymentHistoryList = parsed;
                        } catch (e) {}
                      }

                      return (
                        <tr
                          key={exp.id}
                          className={`hover:bg-slate-50/60 transition-colors border-l-4 ${
                            exp.status === "PAID"
                              ? "border-l-emerald-500 bg-emerald-50/20"
                              : exp.status === "PARTIAL"
                              ? "border-l-amber-500 bg-amber-50/20"
                              : "border-l-transparent"
                          }`}
                        >
                          {/* Cari Başlığı */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                              <span>{exp.title}</span>

                              {/* Kart Sahibi Rozeti */}
                              {exp.cardHolder && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>{exp.cardHolder}</span>
                                </span>
                              )}

                              {/* Taahhüt Rozeti */}
                              {exp.isCommitment && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                  <Smartphone className="w-2.5 h-2.5 text-blue-700" />
                                  <span>Taahhütlü</span>
                                </span>
                              )}

                              {exp.periodStatus && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  {exp.periodStatus}
                                </span>
                              )}
                            </div>

                            {/* Açıklama / Not */}
                            {exp.description && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {(exp.status === "PAID" || exp.amountRemaining <= 0) && exp.description.toLowerCase().includes("kaldı")
                                  ? "Tüm taksitler ödendi - Borç tamamen kapandı ✅"
                                  : exp.description}
                              </span>
                            )}

                            {/* Çoklu Telefon Hatları Dökümü */}
                            {phoneLines.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {phoneLines.map((pl, pIdx) => (
                                  <span key={pIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                                    <PhoneCall className="w-2.5 h-2.5 text-blue-600" />
                                    <span>{pl.title || pl.number}: {pl.number}</span>
                                    {pl.commitmentEnd && <strong className="text-amber-800">(Son: {pl.commitmentEnd})</strong>}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Çek Detayı */}
                            {exp.chequeNo && (
                              <div className="mt-1 text-[10px] font-bold text-emerald-800">
                                📝 Çek No: {exp.chequeNo} • Banka: {exp.chequeBank || "-"}
                              </div>
                            )}

                            {/* Taahhüt Süresi Uyarısı */}
                            {isMounted && exp.isCommitment && exp.commitmentEndDate && (() => {
                              try {
                                const end = new Date(exp.commitmentEndDate);
                                if (isNaN(end.getTime())) return null;
                                const diffDays = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays <= 45 && diffDays >= 0) {
                                  return (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                        <AlertCircle className="w-3 h-3 text-amber-700" />
                                        <span>Taahhüt Bitiyor ({diffDays} gün kaldı)</span>
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              } catch {
                                return null;
                              }
                            })()}
                          </td>

                          {/* Tür & Ödeme Şekli */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cat.badgeBg}`}>
                                <Icon className="w-3 h-3" />
                                <span>{exp.subCategory || cat.label}</span>
                              </span>
                              <div className="block">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${
                                  exp.paymentMethod === "CREDIT_CARD"
                                    ? "bg-purple-50 text-purple-800 border-purple-200"
                                    : exp.paymentMethod === "CHEQUE"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}>
                                  {exp.paymentMethod === "CREDIT_CARD" ? "💳 Kredi Kartı" : exp.paymentMethod === "CHEQUE" ? "📝 Çek" : "💵 Nakit/Banka"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Dönem / Taksit */}
                          <td className="py-3 px-3 text-center">
                            {exp.installmentInfo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 font-extrabold rounded-md border border-purple-300 text-[11px]">
                                <Layers className="w-3 h-3 text-purple-700" />
                                <span>{exp.installmentInfo}</span>
                              </span>
                            ) : exp.period ? (
                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {exp.period}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Vade / Tarih */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-semibold flex flex-col gap-0.5">
                              <span>{exp.dueDateStr || formatSafeDate(exp.dueDate)}</span>
                              {isMounted && (() => {
                                if (!exp.dueDate || exp.status === "PAID") return null;
                                try {
                                  const due = new Date(exp.dueDate);
                                  if (isNaN(due.getTime())) return null;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  due.setHours(0, 0, 0, 0);
                                  const diffTime = due.getTime() - today.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  if (diffDays === 0) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded w-fit animate-pulse">
                                        🔔 BUGÜN SON GÜN!
                                      </span>
                                    );
                                  }
                                  if (diffDays < 0) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded w-fit">
                                        ⚠️ Günü Geçti ({Math.abs(diffDays)} gün)
                                      </span>
                                    );
                                  }
                                  if (diffDays <= 3) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded w-fit">
                                        ⏰ {diffDays} gün kaldı
                                      </span>
                                    );
                                  }
                                  return null;
                                } catch {
                                  return null;
                                }
                              })()}
                            </div>
                          </td>

                          {/* Ödenecek */}
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(exp.amountDue)}
                          </td>

                          {/* Ödenen & Kısmi Ödeme Geçmişi */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-emerald-700 block">
                              {exp.amountPaid > 0 ? formatCurrency(exp.amountPaid) : "-"}
                            </span>
                            {paymentHistoryList.length > 0 && (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                {paymentHistoryList.map((ph, idx) => (
                                  <div key={idx} className="text-emerald-700">
                                    {idx + 1}. Parça: {formatCurrency(ph.amount)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Kalan */}
                          <td className="py-3 px-3 text-right font-extrabold">
                            {exp.amountRemaining > 0 ? (
                              <span className="text-rose-600">{formatCurrency(exp.amountRemaining)}</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                <Check className="w-3.5 h-3.5" /> ₺0,00
                              </span>
                            )}
                          </td>

                          {/* Durum */}
                          <td className="py-3 px-3 text-center">
                            {exp.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Ödendi
                              </span>
                            ) : exp.status === "PARTIAL" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px]">
                                <Clock className="w-3 h-3 text-amber-700" />
                                Kısmi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-[10px]">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Bekliyor
                              </span>
                            )}
                          </td>

                          {/* İşlemler */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {exp.status !== "PAID" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(exp)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                                  >
                                    Ödeme Gir
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPaid(exp)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Tamamını Ödendi Yap"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(exp)}
                                className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(exp.id, exp.title)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEKME 2: ARAÇ & MÜLK TAKİBİ (Kasko, Muayene, Sigorta)         */}
      {/* ============================================================== */}
      {activeMainTab === "ASSETS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-6 h-6 text-amber-600" />
                <span>Şirket & Bireysel Araç / Mülk Takip Sistemi</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                TÜVTÜRK muayeneleri, kasko poliçeleri, trafik sigortaları ve bina DASK bitiş tarihleri
              </p>
            </div>
            <button
              type="button"
              onClick={openNewAssetModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Araç / Mülk Ekle</span>
            </button>
          </div>

          {/* 10 Gün Erken Uyarı Bildirimi */}
          {assetWarningCount > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-950">
                  ⚠️ Acil Hatırlatma: Muayene veya Kasko Süresine 10 Günden Az Kalan Varlıklar ({assetWarningCount} Kalem)
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Trafik cezası ve sigortasız kalma riskini önlemek için muayene randevusu alınız ve kaskonuzu yenileyiniz.
                </p>
              </div>
            </div>
          )}

          {/* Varlık Kartları Izgarası */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                Henüz kayıtlı araç veya mülk bulunamadı. &quot;Yeni Araç / Mülk Ekle&quot; butonuyla ekleyebilirsiniz.
              </div>
            ) : (
              assets.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative transition-all ${
                    item.hasWarning ? "border-rose-400 ring-2 ring-rose-300/30" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.assetType === "VEHICLE" ? "🚗 Araç / Servis" : "🏢 Gayrimenkul / Mülk"}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">Sahibi: {item.owner || "Kurum"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAssetModal(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(item.id, item.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {item.assetType === "VEHICLE" ? (
                      <>
                        {/* TÜVTÜRK Muayene */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">TÜVTÜRK Muayene:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.inspectionDate ? formatSafeDate(item.inspectionDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.inspDays === "number" && (
                              <span className={`text-[10px] font-black ${item.inspDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.inspDays <= 0 ? "Süresi Doldu!" : `${item.inspDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kasko Poliçesi */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">Kasko Bitiş:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.kaskoDate ? formatSafeDate(item.kaskoDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.kaskoDays === "number" && (
                              <span className={`text-[10px] font-black ${item.kaskoDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.kaskoDays <= 0 ? "Süresi Doldu!" : `${item.kaskoDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Trafik Sigortası */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">Trafik Sigortası:</span>
                          <span className="font-bold text-slate-900">
                            {item.insuranceDate ? formatSafeDate(item.insuranceDate) : "Belirtilmedi"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Gayrimenkul / DASK */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">DASK / Yangın Sigortası:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.housingDate ? formatSafeDate(item.housingDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.houseDays === "number" && (
                              <span className={`text-[10px] font-black ${item.houseDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.houseDays <= 0 ? "Süresi Doldu!" : `${item.houseDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1">{item.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: YENİ GİDER / TAKSİT EKLE                              */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <span>{editingExpense ? "Gider Kaydını Düzenle" : "Yeni Okul Gideri / Taksit Ekle"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* İşlem Türü Seçimi */}
              {!editingExpense && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Ödeme / Plan Tipi</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, entryType: "SINGLE", isInstallment: false, isCommitment: false })}
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "SINGLE"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ReceiptText className="w-4 h-4 text-slate-600" />
                      <span>Tek Seferlik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, entryType: "INSTALLMENT", isInstallment: true, isCommitment: false })}
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "INSTALLMENT"
                          ? "bg-purple-700 text-white shadow-2xs"
                          : "text-purple-800 hover:bg-purple-100/50"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Taksitli Borç</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          entryType: "COMMITMENT",
                          isCommitment: true,
                          isInstallment: false,
                          category: "INVOICE",
                          subCategory: form.subCategory || "Haberleşme & TV",
                          amountMode: "MONTHLY",
                        })
                      }
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "COMMITMENT"
                          ? "bg-blue-700 text-white shadow-2xs"
                          : "text-blue-800 hover:bg-blue-100/50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Taahhütlü Abonelik</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cari / Kurum Adı */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cari / Kurum / Kişi Adı *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.entryType === "COMMITMENT"
                      ? "Örn: Türk Telekom, Turkcell Superonline, Digiturk"
                      : "Örn: Özdemirler A.Ş., İlyas Yılmaz, Kayseri Elektrik"
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              {/* Kategori ve Alt Tür */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alt Tür / Detay</label>
                  <input
                    type="text"
                    value={form.subCategory}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    placeholder="Örn: Bina Kirası, F-Elektrik, Kurumsal Hat"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* Ödeme Şekli (Nakit, Kredi Kartı, Çek) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800 text-xs">Bu Gider Nasıl Ödenecek? *</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={form.paymentMethod === "CASH"}
                      onChange={() => setForm({ ...form, paymentMethod: "CASH" })}
                    />
                    <span className="font-semibold text-[11px] text-slate-800">💵 Nakit / Havale</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT_CARD"
                      checked={form.paymentMethod === "CREDIT_CARD"}
                      onChange={() => setForm({ ...form, paymentMethod: "CREDIT_CARD" })}
                    />
                    <span className="font-semibold text-[11px] text-purple-900">💳 Kredi Kartı</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CHEQUE"
                      checked={form.paymentMethod === "CHEQUE"}
                      onChange={() => setForm({ ...form, paymentMethod: "CHEQUE" })}
                    />
                    <span className="font-semibold text-[11px] text-emerald-900">📝 Çek</span>
                  </label>
                </div>

                {/* Kredi Kartı Detayı */}
                {form.paymentMethod === "CREDIT_CARD" && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Kart Sahibi</label>
                      <input
                        type="text"
                        value={form.cardHolder}
                        onChange={(e) => setForm({ ...form, cardHolder: e.target.value })}
                        placeholder="Örn: Ahmet Taymaz, Duygu Köse, Şirket"
                        className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Banka</label>
                      <input
                        type="text"
                        value={form.cardBank}
                        onChange={(e) => setForm({ ...form, cardBank: e.target.value })}
                        placeholder="Örn: Akbank, Halkbank, Vakıfbank"
                        className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Çek Detayı */}
                {form.paymentMethod === "CHEQUE" && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Çek No</label>
                      <input
                        type="text"
                        value={form.chequeNo}
                        onChange={(e) => setForm({ ...form, chequeNo: e.target.value })}
                        placeholder="Örn: TR-884219"
                        className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Keşide Bankası</label>
                      <input
                        type="text"
                        value={form.chequeBank}
                        onChange={(e) => setForm({ ...form, chequeBank: e.target.value })}
                        placeholder="Örn: Halkbank Kayseri Şubesi"
                        className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TAAHHÜTLÜ ABONELİK AYARLARI & ÇOKLU HAT */}
              {form.entryType === "COMMITMENT" && !editingExpense && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-blue-700" />
                    <span>Taahhütlü Abonelik Planı (Telefon, İnternet, TV vb.)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">Taahhüt Süresi</label>
                      <select
                        value={form.commitmentMonths}
                        onChange={(e) => setForm({ ...form, commitmentMonths: parseInt(e.target.value) || 12 })}
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none"
                      >
                        <option value={6}>6 Ay Taahhüt</option>
                        <option value={12}>12 Ay (1 Yıl) Taahhüt</option>
                        <option value={24}>24 Ay (2 Yıl) Taahhüt</option>
                        <option value={36}>36 Ay Taahhüt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">Tutar Şekli</label>
                      <select
                        value={form.amountMode}
                        onChange={(e) => setForm({ ...form, amountMode: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none"
                      >
                        <option value="MONTHLY">Aylık Fatura Tutarı (Her Ay)</option>
                        <option value="TOTAL">Toplam Taahhüt Tutarını Böl</option>
                      </select>
                    </div>
                  </div>

                  {/* Çoklu Telefon Hatları Girişi (Tek fatura - 5 hat vb.) */}
                  <div className="pt-2 border-t border-blue-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-blue-950">
                        📞 Faturaya Bağlı Telefon Hatları & Bitiş Tarihleri
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setPhoneLinesList([
                            ...phoneLinesList,
                            { number: "", title: `${phoneLinesList.length + 1}. Hat`, commitmentEnd: "" },
                          ])
                        }
                        className="text-[10px] font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300"
                      >
                        + Hat Ekle
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {phoneLinesList.map((pl, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-1.5">
                          <input
                            type="text"
                            value={pl.title}
                            onChange={(e) => {
                              const copy = [...phoneLinesList];
                              copy[idx].title = e.target.value;
                              setPhoneLinesList(copy);
                            }}
                            placeholder="Örn: Müdürlük"
                            className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px]"
                          />
                          <input
                            type="text"
                            value={pl.number}
                            onChange={(e) => {
                              const copy = [...phoneLinesList];
                              copy[idx].number = e.target.value;
                              setPhoneLinesList(copy);
                            }}
                            placeholder="0532..."
                            className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px]"
                          />
                          <input
                            type="date"
                            value={pl.commitmentEnd}
                            onChange={(e) => {
                              const copy = [...phoneLinesList];
                              copy[idx].commitmentEnd = e.target.value;
                              setPhoneLinesList(copy);
                            }}
                            title="Taahhüt Bitişi"
                            className="px-1.5 py-1 bg-white border border-blue-200 rounded text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAKSİTLİ BORÇ AYARLARI */}
              {form.entryType === "INSTALLMENT" && !editingExpense && (
                <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-purple-950 font-bold text-xs">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>Taksitli Borç Planı (Veli İadesi, Kredi vb.)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Toplam Taksit Sayısı</label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={form.installmentCount}
                        onChange={(e) => setForm({ ...form, installmentCount: parseInt(e.target.value) || 2 })}
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Tutar Şekli</label>
                      <select
                        value={form.amountMode}
                        onChange={(e) => setForm({ ...form, amountMode: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none"
                      >
                        <option value="TOTAL">Toplam Borcu Taksitlere Böl</option>
                        <option value="MONTHLY">Girilen Tutar Aylık Taksittir</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutar ve Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.entryType === "COMMITMENT" || form.amountMode === "MONTHLY"
                      ? "Aylık Tutar (TL) *"
                      : "Ödenecek Tutar (TL) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.amountDue}
                    onChange={(e) => setForm({ ...form, amountDue: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      {form.category === "INVOICE"
                        ? "📅 Fatura Son Ödeme Tarihi *"
                        : form.category === "CREDIT_CARD"
                        ? "💳 Kart Son Ödeme Tarihi *"
                        : form.entryType === "SINGLE"
                        ? "Vade / Son Ödeme Tarihi *"
                        : "İlk Vade / Başlangıç Tarihi *"}
                    </span>
                    {(form.category === "INVOICE" || form.category === "CREDIT_CARD") && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                        Günü Gelince Hatırlatılır
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* Ay Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giderin Ait Olduğu Ay</label>
                <select
                  value={form.monthIndex}
                  onChange={(e) => setForm({ ...form, monthIndex: parseInt(e.target.value) || 9 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value={7}>7. Ay (Temmuz)</option>
                  <option value={8}>8. Ay (Ağustos)</option>
                  <option value={9}>9. Ay (Eylül)</option>
                  <option value={10}>10. Ay (Ekim)</option>
                  <option value={11}>11. Ay (Kasım)</option>
                  <option value={12}>12. Ay (Aralık)</option>
                </select>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opsiyonel notlar veya detaylar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? "Kaydediliyor..." : editingExpense ? "Güncelle" : "Gideri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: PARÇALI ÖDEME & ÖDEME GEÇMİŞİ                         */}
      {/* ============================================================== */}
      {paymentModalOpen && activePaymentExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-700" />
                <span>Ödeme Girişi Yap</span>
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="mt-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">{activePaymentExpense.title}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>Toplam Borç: <strong>{formatCurrency(activePaymentExpense.amountDue)}</strong></span>
                  <span>Şu Ana Kadar Ödenen: <strong className="text-emerald-700">{formatCurrency(activePaymentExpense.amountPaid)}</strong></span>
                </div>
                <div className="text-right text-[11px] font-extrabold text-rose-600 pt-0.5">
                  Kalan Tutar: {formatCurrency(activePaymentExpense.amountRemaining)}
                </div>

                {/* Önceki Ödeme Geçmişi Dökümü */}
                {activePaymentExpense.paymentHistory && (() => {
                  try {
                    const list = JSON.parse(activePaymentExpense.paymentHistory);
                    if (Array.isArray(list) && list.length > 0) {
                      return (
                        <div className="space-y-1 pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-[10px] text-slate-700 block">Yapılan Ödemeler Geçmişi:</span>
                          <div className="space-y-1 max-h-28 overflow-y-auto">
                            {list.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-lg text-[10px]">
                                <span className="font-semibold text-slate-700">{item.date} - {item.note || `${idx + 1}. Ödeme`}</span>
                                <span className="font-extrabold text-emerald-800">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şimdi Ödenecek Tutar (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={activePaymentExpense.amountRemaining}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-extrabold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödeme Tarihi *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödeme Notu / Dekont No</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Örn: Ziraat Havale, 2. Kısmi Dekont..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {paymentSubmitting ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: YENİ ARAÇ / MÜLK EKLE                                 */}
      {/* ============================================================== */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                <span>{editingAsset ? "Varlık Düzenle" : "Yeni Araç / Mülk Ekle"}</span>
              </h3>
              <button
                onClick={() => setAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Varlık Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="VEHICLE"
                      checked={assetForm.assetType === "VEHICLE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "VEHICLE" })}
                    />
                    <span className="font-bold text-slate-800">🚗 Araç / Servis</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="REAL_ESTATE"
                      checked={assetForm.assetType === "REAL_ESTATE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "REAL_ESTATE" })}
                    />
                    <span className="font-bold text-slate-800">🏢 Ev / Bina / Mülk</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {assetForm.assetType === "VEHICLE" ? "Araç Plakası & Modeli *" : "Mülk / Ev Adresi & Tanımı *"}
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.title}
                  onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                  placeholder={assetForm.assetType === "VEHICLE" ? "Örn: 38 AB 123 - Ford Transit" : "Örn: Kampüs Ana Binası"}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kimin Üzerine / Sahibi</label>
                <input
                  type="text"
                  value={assetForm.owner}
                  onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                  placeholder="Örn: Şirket Aracı, Ahmet Bey, Kiralık Mülk"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              {assetForm.assetType === "VEHICLE" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">TÜVTÜRK Muayene Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.inspectionDate}
                        onChange={(e) => setAssetForm({ ...assetForm, inspectionDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kasko Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.kaskoDate}
                        onChange={(e) => setAssetForm({ ...assetForm, kaskoDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trafik Sigortası Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={assetForm.insuranceDate}
                      onChange={(e) => setAssetForm({ ...assetForm, insuranceDate: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DASK / Bina Sigortası Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={assetForm.housingDate}
                    onChange={(e) => setAssetForm({ ...assetForm, housingDate: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notlar / Poliçe No</label>
                <textarea
                  rows={2}
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  placeholder="Opsiyonel notlar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={assetSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {assetSubmitting ? "Kaydediliyor..." : editingAsset ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GiderlerPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span>Giderler ve Borç Takibi Yükleniyor...</span>
      </div>
    </div>
  );
}

export default function GiderlerPage() {
  return (
    <Suspense fallback={<GiderlerPageFallback />}>
      <GiderlerPageContent />
    </Suspense>
  );
}

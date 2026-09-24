"use client";

import { useState, useEffect, useMemo } from "react";
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
  FileSpreadsheet,
  Download,
  DollarSign,
  ArrowUpDown,
  History,
  Coins,
  Smartphone,
  Tv,
  BellRing,
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
  createdAt: string;
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

export default function GiderlerPage() {
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [installmentOnly, setInstallmentOnly] = useState(false);
  const [commitmentsOnly, setCommitmentsOnly] = useState(false);

  // Yeni / Düzenle Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SchoolExpense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "INVOICE",
    subCategory: "",
    period: "",
    dueDateStr: "",
    dueDate: "",
    amountDue: "",
    periodStatus: "Cari Dönem",
    description: "",
    entryType: "SINGLE", // "SINGLE" | "INSTALLMENT" | "COMMITMENT"
    isInstallment: false,
    installmentCount: 12,
    currentInstallment: 1,
    amountMode: "TOTAL", // "TOTAL" | "MONTHLY"
    isCommitment: false,
    commitmentMonths: 12,
  });

  // Parçalı Ödeme Modalı
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentExpense, setActivePaymentExpense] = useState<SchoolExpense | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory && selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (installmentOnly) params.set("installmentOnly", "true");
      if (commitmentsOnly) params.set("commitmentsOnly", "true");

      const res = await fetch(`/api/giderler?${params.toString()}`);
      const data = await res.json();
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, selectedCategory, selectedStatus, installmentOnly, commitmentsOnly]);

  const stats = useMemo(() => {
    const totalDue = expenses.reduce((sum, e) => sum + e.amountDue, 0);
    const totalPaid = expenses.reduce((sum, e) => sum + e.amountPaid, 0);
    const totalRemaining = expenses.reduce((sum, e) => sum + e.amountRemaining, 0);
    const countPending = expenses.filter((e) => e.status === "PENDING").length;
    const countPartial = expenses.filter((e) => e.status === "PARTIAL").length;
    const countPaid = expenses.filter((e) => e.status === "PAID").length;
    const countInstallment = expenses.filter((e) => Boolean(e.installmentInfo)).length;
    const countCommitment = expenses.filter((e) => Boolean(e.isCommitment)).length;
    return { totalDue, totalPaid, totalRemaining, countPending, countPartial, countPaid, countInstallment, countCommitment };
  }, [expenses]);

  // Taahhüt Bitişi Yaklaşanlar (Son 45 gün)
  const expiringCommitments = useMemo(() => {
    const now = new Date();
    const map = new Map<string, { exp: SchoolExpense; daysLeft: number }>();
    expenses.forEach((e) => {
      if (e.isCommitment && e.commitmentEndDate) {
        const end = new Date(e.commitmentEndDate);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 45) {
          if (!map.has(e.title)) {
            map.set(e.title, { exp: e, daysLeft: diffDays });
          }
        }
      }
    });
    return Array.from(map.values());
  }, [expenses]);

  const openNewModal = () => {
    setEditingExpense(null);
    const todayStr = new Date().toISOString().split("T")[0];
    setForm({
      title: "",
      category: "INVOICE",
      subCategory: "",
      period: "8.Ay",
      dueDateStr: "",
      dueDate: todayStr,
      amountDue: "",
      periodStatus: "Cari Dönem",
      description: "",
      entryType: "SINGLE",
      isInstallment: false,
      installmentCount: 12,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: false,
      commitmentMonths: 12,
    });
    setModalOpen(true);
  };

  const openEditModal = (expense: SchoolExpense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      subCategory: expense.subCategory || "",
      period: expense.period || "",
      dueDateStr: expense.dueDateStr || "",
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split("T")[0] : "",
      amountDue: String(expense.amountDue),
      periodStatus: expense.periodStatus || "Cari Dönem",
      description: expense.description || "",
      entryType: expense.isCommitment ? "COMMITMENT" : expense.installmentInfo ? "INSTALLMENT" : "SINGLE",
      isInstallment: Boolean(expense.installmentInfo),
      installmentCount: 1,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: Boolean(expense.isCommitment),
      commitmentMonths: expense.commitmentMonths || 12,
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          isCommitment,
          isInstallment,
          amountDue: Number(form.amountDue) || 0,
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  const exportToCSV = () => {
    const headers = ["Cari / Kurum", "Tür", "Alt Tür", "Dönem / Taksit", "Tarih / Vade", "Ödenecek", "Ödenen", "Kalan", "Durum", "Not"];
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
      {/* Üst Sekmeler: Personel Cari & Okul Giderleri */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          href="/giderler"
          className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-700 text-white shadow-xs flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          <span>Okul Giderleri & Taksit Takibi</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-teal-800 text-teal-100">
            {stats.countPending + stats.countPartial} Aktif Borç
          </span>
        </Link>
        <Link
          href="/cari"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Personel Cari & Ekstreler</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Okul Gider & Borç Takibi</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Gerçek Okul Verileri
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kiralar, faturalar, velilere taksitli iadeler, krediler, kredi kartları ve tedarikçi çekleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Gider / Taksit Ekle</span>
          </button>
        </div>
      </div>

      {/* Taahhüt Bitişi Yaklaşanlar Erken Uyarı Bildirimi */}
      {expiringCommitments.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
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
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Taahhüdü biten telefon, internet veya TV aboneliklerinde indirimler sona erer ve faturalar katlanır. Lütfen yenileme veya cayma hakkı için kontrol sağlayınız:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {expiringCommitments.map(({ exp, daysLeft }) => (
                <div
                  key={exp.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 shadow-2xs"
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

      {/* 4 Özet Finans Kartı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Toplam Ödenen</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{stats.countPaid} tamamlanan</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700">Kalan Net Borç</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(stats.totalRemaining)}</p>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">{stats.countPending + stats.countPartial} bekleyen</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-700">Taksit & Taahhüt</p>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">{stats.countInstallment + stats.countCommitment} Kalem</p>
            <p className="text-[11px] text-purple-600 mt-0.5">
              {stats.countInstallment} Taksit • {stats.countCommitment} Taahhütlü
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Arama, Kategori Filtreleri & Taksit/Taahhüt Seçenekleri */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari adı, veli, elektrik, doğalgaz, telefon, TV veya açıklama ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Taksitli Olanlar Butonu */}
            <button
              type="button"
              onClick={() => {
                setInstallmentOnly(!installmentOnly);
                if (!installmentOnly) setCommitmentsOnly(false);
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

            {/* Taahhütlüler Butonu */}
            <button
              type="button"
              onClick={() => {
                setCommitmentsOnly(!commitmentsOnly);
                if (!commitmentsOnly) setInstallmentOnly(false);
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

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Giderler yükleniyor...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Cari / Kurum / Kişi</th>
                  <th className="py-3 px-3">Tür & Kategori</th>
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
                {expenses.map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  const Icon = cat.icon;
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
                        {exp.description && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{exp.description}</span>
                        )}
                        {exp.isCommitment && exp.commitmentEndDate && (() => {
                          const end = new Date(exp.commitmentEndDate);
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
                          } else if (diffDays < 0) {
                            return (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                  <AlertCircle className="w-3 h-3 text-rose-700" />
                                  <span>Taahhüt Süresi Doldu!</span>
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>

                      {/* Tür / Kategori */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cat.badgeBg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{exp.subCategory || cat.label}</span>
                        </span>
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
                        <div className="text-slate-800 font-medium">
                          {exp.dueDateStr || (exp.dueDate ? new Date(exp.dueDate).toLocaleDateString("tr-TR") : "-")}
                        </div>
                      </td>

                      {/* Ödenecek */}
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(exp.amountDue)}
                      </td>

                      {/* Ödenen */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {exp.amountPaid > 0 ? formatCurrency(exp.amountPaid) : "-"}
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
                                title="Parçalı / Kısmi Ödeme Gir"
                              >
                                Ödeme Gir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(exp)}
                                className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Tamamını Ödendi Olarak İşaretle"
                              >
                                <CheckCircle2 className="w-4 h-4" />
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

      {/* MODAL 1: Yeni Gider / Taksit Ekle veya Düzenle */}
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
                      : "Örn: Kayseri Elektrik, İlyas Yılmaz, Alp Tuğrul Karaman"
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

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
                    placeholder={
                      form.entryType === "COMMITMENT"
                        ? "Örn: Fiber İnternet, Kurumsal Hat, TV Paketi"
                        : "Örn: F-Elektrik, Bina Kirası"
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* TAAHHÜTLÜ ABONELİK AYARLARI */}
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
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="MONTHLY">Aylık Fatura Tutarı (Her Ay)</option>
                        <option value="TOTAL">Toplam Taahhüt Tutarını Böl</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-700 bg-blue-100/70 p-2 rounded-xl">
                    💡 <strong>Otomatik Plan:</strong> Sistem {form.commitmentMonths} ay boyunca her ayın faturasını otomatik takvime yerleştirir. Taahhüt bitimine 45 gün kala erken uyarı verir.
                  </p>
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
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Tutar Şekli</label>
                      <select
                        value={form.amountMode}
                        onChange={(e) => setForm({ ...form, amountMode: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="TOTAL">Toplam Borcu Taksitlere Böl</option>
                        <option value="MONTHLY">Girilen Tutar Aylık Taksittir</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-700 bg-purple-100/70 p-2 rounded-xl">
                    💡 <strong>Otomatik İlerleme:</strong> Sistem seçtiğiniz ilk tarihten itibaren her aya sırayla {form.installmentCount} taksiti otomatik oluşturur. Her ay elle girmenize gerek kalmaz.
                  </p>
                </div>
              )}

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
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.entryType === "SINGLE" ? "Vade Tarihi" : "İlk Vade / Başlangıç Tarihi"}
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dönem</label>
                  <input
                    type="text"
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="Örn: 7.Ay, 8.Ay, 2026/08"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durum Etiketi</label>
                  <input
                    type="text"
                    value={form.periodStatus}
                    onChange={(e) => setForm({ ...form, periodStatus: e.target.value })}
                    placeholder="Örn: Cari Dönem, KONTROL ET"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

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

      {/* MODAL 2: Parçalı / Kısmi Ödeme Ekleme */}
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
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödenen Tutar (TL) *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Ödeme Notu / Dekont No</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Örn: Ziraat Havale, 1. Parça Dekont No..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
    </div>
  );
}

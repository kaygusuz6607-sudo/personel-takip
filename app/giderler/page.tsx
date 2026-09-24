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
    amountDue: "",
    periodStatus: "Cari Dönem",
    description: "",
    isInstallment: false,
    installmentCount: 1,
    currentInstallment: 1,
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
  }, [search, selectedCategory, selectedStatus, installmentOnly]);

  const stats = useMemo(() => {
    const totalDue = expenses.reduce((sum, e) => sum + e.amountDue, 0);
    const totalPaid = expenses.reduce((sum, e) => sum + e.amountPaid, 0);
    const totalRemaining = expenses.reduce((sum, e) => sum + e.amountRemaining, 0);
    const countPending = expenses.filter((e) => e.status === "PENDING").length;
    const countPartial = expenses.filter((e) => e.status === "PARTIAL").length;
    const countPaid = expenses.filter((e) => e.status === "PAID").length;
    const countInstallment = expenses.filter((e) => Boolean(e.installmentInfo)).length;
    return { totalDue, totalPaid, totalRemaining, countPending, countPartial, countPaid, countInstallment };
  }, [expenses]);

  const openNewModal = () => {
    setEditingExpense(null);
    setForm({
      title: "",
      category: "INVOICE",
      subCategory: "",
      period: "8.Ay",
      dueDateStr: "",
      amountDue: "",
      periodStatus: "Cari Dönem",
      description: "",
      isInstallment: false,
      installmentCount: 1,
      currentInstallment: 1,
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
      amountDue: String(expense.amountDue),
      periodStatus: expense.periodStatus || "Cari Dönem",
      description: expense.description || "",
      isInstallment: Boolean(expense.installmentInfo),
      installmentCount: 1,
      currentInstallment: 1,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingExpense ? `/api/giderler/${editingExpense.id}` : "/api/giderler";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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
            <p className="text-xs font-semibold text-purple-700">Taksitli İşlemler</p>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">{stats.countInstallment} Kalem</p>
            <p className="text-[11px] text-purple-600 mt-0.5">Veli iadesi & Krediler</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Arama, Kategori Filtreleri & Taksit Seçeneği */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari adı, veli, elektrik, doğalgaz, kredi kartı veya açıklama ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Taksitli Olanlar Butonu */}
            <button
              type="button"
              onClick={() => setInstallmentOnly(!installmentOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                installmentOnly
                  ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sadece Taksitli Olanlar ({stats.countInstallment})</span>
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
                        <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                          <span>{exp.title}</span>
                          {exp.periodStatus && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {exp.periodStatus}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{exp.description}</span>
                        )}
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
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cari / Kurum / Kişi Adı *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Kayseri Elektrik, İlyas Yılmaz, Alp Tuğrul Karaman"
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
                    placeholder="Örn: F-Elektrik, Bina Kirası"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* Taksit Seçeneği */}
              {!editingExpense && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isInstallment}
                      onChange={(e) => setForm({ ...form, isInstallment: e.target.checked })}
                      className="rounded text-purple-700 focus:ring-purple-600"
                    />
                    <span className="font-bold text-purple-900 text-xs">
                      Bu ödeme taksitli bir ödemedir (Örn: Veli İadesi, Kredi vb.)
                    </span>
                  </label>

                  {form.isInstallment && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 mb-0.5">
                          Toplam Taksit Sayısı
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={form.installmentCount}
                          onChange={(e) => setForm({ ...form, installmentCount: parseInt(e.target.value) || 1 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950"
                        />
                        <span className="text-[10px] text-purple-700 block mt-0.5">
                          Tutar taksit sayısına eşit bölünerek sıralı taksitler üretilir.
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 mb-0.5">
                          Şu Anki Taksit (Tekli ise)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={form.installmentCount}
                          value={form.currentInstallment}
                          onChange={(e) => setForm({ ...form, currentInstallment: parseInt(e.target.value) || 1 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ödenecek Tutar (TL) *
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
                  <label className="block font-bold text-slate-700 mb-1">Vade / Tarih</label>
                  <input
                    type="text"
                    value={form.dueDateStr}
                    onChange={(e) => setForm({ ...form, dueDateStr: e.target.value })}
                    placeholder="Örn: 15 Ağustos 2026 Cumartesi"
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

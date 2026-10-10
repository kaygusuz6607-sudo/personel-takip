"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Zap,
  Droplets,
  Flame,
  Globe,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpDown,
  Filter,
  Check,
  Edit2,
  Trash2,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Layers,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  X,
  FileText,
  Landmark,
} from "lucide-react";

export type UtilityCategory = "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "TELEPHONE" | "OTHER";

interface UtilitySubscription {
  id: string;
  name: string;
  category: UtilityCategory;
  institution: string;
  subscriberNo?: string | null;
  meterNo?: string | null;
  paymentDay: number;
  paymentMethod: string;
  cardHolder?: string | null;
  cardBank?: string | null;
  cardId?: string | null;
  notes?: string | null;
  status: "ACTIVE" | "PASSIVE";
  totalAnnual?: number;
  totalPaid?: number;
  totalRemaining?: number;
  billCount?: number;
  unpaidCount?: number;
  currentBill?: UtilityBill | null;
}

interface UtilityBill {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  category: UtilityCategory;
  institution: string;
  subscriberNo?: string | null;
  meterNo?: string | null;
  defaultPaymentMethod?: string;
  period: string; // "2026-10"
  periodLabel: string;
  year: number;
  month: number;
  billDate?: string | null;
  dueDate: string; // "YYYY-MM-DD"
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  consumption: number;
  billNo?: string | null;
  paidDate?: string | null;
  paidMethod?: string | null;
  cardHolder?: string | null;
  cardBank?: string | null;
  cardId?: string | null;
  schoolExpenseId?: string | null;
  notes?: string | null;
  paymentHistory?: string | null;
}

interface MatrixMonth {
  year: number;
  month: number;
  label: string;
  period: string;
}

interface MatrixCell {
  period: string;
  label: string;
  year: number;
  month: number;
  hasBill: boolean;
  billId?: string | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  paidDate?: string | null;
  paidMethod?: string | null;
}

interface MatrixRow {
  subscription: UtilitySubscription;
  cells: MatrixCell[];
  rowTotal: number;
  rowPaid: number;
  rowRemaining: number;
}

interface MatrixTotal {
  period: string;
  label: string;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  count: number;
}

export default function FaturalarPage() {
  const [subscriptions, setSubscriptions] = useState<UtilitySubscription[]>([]);
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [matrixMonths, setMatrixMonths] = useState<MatrixMonth[]>([]);
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [matrixTotals, setMatrixTotals] = useState<MatrixTotal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Görünüm Sekmesi
  const [activeTab, setActiveTab] = useState<"BILLS" | "MATRIX" | "SUBSCRIPTIONS">("BILLS");

  // Filtreler
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modallar
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Form Verileri
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);
  const [payingBill, setPayingBill] = useState<UtilityBill | null>(null);
  const [editingSub, setEditingSub] = useState<UtilitySubscription | null>(null);

  const [billForm, setBillForm] = useState({
    subscriptionId: "",
    dueDate: new Date().toISOString().slice(0, 10),
    amount: "",
    consumption: "",
    billNo: "",
    notes: "",
    syncToExpense: true,
  });

  const [payForm, setPayForm] = useState({
    payAmount: "",
    paidDate: new Date().toISOString().slice(0, 10),
    paidMethod: "CASH",
    cardHolder: "",
    cardBank: "",
    cardId: "",
    note: "Fatura Ödemesi",
  });

  const [subForm, setSubForm] = useState<{
    name: string;
    category: UtilityCategory;
    institution: string;
    subscriberNo: string;
    meterNo: string;
    paymentDay: number;
    paymentMethod: string;
    cardHolder: string;
    cardBank: string;
    cardId: string;
    notes: string;
  }>({
    name: "",
    category: "ELECTRICITY",
    institution: "KCETAŞ",
    subscriberNo: "",
    meterNo: "",
    paymentDay: 15,
    paymentMethod: "CREDIT_CARD",
    cardHolder: "",
    cardBank: "",
    cardId: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Veri Çekme
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const url = selectedPeriod && selectedPeriod !== "ALL"
        ? `/api/faturalar?month=${encodeURIComponent(selectedPeriod)}`
        : `/api/faturalar`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setBills(data.bills || []);
        setAvailablePeriods(data.availablePeriods || []);
        if (data.matrix) {
          setMatrixMonths(data.matrix.months || []);
          setMatrixRows(data.matrix.rows || []);
          setMatrixTotals(data.matrix.totals || []);
        }
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Faturalar yüklenemedi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  // Kategori İkon ve Renk Tanımları
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "ELECTRICITY":
        return {
          label: "Elektrik",
          icon: Zap,
          color: "text-amber-600 bg-amber-50 border-amber-200",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
          accent: "border-l-amber-500",
        };
      case "WATER":
        return {
          label: "Su",
          icon: Droplets,
          color: "text-blue-600 bg-blue-50 border-blue-200",
          badge: "bg-blue-100 text-blue-800 border-blue-300",
          accent: "border-l-blue-500",
        };
      case "GAS":
        return {
          label: "Doğalgaz",
          icon: Flame,
          color: "text-orange-600 bg-orange-50 border-orange-200",
          badge: "bg-orange-100 text-orange-800 border-orange-300",
          accent: "border-l-orange-500",
        };
      case "INTERNET":
        return {
          label: "İnternet",
          icon: Globe,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
          accent: "border-l-emerald-500",
        };
      case "TELEPHONE":
        return {
          label: "Telefon / Telekom",
          icon: PhoneCall,
          color: "text-purple-600 bg-purple-50 border-purple-200",
          badge: "bg-purple-100 text-purple-800 border-purple-300",
          accent: "border-l-purple-500",
        };
      default:
        return {
          label: "Diğer Fatura",
          icon: ReceiptText,
          color: "text-slate-600 bg-slate-50 border-slate-200",
          badge: "bg-slate-100 text-slate-800 border-slate-300",
          accent: "border-l-slate-400",
        };
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Filtrelenmiş Faturalar
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Arama filtresi
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (b.subscriptionName || "").toLowerCase().includes(q);
        const matchSubNo = (b.subscriberNo || "").toLowerCase().includes(q);
        const matchInst = (b.institution || "").toLowerCase().includes(q);
        const matchNote = (b.notes || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSubNo && !matchInst && !matchNote) return false;
      }

      // Kategori filtresi
      if (selectedCategory !== "ALL" && b.category !== selectedCategory) {
        return false;
      }

      // Durum filtresi
      if (selectedStatus === "PAID" && b.status !== "PAID") return false;
      if (selectedStatus === "PENDING" && b.status === "PAID") return false;
      if (selectedStatus === "OVERDUE") {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (b.status === "PAID" || b.dueDate >= todayStr) return false;
      }

      return true;
    });
  }, [bills, searchTerm, selectedCategory, selectedStatus]);

  // Hızlı Ödendi Yap (1-Click)
  const handleQuickPay = async (bill: UtilityBill) => {
    if (
      !confirm(
        `"${bill.subscriptionName}" faturasının ${formatCurrency(bill.remainingAmount || bill.amount)} tutarını "ÖDENDİ" olarak kapatmak istiyor musunuz?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/faturalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_BILL",
          id: bill.id,
          paidDate: new Date().toISOString().slice(0, 10),
          paidMethod: bill.defaultPaymentMethod || "CASH",
          cardHolder: bill.cardHolder || "",
          cardBank: bill.cardBank || "",
          cardId: bill.cardId || "",
          note: "Hızlı Tek Tıkla Ödeme",
        }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme yapılamadı.");
      }
    } catch {
      alert("Sunucu hatası oluştu.");
    }
  };

  // Ödeme Sıfırla (Reset)
  const handleResetPay = async (bill: UtilityBill) => {
    if (
      !confirm(
        `"${bill.subscriptionName}" için yapılan ödemeyi iptal edip faturayı tekrar "BEKLİYOR" durumuna almak istiyor musunuz?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/faturalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_BILL_PAYMENT",
          id: bill.id,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  // Fatura Sil
  const handleDeleteBill = async (bill: UtilityBill) => {
    if (!confirm(`"${bill.subscriptionName} - ${bill.periodLabel}" faturasını silmek istiyor musunuz?`)) return;

    try {
      const res = await fetch("/api/faturalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_BILL",
          id: bill.id,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  // Fatura Kaydet / Güncelle
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.subscriptionId || !billForm.amount || Number(billForm.amount) <= 0) {
      alert("Lütfen abonelik ve geçerli fatura tutarı girin.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingBill) {
        const res = await fetch("/api/faturalar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UPDATE_BILL",
            id: editingBill.id,
            amount: Number(billForm.amount),
            dueDate: billForm.dueDate,
            consumption: Number(billForm.consumption) || 0,
            billNo: billForm.billNo,
            notes: billForm.notes,
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/faturalar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ADD_BILL",
            subscriptionId: billForm.subscriptionId,
            amount: Number(billForm.amount),
            dueDate: billForm.dueDate,
            consumption: Number(billForm.consumption) || 0,
            billNo: billForm.billNo,
            notes: billForm.notes,
            syncToExpense: billForm.syncToExpense,
          }),
        });
        if (!res.ok) throw new Error();
      }

      setIsBillModalOpen(false);
      setEditingBill(null);
      await fetchData();
    } catch (err: any) {
      alert("Fatura kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Ödeme Modalı Kaydet
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/faturalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_BILL",
          id: payingBill.id,
          payAmount: Number(payForm.payAmount),
          paidDate: payForm.paidDate,
          paidMethod: payForm.paidMethod,
          cardHolder: payForm.cardHolder,
          cardBank: payForm.cardBank,
          cardId: payForm.cardId,
          note: payForm.note,
        }),
      });

      if (res.ok) {
        setIsPayModalOpen(false);
        setPayingBill(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme kaydedilemedi.");
      }
    } catch {
      alert("Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Abonelik Kaydet / Güncelle
  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name.trim()) {
      alert("Abonelik adı zorunludur.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingSub) {
        const res = await fetch("/api/faturalar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UPDATE_SUBSCRIPTION",
            id: editingSub.id,
            ...subForm,
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/faturalar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ADD_SUBSCRIPTION",
            ...subForm,
          }),
        });
        if (!res.ok) throw new Error();
      }

      setIsSubModalOpen(false);
      setEditingSub(null);
      await fetchData();
    } catch {
      alert("Abonelik kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Abonelik Sil
  const handleDeleteSub = async (sub: UtilitySubscription) => {
    if (!confirm(`"${sub.name}" aboneliğini ve bağlı tüm fatura geçmişini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch("/api/faturalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_SUBSCRIPTION",
          id: sub.id,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert("Silinemedi.");
    }
  };

  const openPayModal = (bill: UtilityBill) => {
    setPayingBill(bill);
    setPayForm({
      payAmount: String(bill.remainingAmount > 0 ? bill.remainingAmount : bill.amount),
      paidDate: new Date().toISOString().slice(0, 10),
      paidMethod: bill.defaultPaymentMethod || "CASH",
      cardHolder: bill.cardHolder || "",
      cardBank: bill.cardBank || "",
      cardId: bill.cardId || "",
      note: `${bill.subscriptionName} Fatura Ödemesi`,
    });
    setIsPayModalOpen(true);
  };

  const openEditBillModal = (bill: UtilityBill) => {
    setEditingBill(bill);
    setBillForm({
      subscriptionId: bill.subscriptionId,
      dueDate: bill.dueDate,
      amount: String(bill.amount),
      consumption: String(bill.consumption || ""),
      billNo: bill.billNo || "",
      notes: bill.notes || "",
      syncToExpense: false,
    });
    setIsBillModalOpen(true);
  };

  const openNewBillModal = (presetSubId?: string) => {
    setEditingBill(null);
    setBillForm({
      subscriptionId: presetSubId || (subscriptions[0]?.id || ""),
      dueDate: new Date().toISOString().slice(0, 10),
      amount: "",
      consumption: "",
      billNo: "",
      notes: "",
      syncToExpense: true,
    });
    setIsBillModalOpen(true);
  };

  const openEditSubModal = (sub: UtilitySubscription) => {
    setEditingSub(sub);
    setSubForm({
      name: sub.name,
      category: sub.category,
      institution: sub.institution,
      subscriberNo: sub.subscriberNo || "",
      meterNo: sub.meterNo || "",
      paymentDay: sub.paymentDay || 15,
      paymentMethod: sub.paymentMethod || "CASH",
      cardHolder: sub.cardHolder || "",
      cardBank: sub.cardBank || "",
      cardId: sub.cardId || "",
      notes: sub.notes || "",
    });
    setIsSubModalOpen(true);
  };

  const openNewSubModal = () => {
    setEditingSub(null);
    setSubForm({
      name: "",
      category: "GAS",
      institution: "Kayserigaz",
      subscriberNo: "",
      meterNo: "",
      paymentDay: 15,
      paymentMethod: "BANK",
      cardHolder: "",
      cardBank: "",
      cardId: "",
      notes: "",
    });
    setIsSubModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ÜST BAŞLIK & BUTONLAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-teal-600 text-white rounded-2xl shadow-md">
            <ReceiptText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Fatura & Abonelik Takibi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 border border-teal-200">
                Kurum Carileri
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Doğalgaz, Elektrik, Su, İnternet ve Türk Telekom faturalarının aylık takibi, ödeme durumları ve ay bazlı tüketim analizi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={openNewSubModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-extrabold rounded-xl transition-all"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>+ Yeni Abonelik / Kurum</span>
          </button>

          <button
            type="button"
            onClick={() => openNewBillModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Fatura Girişi Yap</span>
          </button>
        </div>
      </div>

      {/* KPI BENTO GRID - ÖZET KARTLAR */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bu Ay Toplam Fatura */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {stats.currentPeriodLabel} Faturası
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(stats.currentMonthTotal)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                İlgili ay için kurumlardan gelen toplam fatura tutarı
              </p>
            </div>
          </div>

          {/* Bu Ay Ödenen */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs relative overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">
                Bu Ay Ödenen Faturalar
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrency(stats.currentMonthPaid)}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Kasadan, bankadan veya kredi kartından ödenen kısım
              </p>
            </div>
          </div>

          {/* Bu Ay Bekleyen / Kalan */}
          <div className={`bg-white p-4 rounded-2xl border shadow-2xs relative overflow-hidden ${stats.currentMonthRemaining > 0 ? "border-rose-200 bg-rose-50/20" : "border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700">
                Ödenmeyi Bekleyen Borç
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-rose-700">
                {formatCurrency(stats.currentMonthRemaining)}
              </div>
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {stats.currentMonthRemaining > 0 ? "Bu ay henüz kapatılmamış bekleyen faturalar" : "Tüm faturalar kapatıldı ✓"}
              </p>
            </div>
          </div>

          {/* Yıllık / Dönemsel Toplam Yük */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs relative overflow-hidden bg-gradient-to-b from-white to-indigo-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700">
                Dönemsel Toplam Faturalar
              </span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-indigo-900">
                {formatCurrency(stats.totalBilled)}
              </div>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">
                Ödenen: <strong>{formatCurrency(stats.totalPaid)}</strong> • Kalan: <strong>{formatCurrency(stats.totalRemaining)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GÖRÜNÜM SEKMELERİ (TABS) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("BILLS")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === "BILLS"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>📋 Aylık Fatura & Cari Listesi ({filteredBills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MATRIX")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === "MATRIX"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📅 Aylara Göre Karşılaştırma Matrisi (Ay Ay Fatura Raporu)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUBSCRIPTIONS")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === "SUBSCRIPTIONS"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 Abonelik & Kurum Tanımları ({subscriptions.length})</span>
        </button>
      </div>

      {/* ======================= SEKME 1: AYLIK FATURA & CARİ LİSTESİ ======================= */}
      {activeTab === "BILLS" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* FİLTRE VE ARAMA ÇUBUĞU */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dönem / Ay Seçimi */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                  📅 Dönem / Ay Seçimi:
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                >
                  <option value="ALL">Tüm Dönemler (Bütün Faturalar)</option>
                  {availablePeriods.map((p) => (
                    <option key={p.period} value={p.period}>
                      {p.label} ({p.count} Fatura • {formatCurrency(p.total)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Filtresi */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                  ⚡ Fatura Türü:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                >
                  <option value="ALL">Tüm Fatura Türleri</option>
                  <option value="ELECTRICITY">⚡ Elektrik (KCETAŞ vb.)</option>
                  <option value="WATER">💧 Su (KASKİ vb.)</option>
                  <option value="GAS">🔥 Doğalgaz (Kayserigaz vb.)</option>
                  <option value="INTERNET">🌐 İnternet (Millenicom vb.)</option>
                  <option value="TELEPHONE">📞 Türk Telekom / Telefon</option>
                  <option value="OTHER">Diğer Faturalar</option>
                </select>
              </div>

              {/* Durum Filtresi */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                  Ödeme Durumu:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                >
                  <option value="ALL">Tümü (Ödenen & Bekleyen)</option>
                  <option value="PENDING">⏳ Sadece Bekleyenler</option>
                  <option value="PAID">✓ Sadece Ödenenler</option>
                  <option value="OVERDUE">🔴 Vadesi Geçenler</option>
                </select>
              </div>

              {/* Arama Kutusu */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                  🔍 Kurum / Abone No Ara:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Elektrik, KASKİ, tesisat no..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Hızlı Kategori Rozetleri */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Hızlı Filtre:</span>
              {[
                { id: "ALL", label: "Tümü", icon: Layers },
                { id: "ELECTRICITY", label: "Elektrik", icon: Zap },
                { id: "WATER", label: "Su", icon: Droplets },
                { id: "GAS", label: "Doğalgaz", icon: Flame },
                { id: "INTERNET", label: "İnternet", icon: Globe },
                { id: "TELEPHONE", label: "Telekom", icon: PhoneCall },
              ].map((c) => {
                const Icon = c.icon;
                const isSel = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSel
                        ? "bg-teal-700 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FATURALAR TABLOSU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <p className="text-xs font-bold">Faturalar yükleniyor...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <ReceiptText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Seçili kriterlere uygun fatura bulunamadı.</p>
                <button
                  type="button"
                  onClick={() => openNewBillModal()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl"
                >
                  + Yeni Fatura Ekle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">Kurum / Abonelik</th>
                      <th className="py-3 px-3">Dönem / Ay</th>
                      <th className="py-3 px-3">Son Ödeme (Vade)</th>
                      <th className="py-3 px-3 text-right">Fatura Tutarı</th>
                      <th className="py-3 px-3 text-right">Ödenen</th>
                      <th className="py-3 px-3 text-right">Kalan Borç</th>
                      <th className="py-3 px-3 text-center">Durum</th>
                      <th className="py-3 px-3">Ödeme Detayı</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBills.map((bill) => {
                      const meta = getCategoryMeta(bill.category);
                      const Icon = meta.icon;
                      const isOverdue = bill.status !== "PAID" && bill.dueDate < new Date().toISOString().slice(0, 10);

                      return (
                        <tr
                          key={bill.id}
                          className={`hover:bg-slate-50/70 transition-colors ${bill.status === "PAID" ? "bg-emerald-50/10" : ""}`}
                        >
                          {/* Kurum & Abonelik */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl border ${meta.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block">
                                  {bill.subscriptionName}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span>{bill.institution}</span>
                                  {bill.subscriberNo && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono font-medium">Abone: {bill.subscriberNo}</span>
                                    </>
                                  )}
                                  {bill.meterNo && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-400">{bill.meterNo}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dönem / Ay */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 block">
                              {bill.periodLabel}
                            </span>
                            {bill.billNo && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                No: {bill.billNo}
                              </span>
                            )}
                          </td>

                          {/* Son Ödeme (Vade) */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className={`font-semibold ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                                {bill.dueDate}
                              </span>
                            </div>
                            {isOverdue && (
                              <span className="inline-block text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 mt-0.5">
                                Vadesi Geçti!
                              </span>
                            )}
                          </td>

                          {/* Fatura Tutarı */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatCurrency(bill.amount)}
                            </span>
                            {bill.consumption > 0 && (
                              <span className="block text-[10px] text-slate-400">
                                {bill.consumption} {bill.category === "ELECTRICITY" ? "kWh" : bill.category === "GAS" || bill.category === "WATER" ? "m³" : ""}
                              </span>
                            )}
                          </td>

                          {/* Ödenen */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(bill.paidAmount)}
                            </span>
                          </td>

                          {/* Kalan Borç */}
                          <td className="py-3 px-3 text-right">
                            <span className={`font-extrabold ${bill.remainingAmount > 0 ? "text-rose-600 font-black" : "text-slate-400"}`}>
                              {formatCurrency(bill.remainingAmount)}
                            </span>
                          </td>

                          {/* Durum Rozeti */}
                          <td className="py-3 px-3 text-center">
                            {bill.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ÖDENDİ</span>
                              </span>
                            ) : bill.status === "PARTIAL" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3" />
                                <span>KISMİ</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertCircle className="w-3 h-3" />
                                <span>GECİKTİ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                                <Clock className="w-3 h-3" />
                                <span>BEKLİYOR</span>
                              </span>
                            )}
                          </td>

                          {/* Ödeme Detayı */}
                          <td className="py-3 px-3">
                            {bill.status === "PAID" || bill.paidAmount > 0 ? (
                              <div className="text-[11px]">
                                <span className="font-semibold text-slate-700 block">
                                  {bill.paidMethod === "CREDIT_CARD" ? "💳 Kredi Kartı" : bill.paidMethod === "BANK" ? "🏦 Banka/Havale" : "💵 Nakit/Kasa"}
                                </span>
                                {bill.paidDate && (
                                  <span className="text-slate-400 text-[10px]">
                                    {bill.paidDate} tarihinde ödendi
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">-</span>
                            )}
                          </td>

                          {/* İşlemler */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {bill.status !== "PAID" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickPay(bill)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black rounded-lg transition-all"
                                    title="Tek tıkla ödendi olarak işaretle"
                                  >
                                    ✓ Ödendi
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openPayModal(bill)}
                                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold rounded-lg transition-all"
                                  >
                                    Öde →
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleResetPay(bill)}
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                                  title="Ödemeyi İptal Et / Bekliyora Al"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditBillModal(bill)}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                title="Faturayı Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBill(bill)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                title="Faturayı Sil"
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

      {/* ======================= SEKME 2: AYLARA GÖRE KARŞILAŞTIRMA MATRİSİ ======================= */}
      {activeTab === "MATRIX" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Aylık Fatura Karşılaştırma Matrisi (2026 - 2027 Sezonu)
              </h2>
              <p className="text-xs text-slate-500">
                Aboneliklerin ay ay ne kadar fatura ürettiği, ödeme durumları ve genel aylık fatura yükü karşılaştırması
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Ödendi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Bekliyor
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Fatura Henüz Gelmedi
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-100 z-10">
                      Abonelik / Kurum
                    </th>
                    {matrixMonths.map((m) => (
                      <th key={m.period} className="py-3 px-3 text-center min-w-[95px]">
                        {m.label}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right min-w-[120px] bg-slate-200/60 font-black">
                      TOPLAM
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {matrixRows.map((row) => {
                    const meta = getCategoryMeta(row.subscription.category);
                    const Icon = meta.icon;

                    return (
                      <tr key={row.subscription.id} className="hover:bg-slate-50/50">
                        {/* Abonelik Adı (Sticky Kolon) */}
                        <td className="py-3 px-4 font-extrabold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${meta.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span>{row.subscription.name}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {row.subscription.institution}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Ay Ay Hücreler */}
                        {row.cells.map((cell) => {
                          return (
                            <td
                              key={cell.period}
                              className="py-2 px-2 text-center border-r border-slate-50"
                            >
                              {cell.hasBill ? (
                                <div
                                  className={`p-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${
                                    cell.status === "PAID"
                                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                                      : "bg-amber-50/80 border-amber-300 text-amber-900"
                                  }`}
                                  title={`${row.subscription.name} (${cell.label}): ${formatCurrency(cell.amount)} - ${cell.status === "PAID" ? "Ödendi" : "Bekliyor"}`}
                                >
                                  <div>{cell.amount.toLocaleString("tr-TR")} ₺</div>
                                  <span className={`text-[9px] font-black block mt-0.5 ${cell.status === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                                    {cell.status === "PAID" ? "✓ Ödendi" : "⏳ Bekliyor"}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    openNewBillModal(row.subscription.id);
                                    setBillForm((prev) => ({
                                      ...prev,
                                      dueDate: `${cell.year}-${String(cell.month).padStart(2, "0")}-15`,
                                    }));
                                  }}
                                  className="text-[11px] text-slate-300 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg font-bold"
                                  title="Bu aya fatura gir"
                                >
                                  + Gir
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Satır Toplamı */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 bg-slate-50/50">
                          <div>{formatCurrency(row.rowTotal)}</div>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Ödenen: {formatCurrency(row.rowPaid)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* SÜTUN ALTTOPLAMLARI */}
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-4 sticky left-0 bg-slate-100 z-10 font-black">
                      AYLIK TOPLAM FATURALAR:
                    </td>
                    {matrixTotals.map((tot) => (
                      <td key={tot.period} className="py-3 px-2 text-center">
                        <div className="text-xs text-slate-900 font-black">
                          {tot.totalAmount.toLocaleString("tr-TR")} ₺
                        </div>
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          {tot.totalPaid.toLocaleString("tr-TR")} ₺
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right text-sm bg-slate-200 font-black text-indigo-950">
                      {formatCurrency(matrixTotals.reduce((s, t) => s + t.totalAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= SEKME 3: ABONELİK TANIMLARI ======================= */}
      {activeTab === "SUBSCRIPTIONS" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Kayıtlı Kurum & Sayaç Abonelikleri (Abonelik Carileri)
              </h2>
              <p className="text-xs text-slate-500">
                Okula ait elektrik, su, doğalgaz, internet ve telefon hatlarının resmi abone numaraları ve ödeme tanımları
              </p>
            </div>
            <button
              type="button"
              onClick={openNewSubModal}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-2xs"
            >
              + Yeni Abonelik Tanımla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => {
              const meta = getCategoryMeta(sub.category);
              const Icon = meta.icon;

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all border-l-4 ${meta.accent} space-y-4`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${meta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          {sub.name}
                        </h3>
                        <span className="text-xs text-slate-500 font-semibold">
                          {sub.institution}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Detay Bilgileri */}
                  <div className="bg-slate-50/80 p-3 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Abone / Sözleşme No:</span>
                      <span className="font-mono font-extrabold text-slate-800">
                        {sub.subscriberNo || "Tanımsız"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Sayaç / Lokasyon:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {sub.meterNo || "Genel"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Ödeme Yöntemi:</span>
                      <span className="font-extrabold text-slate-800">
                        {sub.paymentMethod === "CREDIT_CARD" ? "💳 Kredi Kartı" : sub.paymentMethod === "BANK" ? "🏦 Banka" : "💵 Nakit/Kasa"}
                      </span>
                    </div>
                    {sub.cardHolder && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Bağlı Kart:</span>
                        <span className="font-bold text-purple-800">
                          {sub.cardHolder} ({sub.cardBank})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Finansal Özet */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Toplam Fatura</span>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(sub.totalAnnual || 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">Kalan Borç</span>
                      <span className={`font-extrabold ${(sub.totalRemaining || 0) > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {formatCurrency(sub.totalRemaining || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Eylemler */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openNewBillModal(sub.id)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-teal-700 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Fatura Gir</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditSubModal(sub)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSub(sub)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= MODAL 1: FATURA GİRİŞİ / DÜZENLEME ======================= */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ReceiptText className="w-5 h-5 text-teal-200" />
                <h3 className="font-extrabold text-base">
                  {editingBill ? "Fatura Bilgilerini Güncelle" : "Yeni Fatura Girişi"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBillModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Abonelik / Kurum Seçimi *
                </label>
                <select
                  disabled={Boolean(editingBill)}
                  value={billForm.subscriptionId}
                  onChange={(e) => setBillForm({ ...billForm, subscriptionId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 bg-slate-50 focus:outline-teal-500"
                >
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.institution} - {s.subscriberNo || "Genel"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gelen Fatura Tutarı (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border-2 border-teal-400 bg-teal-50/40 rounded-xl text-sm font-black text-teal-900 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Son Ödeme Tarihi (Vade) *
                  </label>
                  <input
                    type="date"
                    required
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tüketim Miktarı (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={billForm.consumption}
                    onChange={(e) => setBillForm({ ...billForm, consumption: e.target.value })}
                    placeholder="kWh, m³ vb."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fatura Seri / Sıra No
                  </label>
                  <input
                    type="text"
                    value={billForm.billNo}
                    onChange={(e) => setBillForm({ ...billForm, billNo: e.target.value })}
                    placeholder="Örn: ETT202600123"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={billForm.notes}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              {!editingBill && (
                <label className="flex items-center gap-2 p-2 bg-teal-50/70 border border-teal-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billForm.syncToExpense}
                    onChange={(e) => setBillForm({ ...billForm, syncToExpense: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-teal-900">
                    Okul Giderleri listesine de otomatik eklensin
                  </span>
                </label>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
                >
                  {submitting ? "Kaydediliyor..." : editingBill ? "Güncelle" : "Faturayı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL 2: FATURA ÖDEME MODALI ======================= */}
      {isPayModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Fatura Ödemesi Kaydet</h3>
                <p className="text-xs text-emerald-100 mt-0.5">{payingBill.subscriptionName} • {payingBill.periodLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">Toplam Fatura</span>
                  <span className="text-sm font-black text-slate-800">{formatCurrency(payingBill.amount)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">Ödenen</span>
                  <span className="text-sm font-bold text-emerald-700">{formatCurrency(payingBill.paidAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-bold block">Kalan Borç</span>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(payingBill.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödenecek Tutar (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payingBill.remainingAmount > 0 ? payingBill.remainingAmount : payingBill.amount}
                  required
                  value={payForm.payAmount}
                  onChange={(e) => setPayForm({ ...payForm, payAmount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-emerald-400 bg-emerald-50/40 rounded-xl text-base font-black text-emerald-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={payForm.paidDate}
                  onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Yöntemi / Kanalı *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "💵 Nakit/Kasa" },
                    { id: "BANK", label: "🏦 Banka/EFT" },
                    { id: "CREDIT_CARD", label: "💳 Kredi Kartı" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayForm({ ...payForm, paidMethod: m.id })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        payForm.paidMethod === m.id
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {payForm.paidMethod === "CREDIT_CARD" && (
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-extrabold text-purple-950">
                    💳 Kart Sahibi & Banka:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Kart Sahibi (Örn: SIMCU / MAÇ)"
                      value={payForm.cardHolder}
                      onChange={(e) => setPayForm({ ...payForm, cardHolder: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-950"
                    />
                    <input
                      type="text"
                      placeholder="Banka (Örn: Ziraat Bankası)"
                      value={payForm.cardBank}
                      onChange={(e) => setPayForm({ ...payForm, cardBank: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-950"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İşlem Notu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  placeholder="Dekont no, ödeme notu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
                >
                  {submitting ? "İşleniyor..." : "✓ Ödemeyi Onayla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL 3: ABONELİK TANIMLAMA / DÜZENLEME ======================= */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-200" />
                <h3 className="font-extrabold text-base">
                  {editingSub ? "Abonelik Bilgilerini Düzenle" : "Yeni Abonelik & Kurum Tanımla"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Abonelik / Kurum Adı *
                </label>
                <input
                  type="text"
                  required
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  placeholder="Örn: Kayserigaz Doğalgaz, KCETAŞ Elektrik..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fatura Türü *
                  </label>
                  <select
                    value={subForm.category}
                    onChange={(e) => setSubForm({ ...subForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                  >
                    <option value="ELECTRICITY">⚡ Elektrik</option>
                    <option value="WATER">💧 Su</option>
                    <option value="GAS">🔥 Doğalgaz</option>
                    <option value="INTERNET">🌐 İnternet</option>
                    <option value="TELEPHONE">📞 Telefon / Telekom</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kurum Adı
                  </label>
                  <input
                    type="text"
                    value={subForm.institution}
                    onChange={(e) => setSubForm({ ...subForm, institution: e.target.value })}
                    placeholder="KCETAŞ, KASKİ vb."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Abone / Sözleşme No
                  </label>
                  <input
                    type="text"
                    value={subForm.subscriberNo}
                    onChange={(e) => setSubForm({ ...subForm, subscriberNo: e.target.value })}
                    placeholder="351872 vb."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sayaç / Lokasyon
                  </label>
                  <input
                    type="text"
                    value={subForm.meterNo}
                    onChange={(e) => setSubForm({ ...subForm, meterNo: e.target.value })}
                    placeholder="Ana Giriş, Bahçe vb."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Varsayılan Ödeme Yöntemi
                  </label>
                  <select
                    value={subForm.paymentMethod}
                    onChange={(e) => setSubForm({ ...subForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                  >
                    <option value="CREDIT_CARD">💳 Kredi Kartı</option>
                    <option value="BANK">🏦 Banka / Otomatik</option>
                    <option value="CASH">💵 Nakit / Kasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ortalama Ödeme Günü
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={subForm.paymentDay}
                    onChange={(e) => setSubForm({ ...subForm, paymentDay: Number(e.target.value) || 15 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {subForm.paymentMethod === "CREDIT_CARD" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/80 border border-purple-200 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      Kart Sahibi
                    </label>
                    <input
                      type="text"
                      placeholder="SIMCU / MAÇ"
                      value={subForm.cardHolder}
                      onChange={(e) => setSubForm({ ...subForm, cardHolder: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      Banka
                    </label>
                    <input
                      type="text"
                      placeholder="Ziraat Bankası"
                      value={subForm.cardBank}
                      onChange={(e) => setSubForm({ ...subForm, cardBank: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-950"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Not / Açıklama
                </label>
                <input
                  type="text"
                  value={subForm.notes}
                  onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                  placeholder="Abonelik hakkında hatırlatıcı notlar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
                >
                  {submitting ? "Kaydediliyor..." : editingSub ? "Güncelle" : "Aboneliği Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

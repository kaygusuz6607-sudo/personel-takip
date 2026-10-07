"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ScrollText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  QrCode,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  Calendar,
  Building2,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Cheque {
  id: string;
  type: "GIVEN" | "RECEIVED";
  chequeNo?: string | null;
  bank?: string | null;
  branch?: string | null;
  accountNo?: string | null;
  issuer?: string | null;
  recipient?: string | null;
  amount: number;
  issueDate?: string | null;
  dueDate?: string | null;
  dueDateStr?: string | null;
  status: "PORTFOLIO" | "COLLECTED" | "BOUNCED" | "ENDORSED" | "CANCELLED";
  paymentDate?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  expenseId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ChequeStats {
  totalCount: number;
  totalGiven: number;
  totalGivenPaid: number;
  totalGivenPending: number;
  countGiven: number;
  totalReceived: number;
  totalReceivedCollected: number;
  totalReceivedPending: number;
  countReceived: number;
  netBalance: number;
  urgentCount: number;
}

const COMMON_BANKS = [
  "VakıfBank",
  "Ziraat Bankası",
  "Halkbank",
  "Türkiye İş Bankası",
  "Garanti BBVA",
  "Yapı Kredi",
  "Akbank",
  "QNB Finansbank",
  "DenizBank",
  "Kuveyt Türk",
  "Albaraka Türk",
  "Türkiye Finans",
  "TEB",
  "Şekerbank",
];

export default function CeklerPage() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [stats, setStats] = useState<ChequeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtreler
  const [activeTab, setActiveTab] = useState<"ALL" | "GIVEN" | "RECEIVED" | "URGENT" | "PAID">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"DUE_ASC" | "DUE_DESC" | "AMOUNT_DESC" | "AMOUNT_ASC">("DUE_ASC");

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    type: "GIVEN" as "GIVEN" | "RECEIVED",
    chequeNo: "",
    bank: "VakıfBank",
    branch: "",
    accountNo: "",
    issuer: "",
    recipient: "",
    amount: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "PORTFOLIO" as "PORTFOLIO" | "COLLECTED" | "BOUNCED" | "ENDORSED" | "CANCELLED",
    notes: "",
    photoUrl: null as string | null,
    syncWithExpense: true,
  });

  // QR Modal
  const [qrModalCheque, setQrModalCheque] = useState<Cheque | null>(null);
  const [qrOrigin, setQrOrigin] = useState<string>("");

  // Fotoğraf Lightbox Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  const fetchCheques = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/cekler");
      if (res.ok) {
        const data = await res.json();
        setCheques(data.cheques || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Çekler yüklenemedi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCheques();
    if (typeof window !== "undefined") {
      setQrOrigin(window.location.origin);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDaysRemaining = (dueDateStr?: string | null) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtrelenmiş ve Sıralanmış Çekler
  const filteredCheques = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().slice(0, 10);

    return cheques
      .filter((c) => {
        // Tab Filtresi
        if (activeTab === "GIVEN" && c.type !== "GIVEN") return false;
        if (activeTab === "RECEIVED" && c.type !== "RECEIVED") return false;
        if (activeTab === "PAID" && c.status !== "COLLECTED") return false;
        if (activeTab === "URGENT") {
          if (c.status === "COLLECTED") return false;
          if (!c.dueDate || c.dueDate > in7DaysStr) return false;
        }

        // Banka Filtresi
        if (bankFilter !== "ALL" && c.bank !== bankFilter) return false;

        // Durum Filtresi
        if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

        // Arama Filtresi
        if (searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase();
          const matchNo = (c.chequeNo || "").toLowerCase().includes(q);
          const matchBank = (c.bank || "").toLowerCase().includes(q);
          const matchIssuer = (c.issuer || "").toLowerCase().includes(q);
          const matchRecipient = (c.recipient || "").toLowerCase().includes(q);
          const matchNotes = (c.notes || "").toLowerCase().includes(q);
          if (!matchNo && !matchBank && !matchIssuer && !matchRecipient && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "DUE_ASC") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortOrder === "DUE_DESC") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return b.dueDate.localeCompare(a.dueDate);
        }
        if (sortOrder === "AMOUNT_DESC") {
          return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        }
        if (sortOrder === "AMOUNT_ASC") {
          return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        }
        return 0;
      });
  }, [cheques, activeTab, bankFilter, statusFilter, searchTerm, sortOrder]);

  // Yeni Çek Modalını Aç
  const handleOpenNewModal = (type: "GIVEN" | "RECEIVED" = "GIVEN") => {
    setEditingCheque(null);
    setForm({
      type,
      chequeNo: "",
      bank: "VakıfBank",
      branch: "",
      accountNo: "",
      issuer: type === "GIVEN" ? "Özel Kayseri Simya Çocuk Üniversitesi" : "",
      recipient: type === "RECEIVED" ? "Özel Kayseri Simya Çocuk Üniversitesi" : "",
      amount: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "PORTFOLIO",
      notes: "",
      photoUrl: null,
      syncWithExpense: true,
    });
    setIsModalOpen(true);
  };

  // Çek Düzenleme Modalını Aç
  const handleOpenEditModal = (c: Cheque) => {
    setEditingCheque(c);
    setForm({
      type: c.type,
      chequeNo: c.chequeNo || "",
      bank: c.bank || "VakıfBank",
      branch: c.branch || "",
      accountNo: c.accountNo || "",
      issuer: c.issuer || "",
      recipient: c.recipient || "",
      amount: c.amount ? String(c.amount) : "",
      issueDate: c.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: c.dueDate || "",
      status: c.status,
      notes: c.notes || "",
      photoUrl: c.photoUrl || null,
      syncWithExpense: false,
    });
    setIsModalOpen(true);
  };

  // Form Kaydet
  const handleSaveCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(form.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Lütfen geçerli bir çek tutarı giriniz.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingCheque) {
        // Güncelleme
        const res = await fetch(`/api/cekler/${editingCheque.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            amount: numAmt,
          }),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
      } else {
        // Yeni Kayıt
        const res = await fetch("/api/cekler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            amount: numAmt,
          }),
        });
        if (!res.ok) throw new Error("Kaydetme başarısız");
      }

      setIsModalOpen(false);
      fetchCheques();
    } catch (err: any) {
      alert("Hata: " + (err.message || "İşlem tamamlanamadı"));
    } finally {
      setIsSaving(false);
    }
  };

  // Hızlı Durum Değiştirme (Ödendi/Tahsil Edildi <-> Bekliyor)
  const handleToggleStatus = async (c: Cheque) => {
    try {
      const res = await fetch(`/api/cekler/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_STATUS" }),
      });
      if (res.ok) {
        fetchCheques();
      }
    } catch (err) {
      console.error("Durum değiştirilemedi:", err);
    }
  };

  // Çek Silme
  const handleDeleteCheque = async (c: Cheque) => {
    const isGiven = c.type === "GIVEN";
    const msg = isGiven
      ? `"${c.recipient || c.chequeNo || 'Verilen Çek'}" kaydını kalıcı olarak silmek istediğinize emin misiniz? (Varsa bağlı okul gideri de silinecektir)`
      : `"${c.issuer || c.chequeNo || 'Alınan Çek'}" kaydını kalıcı olarak silmek istediğinize emin misiniz?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/cekler/${c.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCheques();
      }
    } catch (err) {
      alert("Silme işlemi başarısız.");
    }
  };

  // Görsel Sıkıştırma (Base64)
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          setForm((prev) => ({ ...prev, photoUrl: canvas.toDataURL("image/jpeg", 0.85) }));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Excel / CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Tür",
      "Çek No",
      "Banka",
      "Keşideci",
      "Muhatap / Lehtar",
      "Vade Tarihi",
      "Tutar (TL)",
      "Durum",
      "Açıklama",
    ];

    const rows = filteredCheques.map((c) => [
      c.type === "GIVEN" ? "Verilen Çek (Ödeme)" : "Alınan Çek (Tahsilat)",
      c.chequeNo || "-",
      c.bank || "-",
      c.issuer || "-",
      c.recipient || "-",
      c.dueDateStr || c.dueDate || "-",
      (Number(c.amount) || 0).toLocaleString("tr-TR"),
      c.status === "COLLECTED"
        ? c.type === "GIVEN"
          ? "Ödendi"
          : "Tahsil Edildi"
        : c.status === "BOUNCED"
        ? "Karşılıksız"
        : c.status === "ENDORSED"
        ? "Ciro Edildi"
        : "Bekliyor",
      (c.notes || "").replace(/"/g, '""'),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.map((f) => `"${f}"`).join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cek_listesi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. ÜST BAŞLIK VE HIZLI BUTONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm shadow-teal-600/20">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Çek Takibi & Portföy Yönetimi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Alınan (Müşteri/Veli) ve Verilen (Okul/Tedarikçi) tüm çeklerin vadeleri, tahsilatları ve fotoğraf arşivi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchCheques}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewModal("RECEIVED")}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Alınan Çek Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewModal("GIVEN")}
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-teal-700/20 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Verilen Çek Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. FİNANSAL ÖZET & KPI KARTLARI */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Alınan Çekler (Tahsil Edilecek) */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                Alınan Çekler (Tahsilat)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {stats.countReceived} Adet
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-emerald-950 tracking-tight">
                {formatCurrency(stats.totalReceived)}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Bekleyen: <strong className="text-emerald-700">{formatCurrency(stats.totalReceivedPending)}</strong></span>
                <span>Tahsil: <strong className="text-slate-700">{formatCurrency(stats.totalReceivedCollected)}</strong></span>
              </div>
            </div>
          </div>

          {/* Verilen Çekler (Ödenecek) */}
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs bg-gradient-to-br from-white to-rose-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                Verilen Çekler (Ödeme)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {stats.countGiven} Adet
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-rose-950 tracking-tight">
                {formatCurrency(stats.totalGiven)}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Ödenecek: <strong className="text-rose-700">{formatCurrency(stats.totalGivenPending)}</strong></span>
                <span>Ödenen: <strong className="text-slate-700">{formatCurrency(stats.totalGivenPaid)}</strong></span>
              </div>
            </div>
          </div>

          {/* Net Çek Dengesi */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-600" />
                Net Portföy Bakiyesi
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Alınan - Verilen
              </span>
            </div>
            <div className="mt-2.5">
              <p
                className={`text-xl font-black tracking-tight ${
                  stats.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {stats.netBalance >= 0 ? "+" : ""}
                {formatCurrency(stats.netBalance)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {stats.netBalance >= 0
                  ? "Tahsil edilecek çek fazlası var"
                  : "Ödenecek çek yükümlülüğü fazla"}
              </p>
            </div>
          </div>

          {/* Kritik / Yaklaşan Vadeler */}
          <div
            onClick={() => setActiveTab("URGENT")}
            className="cursor-pointer bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40 hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                Yaklaşan Vadeler (7 Gün)
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  stats.urgentCount > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.urgentCount} Çek
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-amber-950 tracking-tight">
                {stats.urgentCount > 0 ? `${stats.urgentCount} Adet Kritik Vade` : "Acil Vade Yok"}
              </p>
              <p className="mt-1 text-[11px] text-amber-800 font-medium group-hover:underline">
                Detayları görmek için tıklayın →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SEKMELER & FİLTRELEME ÇUBUĞU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
        {/* Tab Butonları */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            Tüm Çekler ({cheques.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GIVEN")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "GIVEN"
                ? "bg-rose-700 text-white shadow-2xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Verilen Çekler ({stats?.countGiven || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECEIVED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "RECEIVED"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Alınan Çekler ({stats?.countReceived || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("URGENT")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "URGENT"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kritik / Yaklaşan Vadeler ({stats?.urgentCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "PAID"
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ödenen & Tahsil Edilenler</span>
          </button>
        </div>

        {/* Filtre ve Arama Alanları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Arama */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Çek No, Banka, Keşideci, Muhatap..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Banka Filtresi */}
          <div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="ALL">Tüm Bankalar</option>
              {COMMON_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="PORTFOLIO">Portföyde / Beklemede</option>
              <option value="COLLECTED">Tahsil Edildi / Ödendi</option>
              <option value="BOUNCED">Karşılıksız</option>
              <option value="ENDORSED">Ciro Edildi</option>
              <option value="CANCELLED">İptal / İade</option>
            </select>
          </div>

          {/* Sıralama */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold"
            >
              <option value="DUE_ASC">📅 Vade: En Yakın Önce</option>
              <option value="DUE_DESC">📅 Vade: En Uzak Önce</option>
              <option value="AMOUNT_DESC">💰 Tutar: En Yüksek Önce</option>
              <option value="AMOUNT_ASC">💰 Tutar: En Düşük Önce</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. ÇEK TABLOSU / LİSTESİ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Çek listesi yükleniyor...</p>
          </div>
        ) : filteredCheques.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ScrollText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Kriterlere uygun çek bulunamadı.</p>
            <p className="text-xs text-slate-400">
              Yeni bir alınan veya verilen çek eklemek için yukarıdaki butonları kullanabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Tür</th>
                  <th className="py-3 px-3.5">Çek No & Banka</th>
                  <th className="py-3 px-3.5">Muhatap & Keşideci</th>
                  <th className="py-3 px-3.5 text-center">Vade Tarihi & Kalan Süre</th>
                  <th className="py-3 px-3.5 text-right">Tutar</th>
                  <th className="py-3 px-3.5 text-center">Durum</th>
                  <th className="py-3 px-3.5 text-center">Çek Görseli</th>
                  <th className="py-3 px-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCheques.map((c) => {
                  const daysRemaining = getDaysRemaining(c.dueDate);
                  const isPaid = c.status === "COLLECTED";
                  const isGiven = c.type === "GIVEN";

                  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                  let badgeText = "Vade Belirsiz";

                  if (isPaid) {
                    badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                    badgeText = isGiven ? "Ödendi" : "Tahsil Edildi";
                  } else if (daysRemaining !== null) {
                    if (daysRemaining < 0) {
                      badgeColor = "bg-rose-100 text-rose-900 border-rose-300 font-extrabold";
                      badgeText = `${Math.abs(daysRemaining)} Gün Geçti!`;
                    } else if (daysRemaining === 0) {
                      badgeColor = "bg-amber-100 text-amber-950 border-amber-300 font-black animate-pulse";
                      badgeText = "BUGÜN VADELİ!";
                    } else if (daysRemaining <= 7) {
                      badgeColor = "bg-amber-50 text-amber-900 border-amber-200 font-extrabold";
                      badgeText = `${daysRemaining} Gün Kaldı`;
                    } else {
                      badgeColor = "bg-teal-50 text-teal-800 border-teal-200";
                      badgeText = `${daysRemaining} Gün Kaldı`;
                    }
                  }

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isPaid && daysRemaining !== null && daysRemaining <= 0
                          ? "bg-rose-50/20"
                          : ""
                      }`}
                    >
                      {/* 1. Tür Rozeti */}
                      <td className="py-3 px-3.5 align-middle">
                        {isGiven ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200/80">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            Verilen Çek
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200/80">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            Alınan Çek
                          </span>
                        )}
                      </td>

                      {/* 2. Çek No & Banka */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-extrabold text-slate-900">
                          {c.chequeNo ? `No: ${c.chequeNo}` : "Çek No Girilmedi"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          🏛️ {c.bank || "Banka Belirtilmedi"}
                          {c.branch ? ` • ${c.branch}` : ""}
                        </div>
                      </td>

                      {/* 3. Muhatap & Keşideci */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-bold text-slate-800">
                          {isGiven
                            ? c.recipient || "Tedarikçi / Muhatap"
                            : c.issuer || "Keşideci (Veli / Müşteri)"}
                        </div>
                        {c.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {c.notes}
                          </div>
                        )}
                      </td>

                      {/* 4. Vade Tarihi */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        <div className="font-bold text-slate-900">
                          {c.dueDateStr || (c.dueDate ? new Date(c.dueDate).toLocaleDateString("tr-TR") : "-")}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                      </td>

                      {/* 5. Tutar */}
                      <td className="py-3 px-3.5 align-middle text-right">
                        <span
                          className={`text-sm font-black tracking-tight ${
                            isGiven ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(Number(c.amount) || 0)}
                        </span>
                      </td>

                      {/* 6. Durum */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all active:scale-95 ${
                            c.status === "COLLECTED"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700"
                              : c.status === "BOUNCED"
                              ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                              : c.status === "ENDORSED"
                              ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                              : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                          }`}
                          title="Durumu değiştirmek için tıklayın"
                        >
                          {c.status === "COLLECTED"
                            ? isGiven
                              ? "✓ Ödendi"
                              : "✓ Tahsil Edildi"
                            : c.status === "BOUNCED"
                            ? "✕ Karşılıksız"
                            : c.status === "ENDORSED"
                            ? "↻ Ciro Edildi"
                            : "⏳ Bekliyor"}
                        </button>
                      </td>

                      {/* 7. Çek Görseli */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        {c.photoUrl ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: c.photoUrl!,
                                  title: `${c.chequeNo ? 'Çek No: ' + c.chequeNo + ' - ' : ''}${c.recipient || c.issuer || 'Çek Görseli'}`,
                                })
                              }
                              className="relative group rounded-lg overflow-hidden border border-slate-200 hover:border-teal-500 shadow-2xs"
                              title="Büyütmek için tıklayın"
                            >
                              <img
                                src={c.photoUrl}
                                alt="Çek"
                                className="w-12 h-8 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQrModalCheque(c)}
                              className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Telefondan Yeniden Fotoğraf Yükle (QR)"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setQrModalCheque(c)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-[10px] font-bold border border-slate-200 flex items-center gap-1 mx-auto transition-colors"
                            title="QR ile telefondan veya bilgisayardan görsel ekle"
                          >
                            <Camera className="w-3 h-3 text-slate-500" />
                            <span>Fotoğraf Ekle</span>
                          </button>
                        )}
                      </td>

                      {/* 8. İşlemler */}
                      <td className="py-3 px-3.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCheque(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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

      {/* 5. YENİ / DÜZENLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 my-8 space-y-4 max-h-[92vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <ScrollText className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingCheque ? "Çek Bilgilerini Düzenle" : "Yeni Çek Kaydı Ekle"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheque} className="space-y-4">
              {/* Çek Türü Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Çek Türü *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        type: "GIVEN",
                        issuer: "Özel Kayseri Simya Çocuk Üniversitesi",
                        recipient: "",
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      form.type === "GIVEN"
                        ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-black shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold">Verilen Çek (Ödeme)</p>
                      <p className="text-[10px] text-slate-500">Bizim kestiğimiz kurum/tedarikçi çeki</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        type: "RECEIVED",
                        issuer: "",
                        recipient: "Özel Kayseri Simya Çocuk Üniversitesi",
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      form.type === "RECEIVED"
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold">Alınan Çek (Tahsilat)</p>
                      <p className="text-[10px] text-slate-500">Veli veya müşteriden tahsil edilecek çek</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tutar ve Vade Tarihi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Çek Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Örn: 50000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-black focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vade Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Banka ve Çek No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Çek No
                  </label>
                  <input
                    type="text"
                    value={form.chequeNo}
                    onChange={(e) => setForm({ ...form, chequeNo: e.target.value })}
                    placeholder="Örn: 00123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banka Adı *
                  </label>
                  <input
                    type="text"
                    required
                    list="bank-list"
                    value={form.bank}
                    onChange={(e) => setForm({ ...form, bank: e.target.value })}
                    placeholder="Banka seçin veya yazın..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold"
                  />
                  <datalist id="bank-list">
                    {COMMON_BANKS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Hızlı Banka Butonları */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">Hızlı Seçim:</span>
                {["VakıfBank", "Ziraat Bankası", "Halkbank", "İş Bankası", "Garanti", "Yapı Kredi", "Akbank"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setForm({ ...form, bank: b })}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                      form.bank === b
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Keşideci ve Muhatap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keşideci (Çeki Düzenleyen)
                  </label>
                  <input
                    type="text"
                    value={form.issuer}
                    onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                    placeholder={
                      form.type === "GIVEN"
                        ? "Özel Kayseri Simya Çocuk Üniversitesi"
                        : "Veli Adı veya Firma"
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {form.type === "GIVEN" ? "Kime Verildi (Lehtar / Cari) *" : "Kimin Adına Alındı"}
                  </label>
                  <input
                    type="text"
                    required={form.type === "GIVEN"}
                    value={form.recipient}
                    onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                    placeholder={
                      form.type === "GIVEN"
                        ? "Tedarikçi Firma / Şahıs Adı"
                        : "Özel Kayseri Simya Çocuk Üniversitesi"
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Durum ve Açıklama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Çek Durumu
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  >
                    <option value="PORTFOLIO">Portföyde / Beklemede</option>
                    <option value="COLLECTED">
                      {form.type === "GIVEN" ? "Ödendi" : "Tahsil Edildi"}
                    </option>
                    <option value="BOUNCED">Karşılıksız</option>
                    <option value="ENDORSED">Ciro Edildi</option>
                    <option value="CANCELLED">İptal / İade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Açıklama / Not
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="İlgili fatura, sözleşme veya işlem notu..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Çek Görseli Yükleme */}
              <div className="border border-dashed border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-700" />
                    Çek Fotoğrafı / Görseli
                  </span>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: null })}
                      className="text-[11px] text-rose-600 font-bold hover:underline"
                    >
                      Görseli Kaldır
                    </button>
                  )}
                </div>

                {form.photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 flex justify-center bg-white p-1">
                    <img
                      src={form.photoUrl}
                      alt="Çek önizleme"
                      className="max-h-44 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl bg-white text-center">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors">
                      <span>📁 Dosyadan Görsel Seç</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      (PNG, JPG, JPEG - Kaydedildikten sonra telefondan QR ile de yüklenebilir)
                    </p>
                  </div>
                )}
              </div>

              {/* Okul Giderleri Senkronizasyon Onayı (Yalnızca yeni verilen çeklerde) */}
              {!editingCheque && form.type === "GIVEN" && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.syncWithExpense}
                    onChange={(e) => setForm({ ...form, syncWithExpense: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs text-teal-950 font-semibold">
                    <span>Okul Gider & Borç Takibi listesine de otomatik yansıtılsın</span>
                    <span className="block text-[10px] text-teal-700 font-normal">
                      Vadesi gelen çek okul giderleri tablosunda da takip edilir.
                    </span>
                  </div>
                </label>
              )}

              {/* Butonlar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingCheque ? "Değişiklikleri Kaydet" : "Çeki Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TELEFONDAN QR İLE ÇEK FOTOĞRAFI YÜKLEME MODALI */}
      {qrModalCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-700" />
                Telefondan Çek Fotoğrafı Yükle
              </span>
              <button
                type="button"
                onClick={() => setQrModalCheque(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                {qrModalCheque.chequeNo ? `Çek No: ${qrModalCheque.chequeNo}` : "Çek Kaydı"}
              </p>
              <p className="text-[11px] text-slate-500">
                {qrModalCheque.recipient || qrModalCheque.issuer} • {formatCurrency(qrModalCheque.amount)}
              </p>
            </div>

            {/* QR Kod Görseli */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-2xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${qrOrigin}/foto-yukle/cek/${qrModalCheque.id}`
                )}`}
                alt="QR Kod"
                className="w-44 h-44 rounded-xl mx-auto"
              />
            </div>

            <p className="text-[11px] text-slate-600 font-medium">
              📱 Telefonunuzun kamerasını açıp QR kodu okutun. Açılan sayfadan doğrudan çek fotoğrafını çekip kaydedebilirsiniz.
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`/foto-yukle/cek/${qrModalCheque.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>Tarayıcıda Aç</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setQrModalCheque(null);
                  fetchCheques();
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
              >
                Kapat & Yenile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. BÜYÜK FOTOĞRAF LIGHTBOX MODALI */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 truncate">
                📸 {previewPhoto.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center overflow-auto bg-slate-900/5 rounded-2xl p-2">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <a
                href={previewPhoto.url}
                download="cek-gorseli.jpg"
                className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors"
              >
                İndir
              </a>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
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

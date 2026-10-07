"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Smartphone,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Coins,
  Receipt,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Building2,
  User,
} from "lucide-react";

interface CorporateLine {
  id: string;
  phoneNumber: string;
  userName: string;
  operator: string;
  packageName?: string | null;
  monthlyFee: number;
  startDate?: string | null;
  endDate?: string | null;
  commitmentMonths?: number | null;
  status: "ACTIVE" | "PASSIVE" | "CANCELLED";
  simCardNo?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PhoneExpense {
  id: string;
  title: string;
  period?: string | null;
  dueDate?: string | null;
  dueDateStr?: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  periodStatus?: string | null;
  description?: string | null;
}

interface Stats {
  totalLines: number;
  activeCount: number;
  totalMonthlyFee: number;
  urgentCommitmentsCount: number;
}

export default function KurumsalHatlarPage() {
  const [lines, setLines] = useState<CorporateLine[]>([]);
  const [expenses, setExpenses] = useState<PhoneExpense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal Durumları
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<CorporateLine | null>(null);
  const [isSavingLine, setIsSavingLine] = useState(false);

  const [lineForm, setLineForm] = useState({
    phoneNumber: "",
    userName: "",
    operator: "Vodafone",
    packageName: "",
    monthlyFee: "",
    startDate: "",
    endDate: "",
    commitmentMonths: "12",
    status: "ACTIVE" as "ACTIVE" | "PASSIVE" | "CANCELLED",
    simCardNo: "",
    notes: "",
  });

  // Fatura Yansıtma Modalı
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    period: "10. Ay (2026)",
    title: "Vodafone Kurumsal Hatlar (Tek Fatura - 6 Hat)",
    dueDate: new Date().toISOString().slice(0, 10),
    amountDue: "",
    notes: "Tüm kurumsal hatların aylık tek faturası",
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/kurumsal-hatlar");
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines || []);
        setExpenses(data.expenses || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Hatlar yüklenemedi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getDaysUntilEnd = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const end = new Date(dateStr);
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filtrelenmiş Hatlar
  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      if (operatorFilter !== "ALL" && l.operator !== operatorFilter) return false;
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;

      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchNum = l.phoneNumber.toLowerCase().includes(q);
        const matchUser = l.userName.toLowerCase().includes(q);
        const matchPkg = (l.packageName || "").toLowerCase().includes(q);
        const matchNotes = (l.notes || "").toLowerCase().includes(q);
        if (!matchNum && !matchUser && !matchPkg && !matchNotes) return false;
      }
      return true;
    });
  }, [lines, operatorFilter, statusFilter, searchTerm]);

  // Taahhüdü 30 gün veya daha az kalmış acil hatlar
  const urgentLines = useMemo(() => {
    return lines.filter((l) => {
      if (l.status !== "ACTIVE" || !l.endDate) return false;
      const days = getDaysUntilEnd(l.endDate);
      return days !== null && days <= 30;
    });
  }, [lines]);

  // Hat Ekleme Modalını Aç
  const handleOpenNewLine = () => {
    setEditingLine(null);
    setLineForm({
      phoneNumber: "",
      userName: "",
      operator: "Vodafone",
      packageName: "",
      monthlyFee: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      commitmentMonths: "12",
      status: "ACTIVE",
      simCardNo: "",
      notes: "",
    });
    setIsLineModalOpen(true);
  };

  // Hat Düzenleme Modalını Aç
  const handleOpenEditLine = (l: CorporateLine) => {
    setEditingLine(l);
    setLineForm({
      phoneNumber: l.phoneNumber,
      userName: l.userName,
      operator: l.operator,
      packageName: l.packageName || "",
      monthlyFee: l.monthlyFee ? String(l.monthlyFee) : "",
      startDate: l.startDate || "",
      endDate: l.endDate || "",
      commitmentMonths: l.commitmentMonths ? String(l.commitmentMonths) : "12",
      status: l.status,
      simCardNo: l.simCardNo || "",
      notes: l.notes || "",
    });
    setIsLineModalOpen(true);
  };

  // Hat Kaydet
  const handleSaveLine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingLine(true);
      if (editingLine) {
        const res = await fetch(`/api/kurumsal-hatlar/${editingLine.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lineForm,
            monthlyFee: parseFloat(lineForm.monthlyFee) || 0,
            commitmentMonths: parseInt(lineForm.commitmentMonths, 10) || 12,
          }),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
      } else {
        const res = await fetch("/api/kurumsal-hatlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lineForm,
            monthlyFee: parseFloat(lineForm.monthlyFee) || 0,
            commitmentMonths: parseInt(lineForm.commitmentMonths, 10) || 12,
          }),
        });
        if (!res.ok) throw new Error("Kaydetme başarısız");
      }

      setIsLineModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Hata: " + (err.message || "İşlem yapılamadı"));
    } finally {
      setIsSavingLine(false);
    }
  };

  // Hat Sil
  const handleDeleteLine = async (l: CorporateLine) => {
    if (!confirm(`"${l.userName} (${l.phoneNumber})" hattını kalıcı olarak silmek istiyor musunuz?`)) return;

    try {
      const res = await fetch(`/api/kurumsal-hatlar/${l.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert("Silme işlemi başarısız.");
    }
  };

  // Fatura Yansıtma Modalını Aç
  const handleOpenSyncExpenseModal = () => {
    const totalLinesFee = lines
      .filter((l) => l.status === "ACTIVE")
      .reduce((s, l) => s + (Number(l.monthlyFee) || 0), 0);

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    setExpenseForm({
      period: `${curMonth}. Ay (${curYear})`,
      title: `Vodafone Kurumsal Hatlar (Tek Fatura - ${lines.length} Hat)`,
      dueDate: new Date(curYear, now.getMonth(), 12).toISOString().slice(0, 10),
      amountDue: totalLinesFee > 0 ? String(totalLinesFee) : "",
      notes: "Tüm kurumsal hatların tek fatura aylık gideri",
    });
    setIsExpenseModalOpen(true);
  };

  // Faturayı Okul Giderlerine Yansıt
  const handleSaveExpenseSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(expenseForm.amountDue);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Lütfen geçerli bir fatura tutarı giriniz.");
      return;
    }

    try {
      setIsSavingExpense(true);
      const res = await fetch("/api/kurumsal-hatlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_EXPENSE",
          ...expenseForm,
          amountDue: numAmt,
        }),
      });

      if (!res.ok) throw new Error("Fatura yansıtılamadı");
      setIsExpenseModalOpen(false);
      fetchData();
      alert("Fatura başarıyla Okul Giderlerine yansıtıldı!");
    } catch (err: any) {
      alert("Hata: " + (err.message || "İşlem başarısız"));
    } finally {
      setIsSavingExpense(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. ÜST BAŞLIK VE HIZLI EYLEMLER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Telefon Faturaları & Kurumsal Hat Taahhüt Takibi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kurum hatları, kullanan personeller, paket ücretleri, taahhüt bitiş tarihleri ve Okul Giderleri fatura entegrasyonu
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSyncExpenseModal}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all active:scale-95"
            title="Aylık toplam fatura tutarını Okul Giderlerine yansıt"
          >
            <Receipt className="w-4 h-4" />
            <span>📄 Okul Giderine Fatura Yansıt</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewLine}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Hat Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. KPI / FİNANSAL ÖZET KARTLARI */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Toplam Hat Sayısı */}
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs bg-gradient-to-br from-white to-blue-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Kurumsal Hatlar
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {stats.activeCount} Aktif
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-black text-blue-950 tracking-tight">
                {stats.totalLines} Hat
              </p>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                {stats.activeCount} aktif kullanımda, {stats.totalLines - stats.activeCount} pasif
              </p>
            </div>
          </div>

          {/* Aylık Toplam Hat Paketi Tutarı */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-600" />
                Aylık Sabit Paket Gideri
              </span>
              <span className="text-[10px] font-bold text-slate-400">Sabit Taahhüt</span>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats.totalMonthlyFee)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                Tüm hatların aylık sözleşmeli sabit toplamı
              </p>
            </div>
          </div>

          {/* Kritik Taahhütler */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Yaklaşan Taahhütler (30 Gün)
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  stats.urgentCommitmentsCount > 0
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.urgentCommitmentsCount} Hat
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-black text-amber-950 tracking-tight">
                {stats.urgentCommitmentsCount > 0 ? `${stats.urgentCommitmentsCount} Hatın Süresi Azaldı` : "Tüm Taahhütler Güvende"}
              </p>
              <p className="mt-1 text-[11px] text-amber-800 font-medium">
                {stats.urgentCommitmentsCount > 0
                  ? "Tarife yenilemesi veya operatör görüşmesi gerekiyor"
                  : "Yakın zamanda süresi dolacak taahhüt yok"}
              </p>
            </div>
          </div>

          {/* Okul Giderlerine Yansıyan Cari Fatura */}
          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-2xs bg-gradient-to-br from-white to-teal-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-teal-600" />
                Okul Giderindeki Son Fatura
              </span>
              <Link
                href="/giderler"
                className="text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-0.5"
              >
                <span>Giderler</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-black text-teal-950 tracking-tight">
                {expenses.length > 0 ? formatCurrency(expenses[0].amountDue) : "0,00 ₺"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                {expenses.length > 0
                  ? `${expenses[0].period || "Cari Dönem"} • ${expenses[0].status === "PAID" ? "Ödendi ✅" : "Bekliyor ⏳"}`
                  : "Henüz gider faturası yansıtılmadı"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAAHHÜT UYARI BANNER'I */}
      {urgentLines.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-extrabold text-amber-900">
              Dikkat: {urgentLines.length} Kurumsal Hattın Taahhüt Süresi Yakında Bitiyor!
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            Aşağıdaki hatların taahhütleri 30 gün içinde sona erecektir. Tarife fiyatlarının fahiş artmaması için operatörle (Vodafone) görüşüp taahhüt yenilemesi yapılması tavsiye edilir:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {urgentLines.map((l) => {
              const d = getDaysUntilEnd(l.endDate);
              return (
                <div
                  key={l.id}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 shadow-2xs flex items-center gap-2 text-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-extrabold text-slate-800">{l.phoneNumber}</span>
                  <span className="text-slate-500 font-medium">({l.userName})</span>
                  <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-amber-200 text-amber-900">
                    {d !== null && d <= 0 ? "Bugün/Süresi Doldu!" : `${d} Gün Kaldı`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Numara, Personel, Departman veya Paket ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="ALL">Tüm Operatörler</option>
            <option value="Vodafone">Vodafone</option>
            <option value="Turkcell">Turkcell</option>
            <option value="Türk Telekom">Türk Telekom</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Yalnızca Aktif Hatlar</option>
            <option value="PASSIVE">Pasif Hatlar</option>
          </select>
        </div>
      </div>

      {/* 5. KURUMSAL HATLAR TABLOSU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Kurumsal Hat & Numara Listesi ({filteredLines.length} Hat)</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Hatlar ve taahhütler sadece burada yönetilir; Okul Giderleri listesine yalnızca aylık faturası yansır.
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Hatlar yükleniyor...</p>
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Kayıtlı telefon hattı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Telefon Numarası</th>
                  <th className="py-3 px-3.5">Kullanan Kişi / Birim</th>
                  <th className="py-3 px-3.5">Operatör & Tarife</th>
                  <th className="py-3 px-3.5 text-right">Aylık Paket Ücreti</th>
                  <th className="py-3 px-3.5 text-center">Taahhüt Bitiş Tarihi</th>
                  <th className="py-3 px-3.5 text-center">Kalan Süre</th>
                  <th className="py-3 px-3.5 text-center">Durum</th>
                  <th className="py-3 px-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLines.map((l) => {
                  const daysLeft = getDaysUntilEnd(l.endDate);
                  let timeBadge = "bg-slate-100 text-slate-600 border-slate-200";
                  let timeText = "Belirtilmedi";

                  if (daysLeft !== null) {
                    if (daysLeft < 0) {
                      timeBadge = "bg-rose-100 text-rose-900 border-rose-300 font-extrabold";
                      timeText = "Süresi Doldu!";
                    } else if (daysLeft === 0) {
                      timeBadge = "bg-rose-200 text-rose-950 border-rose-400 font-black animate-pulse";
                      timeText = "BUGÜN DOLUYOR!";
                    } else if (daysLeft <= 30) {
                      timeBadge = "bg-amber-100 text-amber-950 border-amber-300 font-extrabold";
                      timeText = `${daysLeft} Gün Kaldı`;
                    } else {
                      const months = Math.round(daysLeft / 30);
                      timeBadge = "bg-teal-50 text-teal-800 border-teal-200 font-semibold";
                      timeText = months >= 1 ? `~${months} Ay Kaldı` : `${daysLeft} Gün Kaldı`;
                    }
                  }

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Numara */}
                      <td className="py-3 px-3.5 align-middle font-extrabold text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{l.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Kullanan Kişi */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-bold text-slate-800">{l.userName}</div>
                        {l.notes && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{l.notes}</div>}
                      </td>

                      {/* Operatör ve Tarife */}
                      <td className="py-3 px-3.5 align-middle">
                        <span className="font-extrabold text-slate-800">{l.operator}</span>
                        {l.packageName && (
                          <span className="text-[11px] text-slate-500 block">{l.packageName}</span>
                        )}
                      </td>

                      {/* Aylık Ücret */}
                      <td className="py-3 px-3.5 align-middle text-right font-black text-slate-900 text-sm">
                        {formatCurrency(Number(l.monthlyFee) || 0)}
                      </td>

                      {/* Bitiş Tarihi */}
                      <td className="py-3 px-3.5 align-middle text-center font-bold text-slate-700">
                        {l.endDate ? new Date(l.endDate).toLocaleDateString("tr-TR") : "-"}
                      </td>

                      {/* Kalan Süre Rozeti */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${timeBadge}`}>
                          {timeText}
                        </span>
                      </td>

                      {/* Durum */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {l.status === "ACTIVE" ? "Aktif" : "Pasif"}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="py-3 px-3.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLine(l)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(l)}
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

      {/* 6. OKUL GİDERLERİNE YANSIYAN FATURALAR LİSTESİ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-700" />
              <span>Okul Giderleri Listesine Yansıyan Telefon Faturaları</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bu faturalar Okul Giderleri & Taksit Takibi ekranınızda aylık gider olarak kayıtlıdır.
            </p>
          </div>

          <Link
            href="/giderler"
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <span>Okul Giderleri Sayfasına Git</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Henüz Okul Giderleri tablosuna yansıtılmış telefon faturası bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3.5">Fatura Başlığı</th>
                  <th className="py-2.5 px-3.5">Dönem</th>
                  <th className="py-2.5 px-3.5">Son Ödeme Tarihi</th>
                  <th className="py-2.5 px-3.5 text-right">Ödenecek Tutar</th>
                  <th className="py-2.5 px-3.5 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">
                      {e.title}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-semibold">
                      {e.period || "-"}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-bold">
                      {e.dueDateStr || (e.dueDate ? new Date(e.dueDate).toLocaleDateString("tr-TR") : "-")}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900">
                      {formatCurrency(Number(e.amountDue) || 0)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          e.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {e.status === "PAID" ? "Ödendi ✓" : "Bekliyor ⏳"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. HAT EKLEME / DÜZENLEME MODALI */}
      {isLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingLine ? "Hat Bilgilerini Düzenle" : "Yeni Kurumsal Hat Ekle"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLineModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLine} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefon Numarası *
                  </label>
                  <input
                    type="text"
                    required
                    value={lineForm.phoneNumber}
                    onChange={(e) => setLineForm({ ...lineForm, phoneNumber: e.target.value })}
                    placeholder="0545 545 10 58"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kullanan Kişi / Birim *
                  </label>
                  <input
                    type="text"
                    required
                    value={lineForm.userName}
                    onChange={(e) => setLineForm({ ...lineForm, userName: e.target.value })}
                    placeholder="Muhammed Ali Çağır / Danışma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operatör *
                  </label>
                  <select
                    value={lineForm.operator}
                    onChange={(e) => setLineForm({ ...lineForm, operator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="Vodafone">Vodafone</option>
                    <option value="Turkcell">Turkcell</option>
                    <option value="Türk Telekom">Türk Telekom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paket / Tarife Adı
                  </label>
                  <input
                    type="text"
                    value={lineForm.packageName}
                    onChange={(e) => setLineForm({ ...lineForm, packageName: e.target.value })}
                    placeholder="Red Business 40GB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aylık Sabit Paket Ücreti (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={lineForm.monthlyFee}
                    onChange={(e) => setLineForm({ ...lineForm, monthlyFee: e.target.value })}
                    placeholder="Örn: 948"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taahhüt Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={lineForm.endDate}
                    onChange={(e) => setLineForm({ ...lineForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={lineForm.notes}
                  onChange={(e) => setLineForm({ ...lineForm, notes: e.target.value })}
                  placeholder="Grup içi ücretsiz, 2. şirket hattı vb."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSavingLine}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  {isSavingLine ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingLine ? "Güncelle" : "Hattı Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. OKUL GİDERİNE FATURA YANSITMA MODALI */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Okul Giderlerine Fatura Yansıt
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bu fatura Okul Giderleri & Aylık Borç Takibi listesinde fatura gideri olarak kaydedilecektir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseSync} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fatura Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-amber-600/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dönem (Ay) *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseForm.period}
                    onChange={(e) => setExpenseForm({ ...expenseForm, period: e.target.value })}
                    placeholder="10. Ay (2026)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-amber-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Son Ödeme Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.dueDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödenecek Fatura Tutarı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseForm.amountDue}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amountDue: e.target.value })}
                  placeholder="Örn: 4984.80"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-amber-900 focus:ring-2 focus:ring-amber-600/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  İpucu: Vodafone kurumsal faturanızın KDV dahil genel toplamını buraya girebilirsiniz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                >
                  {isSavingExpense ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Faturayı Yansıt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

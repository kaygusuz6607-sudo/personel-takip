"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserMinus,
  Plus,
  Search,
  Calendar,
  Coins,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Banknote,
  RefreshCw,
  Check,
  Building2,
  Phone,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  Copy,
  ReceiptText,
  AlertTriangle,
  ArrowRight,
  Info,
} from "lucide-react";

export interface RefundInstallment {
  id: string;
  refundId: string;
  installmentNo: number;
  dueDate: string;
  dueDateStr: string | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PAID" | "PARTIAL";
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
}

export interface StudentRefund {
  id: string;
  studentName: string;
  parentName: string | null;
  phone: string | null;
  iban: string | null;
  reason: string | null;
  cancellationDate: string | null;
  startDate: string;
  totalAmount: number;
  installmentCount: number;
  notes: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  installments: RefundInstallment[];
  createdAt: string;
  updatedAt: string;
}

interface RefundStats {
  totalFiles: number;
  activeFiles: number;
  completedFiles: number;
  totalCommitment: number;
  totalPaid: number;
  totalRemaining: number;
}

export default function KayitSilmeIadeleriPage() {
  const [refunds, setRefunds] = useState<StudentRefund[]>([]);
  const [upcomingInstallments, setUpcomingInstallments] = useState<any[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalFiles: 0,
    activeFiles: 0,
    completedFiles: 0,
    totalCommitment: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Modallar
  const [newRefundModalOpen, setNewRefundModalOpen] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);

  // Yeni Dosya Formu
  const [newForm, setNewForm] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    iban: "",
    reason: "Kayıt Silme / Nakil İadesi",
    cancellationDate: new Date().toISOString().split("T")[0],
    startDate: new Date().toISOString().split("T")[0],
    totalAmount: 122500,
    installmentCount: 5,
    notes: "",
  });
  const [newSubmitting, setNewSubmitting] = useState(false);

  // Ödeme Yap Formu
  const [selectedInstallment, setSelectedInstallment] = useState<RefundInstallment | null>(null);
  const [payForm, setPayForm] = useState({
    paidAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    notes: "",
  });
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Toplu Düzenleme Formu
  const [bulkRounds, setBulkRounds] = useState<
    Array<{
      id: string;
      installmentNo: number;
      dueDate: string;
      amount: number;
      notes: string;
    }>
  >([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Dosya Bilgileri Düzenleme
  const [editInfoForm, setEditInfoForm] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    iban: "",
    reason: "",
    notes: "",
    status: "ACTIVE",
  });
  const [editInfoSubmitting, setEditInfoSubmitting] = useState(false);

  const [copiedIban, setCopiedIban] = useState(false);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kayit-silme-iadeleri");
      if (!res.ok) throw new Error("Yüklenemedi");
      const data = await res.json();
      setRefunds(data.refunds || []);
      setUpcomingInstallments(data.upcomingInstallments || []);
      setStats(
        data.stats || {
          totalFiles: 0,
          activeFiles: 0,
          completedFiles: 0,
          totalCommitment: 0,
          totalPaid: 0,
          totalRemaining: 0,
        }
      );

      // Otomatik ilk dosyayı seç
      if (data.refunds && data.refunds.length > 0) {
        if (!selectedRefundId || !data.refunds.some((r: any) => r.id === selectedRefundId)) {
          setSelectedRefundId(data.refunds[0].id);
        }
      } else {
        setSelectedRefundId(null);
      }
    } catch (e) {
      console.error("İadeler çekilemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  const selectedRefund = useMemo(() => {
    return refunds.find((r) => r.id === selectedRefundId) || null;
  }, [refunds, selectedRefundId]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const matchSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.parentName && r.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.phone && r.phone.includes(searchQuery)) ||
        (r.iban && r.iban.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted = r.status === "COMPLETED" || r.installments.every((i) => i.remainingAmount === 0);
      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "COMPLETED"
          ? isCompleted
          : !isCompleted && r.status === "ACTIVE";

      return matchSearch && matchStatus;
    });
  }, [refunds, searchQuery, statusFilter]);

  // Yeni Dosya Kaydet
  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.studentName.trim() || newForm.totalAmount <= 0) {
      alert("Lütfen öğrenci adı ve geçerli bir iade tutarı giriniz.");
      return;
    }

    try {
      setNewSubmitting(true);
      const res = await fetch("/api/kayit-silme-iadeleri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Oluşturulamadı");
        return;
      }

      const created = await res.json();
      setNewRefundModalOpen(false);
      await fetchRefunds();
      setSelectedRefundId(created.id);
      // Formu sıfırla
      setNewForm({
        studentName: "",
        parentName: "",
        phone: "",
        iban: "",
        reason: "Kayıt Silme / Nakil İadesi",
        cancellationDate: new Date().toISOString().split("T")[0],
        startDate: new Date().toISOString().split("T")[0],
        totalAmount: 122500,
        installmentCount: 5,
        notes: "",
      });
    } catch {
      alert("Hata oluştu");
    } finally {
      setNewSubmitting(false);
    }
  };

  // Taksit Ödeme Modalı Aç
  const openPayModal = (inst: RefundInstallment) => {
    setSelectedInstallment(inst);
    setPayForm({
      paidAmount: inst.remainingAmount,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: inst.paymentMethod || "BANK_TRANSFER",
      notes: inst.notes || "",
    });
    setPayModalOpen(true);
  };

  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    try {
      setPaySubmitting(true);
      const res = await fetch("/api/kayit-silme-iadeleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_INSTALLMENT",
          installmentId: selectedInstallment.id,
          paidAmount: payForm.paidAmount,
          paymentDate: payForm.paymentDate,
          paymentMethod: payForm.paymentMethod,
          notes: payForm.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Ödeme kaydedilemedi");
        return;
      }

      setPayModalOpen(false);
      await fetchRefunds();
    } catch {
      alert("Hata oluştu");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Ödemeyi Geri Al (Unpay)
  const handleUnpayInstallment = async (instId: string) => {
    if (!confirm("Bu taksitin ödemesini geri alarak 'Bekliyor' durumuna getirmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch("/api/kayit-silme-iadeleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNPAY_INSTALLMENT",
          installmentId: instId,
        }),
      });

      if (!res.ok) {
        alert("Geri alınamadı");
        return;
      }
      await fetchRefunds();
    } catch {
      alert("Hata oluştu");
    }
  };

  // Toplu Düzenleme Modalı Aç
  const openBulkEditModal = (refund: StudentRefund) => {
    const items = refund.installments.map((inst) => ({
      id: inst.id,
      installmentNo: inst.installmentNo,
      dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split("T")[0] : "",
      amount: inst.amount,
      notes: inst.notes || "",
    }));
    setBulkRounds(items);
    setBulkEditModalOpen(true);
  };

  const handleSaveBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    try {
      setBulkSubmitting(true);
      const res = await fetch("/api/kayit-silme-iadeleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_UPDATE_INSTALLMENTS",
          refundId: selectedRefund.id,
          installments: bulkRounds,
        }),
      });

      if (!res.ok) {
        alert("Taksitler güncellenemedi");
        return;
      }

      setBulkEditModalOpen(false);
      await fetchRefunds();
    } catch {
      alert("Hata oluştu");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Dosya Bilgilerini Düzenleme Modalı
  const openEditInfoModal = (refund: StudentRefund) => {
    setEditInfoForm({
      studentName: refund.studentName,
      parentName: refund.parentName || "",
      phone: refund.phone || "",
      iban: refund.iban || "",
      reason: refund.reason || "",
      notes: refund.notes || "",
      status: refund.status,
    });
    setEditInfoModalOpen(true);
  };

  const handleSaveEditInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    try {
      setEditInfoSubmitting(true);
      const res = await fetch("/api/kayit-silme-iadeleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REFUND",
          refundId: selectedRefund.id,
          ...editInfoForm,
        }),
      });

      if (!res.ok) {
        alert("Güncellenemedi");
        return;
      }

      setEditInfoModalOpen(false);
      await fetchRefunds();
    } catch {
      alert("Hata oluştu");
    } finally {
      setEditInfoSubmitting(false);
    }
  };

  // Dosyayı Sil
  const handleDeleteRefund = async (refundId: string) => {
    if (!confirm("Bu iade dosyasını ve tüm taksitlerini tamamen silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/kayit-silme-iadeleri?refundId=${refundId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Silinemedi");
        return;
      }
      await fetchRefunds();
    } catch {
      alert("Hata oluştu");
    }
  };

  // Yeni simülasyon taksitleri (modal içi canlı önizleme)
  const simulationInstallments = useMemo(() => {
    const tot = Math.max(0, Number(newForm.totalAmount) || 0);
    const count = Math.max(1, parseInt(String(newForm.installmentCount), 10) || 1);
    const sDate = newForm.startDate ? new Date(newForm.startDate) : new Date();

    const basePerInst = Number((tot / count).toFixed(2));
    let currentRemainder = tot;

    const list: Array<{ no: number; dateStr: string; amount: number }> = [];
    const sYear = sDate.getFullYear();
    const sMonth = sDate.getMonth() + 1;
    const targetDay = sDate.getDate();

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const instAmt = isLast ? Number(currentRemainder.toFixed(2)) : basePerInst;
      currentRemainder -= instAmt;

      const targetMonthOffset = sMonth - 1 + i;
      const rYear = sYear + Math.floor(targetMonthOffset / 12);
      const rMonth = (targetMonthOffset % 12) + 1;
      const lastDayOfMonth = new Date(rYear, rMonth, 0).getDate();
      const safeDay = Math.min(targetDay, lastDayOfMonth);

      const dStr = `${String(safeDay).padStart(2, "0")}.${String(rMonth).padStart(2, "0")}.${rYear}`;
      list.push({ no: i + 1, dateStr: dStr, amount: instAmt });
    }
    return list;
  }, [newForm.totalAmount, newForm.installmentCount, newForm.startDate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. ÜST BAŞLIK VE HIZLI BUTONLAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Kayıt Silme İadeleri
              </h1>
              <p className="text-xs text-slate-500">
                Kayıt sildiren öğrencilerin iade cari hesapları, taksit planları ve ödenen/kalan takibi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={fetchRefunds}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setNewRefundModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kayıt Silme İadesi Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. ÖZET KPI KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Toplam İade Taahhüdü
            </span>
            <Coins className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.totalCommitment)}
          </p>
          <span className="text-[10px] text-slate-400">Tüm iade dosyaları toplamı</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Ödenen İadeler
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(stats.totalPaid)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            Kasadan / Bankadan iade edildi ✓
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Kalan İade Borcu
            </span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
            {formatCurrency(stats.totalRemaining)}
          </p>
          <span className="text-[10px] text-rose-600 font-semibold">
            Ödenecek kalan taksitler
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Dosya Sayısı
            </span>
            <UserMinus className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-teal-900 mt-1">
            {stats.activeFiles} Aktif / {stats.totalFiles} Toplam
          </p>
          <span className="text-[10px] text-teal-700 font-semibold">
            {stats.completedFiles} Dosya Tamamlandı
          </span>
        </div>
      </div>

      {/* 3. YAKLAŞAN VADE BİLDİRİMİ (VARSA) */}
      {upcomingInstallments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
              🔔
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                Önümüzdeki İade Vadesi
              </span>
              <p className="text-sm font-extrabold text-slate-900">
                {upcomingInstallments[0].studentName} • {upcomingInstallments[0].installmentNo}. Taksit:{" "}
                <strong className="text-rose-700">
                  {formatCurrency(upcomingInstallments[0].remainingAmount)}
                </strong>{" "}
                (Vade: {upcomingInstallments[0].dueDateStr || new Date(upcomingInstallments[0].dueDate).toLocaleDateString("tr-TR")})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedRefundId(upcomingInstallments[0].refundId);
              openPayModal(upcomingInstallments[0]);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-900 hover:bg-black text-amber-200 text-xs font-bold shrink-0 transition-colors"
          >
            Ödeme Yap
          </button>
        </div>
      )}

      {/* 4. ANA İÇERİK: SOL LİSTE / SAĞ DETAY VE TAKSİTLER (TEDARİKÇİ CARİ GİBİ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL: İADE DOSYALARI LİSTESİ */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col max-h-[85vh]">
          {/* Arama & Filtreler */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Öğrenci, veli veya IBAN ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                  statusFilter === "ALL"
                    ? "bg-slate-800 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Tümü ({refunds.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                  statusFilter === "ACTIVE"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Aktif ({stats.activeFiles})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Bitti ({stats.completedFiles})
              </button>
            </div>
          </div>

          {/* Dosya Kartları */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredRefunds.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Kayıt silme iade dosyası bulunamadı.
              </div>
            ) : (
              filteredRefunds.map((r) => {
                const isSelected = r.id === selectedRefundId;
                const filePaid = r.installments.reduce((sum, i) => sum + i.paidAmount, 0);
                const fileRem = r.installments.reduce((sum, i) => sum + i.remainingAmount, 0);
                const percent = r.totalAmount > 0 ? Math.round((filePaid / r.totalAmount) * 100) : 0;
                const isDone = fileRem === 0 && r.installments.length > 0;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRefundId(r.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-rose-50/80 border-l-4 border-rose-600 shadow-2xs"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">
                          {r.studentName}
                        </h4>
                        {r.parentName && (
                          <span className="text-[11px] text-slate-500 block font-medium">
                            Veli: {r.parentName}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isDone ? "Tamamlandı" : `${r.installmentCount} Taksit`}
                      </span>
                    </div>

                    {/* İlerleme Çubuğu */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                        <span>{formatCurrency(filePaid)} ödendi</span>
                        <span className="font-extrabold text-rose-700">
                          Kalan: {formatCurrency(fileRem)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: SEÇİLİ İADE DOSYASI DETAYI & TAKSİTLERİ */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRefund ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Dosya Başlık & Veli / Banka Kartı */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-rose-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-200">
                        📁 İade Dosyası
                      </span>
                      {selectedRefund.status === "COMPLETED" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Tamamen Ödendi
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Ödemeler Devam Ediyor
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      {selectedRefund.studentName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedRefund.reason || "Kayıt Silme İadesi"} • Toplam İade:{" "}
                      <strong className="text-slate-900">
                        {formatCurrency(selectedRefund.totalAmount)}
                      </strong>{" "}
                      ({selectedRefund.installmentCount} Taksit)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openBulkEditModal(selectedRefund)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Taksit vadelerini ve tutarlarını manuel düzenle"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>✍️ Taksitleri Düzenle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditInfoModal(selectedRefund)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold"
                      title="Dosya Bilgilerini Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRefund(selectedRefund.id)}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                      title="Dosyayı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Veli, Telefon ve IBAN Detay Şeridi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Muhatap / Veli
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {selectedRefund.parentName || "Belirtilmedi"}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      İletişim Telefonu
                    </span>
                    {selectedRefund.phone ? (
                      <a
                        href={`tel:${selectedRefund.phone}`}
                        className="font-extrabold text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{selectedRefund.phone}</span>
                      </a>
                    ) : (
                      <span className="font-semibold text-slate-400">-</span>
                    )}
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        İade IBAN Numarası
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {selectedRefund.iban || "Belirtilmedi"}
                      </span>
                    </div>
                    {selectedRefund.iban && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedRefund.iban || "");
                          setCopiedIban(true);
                          setTimeout(() => setCopiedIban(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="IBAN Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {copiedIban && (
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    ✓ IBAN panoya kopyalandı!
                  </span>
                )}
              </div>

              {/* Taksitler Tablosu */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-16 text-center">Taksit</th>
                      <th className="py-3 px-3.5">Vade Tarihi</th>
                      <th className="py-3 px-3.5 text-right">Taksit Tutarı</th>
                      <th className="py-3 px-3.5 text-right">Ödenen</th>
                      <th className="py-3 px-3.5 text-right">Kalan Bakiye</th>
                      <th className="py-3 px-3.5 text-center">Durum</th>
                      <th className="py-3 px-3.5 text-center">Ödeme Tarihi / Şekli</th>
                      <th className="py-3 px-3.5 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRefund.installments.map((inst) => {
                      const isPaid = inst.status === "PAID";
                      const isPartial = inst.status === "PARTIAL";

                      return (
                        <tr
                          key={inst.id}
                          className={`transition-colors ${
                            isPaid
                              ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                              : isPartial
                              ? "bg-amber-50/30 hover:bg-amber-50/50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-extrabold text-slate-800">
                            {inst.installmentNo}. Taksit
                          </td>

                          <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {inst.dueDateStr ||
                                  new Date(inst.dueDate).toLocaleDateString("tr-TR")}
                              </span>
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right font-bold text-slate-800 whitespace-nowrap">
                            {formatCurrency(inst.amount)}
                          </td>

                          <td className="py-3 px-3.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {formatCurrency(inst.paidAmount)}
                          </td>

                          <td className="py-3 px-3.5 text-right font-black text-rose-700 whitespace-nowrap text-sm">
                            {formatCurrency(inst.remainingAmount)}
                          </td>

                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Ödendi
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Kısmi Ödendi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-500" />
                                Bekliyor
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-center text-slate-500 whitespace-nowrap text-[11px]">
                            {inst.paymentDate ? (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {new Date(inst.paymentDate).toLocaleDateString("tr-TR")}
                                </span>
                                <span className="text-[10px] text-teal-700 font-semibold">
                                  {inst.paymentMethod === "CASH"
                                    ? "Nakit"
                                    : inst.paymentMethod === "CREDIT_CARD"
                                    ? "Kredi Kartı"
                                    : "Banka / Havale"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnpayInstallment(inst.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                  Geri Al
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openPayModal(inst)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Öde</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Alt Bilgi & Notlar */}
              {selectedRefund.notes && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Dosya Notu: </span>
                    <span>{selectedRefund.notes}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              Lütfen sol taraftan bir kayıt silme iade dosyası seçin veya yeni dosya oluşturun.
            </div>
          )}
        </div>
      </div>

      {/* 5. YENİ İADE DOSYASI OLUŞTURMA MODALI */}
      {newRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <UserMinus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Yeni Kayıt Silme İadesi Tanımla
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewRefundModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Öğrenci & Veli */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Öğrenci Adı Soyadı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Alp Tuğrul Karaman"
                      value={newForm.studentName}
                      onChange={(e) => setNewForm({ ...newForm, studentName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Muhatap / Veli Adı
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Ahmet Karaman"
                      value={newForm.parentName}
                      onChange={(e) => setNewForm({ ...newForm, parentName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Telefon & IBAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telefon Numarası
                    </label>
                    <input
                      type="text"
                      placeholder="0(5xx) xxx xx xx"
                      value={newForm.phone}
                      onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      İade Yapılacak IBAN No
                    </label>
                    <input
                      type="text"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      value={newForm.iban}
                      onChange={(e) => setNewForm({ ...newForm, iban: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tutar & Taksit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200/80">
                  <div>
                    <label className="block font-bold text-rose-950 mb-1">
                      Toplam İade Tutarı (TL) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newForm.totalAmount}
                      onChange={(e) =>
                        setNewForm({ ...newForm, totalAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-xl font-black text-rose-950 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-950 mb-1">
                      Taksit Sayısı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={36}
                      required
                      value={newForm.installmentCount}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          installmentCount: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-950 mb-1">
                      İlk Ödeme Başlama Tarihi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newForm.startDate}
                      onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })}
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Kayıt Silme Nedeni & Not */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kayıt Silme Nedeni
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Şehir Değişikliği / Nakil"
                      value={newForm.reason}
                      onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                    <input
                      type="text"
                      placeholder="İsteğe bağlı not..."
                      value={newForm.notes}
                      onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                {/* Canlı Taksit Simülasyonu */}
                <div className="pt-2">
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">
                    📋 Oluşturulacak Taksit Planı Önizlemesi:
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {simulationInstallments.map((item) => (
                      <div
                        key={item.no}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50"
                      >
                        <span className="font-extrabold text-slate-700">
                          {item.no}. Taksit
                        </span>
                        <span className="text-slate-500 font-semibold">{item.dateStr}</span>
                        <span className="font-black text-rose-700">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewRefundModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={newSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{newSubmitting ? "Kaydediliyor..." : "Dosyayı ve Taksitleri Oluştur"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TAKSİT ÖDEME YAP MODALI */}
      {payModalOpen && selectedInstallment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full my-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedInstallment.installmentNo}. Taksit İade Ödemesi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInstallment} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Öğrenci:</span>
                  <strong className="text-slate-900">{selectedRefund?.studentName}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                  <span>Kalan Taksit Borcu:</span>
                  <strong className="text-rose-700">
                    {formatCurrency(selectedInstallment.remainingAmount)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ödenen Tutar (TL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payForm.paidAmount}
                  onChange={(e) =>
                    setPayForm({ ...payForm, paidAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ödeme Tarihi</label>
                  <input
                    type="date"
                    required
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="BANK_TRANSFER">Banka / Havale / EFT</option>
                    <option value="CASH">Nakit (Elden)</option>
                    <option value="CREDIT_CARD">Kredi Kartı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dekont No / Açıklama</label>
                <input
                  type="text"
                  placeholder="Dekont no veya ödeme notu..."
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{paySubmitting ? "Kaydediliyor..." : "Ödemeyi Onayla"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TAKSİTLERİ TOPLU DÜZENLE MODALI */}
      {bulkEditModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Taksit Planını Manuel Düzenle
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRefund.studentName} için vade tarihlerini ve tutarları satır satır ayarlayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkEdit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">Taksit</th>
                      <th className="py-2.5 px-3 w-44">Vade Tarihi</th>
                      <th className="py-2.5 px-3 w-40 text-right">Tutar (TL)</th>
                      <th className="py-2.5 px-3">Not</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRounds.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-extrabold text-slate-800">
                          {r.installmentNo}. Taksit
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            required
                            value={r.dueDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkRounds((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, dueDate: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="any"
                            required
                            value={r.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBulkRounds((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="İsteğe bağlı not..."
                            value={r.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkRounds((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, notes: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Toplam Karşılaştırması */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Yeni Taksitlerin Toplamı:</span>
                  <span className="font-black text-rose-700 text-sm">
                    {formatCurrency(bulkRounds.reduce((sum, item) => sum + item.amount, 0))}
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setBulkEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{bulkSubmitting ? "Kaydediliyor..." : "Taksit Planını Güncelle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DOSYA BİLGİLERİ DÜZENLE MODALI */}
      {editInfoModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Dosya Bilgilerini Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditInfoModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInfo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Öğrenci Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={editInfoForm.studentName}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, studentName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Veli / Muhatap</label>
                  <input
                    type="text"
                    value={editInfoForm.parentName}
                    onChange={(e) => setEditInfoForm({ ...editInfoForm, parentName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editInfoForm.phone}
                    onChange={(e) => setEditInfoForm({ ...editInfoForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">IBAN Numarası</label>
                <input
                  type="text"
                  value={editInfoForm.iban}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, iban: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kayıt Silme Nedeni</label>
                <input
                  type="text"
                  value={editInfoForm.reason}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Not / Açıklama</label>
                <input
                  type="text"
                  value={editInfoForm.notes}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditInfoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={editInfoSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editInfoSubmitting ? "Kaydediliyor..." : "Bilgileri Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Coins,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  CreditCard,
  Banknote,
  RefreshCw,
  Check,
} from "lucide-react";

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  txType: "PURCHASE" | "PAYMENT";
  date: string;
  dueDate: string | null;
  itemTitle: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SupplierAccount {
  id: string;
  name: string;
  productSummary: string;
  category: string;
  unitLabel: string;
  defaultUnitPrice: number;
  paymentDay: number;
  nextPaymentDate: string | null;
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  phone: string | null;
  iban: string | null;
  notes: string | null;
  totalPurchased: number;
  totalPaid: number;
  remainingDebt: number;
  cashPurchased: number;
  cardPurchased: number;
  cashPaid: number;
  cardPaid: number;
  purchaseCount: number;
  paymentCount: number;
  transactions: SupplierTransaction[];
}

interface SupplierStats {
  supplierCount: number;
  activeDebtSupplierCount: number;
  totalPurchased: number;
  totalPaid: number;
  totalRemaining: number;
  totalCashPaid: number;
  totalCardPaid: number;
  totalCashPurchased: number;
  totalCardPurchased: number;
}

const TR_MONTH_NAMES = [
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

function formatDateTR(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[3]}.${m[2]}.${m[1]}`;
  }
  return dateStr;
}

function getDuePeriodLabel(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "-";
  const yr = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  return `${mo}. Ay (${TR_MONTH_NAMES[mo]} ${yr})`;
}

export default function SupplierCariPanel({
  onSynced,
  onNavigateToMonthExpense,
}: {
  onSynced?: () => void;
  onNavigateToMonthExpense?: (ym: string) => void;
}) {
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    supplierCount: 0,
    activeDebtSupplierCount: 0,
    totalPurchased: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalCashPaid: 0,
    totalCardPaid: 0,
    totalCashPurchased: 0,
    totalCardPurchased: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"ALL" | "PURCHASE" | "PAYMENT">("ALL");

  // Cari Ekle / Düzenle Modalı
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierAccount | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    productSummary: "",
    category: "Gıda & Tedarik",
    unitLabel: "Adet",
    defaultUnitPrice: "",
    paymentDay: 15,
    nextPaymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    phone: "",
    iban: "",
    notes: "",
    syncDueDateToPurchases: true,
  });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Alım / Ödeme Ekle Modalı
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<SupplierTransaction | null>(null);
  const [txForm, setTxForm] = useState({
    supplierId: "",
    txType: "PURCHASE" as "PURCHASE" | "PAYMENT",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    itemTitle: "",
    quantity: "1",
    unitPrice: "",
    amount: "",
    paymentMethod: "CASH",
    repeatMonths: 1,
    notes: "",
  });
  const [savingTx, setSavingTx] = useState(false);
  const [quickDueDateSaving, setQuickDueDateSaving] = useState(false);
  const [quickDueDateSavedMsg, setQuickDueDateSavedMsg] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

  const fetchSuppliers = async (keepSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/tedarikci-cari");
      const data = await res.json();
      if (Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
        if (data.stats) setStats(data.stats);
        const targetId = keepSelectedId || selectedId || data.suppliers[0]?.id || "";
        if (targetId && data.suppliers.some((s: SupplierAccount) => s.id === targetId)) {
          setSelectedId(targetId);
        } else if (data.suppliers[0]) {
          setSelectedId(data.suppliers[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedId) || suppliers[0] || null,
    [suppliers, selectedId]
  );

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.productSummary.toLowerCase().includes(q) ||
        (s.category || "").toLowerCase().includes(q) ||
        (s.notes || "").toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const filteredTransactions = useMemo(() => {
    if (!selectedSupplier) return [];
    if (txFilter === "ALL") return selectedSupplier.transactions;
    return selectedSupplier.transactions.filter((t) => t.txType === txFilter);
  }, [selectedSupplier, txFilter]);

  // Seçili carinin hangi aylarda ne kadar ödemesi olduğunu özetle
  const selectedMonthlySchedule = useMemo(() => {
    if (!selectedSupplier) return [];
    const purchases = selectedSupplier.transactions.filter((t) => t.txType === "PURCHASE");
    const payments = selectedSupplier.transactions.filter((t) => t.txType === "PAYMENT");

    const map = new Map<
      string,
      { ym: string; year: number; month: number; dueDate: string; totalDue: number; count: number }
    >();

    purchases.forEach((p) => {
      const raw = p.dueDate || p.date;
      const m = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return;
      const yr = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const ym = `${yr}-${mo}`;
      const existing = map.get(ym);
      if (!existing) {
        map.set(ym, {
          ym,
          year: yr,
          month: mo,
          dueDate: raw,
          totalDue: p.amount,
          count: 1,
        });
      } else {
        existing.totalDue += p.amount;
        existing.count += 1;
        if (raw > existing.dueDate) existing.dueDate = raw;
      }
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month)
    );

    let paidPool = payments.reduce((s, p) => s + p.amount, 0);
    return sorted.map((item) => {
      const applied = Math.min(item.totalDue, Math.max(0, paidPool));
      paidPool = Math.max(0, paidPool - applied);
      const rem = Math.max(0, Number((item.totalDue - applied).toFixed(2)));
      return {
        ...item,
        totalPaid: Number(applied.toFixed(2)),
        remaining: rem,
      };
    });
  }, [selectedSupplier]);

  const openNewSupplierModal = () => {
    setEditingSupplier(null);
    const todayISO = new Date().toISOString().split("T")[0];
    setSupplierForm({
      name: "",
      productSummary: "",
      category: "Gıda & Tedarik",
      unitLabel: "Adet",
      defaultUnitPrice: "",
      paymentDay: 15,
      nextPaymentDate: todayISO,
      paymentMethod: "CASH",
      phone: "",
      iban: "",
      notes: "",
      syncDueDateToPurchases: true,
    });
    setSupplierModalOpen(true);
  };

  const openEditSupplierModal = (sup: SupplierAccount) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      productSummary: sup.productSummary,
      category: sup.category || "Tedarikçi",
      unitLabel: sup.unitLabel || "Adet",
      defaultUnitPrice: sup.defaultUnitPrice > 0 ? String(sup.defaultUnitPrice) : "",
      paymentDay: sup.paymentDay || 15,
      nextPaymentDate: sup.nextPaymentDate || new Date().toISOString().split("T")[0],
      paymentMethod: sup.paymentMethod || "CASH",
      phone: sup.phone || "",
      iban: sup.iban || "",
      notes: sup.notes || "",
      syncDueDateToPurchases: true,
    });
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      setSavingSupplier(true);
      const res = await fetch("/api/tedarikci-cari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingSupplier ? "UPDATE_SUPPLIER" : "CREATE_SUPPLIER",
          id: editingSupplier?.id,
          ...supplierForm,
          defaultUnitPrice: Number(supplierForm.defaultUnitPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Kaydedilemedi");
        return;
      }
      setSupplierModalOpen(false);
      await fetchSuppliers(data.id || editingSupplier?.id);
      if (onSynced) onSynced();
    } catch {
      alert("Hata oluştu");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (sup: SupplierAccount) => {
    if (
      !confirm(
        `"${sup.name}" carisini ve tüm alım/ödeme kayıtlarını silmek istediğinize emin misiniz?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/tedarikci-cari?supplierId=${sup.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSuppliers();
        if (onSynced) onSynced();
      }
    } catch {
      alert("Silinemedi");
    }
  };

  const handleQuickUpdatePaymentDate = async (sup: SupplierAccount, newDateISO: string) => {
    if (!newDateISO) return;
    try {
      setQuickDueDateSaving(true);
      const dMatch = newDateISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
      const dayNum = dMatch ? parseInt(dMatch[3], 10) : sup.paymentDay || 15;
      const res = await fetch("/api/tedarikci-cari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SUPPLIER",
          id: sup.id,
          name: sup.name,
          productSummary: sup.productSummary,
          category: sup.category,
          unitLabel: sup.unitLabel,
          defaultUnitPrice: sup.defaultUnitPrice,
          paymentDay: dayNum,
          nextPaymentDate: newDateISO,
          paymentMethod: sup.paymentMethod,
          phone: sup.phone,
          iban: sup.iban,
          notes: sup.notes,
          syncDueDateToPurchases: true,
        }),
      });
      if (res.ok) {
        await fetchSuppliers(sup.id);
        if (onSynced) onSynced();
        setQuickDueDateSavedMsg(true);
        setTimeout(() => setQuickDueDateSavedMsg(false), 2500);
      }
    } finally {
      setQuickDueDateSaving(false);
    }
  };

  const openAddPurchaseModal = (sup: SupplierAccount) => {
    setEditingTx(null);
    const todayISO = new Date().toISOString().split("T")[0];
    const defDue = sup.nextPaymentDate || todayISO;
    setTxForm({
      supplierId: sup.id,
      txType: "PURCHASE",
      date: todayISO,
      dueDate: defDue,
      itemTitle: sup.productSummary || `${sup.name} Alımı`,
      quantity: "1",
      unitPrice: sup.defaultUnitPrice > 0 ? String(sup.defaultUnitPrice) : "",
      amount: sup.defaultUnitPrice > 0 ? String(sup.defaultUnitPrice) : "",
      paymentMethod: sup.paymentMethod || "CASH",
      repeatMonths: 1,
      notes: "",
    });
    setTxModalOpen(true);
  };

  const openAddPaymentModal = (sup: SupplierAccount, presetAmount?: number, presetDueISO?: string) => {
    setEditingTx(null);
    const todayISO = new Date().toISOString().split("T")[0];
    const payAmt =
      presetAmount !== undefined
        ? presetAmount
        : sup.remainingDebt > 0
        ? sup.remainingDebt
        : 0;
    setTxForm({
      supplierId: sup.id,
      txType: "PAYMENT",
      date: todayISO,
      dueDate: presetDueISO || sup.nextPaymentDate || todayISO,
      itemTitle: `${sup.name} Ödemesi`,
      quantity: "1",
      unitPrice: payAmt > 0 ? String(payAmt) : "",
      amount: payAmt > 0 ? String(payAmt) : "",
      paymentMethod: sup.paymentMethod || "CASH",
      repeatMonths: 1,
      notes: "",
    });
    setTxModalOpen(true);
  };

  const openEditTxModal = (tx: SupplierTransaction) => {
    setEditingTx(tx);
    setTxForm({
      supplierId: tx.supplierId,
      txType: tx.txType,
      date: tx.date,
      dueDate: tx.dueDate || tx.date,
      itemTitle: tx.itemTitle,
      quantity: String(tx.quantity || 1),
      unitPrice: String(tx.unitPrice || tx.amount || ""),
      amount: String(tx.amount || ""),
      paymentMethod: tx.paymentMethod || "CASH",
      repeatMonths: 1,
      notes: tx.notes || "",
    });
    setTxModalOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(txForm.amount) || 0;
    if (numAmount <= 0) {
      alert("Lütfen geçerli bir tutar girin.");
      return;
    }
    try {
      setSavingTx(true);
      const res = await fetch("/api/tedarikci-cari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingTx ? "UPDATE_TRANSACTION" : "ADD_TRANSACTION",
          id: editingTx?.id,
          ...txForm,
          quantity: Number(txForm.quantity) || 1,
          unitPrice: Number(txForm.unitPrice) || numAmount,
          amount: numAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "İşlem kaydedilemedi");
        return;
      }
      setTxModalOpen(false);
      await fetchSuppliers(txForm.supplierId);
      if (onSynced) onSynced();
    } catch {
      alert("Hata oluştu");
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (tx: SupplierTransaction) => {
    if (!confirm(`"${tx.itemTitle}" (${formatCurrency(tx.amount)}) kaydını silmek istiyor musunuz?`))
      return;
    try {
      const res = await fetch(
        `/api/tedarikci-cari?txId=${tx.id}&supplierId=${tx.supplierId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchSuppliers(tx.supplierId);
        if (onSynced) onSynced();
      }
    } catch {
      alert("Silinemedi");
    }
  };

  const cashRemainingTotal = Math.max(0, stats.totalCashPurchased - stats.totalCashPaid);
  const cardRemainingTotal = Math.max(0, stats.totalCardPurchased - stats.totalCardPaid);

  return (
    <div className="space-y-5">
      {/* Üst Başlık ve Hızlı Bilgi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <ShoppingBag className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Düzenli Ürün & Hizmet Aldığımız Tedarikçi Carileri
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Aylık Gider Listesiyle Otomatik Senkronize
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            FSM İlaçlama, Sacit Yoğurt, Tanfer Çiçekçi, Tellioğlu Ekmek, Büyüksümütçi Et, Hamet Tavuk, Altın Dede Pide, Sinan Geldi ve Ahmet Taymaz Kırtasiye gibi carilerden aldıklarınızı ve ödediklerinizi takip edin. Belirttiğiniz ödeme tarihleri otomatik olarak o ayın gider listesinde görünür.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openNewSupplierModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Tedarikçi / Cari Ekle</span>
          </button>
        </div>
      </div>

      {/* 4 Özet Kartı (Nakit & Kart Kırılımlı) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-700">Toplam Alınan (Cari Borçlanma)</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                {formatCurrency(stats.totalPurchased)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">💵 Nakit Ödenecek:</span>
              <span className="font-extrabold">{formatCurrency(stats.totalCashPurchased)}</span>
            </div>
            <div className="flex justify-between text-purple-800">
              <span className="font-semibold">💳 Kartla Ödenecek:</span>
              <span className="font-extrabold">{formatCurrency(stats.totalCardPurchased)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700">Toplam Ödenen</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {formatCurrency(stats.totalPaid)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
            <div className="flex justify-between text-emerald-800">
              <span className="font-semibold">💵 Nakit Ödenen:</span>
              <span className="font-extrabold">{formatCurrency(stats.totalCashPaid)}</span>
            </div>
            <div className="flex justify-between text-purple-800">
              <span className="font-semibold">💳 Kartla Ödenen:</span>
              <span className="font-extrabold">{formatCurrency(stats.totalCardPaid)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-700">Kalan Cari Borç</p>
              <p className="text-lg font-extrabold text-rose-600 mt-0.5">
                {formatCurrency(stats.totalRemaining)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
            <div className="flex justify-between text-rose-900">
              <span className="font-semibold">💵 Nakit Kalan:</span>
              <span className="font-extrabold">{formatCurrency(cashRemainingTotal)}</span>
            </div>
            <div className="flex justify-between text-purple-800">
              <span className="font-semibold">💳 Kartla Kalan:</span>
              <span className="font-extrabold">{formatCurrency(cardRemainingTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-teal-700">Kayıtlı Tedarikçiler</p>
              <p className="text-lg font-extrabold text-teal-800 mt-0.5">
                {stats.supplierCount} Cari Firma
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 font-semibold">
            {stats.activeDebtSupplierCount} caride açık ödeme bakiyesi bulunuyor
          </div>
        </div>
      </div>

      {/* Ana İki Sütunlu Alan: Sol Tedarikçi Listesi | Sağ Seçili Cari Detay & Alım/Ödeme Ekstresi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* SOL SÜTUN: Tedarikçi Carileri Listesi */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                🏪 Tedarikçi & Esnaf Listesi ({filteredSuppliers.length})
              </span>
              <button
                type="button"
                onClick={openNewSupplierModal}
                className="text-[11px] font-extrabold text-teal-700 hover:underline"
              >
                + Yeni Ekle
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari veya alınan ürün ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Yükleniyor...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Cari bulunamadı.</div>
            ) : (
              filteredSuppliers.map((sup) => {
                const isSelected = selectedSupplier?.id === sup.id;
                return (
                  <div
                    key={sup.id}
                    onClick={() => setSelectedId(sup.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50/80 border-l-4 border-l-teal-700"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {sup.name}
                        </p>
                        <p className="text-[11px] font-semibold text-teal-800 truncate">
                          📦 {sup.productSummary}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          sup.remainingDebt > 0
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {sup.remainingDebt > 0
                          ? `Kalan: ${formatCurrency(sup.remainingDebt)}`
                          : "Borç Yok"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                      <span>
                        Alınan: <strong className="text-slate-800">{formatCurrency(sup.totalPurchased)}</strong>
                      </span>
                      <span>
                        Ödenen: <strong className="text-emerald-700">{formatCurrency(sup.totalPaid)}</strong>
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>
                          Ödeme:{" "}
                          {sup.nextPaymentDate
                            ? formatDateTR(sup.nextPaymentDate)
                            : `Her ayın ${sup.paymentDay}'i`}
                        </span>
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openAddPurchaseModal(sup)}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold"
                        >
                          + Alım Gir
                        </button>
                        <button
                          type="button"
                          onClick={() => openAddPaymentModal(sup)}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold"
                        >
                          + Öde
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ SÜTUN: Seçili Cari Detayı, Ödeme Tarihi Planlama ve Alınan/Ödenen Listesi */}
        <div className="lg:col-span-8 space-y-4">
          {selectedSupplier ? (
            <>
              {/* Seçili Cari Üst Kartı */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedSupplier.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                        {selectedSupplier.productSummary}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {selectedSupplier.category}
                      </span>
                    </div>
                    {selectedSupplier.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{selectedSupplier.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openAddPurchaseModal(selectedSupplier)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>📦 + Aldığımız Ürün / Hizmet Gir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddPaymentModal(selectedSupplier)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-2xs transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>💸 + Ödeme Yap (Borçtan Düş)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditSupplierModal(selectedSupplier)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title="Cari Bilgilerini Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSupplier(selectedSupplier)}
                      className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Cariyi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Seçili Carinin Özet Rakamları ve Ödeme Tarihi Seçici */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <span className="text-[11px] font-bold text-amber-900 block">
                      📦 Toplam Aldığımız ({selectedSupplier.purchaseCount} Alım)
                    </span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                      {formatCurrency(selectedSupplier.totalPurchased)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      💸 Toplam Ödediğimiz ({selectedSupplier.paymentCount} Ödeme)
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                      {formatCurrency(selectedSupplier.totalPaid)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/90">
                    <span className="text-[11px] font-bold text-rose-900 block">
                      🔴 Kalan Ödenecek Borç
                    </span>
                    <span className="text-base font-extrabold text-rose-600 mt-0.5 block">
                      {formatCurrency(selectedSupplier.remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* Hızlı Aylık Ödeme Tarihi Belirleme Barı */}
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="font-bold text-teal-950">
                      Bu Cariye Ne Zaman Ödeme Yapılacak? (Aylık Giderlerde Gösterilecek Tarih):
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="date"
                      value={selectedSupplier.nextPaymentDate || ""}
                      onChange={(e) =>
                        handleQuickUpdatePaymentDate(selectedSupplier, e.target.value)
                      }
                      disabled={quickDueDateSaving}
                      className="px-2.5 py-1 bg-white border border-teal-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none"
                    />
                    {quickDueDateSavedMsg && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Aylık Giderlere Yansıtıldı
                      </span>
                    )}
                    {selectedSupplier.nextPaymentDate && onNavigateToMonthExpense && (
                      <button
                        type="button"
                        onClick={() => {
                          const m = String(selectedSupplier.nextPaymentDate).match(
                            /^(\d{4})-(\d{2})/
                          );
                          if (m) {
                            onNavigateToMonthExpense(`${parseInt(m[1], 10)}-${parseInt(m[2], 10)}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold transition-colors"
                      >
                        {getDuePeriodLabel(selectedSupplier.nextPaymentDate)} Gider Listesinde Gör →
                      </button>
                    )}
                  </div>
                </div>

                {/* Aylık Gider Listesine Yansıyan Dönemler Özeti */}
                {selectedMonthlySchedule.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-extrabold text-slate-700 block">
                      📅 Aylık Giderler & Ödeme Listesine Yansıyan Dönemler:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMonthlySchedule.map((ms) => (
                        <div
                          key={ms.ym}
                          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                            ms.remaining > 0
                              ? "bg-amber-50/70 border-amber-300 text-slate-900"
                              : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          }`}
                        >
                          <span className="font-extrabold">
                            {ms.month}. Ay ({TR_MONTH_NAMES[ms.month]} {ms.year})
                          </span>
                          <span className="text-[11px] text-slate-600">
                            Vade: {formatDateTR(ms.dueDate)}
                          </span>
                          <span className="font-black text-slate-900">
                            {formatCurrency(ms.totalDue)}
                          </span>
                          {ms.remaining > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                              Kalan: {formatCurrency(ms.remaining)}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-extrabold">
                              ✓ Ödendi
                            </span>
                          )}
                          {onNavigateToMonthExpense && (
                            <button
                              type="button"
                              onClick={() => onNavigateToMonthExpense(ms.ym)}
                              className="text-[10px] font-extrabold text-teal-700 hover:underline"
                            >
                              Giderde Gör →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seçili Cari Hareket Tablosu (Aldıklarımız & Ödediklerimiz) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: "ALL", label: `Tüm Hareketler (${selectedSupplier.transactions.length})` },
                      {
                        key: "PURCHASE",
                        label: `📦 Aldıklarımız (${selectedSupplier.purchaseCount})`,
                      },
                      {
                        key: "PAYMENT",
                        label: `💸 Ödediklerimiz (${selectedSupplier.paymentCount})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setTxFilter(tab.key as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          txFilter === tab.key
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openAddPurchaseModal(selectedSupplier)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold"
                    >
                      + Aldığımız Ürün Gir
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddPaymentModal(selectedSupplier)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold"
                    >
                      + Ödeme Gir
                    </button>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-600">
                      {selectedSupplier.name} için henüz kayıtlı bir alım veya ödeme hareketi yok.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      &ldquo;📦 + Aldığımız Ürün / Hizmet Gir&rdquo; butonuna tıklayarak aldığınız ürünü ve ne zaman ödeneceğini girdiğinizde otomatik olarak o ayın gider listesine de eklenir.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">İşlem Türü</th>
                          <th className="py-2.5 px-3">Alınan Ürün / Hizmet & Açıklama</th>
                          <th className="py-2.5 px-3">İşlem Tarihi</th>
                          <th className="py-2.5 px-3">Ödeme / Vade Tarihi (Gider Ayı)</th>
                          <th className="py-2.5 px-3 text-center">Miktar / Birim</th>
                          <th className="py-2.5 px-3 text-right">Tutar</th>
                          <th className="py-2.5 px-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map((tx) => {
                          const isPurchase = tx.txType === "PURCHASE";
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3">
                                {isPurchase ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-[10px]">
                                    <ArrowDownLeft className="w-3 h-3 text-amber-700" />
                                    <span>Ürün/Hizmet Alımı</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[10px]">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                                    <span>Ödeme Yapıldı</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-900">{tx.itemTitle}</p>
                                {tx.notes && (
                                  <p className="text-[10px] text-slate-500">{tx.notes}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-700">
                                {formatDateTR(tx.date)}
                              </td>
                              <td className="py-2.5 px-3">
                                {isPurchase ? (
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-teal-900">
                                      📅 {formatDateTR(tx.dueDate || tx.date)}
                                    </span>
                                    <span className="text-[10px] text-teal-700 font-semibold">
                                      {getDuePeriodLabel(tx.dueDate || tx.date)} Gideri
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    {tx.paymentMethod === "CREDIT_CARD"
                                      ? "💳 Kredi Kartı"
                                      : "💵 Nakit / Havale"}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">
                                {isPurchase
                                  ? `${tx.quantity} ${selectedSupplier.unitLabel || "Adet"}`
                                  : "-"}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-extrabold text-sm ${
                                  isPurchase ? "text-amber-900" : "text-emerald-700"
                                }`}
                              >
                                {isPurchase ? "+" : "-"}
                                {formatCurrency(tx.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditTxModal(tx)}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTx(tx)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
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
            </>
          ) : null}
        </div>
      </div>

      {/* MODAL 1: ALIM GİR / ÖDEME YAP */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    txForm.txType === "PURCHASE"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {txForm.txType === "PURCHASE" ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : (
                    <Coins className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingTx
                      ? "Cari Hareketi Düzenle"
                      : txForm.txType === "PURCHASE"
                      ? "📦 Aldığımız Ürün / Hizmeti Gir (Cari Borç Ekle)"
                      : "💸 Cariye Yaptığımız Ödemeyi Gir (Borçtan Düş)"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {suppliers.find((s) => s.id === txForm.supplierId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="space-y-3">
              {/* İşlem Türü Seçimi */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, txType: "PURCHASE" })}
                  className={`py-2 rounded-lg font-extrabold text-xs transition-all ${
                    txForm.txType === "PURCHASE"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📦 Ürün / Hizmet Aldık (Borç)
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, txType: "PAYMENT" })}
                  className={`py-2 rounded-lg font-extrabold text-xs transition-all ${
                    txForm.txType === "PAYMENT"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  💸 Ödeme Yaptık (Borçtan Düş)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {txForm.txType === "PURCHASE"
                    ? "Alınan Ürün / Hizmet Açıklaması *"
                    : "Ödeme Açıklaması *"}
                </label>
                <input
                  type="text"
                  required
                  value={txForm.itemTitle}
                  onChange={(e) => setTxForm({ ...txForm, itemTitle: e.target.value })}
                  placeholder={
                    txForm.txType === "PURCHASE"
                      ? "Örn: 10 Kova Yoğurt Alımı, İlaçlama Hizmeti, Ekmek Alımı, Kırtasiye..."
                      : "Örn: Nakit Ödeme, Banka Havalesi..."
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-teal-600"
                />
              </div>

              {txForm.txType === "PURCHASE" && (
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Miktar ({selectedSupplier?.unitLabel || "Adet"})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={txForm.quantity}
                      onChange={(e) => {
                        const qty = e.target.value;
                        const up = Number(txForm.unitPrice) || 0;
                        setTxForm({
                          ...txForm,
                          quantity: qty,
                          amount: up > 0 ? String(Number(((Number(qty) || 1) * up).toFixed(2))) : txForm.amount,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Birim Ücret (Opsiyonel)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={txForm.unitPrice}
                      onChange={(e) => {
                        const up = e.target.value;
                        const qty = Number(txForm.quantity) || 1;
                        setTxForm({
                          ...txForm,
                          unitPrice: up,
                          amount:
                            Number(up) > 0
                              ? String(Number((qty * Number(up)).toFixed(2)))
                              : txForm.amount,
                        });
                      }}
                      placeholder="Örn: 350"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Toplam Tutar (TL) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border-2 border-amber-400 bg-amber-50/40 rounded-xl font-extrabold text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}

              {txForm.txType === "PAYMENT" && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Ödenen Tutar (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border-2 border-emerald-400 bg-emerald-50/40 rounded-xl font-extrabold text-sm text-emerald-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txForm.txType === "PURCHASE" ? "Ürün/Hizmet Alım Tarihi *" : "Ödeme Tarihi *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-teal-900 mb-1">
                    {txForm.txType === "PURCHASE"
                      ? "📅 Ne Zaman Ödenecek? (Aylık Gider Tarihi) *"
                      : "İlgili Dönem / Vade Tarihi"}
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.dueDate}
                    onChange={(e) => setTxForm({ ...txForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-teal-400 bg-teal-50/40 rounded-xl font-extrabold text-teal-950"
                  />
                </div>
              </div>

              {txForm.txType === "PURCHASE" && !editingTx && (
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-extrabold text-teal-950 text-[11px]">
                      🔄 Her Ay Düzenli Tekrarlansın mı? (Aylık Giderlerde Her Ay Göster):
                    </label>
                    <select
                      value={txForm.repeatMonths}
                      onChange={(e) =>
                        setTxForm({ ...txForm, repeatMonths: Number(e.target.value) || 1 })
                      }
                      className="px-2.5 py-1 bg-white border border-teal-300 rounded-lg font-extrabold text-xs text-teal-900"
                    >
                      <option value={1}>Sadece Seçili Ayda Göster (Tek Alım)</option>
                      <option value={3}>3 Ay Boyunca Her Ay Giderlerde Göster</option>
                      <option value={6}>6 Ay Boyunca Her Ay Giderlerde Göster</option>
                      <option value={10}>10 Ay (Okul Dönemi) Her Ay Göster</option>
                      <option value={12}>12 Ay Boyunca Her Ay Giderlerde Göster</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-teal-800">
                    Seçtiğiniz ödeme tarihi (<strong>{getDuePeriodLabel(txForm.dueDate)}</strong>) otomatik olarak <strong>Okul Giderleri & Taksit Takibi</strong> listesindeki ilgili ayın ödemelerine eklenir.
                  </p>
                </div>
              )}

              {/* Ödeme Şekli (Nakit / Kart) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödeme Şekli</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer bg-slate-50">
                    <input
                      type="radio"
                      name="supTxPm"
                      checked={txForm.paymentMethod === "CASH"}
                      onChange={() => setTxForm({ ...txForm, paymentMethod: "CASH" })}
                    />
                    <span className="font-bold text-slate-800">💵 Nakit / Havale</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer bg-purple-50/50">
                    <input
                      type="radio"
                      name="supTxPm"
                      checked={txForm.paymentMethod === "CREDIT_CARD"}
                      onChange={() => setTxForm({ ...txForm, paymentMethod: "CREDIT_CARD" })}
                    />
                    <span className="font-bold text-purple-900">💳 Kredi Kartı</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Not / Fiş / Açıklama</label>
                <input
                  type="text"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  placeholder="Opsiyonel detay..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingTx}
                  className={`px-5 py-2 text-white rounded-xl font-extrabold shadow-xs disabled:opacity-50 ${
                    txForm.txType === "PURCHASE"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {savingTx
                    ? "Kaydediliyor..."
                    : editingTx
                    ? "Güncelle"
                    : txForm.txType === "PURCHASE"
                    ? "Alımı Kaydet & Giderlere Yansıt"
                    : "Ödemeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: YENİ TEDARİKÇİ / CARİ EKLE VEYA DÜZENLE */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>
                  {editingSupplier ? "Tedarikçi Cari Düzenle" : "Yeni Tedarikçi / Cari Ekle"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cari / Firma / Esnaf Adı *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Örn: Sacit Yoğurt, FSM İlaçlama, Tellioğlu Ekmek..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alınan Ürün / Hizmet Tanımı *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.productSummary}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, productSummary: e.target.value })
                  }
                  placeholder="Örn: Aylık kova yoğurt alımı, İlaçlama başı ücret, Pide yaptırma..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    placeholder="Örn: Gıda, Kırtasiye, Servis"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Birim Adı</label>
                  <input
                    type="text"
                    value={supplierForm.unitLabel}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, unitLabel: e.target.value })
                    }
                    placeholder="Örn: Kova, Adet, Kg, İşlem"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Varsayılan Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={supplierForm.nextPaymentDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
                      setSupplierForm({
                        ...supplierForm,
                        nextPaymentDate: val,
                        paymentDay: m ? parseInt(m[3], 10) : supplierForm.paymentDay,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Birim Ücret (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierForm.defaultUnitPrice}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, defaultUnitPrice: e.target.value })
                    }
                    placeholder="Örn: 500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="05XX..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={supplierForm.iban}
                    onChange={(e) => setSupplierForm({ ...supplierForm, iban: e.target.value })}
                    placeholder="TR..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  placeholder="Opsiyonel açıklama..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-extrabold shadow-xs disabled:opacity-50"
                >
                  {savingSupplier ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

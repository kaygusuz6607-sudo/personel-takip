"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Building2,
  TrendingUp,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  PlusCircle,
  MinusCircle,
  FileText,
  Phone,
  Mail,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Scale,
} from "lucide-react";

export interface ThirdPartyAccount {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  tcNo: string | null;
  iban: string | null;
  notes: string | null;
  balance: number;
  transactions: ThirdPartyTransaction[];
  _count?: { transactions: number };
  createdAt: string;
}

export interface ThirdPartyTransaction {
  id: string;
  accountId: string;
  date: string;
  type: string;
  amount: number;
  direction: string; // INFLOW (+), OUTFLOW (-)
  balanceAfter: number;
  paymentMethod: string;
  category: string | null;
  description: string | null;
  createdAt: string;
}

interface Stats {
  totalAccounts: number;
  totalCompanyOwed: number; // Borçlu olduğumuz (-)
  totalCompanyReceivable: number; // Alacaklı olduğumuz (+)
  netBalance: number;
}

const TYPE_MAP: Record<string, { label: string; badge: string }> = {
  PERSON: { label: "Şahıs / Birey", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  PARTNER: { label: "Şirket Ortağı", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPANY: { label: "Firma / 3. Şahıs", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

const TX_TYPES: Record<string, { label: string; defaultDir: "INFLOW" | "OUTFLOW"; icon: any; color: string }> = {
  BORROW: { label: "Borç Alındı", defaultDir: "OUTFLOW", icon: ArrowDownLeft, color: "text-rose-700 bg-rose-50 border-rose-200" },
  EXPENSE_ON_BEHALF: { label: "Bizim Adımıza Ödeme Yaptı (SGK vb.)", defaultDir: "OUTFLOW", icon: Receipt, color: "text-amber-700 bg-amber-50 border-amber-200" },
  PAYMENT_SENT: { label: "Ödeme Gönderildi", defaultDir: "INFLOW", icon: ArrowUpRight, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LEND: { label: "Borç Verildi", defaultDir: "INFLOW", icon: ArrowUpRight, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  COLLECTION: { label: "Tahsilat Alındı", defaultDir: "OUTFLOW", icon: ArrowDownLeft, color: "text-teal-700 bg-teal-50 border-teal-200" },
  OFFSET: { label: "Mahsup / Düzeltme", defaultDir: "INFLOW", icon: Scale, color: "text-slate-700 bg-slate-50 border-slate-200" },
};

export default function ThirdPartyLedger() {
  const [accounts, setAccounts] = useState<ThirdPartyAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ThirdPartyAccount | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalAccounts: 0,
    totalCompanyOwed: 0,
    totalCompanyReceivable: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modallar
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ThirdPartyAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    type: "PERSON",
    phone: "",
    tcNo: "",
    iban: "",
    notes: "",
  });
  const [submittingAccount, setSubmittingAccount] = useState(false);

  const [newTxModalOpen, setNewTxModalOpen] = useState(false);
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "BORROW",
    direction: "OUTFLOW" as "INFLOW" | "OUTFLOW",
    amount: "",
    paymentMethod: "BANK",
    category: "Nakit Borç",
    description: "",
  });

  const fetchAccounts = async (preserveSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/cari/sahis");
      const data = await res.json();
      if (Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        if (data.stats) setStats(data.stats);

        const currentId = preserveSelectedId || selectedAccount?.id;
        const target = data.accounts.find((a: ThirdPartyAccount) => a.id === currentId) || data.accounts[0] || null;
        setSelectedAccount(target);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Kişi Filtreleme
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.phone && a.phone.includes(q)) ||
        (a.tcNo && a.tcNo.includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  // Yeni Cari Açılışı
  const handleOpenNewAccountModal = () => {
    setEditingAccount(null);
    setAccountForm({
      name: "",
      type: "PERSON",
      phone: "",
      tcNo: "",
      iban: "",
      notes: "",
    });
    setNewAccountModalOpen(true);
  };

  const handleOpenEditAccountModal = (acc: ThirdPartyAccount) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      type: acc.type,
      phone: acc.phone || "",
      tcNo: acc.tcNo || "",
      iban: acc.iban || "",
      notes: acc.notes || "",
    });
    setNewAccountModalOpen(true);
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;
    try {
      setSubmittingAccount(true);
      const url = editingAccount ? `/api/cari/sahis/${editingAccount.id}` : "/api/cari/sahis";
      const method = editingAccount ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "İşlem başarısız");
        return;
      }
      setNewAccountModalOpen(false);
      await fetchAccounts(data.id || editingAccount?.id);
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`"${name}" cari hesabını ve tüm hareket geçmişini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/cari/sahis/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || "Silinemedi");
      }
    } catch (e) {
      alert("Hata oluştu");
    }
  };

  // Yeni Hareket Açılışı
  const handleOpenNewTxModal = (presetType?: string) => {
    const selectedType = presetType || "BORROW";
    const defDir = TX_TYPES[selectedType]?.defaultDir || "OUTFLOW";
    setTxForm({
      date: new Date().toISOString().split("T")[0],
      type: selectedType,
      direction: defDir,
      amount: "",
      paymentMethod: "BANK",
      category:
        selectedType === "EXPENSE_ON_BEHALF"
          ? "SGK Ödemesi"
          : selectedType === "PAYMENT_SENT"
          ? "Banka Havalesi"
          : "Nakit Borç",
      description: "",
    });
    setNewTxModalOpen(true);
  };

  // İşlem türü değiştiğinde varsayılan yönü ve kategoriyi otomatik belirle
  const handleTxTypeChange = (newType: string) => {
    const defDir = TX_TYPES[newType]?.defaultDir || "OUTFLOW";
    let defaultCat = "Nakit Borç";
    if (newType === "EXPENSE_ON_BEHALF") defaultCat = "SGK Ödemesi";
    if (newType === "PAYMENT_SENT") defaultCat = "Banka Havalesi";
    if (newType === "COLLECTION") defaultCat = "Tahsilat";
    if (newType === "OFFSET") defaultCat = "Mahsup";

    setTxForm({
      ...txForm,
      type: newType,
      direction: defDir,
      category: defaultCat,
    });
  };

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const num = parseFloat(txForm.amount);
    if (isNaN(num) || num <= 0) {
      alert("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    try {
      setTxSubmitting(true);
      const res = await fetch(`/api/cari/sahis/${selectedAccount.id}/islem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "İşlem kaydedilemedi");
        return;
      }
      setNewTxModalOpen(false);
      await fetchAccounts(selectedAccount.id);
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    if (!selectedAccount) return;
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz? Bakiye otomatik olarak yeniden hesaplanacaktır.")) return;

    try {
      const res = await fetch(`/api/cari/sahis/${selectedAccount.id}/islem?txId=${txId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAccounts(selectedAccount.id);
      } else {
        const data = await res.json();
        alert(data.error || "İşlem silinemedi");
      }
    } catch (e) {
      alert("Hata oluştu");
    }
  };

  // Simüle Edilen Yeni Bakiye (Modalda anlık gösterim)
  const simulatedNewBalance = useMemo(() => {
    if (!selectedAccount) return 0;
    const num = parseFloat(txForm.amount) || 0;
    if (txForm.direction === "INFLOW") {
      return selectedAccount.balance + num;
    } else {
      return selectedAccount.balance - num;
    }
  }, [selectedAccount, txForm.amount, txForm.direction]);

  return (
    <div className="space-y-6">
      {/* 1. Üst İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanımlı Şahıs Carisi</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalAccounts} Kişi/Firma</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ortaklar ve 3. şahıslar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Kurumun Toplam Borcu (-) */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-rose-50/40 to-white">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Şahıslara Borcumuz (-)</p>
            </div>
            <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(stats.totalCompanyOwed)}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">Geri ödenmesi gereken borç</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Kurumun Toplam Alacağı (+) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-emerald-50/40 to-white">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Şahıslardan Alacağımız (+)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stats.totalCompanyReceivable)}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Kurumun tahsil edeceği tutar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Durum */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Bakiye Durumu</p>
            <p
              className={`text-2xl font-black mt-1 ${
                stats.netBalance < 0 ? "text-rose-600" : stats.netBalance > 0 ? "text-emerald-600" : "text-slate-800"
              }`}
            >
              {formatCurrency(stats.netBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.netBalance < 0 ? "Net olarak borçluyuz" : stats.netBalance > 0 ? "Net olarak alacaklıyız" : "Dengede"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Ana Gövde: Sol Cari Listesi & Sağ Cari Ekstresi */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SOL: Kişi / Cari Seçici */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 h-fit print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-700" />
              <span>Cari Hesaplar</span>
            </span>
            <button
              type="button"
              onClick={handleOpenNewAccountModal}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Yeni Kişi</span>
            </button>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="İsim, telefon veya not ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Kişi Listesi */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Kayıt bulunamadı. &quot;Yeni Kişi&quot; butonuyla ekleyebilirsiniz.
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                const typeInfo = TYPE_MAP[acc.type] || TYPE_MAP.PERSON;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccount(acc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-500 shadow-2xs ring-1 ring-indigo-500/20"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                          {acc.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {typeInfo.label} • {acc.transactions.length} İşlem
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black block ${
                          acc.balance < 0 ? "text-rose-600" : acc.balance > 0 ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {formatCurrency(acc.balance)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                          acc.balance < 0
                            ? "bg-rose-100 text-rose-800"
                            : acc.balance > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {acc.balance < 0 ? "Borçluyuz" : acc.balance > 0 ? "Alacaklıyız" : "Bakiye 0"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Seçilen Şahsın Ekstresi ve İşlemleri */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Cari verileri yükleniyor...
            </div>
          ) : !selectedAccount ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Lütfen sol listeden bir cari hesap seçiniz veya yeni bir kişi tanımlayınız.
            </div>
          ) : (
            <>
              {/* Hesap Bilgileri & Büyük Bakiye Kartı */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative overflow-hidden space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {selectedAccount.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedAccount.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_MAP[selectedAccount.type]?.badge}`}>
                          {TYPE_MAP[selectedAccount.type]?.label}
                        </span>
                        {selectedAccount.tcNo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            TC/Vergi: {selectedAccount.tcNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedAccount.phone && `📞 ${selectedAccount.phone}`}
                        {selectedAccount.notes && ` • Not: ${selectedAccount.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAccountModal(selectedAccount)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(selectedAccount.id, selectedAccount.name)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hesabı Sil</span>
                    </button>
                  </div>
                </div>

                {/* Bakiye Durum Kartı (Kullanıcının örneğindeki net görünüm) */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedAccount.balance < 0
                      ? "bg-rose-50/80 border-rose-300 text-rose-950"
                      : selectedAccount.balance > 0
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs ${
                        selectedAccount.balance < 0 ? "bg-rose-600" : selectedAccount.balance > 0 ? "bg-emerald-600" : "bg-slate-500"
                      }`}
                    >
                      {selectedAccount.balance < 0 ? "BORÇ" : selectedAccount.balance > 0 ? "ALACAK" : "0"}
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider block opacity-75">
                        Güncel Cari Bakiye
                      </span>
                      <span className="text-2xl font-black block tracking-tight">
                        {formatCurrency(selectedAccount.balance)}
                      </span>
                      <span className="text-xs font-semibold block mt-0.5">
                        {selectedAccount.balance < 0
                          ? `🔴 Kurumumuz ${selectedAccount.name} şahsına toplam ${formatCurrency(Math.abs(selectedAccount.balance))} borçludur.`
                          : selectedAccount.balance > 0
                          ? `🟢 Kurumumuz ${selectedAccount.name} şahsından toplam ${formatCurrency(selectedAccount.balance)} alacaklıdır.`
                          : `⚪ Hesap kapalı / borç ve alacak bulunmamaktadır.`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 print:hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenNewTxModal("BORROW")}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>+ Borç Alındı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNewTxModal("EXPENSE_ON_BEHALF")}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>+ SGK / Masraf Ödedi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNewTxModal("PAYMENT_SENT")}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+ Ödeme Gönderildi</span>
                    </button>
                  </div>
                </div>

                {/* IBAN Bilgisi (Varsa) */}
                {selectedAccount.iban && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium">Banka IBAN:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedAccount.iban}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedAccount.iban!, "acc-iban")}
                      className="ml-auto text-[11px] text-indigo-700 hover:underline font-bold"
                    >
                      {copiedId === "acc-iban" ? "Kopyalandı! ✓" : "Kopyala"}
                    </button>
                  </div>
                )}
              </div>

              {/* Ekstre Tablosu (Kronolojik Yürüyen Bakiye) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      📜 Hesap Hareketleri & Yürüyen Bakiye Ekstresi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tüm borç alımları, SGK ödemeleri ve gönderilen transferlerin kronolojik dökümü
                    </p>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Yazdır / PDF</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3.5">Tarih</th>
                        <th className="py-3 px-3.5">İşlem Türü</th>
                        <th className="py-3 px-3.5">Açıklama / Detay</th>
                        <th className="py-3 px-3.5">Ödeme Kanalı</th>
                        <th className="py-3 px-3.5 text-right text-rose-700">Borç (-)</th>
                        <th className="py-3 px-3.5 text-right text-emerald-700">Alacak (+)</th>
                        <th className="py-3 px-3.5 text-right">Yürüyen Bakiye</th>
                        <th className="py-3 px-3 text-center print:hidden">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedAccount.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-400">
                            Bu cariye ait henüz işlem kaydı bulunmuyor. Yukarıdaki butonlarla ilk hareketi ekleyebilirsiniz.
                          </td>
                        </tr>
                      ) : (
                        selectedAccount.transactions.map((tx) => {
                          const txTypeInfo = TX_TYPES[tx.type] || TX_TYPES.BORROW;
                          const TxIcon = txTypeInfo.icon;
                          const isOutflow = tx.direction === "OUTFLOW"; // Borç (-)
                          const isInflow = tx.direction === "INFLOW"; // Alacak (+)

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Tarih */}
                              <td className="py-3 px-3.5 text-slate-900 font-bold whitespace-nowrap">
                                {new Date(tx.date).toLocaleDateString("tr-TR")}
                              </td>

                              {/* İşlem Türü */}
                              <td className="py-3 px-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${txTypeInfo.color}`}>
                                  <TxIcon className="w-3 h-3" />
                                  <span>{txTypeInfo.label}</span>
                                </span>
                              </td>

                              {/* Açıklama */}
                              <td className="py-3 px-3.5">
                                <div className="space-y-0.5">
                                  <p className="text-slate-900 font-semibold">{tx.description || tx.category || "—"}</p>
                                  {tx.category && tx.description && (
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      Kategori: {tx.category}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Kanal */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {tx.paymentMethod === "CASH" ? "💵 Nakit / Elden" : "🏛️ Banka / Havale"}
                                </span>
                              </td>

                              {/* Borç (-) */}
                              <td className="py-3 px-3.5 text-right font-extrabold text-rose-600 whitespace-nowrap">
                                {isOutflow ? `-${formatCurrency(tx.amount)}` : "—"}
                              </td>

                              {/* Alacak (+) */}
                              <td className="py-3 px-3.5 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                                {isInflow ? `+${formatCurrency(tx.amount)}` : "—"}
                              </td>

                              {/* Yürüyen Bakiye */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <span
                                  className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                                    tx.balanceAfter < 0
                                      ? "text-rose-700 bg-rose-50 border border-rose-200"
                                      : tx.balanceAfter > 0
                                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                      : "text-slate-700 bg-slate-100"
                                  }`}
                                >
                                  {formatCurrency(tx.balanceAfter)}
                                </span>
                              </td>

                              {/* Silme */}
                              <td className="py-3 px-3 text-center print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTx(tx.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Bu İşlemi Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. MODAL: YENİ / DÜZENLE CARİ ŞAHIS HESABI */}
      {newAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingAccount ? "Cari Hesabı Düzenle" : "Yeni Şahıs / 3. Kişi Cari Hesabı"}
                  </h3>
                  <p className="text-xs text-slate-500">Şirket ortakları, borç alınıp verilen şahıslar veya 3. kişiler</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewAccountModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cari / Şahıs Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="Örn: Orhan Kayaalp"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cari Türü</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="PARTNER">Şirket Ortağı</option>
                    <option value="PERSON">Şahıs / Birey</option>
                    <option value="COMPANY">Firma / Kurum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="0532..."
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TC Kimlik / Vergi No</label>
                  <input
                    type="text"
                    value={accountForm.tcNo}
                    onChange={(e) => setAccountForm({ ...accountForm, tcNo: e.target.value })}
                    placeholder="11 haneli TC no"
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banka IBAN</label>
                  <input
                    type="text"
                    value={accountForm.iban}
                    onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })}
                    placeholder="TR..."
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notlar / Açıklama</label>
                <textarea
                  rows={2}
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  placeholder="Bu hesap hakkında özel notlar..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingAccount}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingAccount ? "Kaydediliyor..." : editingAccount ? "Güncelle" : "Hesabı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: YENİ CARİ HAREKET / PARA ALIŞVERİŞİ */}
      {newTxModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Yeni Cari Hareket: {selectedAccount.name}
                  </h3>
                  <p className="text-xs text-slate-500">Borç alma, SGK/masraf ödemesi veya ödeme gönderme</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTx} className="space-y-3.5">
              {/* İşlem Türü Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">İşlem Türü *</label>
                <select
                  value={txForm.type}
                  onChange={(e) => handleTxTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none bg-slate-50"
                >
                  <option value="BORROW">🔴 Borç Para Alındı (Kurumun Borcu Artar)</option>
                  <option value="EXPENSE_ON_BEHALF">🟡 SGK / Kurum Adına Masraf Yaptı (Kurum Borçlanır)</option>
                  <option value="PAYMENT_SENT">🟢 Şahsa Borç Ödemesi Gönderildi (Borcumuz Azalır)</option>
                  <option value="LEND">🔵 Şahsa Borç Para Verildi (Alacağımız Artar)</option>
                  <option value="COLLECTION">🟣 Şahıstan Borç Tahsil Edildi (Alacağımız Azalır)</option>
                  <option value="OFFSET">⚪ Özel Mahsup / Bakiye Düzeltmesi</option>
                </select>
              </div>

              {/* Tutar ve Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">İşlem Tutarı (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-black text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Yön & Ödeme Yöntemi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Hesap Etkisi</label>
                  <select
                    value={txForm.direction}
                    onChange={(e) => setTxForm({ ...txForm, direction: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="OUTFLOW">Borç (-) Şirket Borçlanır / Bakiye Düşer</option>
                    <option value="INFLOW">Alacak / Ödeme (+) Bakiye Yükselir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="BANK">🏛️ Banka / Havale / EFT</option>
                    <option value="CASH">💵 Nakit / Elden</option>
                  </select>
                </div>
              </div>

              {/* Kategori ve Açıklama */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Kategori</label>
                <input
                  type="text"
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  placeholder="Örn: SGK Ödemesi, Nakit Borç, Okul Masrafı"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Açıklama / Not</label>
                <input
                  type="text"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  placeholder="Örn: SGK için bizim adımıza ödeme yaptı, Vakıfbank havale"
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              {/* Anlık Yeni Bakiye Önizlemesi */}
              {Boolean(txForm.amount) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Mevcut Bakiye:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(selectedAccount.balance)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium block">Bu İşlem Sonrası Yeni Bakiye:</span>
                    <span
                      className={`font-black text-sm ${
                        simulatedNewBalance < 0
                          ? "text-rose-600"
                          : simulatedNewBalance > 0
                          ? "text-emerald-600"
                          : "text-slate-800"
                      }`}
                    >
                      {formatCurrency(simulatedNewBalance)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTxModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {txSubmitting ? "Kaydediliyor..." : "İşlemi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

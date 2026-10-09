"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Landmark,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  Building2,
  User,
  DollarSign,
  Coins,
  RefreshCw,
  ArrowRight,
  Filter,
  Check,
  X,
  CreditCard,
  Edit2,
  Edit3,
} from "lucide-react";

interface InstallmentItem {
  id: string;
  title: string;
  installmentInfo: string | null;
  period: string | null;
  monthIndex: number | null;
  dueDate: string | null;
  dueDateStr: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  description: string | null;
  paymentHistory: string | null;
}

interface LoanGroup {
  id: string;
  groupKey: string;
  title: string;
  borrowerType: "OKUL" | "SAHIS";
  borrowerName: string;
  bankName: string;
  subCategory: string;
  notes: string;
  installments: InstallmentItem[];
  totalAmount: number;
  totalPaid: number;
  remainingDebt: number;
  installmentCount: number;
  paidInstallmentCount: number;
  pendingInstallmentCount: number;
  monthlyInstallmentAmount: number;
  firstDueDate: string | null;
  isCompleted: boolean;
  nextDueInstallment: InstallmentItem | null;
}

interface SummaryStats {
  totalDebt: number;
  totalPaid: number;
  monthlyDueThisMonth: number;
  activeLoanCount: number;
  completedLoanCount: number;
  totalLoanCount: number;
}

const COMMON_BANKS = [
  "Akbank",
  "Halkbank",
  "VakıfBank",
  "Ziraat Bankası",
  "Garanti BBVA",
  "İş Bankası",
  "Yapı Kredi",
  "Denizbank",
  "QNB Finansbank",
  "Türkiye Finans",
  "TEB",
];

const COMMON_BORROWERS = [
  "Simya Çocuk Üniversitesi",
  "Ahmet Taymaz",
  "Muhammed Ali Çağır",
  "Duygu Köse",
  "Emre Helvacı",
];

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatSafeDate(dStr: string | null | undefined): string {
  if (!dStr) return "-";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(dStr);
  }
}

function getBankBadgeColors(bankName: string): { bg: string; text: string; border: string; bar: string } {
  const b = (bankName || "").toLowerCase();
  if (b.includes("akbank")) return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", bar: "bg-rose-600" };
  if (b.includes("halk") || b.includes("paraf")) return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", bar: "bg-sky-600" };
  if (b.includes("vakıf") || b.includes("vakif")) return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", bar: "bg-amber-500" };
  if (b.includes("ziraat")) return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-600" };
  if (b.includes("garanti")) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-600" };
  if (b.includes("iş bank") || b.includes("is bank")) return { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", bar: "bg-blue-700" };
  if (b.includes("yapı kredi") || b.includes("yapi kredi")) return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", bar: "bg-indigo-600" };
  if (b.includes("deniz")) return { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", bar: "bg-cyan-600" };
  if (b.includes("qnb") || b.includes("finans")) return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-600" };
  return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", bar: "bg-indigo-600" };
}

export default function BankLoansTracker() {
  const [loans, setLoans] = useState<LoanGroup[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalDebt: 0,
    totalPaid: 0,
    monthlyDueThisMonth: 0,
    activeLoanCount: 0,
    completedLoanCount: 0,
    totalLoanCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBorrowerType, setFilterBorrowerType] = useState<"ALL" | "OKUL" | "SAHIS">("ALL");
  const [filterBank, setFilterBank] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [expandedLoanIds, setExpandedLoanIds] = useState<Set<string>>(new Set());

  // Yeni Kredi Tanımlama Modalı
  const [newLoanModalOpen, setNewLoanModalOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanForm, setLoanForm] = useState({
    title: "",
    borrowerType: "OKUL" as "OKUL" | "SAHIS",
    borrowerName: "Simya Çocuk Üniversitesi",
    bankName: "Halkbank",
    subCategory: "Banka Kredisi",
    totalAmount: "",
    monthlyAmount: "",
    installmentCount: "12",
    firstDueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Kredi Düzenleme Modalı
  const [editLoanModalOpen, setEditLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanGroup | null>(null);
  const [submittingEditLoan, setSubmittingEditLoan] = useState(false);
  const [editLoanForm, setEditLoanForm] = useState({
    title: "",
    borrowerType: "OKUL" as "OKUL" | "SAHIS",
    borrowerName: "",
    bankName: "",
    subCategory: "Banka Kredisi",
    monthlyAmount: "",
    updatePendingAmount: false,
    notes: "",
  });

  // Tekil Taksit Düzenleme Modalı
  const [editInstallmentModalOpen, setEditInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<InstallmentItem | null>(null);
  const [submittingEditInstallment, setSubmittingEditInstallment] = useState(false);
  const [editInstallmentForm, setEditInstallmentForm] = useState({
    dueDate: "",
    amountDue: "",
    installmentInfo: "",
    notes: "",
  });

  // Parçalı / Taksit Ödeme Modalı
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<InstallmentItem | null>(null);
  const [activeLoanTitle, setActiveLoanTitle] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState<"CASH" | "BANK">("BANK");
  const [payNote, setPayNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Verileri Çek
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/krediler");
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error("Krediler yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Akordiyon aç / kapa
  const toggleLoanExpand = (loanId: string) => {
    setExpandedLoanIds((prev) => {
      const next = new Set(prev);
      if (next.has(loanId)) {
        next.delete(loanId);
      } else {
        next.add(loanId);
      }
      return next;
    });
  };

  // Yeni Kredi Form Değişiklikleri
  const handleLoanFormChange = (key: string, val: any) => {
    const updated = { ...loanForm, [key]: val };
    if (key === "borrowerType") {
      if (val === "OKUL") {
        updated.borrowerName = "Simya Çocuk Üniversitesi";
      } else if (updated.borrowerName === "Simya Çocuk Üniversitesi") {
        updated.borrowerName = "Ahmet Taymaz";
      }
    }
    if (key === "totalAmount" || key === "installmentCount") {
      const tot = Number(key === "totalAmount" ? val : updated.totalAmount) || 0;
      const count = Number(key === "installmentCount" ? val : updated.installmentCount) || 1;
      if (tot > 0 && count > 0) {
        updated.monthlyAmount = (tot / count).toFixed(2);
      }
    }
    setLoanForm(updated);
  };

  // Yeni Kredi Kaydet
  const handleCreateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.title.trim()) {
      alert("Lütfen kredi başlığını girin.");
      return;
    }
    if (!loanForm.bankName.trim()) {
      alert("Lütfen banka adını seçin veya girin.");
      return;
    }
    const count = Number(loanForm.installmentCount);
    if (isNaN(count) || count <= 0) {
      alert("Lütfen geçerli bir taksit sayısı girin.");
      return;
    }
    const tot = Number(loanForm.totalAmount);
    const monthly = Number(loanForm.monthlyAmount);
    if ((isNaN(tot) || tot <= 0) && (isNaN(monthly) || monthly <= 0)) {
      alert("Lütfen toplam kredi tutarını veya aylık taksit tutarını girin.");
      return;
    }

    try {
      setSubmittingLoan(true);
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_LOAN",
          title: loanForm.title.trim(),
          borrowerType: loanForm.borrowerType,
          borrowerName: loanForm.borrowerName.trim(),
          bankName: loanForm.bankName.trim(),
          subCategory: loanForm.subCategory,
          totalAmount: tot,
          monthlyAmount: monthly,
          installmentCount: count,
          firstDueDate: loanForm.firstDueDate,
          notes: loanForm.notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Kredi kaydedilemedi.");
        return;
      }

      alert(`✅ "${loanForm.title}" kredisi ve ${data.count} aylık taksiti Okul Giderlerine başarıyla işlendi!`);
      setNewLoanModalOpen(false);
      setLoanForm({
        title: "",
        borrowerType: "OKUL",
        borrowerName: "Simya Çocuk Üniversitesi",
        bankName: "Halkbank",
        subCategory: "Banka Kredisi",
        totalAmount: "",
        monthlyAmount: "",
        installmentCount: "12",
        firstDueDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      fetchLoans();
    } catch (err: any) {
      alert("Kredi kaydedilirken bağlantı hatası: " + err.message);
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Kredi Düzenleme Modalı Aç
  const openEditLoanModal = (loan: LoanGroup) => {
    setEditingLoan(loan);
    setEditLoanForm({
      title: loan.title,
      borrowerType: loan.borrowerType,
      borrowerName: loan.borrowerName,
      bankName: loan.bankName,
      subCategory: loan.subCategory || "Banka Kredisi",
      monthlyAmount: String(loan.monthlyInstallmentAmount || ""),
      updatePendingAmount: false,
      notes: loan.notes || "",
    });
    setEditLoanModalOpen(true);
  };

  // Kredi Düzenleme Kaydet
  const handleEditLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;

    if (!editLoanForm.title.trim()) {
      alert("Lütfen kredi başlığını girin.");
      return;
    }

    try {
      setSubmittingEditLoan(true);
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_LOAN",
          loanId: editingLoan.id,
          title: editLoanForm.title.trim(),
          borrowerType: editLoanForm.borrowerType,
          borrowerName: editLoanForm.borrowerName.trim(),
          bankName: editLoanForm.bankName.trim(),
          subCategory: editLoanForm.subCategory,
          notes: editLoanForm.notes.trim(),
          updatePendingAmount: editLoanForm.updatePendingAmount,
          newMonthlyAmount: Number(editLoanForm.monthlyAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Kredi güncellenemedi.");
        return;
      }

      setEditLoanModalOpen(false);
      setEditingLoan(null);
      fetchLoans();
    } catch (e: any) {
      alert("Kredi güncellenirken hata: " + e.message);
    } finally {
      setSubmittingEditLoan(false);
    }
  };

  // Tekil Taksit Düzenleme Modalı Aç
  const openEditInstallmentModal = (inst: InstallmentItem) => {
    setEditingInstallment(inst);
    let dStr = "";
    if (inst.dueDate) {
      const d = new Date(inst.dueDate);
      if (!isNaN(d.getTime())) {
        dStr = d.toISOString().split("T")[0];
      }
    }
    setEditInstallmentForm({
      dueDate: dStr,
      amountDue: String(inst.amountDue),
      installmentInfo: inst.installmentInfo || "",
      notes: inst.description || "",
    });
    setEditInstallmentModalOpen(true);
  };

  // Tekil Taksit Düzenleme Kaydet
  const handleEditInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment) return;

    const num = Number(editInstallmentForm.amountDue);
    if (isNaN(num) || num <= 0) {
      alert("Lütfen geçerli bir taksit tutarı girin.");
      return;
    }

    try {
      setSubmittingEditInstallment(true);
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_INSTALLMENT",
          installmentId: editingInstallment.id,
          dueDate: editInstallmentForm.dueDate,
          amountDue: num,
          installmentInfo: editInstallmentForm.installmentInfo,
          notes: editInstallmentForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Taksit güncellenemedi");
        return;
      }

      setEditInstallmentModalOpen(false);
      setEditingInstallment(null);
      fetchLoans();
    } catch (e: any) {
      alert("Taksit güncellenirken hata: " + e.message);
    } finally {
      setSubmittingEditInstallment(false);
    }
  };

  // Tekil Taksiti Sil
  const handleDeleteInstallment = async (inst: InstallmentItem) => {
    if (!confirm(`"${inst.installmentInfo || inst.title || "Taksit"}" kaydını kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_INSTALLMENT",
          installmentId: inst.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoans();
      } else {
        alert(data.error || "Taksit silinemedi");
      }
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    }
  };

  // Krediyi Sil
  const handleDeleteLoan = async (loan: LoanGroup) => {
    const isZeroDebt = loan.remainingDebt <= 0 || loan.isCompleted;
    const confirmMsg =
      `"${loan.title}" (${loan.borrowerName} / ${loan.bankName}) kredisini silmek istediğinize emin misiniz?\n\n` +
      (isZeroDebt
        ? `Bu krediye ait ${loan.installmentCount} adet taksit kaydı kalıcı olarak silinecektir.\n\n`
        : `Bu krediye ait toplam ${loan.installmentCount} taksit (${loan.paidInstallmentCount} ödenmiş, ${loan.pendingInstallmentCount} bekleyen) Okul Giderleri tablosundan kalıcı olarak silinecektir.\n\n`) +
      `• [Tamam] = Krediyi ve tüm kayıtlarını siler\n` +
      `• [İptal] = İşlemi iptal eder`;

    if (!confirm(confirmMsg)) return;

    try {
      const installmentIds = loan.installments.map((i) => i.id);
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_LOAN",
          loanId: loan.id,
          installmentIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoans();
      } else {
        alert(data.error || "Kredi silinemedi.");
      }
    } catch (e: any) {
      alert("Kredi silinirken hata oluştu: " + e.message);
    }
  };

  // Taksiti Tek Tıkla Ödendi Yap
  const handleQuickPay = async (installment: InstallmentItem) => {
    if (!confirm(`${installment.installmentInfo || "Taksit"} tutarı (${formatCurrency(installment.amountRemaining)}) ödendi olarak işaretlensin mi?`)) {
      return;
    }

    try {
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_INSTALLMENT",
          installmentId: installment.id,
          amount: installment.amountRemaining,
          paymentMethod: "BANK",
          note: "Banka Kredisi Taksit Ödemesi",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoans();
      } else {
        alert(data.error || "Ödeme işlenemedi");
      }
    } catch (e: any) {
      alert("Ödeme işlenirken hata oluştu: " + e.message);
    }
  };

  // Parçalı Ödeme Modalı Aç
  const openPayModal = (installment: InstallmentItem, loanTitle: string) => {
    setActiveInstallment(installment);
    setActiveLoanTitle(loanTitle);
    setPayAmount(String(installment.amountRemaining));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayMethod("BANK");
    setPayNote("");
    setPayModalOpen(true);
  };

  // Parçalı Ödeme Kaydet
  const handlePayModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstallment) return;

    const num = Number(payAmount);
    if (isNaN(num) || num <= 0) {
      alert("Lütfen geçerli bir ödeme tutarı girin.");
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_INSTALLMENT",
          installmentId: activeInstallment.id,
          amount: num,
          paymentMethod: payMethod,
          paymentDate: payDate,
          note: payNote.trim() || (payMethod === "CASH" ? "Elden Nakit Kredi Ödemesi" : "Banka Havalesi"),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPayModalOpen(false);
        setActiveInstallment(null);
        fetchLoans();
      } else {
        alert(data.error || "Ödeme kaydedilemedi");
      }
    } catch (e: any) {
      alert("Ödeme kaydedilirken hata: " + e.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Ödemeyi Geri Al
  const handleRevertPayment = async (installment: InstallmentItem) => {
    if (!confirm(`${installment.installmentInfo} ödemesini geri alıp "Bekliyor" durumuna getirmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch("/api/krediler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVERT_INSTALLMENT",
          installmentId: installment.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoans();
      } else {
        alert(data.error || "İşlem geri alınamadı");
      }
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    }
  };

  // Filtrelenmiş Krediler
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (filterBorrowerType !== "ALL" && loan.borrowerType !== filterBorrowerType) {
        return false;
      }
      if (filterBank !== "ALL" && loan.bankName !== filterBank) {
        return false;
      }
      if (filterStatus === "ACTIVE" && loan.isCompleted) {
        return false;
      }
      if (filterStatus === "COMPLETED" && !loan.isCompleted) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const tMatch = loan.title.toLowerCase().includes(q);
        const bMatch = loan.bankName.toLowerCase().includes(q);
        const holderMatch = loan.borrowerName.toLowerCase().includes(q);
        const subMatch = loan.subCategory.toLowerCase().includes(q);
        return tMatch || bMatch || holderMatch || subMatch;
      }
      return true;
    });
  }, [loans, filterBorrowerType, filterBank, filterStatus, search]);

  // Banka Listesi Seçenekleri
  const availableBanks = useMemo(() => {
    const s = new Set<string>();
    loans.forEach((l) => {
      if (l.bankName) s.add(l.bankName);
    });
    return Array.from(s);
  }, [loans]);

  // Canlı Önizleme Hesaplama (Yeni Kredi Modalı İçin)
  const previewInstallments = useMemo(() => {
    const count = Number(loanForm.installmentCount);
    const tot = Number(loanForm.totalAmount);
    const monthly = Number(loanForm.monthlyAmount) || (count > 0 && tot > 0 ? tot / count : 0);
    if (!count || count <= 0) return [];

    let base = new Date();
    if (loanForm.firstDueDate) {
      const p = loanForm.firstDueDate.split("-").map(Number);
      if (p.length === 3) base = new Date(p[0], p[1] - 1, p[2]);
    }

    const items = [];
    for (let i = 1; i <= Math.min(count, 12); i++) {
      const d = new Date(base.getTime());
      d.setMonth(d.getMonth() + (i - 1));
      items.push({
        no: `${i}t/${count}t`,
        month: `${d.getMonth() + 1}.Ay`,
        dateStr: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }),
        amount: monthly,
      });
    }
    return items;
  }, [loanForm.installmentCount, loanForm.totalAmount, loanForm.monthlyAmount, loanForm.firstDueDate]);

  return (
    <div className="space-y-6">
      {/* 🧭 ÜST BAŞLIK & HIZLI EYLEMLER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Banka Kredileri Takibi</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
                  {summary.totalLoanCount} Tanımlı Kredi
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Okulun veya okul adına şahısların çektiği tüm banka kredileri, taksitleri ve borç dökümü
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setNewLoanModalOpen(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Kredi Tanımla</span>
          </button>

          <Link
            href="/kredi-kartlari"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-purple-700" />
            <span>Kredi Kartlarına Git →</span>
          </Link>

          <Link
            href="/giderler?category=LOAN"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
          >
            <Coins className="w-4 h-4 text-slate-600" />
            <span>Okul Giderlerine Git →</span>
          </Link>
        </div>
      </div>

      {/* 🧭 KPI ÖZET KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Toplam Kredi Borcu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Toplam Kalan Kredi Borcu
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summary.totalDebt)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Şimdiye kadar ödenen:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600" />
        </div>

        {/* Kart 2: Bu Ayki Kredi Taksitleri */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bu Ay Ödenecek Taksitler
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-950 tracking-tight">
              {formatCurrency(summary.monthlyDueThisMonth)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cari ayda vadesi gelen aktif taksit toplamı
            </div>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
        </div>

        {/* Kart 3: Aktif Kredi Sayısı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aktif Krediler
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.activeLoanCount} <span className="text-sm font-semibold text-slate-500">Aktif Kredi</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Tamamlanan / Biten:</span>
              <span className="font-bold text-emerald-600">{summary.completedLoanCount} Adet</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 left-0 h-1 bg-sky-600" />
        </div>

        {/* Kart 4: Okul Giderlerine Entegrasyon */}
        <div className="bg-linear-to-br from-indigo-700 to-indigo-900 text-white p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Okul Taksit Giderleri
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-indigo-100 mt-2 font-medium">
              Tanımladığınız tüm kredilerin aylık taksitleri ay ay Okul Giderleri listesine otomatik işlenir.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-indigo-600/60 flex items-center justify-between">
            <Link
              href="/giderler?category=LOAN"
              className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1 underline underline-offset-2"
            >
              <span>Giderler Tablosunda Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={fetchLoans}
              className="p-1 rounded-lg hover:bg-indigo-600/50 text-indigo-200 hover:text-white transition-colors"
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🛠️ ARAMA, FİLTRELEME VE YENİ KREDİ BUTONU */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Arama */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kredi adı, borçlu veya banka ara..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Tür Filtresi */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterBorrowerType("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterBorrowerType === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setFilterBorrowerType("OKUL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterBorrowerType === "OKUL" ? "bg-white text-indigo-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3 h-3 text-indigo-600" />
              <span>Okul Adına</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterBorrowerType("SAHIS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterBorrowerType === "SAHIS" ? "bg-white text-amber-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3 h-3 text-amber-600" />
              <span>Şahıs Adına</span>
            </button>
          </div>

          {/* Banka Filtresi */}
          {availableBanks.length > 0 && (
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tüm Bankalar</option>
              {availableBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}

          {/* Durum Filtresi */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Sadece Aktif / Devam Edenler</option>
            <option value="COMPLETED">Biten / Kapanan Krediler</option>
          </select>
        </div>

        {/* Yeni Kredi Ekle Butonu */}
        <button
          type="button"
          onClick={() => setNewLoanModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni Kredi Tanımla</span>
        </button>
      </div>

      {/* 📋 KREDİ LİSTESİ */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Krediler ve taksit dökümleri yükleniyor...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tanımlı Kredi Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Henüz tanımlanmış bir banka kredisi bulunmuyor. Okulun veya okul adına şahısların çektiği kredileri eklemek için yukarıdaki &quot;Yeni Kredi Tanımla&quot; butonunu kullanabilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => setNewLoanModalOpen(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kredi Tanımla</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const isExpanded = expandedLoanIds.has(loan.id);
            const badgeTheme = getBankBadgeColors(loan.bankName);
            const completionPercent =
              loan.totalAmount > 0
                ? Math.min(100, Math.round((loan.totalPaid / loan.totalAmount) * 100))
                : 0;

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Banka Üst Şeridi */}
                <div className={`h-1.5 w-full ${badgeTheme.bar}`} />

                {/* Kredi Kartı Üst Bölümü */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Başlık, Banka ve Borçlu Bilgisi */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Banka Rozeti */}
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${badgeTheme.bg} ${badgeTheme.text} ${badgeTheme.border}`}>
                          {loan.bankName}
                        </span>

                        {/* Borçlu Türü Rozeti */}
                        {loan.borrowerType === "OKUL" ? (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-600" />
                            <span>Okulun Çektiği Kredi (Kurumsal)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-amber-700" />
                            <span>Okul Adına Şahıs Kredisi (Bireysel)</span>
                          </span>
                        )}

                        {/* Alt Kategori */}
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {loan.subCategory}
                        </span>

                        {/* Tamamlandı / Kapanan Rozeti */}
                        {loan.isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Borç Tamamen Kapandı</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{loan.title}</span>
                      </h2>

                      <p className="text-xs text-slate-500 font-medium">
                        Krediyi Çeken: <strong className="text-slate-800 font-bold">{loan.borrowerName}</strong>
                        {loan.notes ? ` • Not: ${loan.notes}` : ""}
                      </p>
                    </div>

                    {/* Finansal Özet Metrikleri */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                          Toplam Kredi
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(loan.totalAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                          Kalan Borç
                        </span>
                        <span className="text-sm font-black text-rose-700">
                          {formatCurrency(loan.remainingDebt)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                          Aylık Taksit
                        </span>
                        <span className="text-sm font-black text-indigo-950">
                          {formatCurrency(loan.monthlyInstallmentAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                          Taksit Durumu
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {loan.paidInstallmentCount} / {loan.installmentCount} Ay
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* İlerleme Çubuğu */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Ödeme İlerlemesi: %{completionPercent}</span>
                      <span>
                        Ödenen: {formatCurrency(loan.totalPaid)} • Kalan: {formatCurrency(loan.remainingDebt)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          loan.isCompleted ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Alt Eylemler, Düzenle & Sil Butonları */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleLoanExpand(loan.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                            <span>Taksit Planını Gizle</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                            <span>Taksit Planını Aç ({loan.installmentCount} Taksit)</span>
                          </>
                        )}
                      </button>

                      {loan.nextDueInstallment && (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Sıradaki: {loan.nextDueInstallment.installmentInfo || "1t"} (
                            {loan.nextDueInstallment.dueDateStr || formatSafeDate(loan.nextDueInstallment.dueDate)}) -{" "}
                            {formatCurrency(loan.nextDueInstallment.amountRemaining)}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditLoanModal(loan)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Krediyi ve taksit tutarlarını düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Krediyi Düzenle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLoan(loan)}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Krediyi ve taksitlerini sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Krediyi Sil</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📊 AÇILABİLİR AY AY TAKSİT TABLOSU (Okul Taksit Giderleri Dökümü) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-3 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Ay Ay Taksit Ödeme Planı (Okul Giderlerine Yansıyan Kayıtlar)</span>
                      </h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        {loan.installments.length} Taksit Kaydı
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                            <th className="py-2.5 px-3">Taksit No</th>
                            <th className="py-2.5 px-3">Dönem</th>
                            <th className="py-2.5 px-3">Vade Tarihi</th>
                            <th className="py-2.5 px-3 text-right">Taksit Tutarı</th>
                            <th className="py-2.5 px-3 text-right">Ödenen</th>
                            <th className="py-2.5 px-3 text-right">Kalan Borç</th>
                            <th className="py-2.5 px-3 text-center">Durum</th>
                            <th className="py-2.5 px-3 text-right">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {loan.installments.map((inst, idx) => {
                            const isPaid = inst.status === "PAID";
                            const isPartial = inst.status === "PARTIAL";

                            return (
                              <tr
                                key={inst.id}
                                className={`hover:bg-slate-50 transition-colors ${
                                  isPaid ? "bg-emerald-50/30" : ""
                                }`}
                              >
                                <td className="py-2.5 px-3 font-black text-indigo-950">
                                  {inst.installmentInfo || `${idx + 1}t/${loan.installmentCount}t`}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-700">
                                    {inst.period || `${inst.monthIndex || "-"}.Ay`}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {inst.dueDateStr || formatSafeDate(inst.dueDate)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                  {formatCurrency(inst.amountDue)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                  {formatCurrency(inst.amountPaid)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-rose-700">
                                  {formatCurrency(inst.amountRemaining)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Ödendi</span>
                                    </span>
                                  ) : isPartial ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                                      <Clock className="w-3 h-3 text-amber-700" />
                                      <span>Kısmi Ödeme</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      <span>Bekliyor</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1 flex-wrap">
                                    {!isPaid ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleQuickPay(inst)}
                                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                                          title="Tamamını Ödendi Yap"
                                        >
                                          Ödendi Yap
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openPayModal(inst, loan.title)}
                                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-lg border border-indigo-200 transition-all cursor-pointer"
                                          title="Parçalı Ödeme / Tutar Belirle"
                                        >
                                          Parçalı Öde
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleRevertPayment(inst)}
                                        className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                        title="Ödemeyi Geri Al"
                                      >
                                        Geri Al
                                      </button>
                                    )}

                                    {/* Taksiti Düzenle */}
                                    <button
                                      type="button"
                                      onClick={() => openEditInstallmentModal(inst)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                      title="Bu taksiti düzenle (vade / tutar)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Taksiti Sil */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInstallment(inst)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                      title="Bu taksit kaydını sil"
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ➕ YENİ KREDİ TANIMLAMA MODALI */}
      {newLoanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Başlığı */}
            <div className="p-5 bg-linear-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                  <Landmark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Yeni Banka Kredisi Tanımla</h3>
                  <p className="text-xs text-indigo-200">
                    Okulun veya okul adına şahsın çektiği krediyi taksitleriyle birlikte oluşturun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewLoanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoanSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 1. Krediyi Çeken / Kredi Türü */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
                  1. Krediyi Kimin Adına Çekti? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoanFormChange("borrowerType", "OKUL")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      loanForm.borrowerType === "OKUL"
                        ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-black"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${loanForm.borrowerType === "OKUL" ? "text-indigo-600" : "text-slate-400"}`} />
                    <div>
                      <div className="text-xs">Okul / Kurum Adına</div>
                      <div className="text-[10px] text-slate-500 font-medium">Doğrudan okulun çektiği kredi</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoanFormChange("borrowerType", "SAHIS")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      loanForm.borrowerType === "SAHIS"
                        ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-black"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <User className={`w-5 h-5 ${loanForm.borrowerType === "SAHIS" ? "text-amber-600" : "text-slate-400"}`} />
                    <div>
                      <div className="text-xs">Okul Adına Şahıs Çekti</div>
                      <div className="text-[10px] text-slate-500 font-medium">Bireysel çekilip okula aktarılan</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Krediyi Çeken Kişi / Kurum Adı */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Borçlu Kişi veya Kurum Adı *
                </label>
                <input
                  type="text"
                  value={loanForm.borrowerName}
                  onChange={(e) => handleLoanFormChange("borrowerName", e.target.value)}
                  placeholder="Örn: Simya Çocuk Üniversitesi veya Ahmet Taymaz"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Hızlı Seçim:</span>
                  {COMMON_BORROWERS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleLoanFormChange("borrowerName", name)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Banka ve Kredi Başlığı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Banka Adı *
                  </label>
                  <select
                    value={loanForm.bankName}
                    onChange={(e) => handleLoanFormChange("bankName", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {COMMON_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Kredi Başlığı / Tanımı *
                  </label>
                  <input
                    type="text"
                    value={loanForm.title}
                    onChange={(e) => handleLoanFormChange("title", e.target.value)}
                    placeholder="Örn: Halkbank İşletme Kredisi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* 4. Toplam Tutar, Taksit Sayısı ve Aylık Taksit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-black text-indigo-950 mb-1">
                    Toplam Kredi Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.totalAmount}
                    onChange={(e) => handleLoanFormChange("totalAmount", e.target.value)}
                    placeholder="Örn: 600000"
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-indigo-950 mb-1">
                    Taksit Sayısı (Ay / Vade) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={loanForm.installmentCount}
                    onChange={(e) => handleLoanFormChange("installmentCount", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
                    required
                  />
                  <div className="flex gap-1 mt-1">
                    {[6, 12, 24, 36].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleLoanFormChange("installmentCount", String(num))}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold"
                      >
                        {num} Ay
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-indigo-950 mb-1">
                    Aylık Taksit Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.monthlyAmount}
                    onChange={(e) => handleLoanFormChange("monthlyAmount", e.target.value)}
                    placeholder="Örn: 50000"
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
                    required
                  />
                  <span className="text-[9px] text-slate-400 font-medium">Faiz/Küsürat için düzenlenebilir</span>
                </div>
              </div>

              {/* 5. İlk Taksit Tarihi ve Alt Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    📅 İlk Taksit / Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={loanForm.firstDueDate}
                    onChange={(e) => handleLoanFormChange("firstDueDate", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Kredi Alt Kategorisi
                  </label>
                  <select
                    value={loanForm.subCategory}
                    onChange={(e) => handleLoanFormChange("subCategory", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Banka Kredisi">Banka Kredisi</option>
                    <option value="Ticari / İşletme Kredisi">Ticari / İşletme Kredisi</option>
                    <option value="Taşıt / Araç Kredisi">Taşıt / Araç Kredisi</option>
                    <option value="İhtiyaç Kredisi">İhtiyaç Kredisi</option>
                    <option value="Konut Kredisi">Konut Kredisi</option>
                  </select>
                </div>
              </div>

              {/* 6. Açıklama / Notlar */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Açıklama / Faiz Oranı / Özel Notlar (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={loanForm.notes}
                  onChange={(e) => handleLoanFormChange("notes", e.target.value)}
                  placeholder="Örn: %3.5 faizli 12 ay eşit taksitli ticari kredi. Kredi no: 12345678"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              {/* 7. Canlı Taksit Planı Önizlemesi */}
              {previewInstallments.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    ✨ Oluşacak Taksit Planı Canlı Önizlemesi (İlk {previewInstallments.length} Taksit):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto text-[10px]">
                    {previewInstallments.map((item, idx) => (
                      <div key={idx} className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <strong className="text-indigo-900 font-extrabold">{item.no}</strong> ({item.month})
                        <div className="text-slate-500">{item.dateStr}</div>
                        <div className="font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Butonları */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewLoanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingLoan ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Taksitler Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Krediyi ve Taksitlerini Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ KREDİYİ DÜZENLE MODALI */}
      {editLoanModalOpen && editingLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="text-sm font-black">Krediyi Düzenle</h3>
                  <p className="text-[11px] text-indigo-200">{editingLoan.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditLoanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditLoanSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Kredi Başlığı *
                </label>
                <input
                  type="text"
                  value={editLoanForm.title}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Borçlu Türü
                  </label>
                  <select
                    value={editLoanForm.borrowerType}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, borrowerType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="OKUL">🏫 Okul / Kurum</option>
                    <option value="SAHIS">👤 Okul Adına Şahıs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Banka Adı
                  </label>
                  <select
                    value={editLoanForm.bankName}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {COMMON_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Borçlu Kişi veya Kurum Adı
                </label>
                <input
                  type="text"
                  value={editLoanForm.borrowerName}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, borrowerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Kredi Alt Kategorisi
                  </label>
                  <select
                    value={editLoanForm.subCategory}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Banka Kredisi">Banka Kredisi</option>
                    <option value="Ticari / İşletme Kredisi">Ticari / İşletme Kredisi</option>
                    <option value="Taşıt / Araç Kredisi">Taşıt / Araç Kredisi</option>
                    <option value="İhtiyaç Kredisi">İhtiyaç Kredisi</option>
                    <option value="Konut Kredisi">Konut Kredisi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Aylık Taksit Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLoanForm.monthlyAmount}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, monthlyAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Taksit Tutarlarını Güncelle Checkbox */}
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={editLoanForm.updatePendingAmount}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, updatePendingAmount: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span>Henüz ödenmemiş bekleyen taksitlerin tutarlarını bu tutarla güncelle</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Not / Açıklama
                </label>
                <textarea
                  rows={2}
                  value={editLoanForm.notes}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditLoanModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingEditLoan}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {submittingEditLoan ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ TEKİL TAKSİT DÜZENLEME MODALI */}
      {editInstallmentModalOpen && editingInstallment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-700 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black">Taksiti Düzenle</h4>
                <p className="text-[11px] text-indigo-200">{editingInstallment.title} • {editingInstallment.installmentInfo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditInstallmentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleEditInstallmentSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Vade Tarihi *
                </label>
                <input
                  type="date"
                  value={editInstallmentForm.dueDate}
                  onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Taksit Tutarı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editInstallmentForm.amountDue}
                  onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, amountDue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Taksit Bilgisi (Örn: 1t/12t)
                </label>
                <input
                  type="text"
                  value={editInstallmentForm.installmentInfo}
                  onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, installmentInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditInstallmentModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingEditInstallment}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {submittingEditInstallment ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💵 PARÇALI ÖDEME MODALI */}
      {payModalOpen && activeInstallment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-700 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black">Taksit Ödemesi Yap</h4>
                <p className="text-[11px] text-indigo-200">
                  {activeLoanTitle} • {activeInstallment.installmentInfo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handlePayModalSubmit} className="p-5 space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Kalan Taksit Tutarı:</span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(activeInstallment.amountRemaining)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ödenecek Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={activeInstallment.amountRemaining}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ödeme Yöntemi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("BANK")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      payMethod === "BANK"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    🏦 Banka / Havale
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("CASH")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      payMethod === "CASH"
                        ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    💵 Elden Nakit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Not / Açıklama
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Örn: 1. taksit bankadan ödendi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {submittingPayment ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

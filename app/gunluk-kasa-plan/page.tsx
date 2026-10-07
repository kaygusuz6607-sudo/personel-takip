"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Wallet,
  Calendar,
  Clock,
  CreditCard,
  Landmark,
  Coins,
  TrendingUp,
  BarChart3,
  Printer,
  Copy,
  Check,
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileText,
  Search,
  X,
  RefreshCw,
  Building2,
  ReceiptText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface PaymentHistoryItem {
  date: string;
  amount: number;
  note?: string;
}

interface SchoolExpense {
  id: string;
  title: string;
  category: string;
  subCategory?: string | null;
  period?: string | null;
  installmentInfo?: string | null;
  dueDate?: string | null;
  dueDateStr?: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  paymentMethod: "CASH" | "CREDIT_CARD" | "CHEQUE" | "BANK_TRANSFER" | string;
  paymentHistory?: string | null;
  monthIndex?: number | null;
  cardHolder?: string | null;
  cardBank?: string | null;
  createdAt: string;
}

interface AvailablePeriod {
  year: number;
  month: number;
  label: string;
  count: number;
  unpaidCount: number;
  totalDue: number;
  totalRemaining: number;
}

const TR_MONTHS: Record<string, number> = {
  ocak: 1,
  şubat: 2,
  subat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8,
  agustos: 8,
  eylül: 9,
  eylul: 9,
  ekim: 10,
  kasım: 11,
  kasim: 11,
  aralık: 12,
  aralik: 12,
};

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

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function parseExpenseDate(exp: SchoolExpense): {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  dateObj: Date | null;
} {
  if (exp.dueDate) {
    const d = new Date(exp.dueDate);
    if (!isNaN(d.getTime())) {
      const trD = new Date(d.getTime() + 3 * 3600 * 1000);
      const y = trD.getUTCFullYear();
      const m = trD.getUTCMonth() + 1;
      const day = trD.getUTCDate();
      return {
        year: y,
        month: m,
        day,
        dateKey: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        dateObj: d,
      };
    }
  }

  const dStr = (exp.dueDateStr || "").toLowerCase();
  const dayMatch = dStr.match(/\b(\d{1,2})\b/);
  const day = dayMatch ? Math.min(31, Math.max(1, parseInt(dayMatch[1], 10))) : 15;

  let m = exp.monthIndex || 11;
  for (const [mName, mIdx] of Object.entries(TR_MONTHS)) {
    if (dStr.includes(mName)) {
      m = mIdx;
      break;
    }
  }

  const yearMatch = dStr.match(/\b(20\d{2})\b/);
  const y = yearMatch ? parseInt(yearMatch[1], 10) : m >= 7 ? 2026 : 2027;

  return {
    year: y,
    month: m,
    day,
    dateKey: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    dateObj: new Date(y, m - 1, day),
  };
}

// Harcama kanalını sınıflandırma (Nakit, Kredi Kartı, Menkul Kıymet, Banka/Çek)
function classifyChannel(exp: SchoolExpense): "CASH" | "CREDIT_CARD" | "GOLD_ASSET" | "BANK" {
  const t = (exp.title || "").toLowerCase();
  const cat = (exp.category || "").toUpperCase();
  const pm = (exp.paymentMethod || "").toUpperCase();

  // Menkul Kıymet / Altın / Kıymetli Varlık
  if (
    cat === "GOLD_DAY" ||
    t.includes("altın") ||
    t.includes("ajda") ||
    t.includes("bilezik") ||
    t.includes("menkul") ||
    t.includes("fon") ||
    t.includes("döviz")
  ) {
    return "GOLD_ASSET";
  }

  // Kredi Kartı
  if (
    cat === "CREDIT_CARD" ||
    pm === "CREDIT_CARD" ||
    Boolean(exp.cardHolder) ||
    Boolean(exp.cardBank) ||
    t.includes("kredi kartı") ||
    t.includes("paraf") ||
    t.includes("kart ") ||
    t.includes("bonus")
  ) {
    return "CREDIT_CARD";
  }

  // Çek / Banka
  if (
    cat === "CHEQUE" ||
    pm === "CHEQUE" ||
    pm === "BANK_TRANSFER" ||
    t.includes("çek") ||
    t.includes("havale") ||
    t.includes("eft")
  ) {
    return "BANK";
  }

  // Varsayılan: Nakit / Kasa
  return "CASH";
}

function GunlukKasaPlanContent() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [allExpenses, setAllExpenses] = useState<SchoolExpense[]>([]);
  const [rolloverExpenses, setRolloverExpenses] = useState<SchoolExpense[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);

  // Seçili Ay (Varsayılan: 2026-11 - Kasım 2026)
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");
  // Seçili Gün (Gün Sonu Raporu için, varsayılan: Bugün)
  const [selectedReportDate, setSelectedReportDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Seçili Hafta Filtresi (Haftalık görünümde tümü veya belirli hafta)
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | "ALL">("ALL");

  // Günlük Hızlı Kasa Çıkışı Modalı
  const [quickExpenseModal, setQuickExpenseModal] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: "",
    amount: "",
    category: "OTHER",
    paymentMethod: "CASH",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // WhatsApp Kopyalama Geri Bildirimi
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // Veri Çekme
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/giderler?month=${selectedMonth}`);
      const data = await res.json();

      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
      if (data.rolloverExpenses && Array.isArray(data.rolloverExpenses)) {
        setRolloverExpenses(data.rolloverExpenses);
      }
      if (data.availablePeriods && Array.isArray(data.availablePeriods)) {
        setAvailablePeriods(data.availablePeriods);
      }

      // Tüm kayıtları da gün sonu hesaplamaları için çekelim
      const allRes = await fetch("/api/giderler");
      const allData = await allRes.json();
      if (allData.expenses && Array.isArray(allData.expenses)) {
        setAllExpenses(allData.expenses);
      }
    } catch (e) {
      console.error("Gider verileri alınamadı:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Seçili Ayın Yıl ve Ay Bilgisi
  const { currentYear, currentMonthNumber } = useMemo(() => {
    if (selectedMonth.includes("-")) {
      const [y, m] = selectedMonth.split("-").map(Number);
      return { currentYear: y, currentMonthNumber: m };
    }
    const m = Number(selectedMonth);
    const y = m >= 7 ? 2026 : 2027;
    return { currentYear: y, currentMonthNumber: m };
  }, [selectedMonth]);

  const currentMonthLabel = `${TR_MONTH_NAMES[currentMonthNumber]} ${currentYear}`;

  // 1. HAFTALIK GİDER PLANLAMASI (1-7, 8-14, 15-21, 22-28, 29-31)
  const weeklyPlan = useMemo(() => {
    const weeks = [
      { id: 1, label: "1. Hafta (1 - 7 Gün)", start: 1, end: 7, expenses: [] as SchoolExpense[], totalDue: 0, totalPaid: 0, totalRemaining: 0 },
      { id: 2, label: "2. Hafta (8 - 14 Gün)", start: 8, end: 14, expenses: [] as SchoolExpense[], totalDue: 0, totalPaid: 0, totalRemaining: 0 },
      { id: 3, label: "3. Hafta (15 - 21 Gün)", start: 15, end: 21, expenses: [] as SchoolExpense[], totalDue: 0, totalPaid: 0, totalRemaining: 0 },
      { id: 4, label: "4. Hafta (22 - 28 Gün)", start: 22, end: 28, expenses: [] as SchoolExpense[], totalDue: 0, totalPaid: 0, totalRemaining: 0 },
      { id: 5, label: "5. Hafta (29 - 31 Gün)", start: 29, end: 31, expenses: [] as SchoolExpense[], totalDue: 0, totalPaid: 0, totalRemaining: 0 },
    ];

    expenses.forEach((exp) => {
      const { day } = parseExpenseDate(exp);
      const targetWeek = weeks.find((w) => day >= w.start && day <= w.end) || weeks[weeks.length - 1];
      targetWeek.expenses.push(exp);
      targetWeek.totalDue += Number(exp.amountDue) || 0;
      targetWeek.totalPaid += Number(exp.amountPaid) || 0;
      targetWeek.totalRemaining += Number(exp.amountRemaining) || 0;
    });

    return weeks;
  }, [expenses]);

  const maxWeeklyDue = useMemo(() => {
    return Math.max(...weeklyPlan.map((w) => w.totalDue), 1);
  }, [weeklyPlan]);

  // 2. DEVREDEN BORÇ BAKİYESİ VE TOPLAM FİNANSAL YÜK
  const rolloverSummary = useMemo(() => {
    const totalRolloverDue = rolloverExpenses.reduce((sum, e) => sum + (Number(e.amountDue) || 0), 0);
    const totalRolloverRemaining = rolloverExpenses.reduce((sum, e) => sum + (Number(e.amountRemaining) || 0), 0);
    const monthTotalDue = expenses.reduce((sum, e) => sum + (Number(e.amountDue) || 0), 0);
    const monthTotalPaid = expenses.reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);
    const monthTotalRemaining = expenses.reduce((sum, e) => sum + (Number(e.amountRemaining) || 0), 0);

    const grandTotalRemaining = monthTotalRemaining + totalRolloverRemaining;
    const grandTotalDue = monthTotalDue + totalRolloverDue;

    return {
      totalRolloverRemaining,
      totalRolloverDue,
      countRollover: rolloverExpenses.length,
      monthTotalDue,
      monthTotalPaid,
      monthTotalRemaining,
      grandTotalRemaining,
      grandTotalDue,
    };
  }, [rolloverExpenses, expenses]);

  // 3. HARCAMA KANALI AYRIMI (Nakit, Kredi Kartı, Menkul Kıymet, Banka)
  const channelBreakdown = useMemo(() => {
    const channels = {
      CASH: { key: "CASH", label: "Nakit / Kasa", icon: Wallet, color: "#10b981", bgColor: "bg-emerald-500", textCol: "text-emerald-700", bgLight: "bg-emerald-50", totalDue: 0, totalPaid: 0, totalRemaining: 0, count: 0 },
      CREDIT_CARD: { key: "CREDIT_CARD", label: "Kredi Kartı", icon: CreditCard, color: "#3b82f6", bgColor: "bg-blue-500", textCol: "text-blue-700", bgLight: "bg-blue-50", totalDue: 0, totalPaid: 0, totalRemaining: 0, count: 0 },
      GOLD_ASSET: { key: "GOLD_ASSET", label: "Menkul Kıymet & Altın", icon: Coins, color: "#f59e0b", bgColor: "bg-amber-500", textCol: "text-amber-700", bgLight: "bg-amber-50", totalDue: 0, totalPaid: 0, totalRemaining: 0, count: 0 },
      BANK: { key: "BANK", label: "Banka & Çek", icon: Landmark, color: "#8b5cf6", bgColor: "bg-purple-500", textCol: "text-purple-700", bgLight: "bg-purple-50", totalDue: 0, totalPaid: 0, totalRemaining: 0, count: 0 },
    };

    expenses.forEach((exp) => {
      const ch = classifyChannel(exp);
      channels[ch].totalDue += Number(exp.amountDue) || 0;
      channels[ch].totalPaid += Number(exp.amountPaid) || 0;
      channels[ch].totalRemaining += Number(exp.amountRemaining) || 0;
      channels[ch].count += 1;
    });

    const totalMonth = Object.values(channels).reduce((acc, c) => acc + c.totalDue, 0) || 1;
    const channelList = Object.values(channels).map((c) => ({
      ...c,
      percent: Math.round((c.totalDue / totalMonth) * 100),
    }));

    return {
      channels: channelList,
      totalMonth,
    };
  }, [expenses]);

  // 4. GÜN SONU MUHASEBE RAPORU (Z-RAPORU / GÜNLÜK KASA KAPANIŞI)
  const dailyReport = useMemo(() => {
    const targetDateStr = selectedReportDate; // e.g. "2026-10-07"
    const paymentsFound: {
      id: string;
      title: string;
      amount: number;
      channel: "CASH" | "CREDIT_CARD" | "GOLD_ASSET" | "BANK";
      note: string;
      time?: string;
    }[] = [];

    allExpenses.forEach((exp) => {
      const ch = classifyChannel(exp);

      // 1. paymentHistory kayıtlarında bu tarih var mı?
      if (exp.paymentHistory) {
        try {
          const phList: PaymentHistoryItem[] = JSON.parse(exp.paymentHistory);
          if (Array.isArray(phList)) {
            phList.forEach((ph: any, idx) => {
              const phDate = (ph.date || "").split("T")[0];
              if (phDate === targetDateStr) {
                let actualChannel = ch;
                const phMethod = ph.paymentMethod;
                const phCard = ph.cardId || ph.cardBank || ph.cardHolder;
                const phNote = (ph.note || "").toLowerCase();
                if (
                  phMethod === "CREDIT_CARD" ||
                  Boolean(phCard) ||
                  phNote.includes("kredi kart") ||
                  phNote.includes(" kk") ||
                  phNote.includes("paraf") ||
                  phNote.includes("bonus") ||
                  phNote.includes("world") ||
                  phNote.includes("cardfinans")
                ) {
                  actualChannel = "CREDIT_CARD";
                }

                paymentsFound.push({
                  id: `${exp.id}-ph-${idx}`,
                  title: exp.title,
                  amount: Number(ph.amount) || 0,
                  channel: actualChannel,
                  note: ph.note || (actualChannel === "CREDIT_CARD" ? "Kredi Kartı ile Ödeme" : "Fiili Ödeme Çıkışı"),
                });
              }
            });
          }
        } catch {}
      }

      // 2. Vadesi bugün olup ödenmiş olanlar (history boş olsa dahi)
      const { dateKey } = parseExpenseDate(exp);
      if (dateKey === targetDateStr && exp.status === "PAID" && paymentsFound.every((p) => !p.id.startsWith(exp.id))) {
        paymentsFound.push({
          id: `${exp.id}-due`,
          title: exp.title,
          amount: Number(exp.amountPaid || exp.amountDue) || 0,
          channel: ch,
          note: "Günün Vadesiyle Ödenen Gider",
        });
      }
    });

    const cashOut = paymentsFound.filter((p) => p.channel === "CASH").reduce((s, p) => s + p.amount, 0);
    const cardOut = paymentsFound.filter((p) => p.channel === "CREDIT_CARD").reduce((s, p) => s + p.amount, 0);
    const bankOut = paymentsFound.filter((p) => p.channel === "BANK").reduce((s, p) => s + p.amount, 0);
    const goldOut = paymentsFound.filter((p) => p.channel === "GOLD_ASSET").reduce((s, p) => s + p.amount, 0);
    const totalOut = paymentsFound.reduce((s, p) => s + p.amount, 0);

    return {
      dateStr: targetDateStr,
      items: paymentsFound,
      cashOut,
      cardOut,
      bankOut,
      goldOut,
      totalOut,
    };
  }, [allExpenses, selectedReportDate]);

  // Hızlı Günlük Kasa Çıkışı Kaydet
  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.title || !quickForm.amount) return;

    try {
      setQuickSubmitting(true);
      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickForm.title.trim(),
          amountDue: Number(quickForm.amount),
          amountPaid: Number(quickForm.amount),
          amountRemaining: 0,
          status: "PAID",
          category: quickForm.category,
          paymentMethod: quickForm.paymentMethod,
          dueDateStr: quickForm.date,
          dueDate: new Date(quickForm.date).toISOString(),
          description: quickForm.description.trim() || "Günlük hızlı kasa fişi",
          paymentHistory: JSON.stringify([
            {
              date: quickForm.date,
              amount: Number(quickForm.amount),
              note: "Günlük Nakit Kasa Çıkışı",
            },
          ]),
        }),
      });

      if (!res.ok) {
        alert("Kayıt oluşturulamadı.");
        return;
      }

      setQuickExpenseModal(false);
      setQuickForm({
        title: "",
        amount: "",
        category: "OTHER",
        paymentMethod: "CASH",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      fetchData();
    } catch {
      alert("Hata oluştu.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  // WhatsApp Metin Özeti Kopyala
  const copyWhatsappReport = () => {
    const dParts = selectedReportDate.split("-");
    const dFormatted = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;

    const text = `📊 *COSMOS KOLEJİ - GÜN SONU MUHASEBE VE KASA RAPORU*
📅 *Tarih:* ${dFormatted}
───────────────────────
💵 *Nakit Kasa Çıkışı:* ${formatCurrency(dailyReport.cashOut)}
💳 *Kredi Kartı Harcaması:* ${formatCurrency(dailyReport.cardOut)}
🏦 *Banka & Çek Çıkışı:* ${formatCurrency(dailyReport.bankOut)}
🪙 *Menkul Kıymet & Altın:* ${formatCurrency(dailyReport.goldOut)}
───────────────────────
🔴 *GÜNÜN TOPLAM ÇIKIŞI:* ${formatCurrency(dailyReport.totalOut)}
İşlem Adedi: ${dailyReport.items.length} kalem
───────────────────────
*Önemli Çıkışlar:*
${dailyReport.items
  .slice(0, 5)
  .map((it) => `• ${it.title}: ${formatCurrency(it.amount)} (${it.channel})`)
  .join("\n")}
${dailyReport.items.length > 5 ? `... ve ${dailyReport.items.length - 5} kalem daha.` : ""}

_Sistem üzerinden otomatik üretilmiştir._`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  // Yazdırma (Z-Raporu)
  const handlePrintZReport = () => {
    window.print();
  };

  // Aktif haftanın filtrelenmiş harcamaları
  const displayWeeklyExpenses = useMemo(() => {
    if (selectedWeekFilter === "ALL") {
      return expenses;
    }
    const found = weeklyPlan.find((w) => w.id === selectedWeekFilter);
    return found ? found.expenses : expenses;
  }, [selectedWeekFilter, weeklyPlan, expenses]);

  return (
    <div className="space-y-6 pb-20 print:p-0 print:space-y-3">
      {/* BAŞLIK & AY SEÇİCİ BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/10 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Günlük Kasa & Gider Planı</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {currentMonthLabel}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Haftalık ödeme projeksiyonu, devreden borç yükü, harcama kanalları ve gün sonu Z-raporu
            </p>
          </div>
        </div>

        {/* AY SEÇİCİ DROPDOWN */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="2026-11">Kasım 2026 (Önerilen)</option>
              <option value="2026-10">Ekim 2026</option>
              <option value="2026-12">Aralık 2026</option>
              <option value="2027-1">Ocak 2027</option>
              <option value="2027-2">Şubat 2027</option>
              <option value="2027-3">Mart 2027</option>
              <option value="2026-9">Eylül 2026</option>
              <option value="2026-8">Ağustos 2026</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            title="Yenile"
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setQuickExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Hızlı Kasa Çıkışı</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DEVREDEN BORÇ BAKİYESİ & GENEL YÜK KPI KARTLARI            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        {/* KART 1: DEVREDEN BORÇ (Geçmiş Aylardan Kalan Yük) */}
        <div className="bg-white rounded-3xl border-2 border-rose-200 p-5 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full pointer-events-none -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Devreden Borç Bakiyesi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800">
              {rolloverSummary.countRollover} Kalem Gecikmiş
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-black text-rose-700">
              {formatCurrency(rolloverSummary.totalRolloverRemaining)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {currentMonthLabel} öncesindeki vadesi geçmiş ve henüz kapatılmamış borçlar
            </p>
          </div>
        </div>

        {/* KART 2: CARİ AY YENİ GİDERLERİ */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              {currentMonthLabel} Giderleri
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800">
              {expenses.length} Gider
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(rolloverSummary.monthTotalDue)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-700 font-bold">Ödenen: {formatCurrency(rolloverSummary.monthTotalPaid)}</span>
              <span className="text-amber-700 font-bold">Kalan: {formatCurrency(rolloverSummary.monthTotalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* KART 3: TOPLAM FİNANSAL YÜKÜMLÜLÜK */}
        <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Genel Toplam Kalan Borç
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Devreden + Bu Ay
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              {formatCurrency(rolloverSummary.grandTotalRemaining)}
            </div>
            {/* Karşılaştırmalı İlerleme Çubuğu */}
            <div className="mt-2.5">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      rolloverSummary.grandTotalDue > 0
                        ? Math.round((rolloverSummary.monthTotalPaid / rolloverSummary.grandTotalDue) * 100)
                        : 0
                    }%`,
                  }}
                  className="bg-emerald-500 h-full"
                  title="Ödenen"
                />
                <div
                  style={{
                    width: `${
                      rolloverSummary.grandTotalDue > 0
                        ? Math.round((rolloverSummary.totalRolloverRemaining / rolloverSummary.grandTotalDue) * 100)
                        : 0
                    }%`,
                  }}
                  className="bg-rose-500 h-full"
                  title="Devreden Borç"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-400">Ödenen Nakit</span>
                <span className="text-rose-400">Devreden Borç Oranı</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. HAFTALIK GİDER PLANLAMASI (GRAFİKLİ & KARŞILAŞTIRMALI)       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-700" />
              <span>{currentMonthLabel} Haftalık Gider & Ödeme Projeksiyonu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Haftalık vadeler bazında planlanan harcamalar ve ödeme tamamlama performansı
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setSelectedWeekFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedWeekFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-950"
              }`}
            >
              Tüm Ay
            </button>
            {weeklyPlan.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWeekFilter(w.id)}
                className={`px-2.5 py-1.5 rounded-xl transition-all ${
                  selectedWeekFilter === w.id ? "bg-white text-teal-900 shadow-2xs font-black" : "hover:text-slate-950"
                }`}
              >
                {w.id}. Hf
              </button>
            ))}
          </div>
        </div>

        {/* GRAFİK: 5 HAFTALIK ÇİFT ÇUBUK (PLANLANAN vs ÖDENEN) */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {weeklyPlan.map((w) => {
            const isSelected = selectedWeekFilter === w.id;
            const completionRate = w.totalDue > 0 ? Math.min(100, Math.round((w.totalPaid / w.totalDue) * 100)) : 0;
            const heightPercent = Math.max(12, Math.round((w.totalDue / maxWeeklyDue) * 100));

            return (
              <div
                key={w.id}
                onClick={() => setSelectedWeekFilter(selectedWeekFilter === w.id ? "ALL" : w.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-teal-700 bg-teal-50/50 shadow-sm ring-2 ring-teal-500/20"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900">{w.label}</span>
                    <span className="text-[10px] font-bold text-slate-500">{w.expenses.length} Adet</span>
                  </div>
                  <div className="text-base font-black text-slate-900 mt-2">{formatCurrency(w.totalDue)}</div>
                  <div className="flex items-center gap-1.5 text-[11px] mt-1">
                    <span className="text-emerald-700 font-bold">{formatCurrency(w.totalPaid)}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-rose-600 font-semibold">{formatCurrency(w.totalRemaining)}</span>
                  </div>
                </div>

                {/* Görsel Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Ödeme Oranı</span>
                    <span className={completionRate >= 100 ? "text-emerald-700" : "text-amber-700"}>
                      %{completionRate}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${completionRate}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        completionRate >= 100 ? "bg-emerald-600" : "bg-teal-700"
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HARCAMA KANALI AYRIMI (DONUT GRAFİK & AYRINTILI KARTLAR)    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs print:hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-teal-700" />
              <span>Harcama Kanalı Ayrımı & Dağılım Grafiği</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nakit kasa, kredi kartı, menkul kıymet (altın) ve banka çıkışlarının oransal payları
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            Toplam: {formatCurrency(channelBreakdown.totalMonth)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {channelBreakdown.channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.key}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-2xs transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${ch.bgLight} ${ch.textCol} flex items-center justify-center font-bold`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{ch.label}</span>
                    </div>
                    <span className={`text-xs font-black ${ch.textCol}`}>%{ch.percent}</span>
                  </div>

                  <div className="mt-3">
                    <div className="text-lg font-black text-slate-900">{formatCurrency(ch.totalDue)}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Ödenen: {formatCurrency(ch.totalPaid)}</span>
                      <span className="text-rose-600 font-semibold">Kalan: {formatCurrency(ch.totalRemaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${ch.percent}%` }} className={`h-full ${ch.bgColor} rounded-full`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. GÜN SONU MUHASEBE RAPORU (Z-RAPORU & KASA KAPANIŞI)         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Kontrol Paneli (Yazdırma sırasında gizlenir) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Gün Sonu Muhasebe Raporu (Z-Raporu)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Kasa Kapanış
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Seçilen günde kasadan, kartlardan ve bankadan çıkan fiili ödemeler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tarih Seçici */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <input
                type="date"
                value={selectedReportDate}
                onChange={(e) => setSelectedReportDate(e.target.value)}
                className="bg-transparent text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            {/* WhatsApp Butonu */}
            <button
              onClick={copyWhatsappReport}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                copiedWhatsapp
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
              }`}
            >
              {copiedWhatsapp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-600" />}
              <span>{copiedWhatsapp ? "Kopyalandı!" : "WhatsApp Özeti Kopyala"}</span>
            </button>

            {/* Yazdır Butonu */}
            <button
              onClick={handlePrintZReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Z-Raporu Yazdır / PDF</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* YAZDIRILABİLİR Z-RAPORU ŞABLONU (A4 FİŞ FORMATI)                */}
        {/* ============================================================== */}
        <div className="mt-5 space-y-5">
          {/* Rapor Başlığı (Yazdırıldığında da görünür) */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                Cosmos Koleji • Gün Sonu Kasa Kapanış Raporu
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Finansman & Muhasebe Operasyonları Günlük Çıkış Dökümü
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-slate-900 block">Rapor Tarihi: {selectedReportDate}</span>
              <span className="text-slate-500 text-[11px]">Baskı Saati: {new Date().toLocaleTimeString("tr-TR")}</span>
            </div>
          </div>

          {/* Günlük Kanal Özet Kutucukları */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
              <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-800">
                💵 Kasa Nakit Çıkışı
              </span>
              <div className="text-lg font-black mt-1">{formatCurrency(dailyReport.cashOut)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950">
              <span className="text-[10px] font-black uppercase tracking-wider block text-blue-800">
                💳 Kredi Kartı Çıkışı
              </span>
              <div className="text-lg font-black mt-1">{formatCurrency(dailyReport.cardOut)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950">
              <span className="text-[10px] font-black uppercase tracking-wider block text-purple-800">
                🏦 Banka & Çek Çıkışı
              </span>
              <div className="text-lg font-black mt-1">{formatCurrency(dailyReport.bankOut)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950">
              <span className="text-[10px] font-black uppercase tracking-wider block text-amber-800">
                🪙 Menkul Kıymet / Altın
              </span>
              <div className="text-lg font-black mt-1">{formatCurrency(dailyReport.goldOut)}</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900 text-white shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider block text-teal-300">
                🔴 GÜNÜN TOPLAMI
              </span>
              <div className="text-lg font-black mt-1">{formatCurrency(dailyReport.totalOut)}</div>
            </div>
          </div>

          {/* Günün Gerçekleşen Ödeme Kalemleri Tablosu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Günün Çıkış İşlemleri Dökümü ({dailyReport.items.length} Kalem)
              </h4>
              <span className="text-[11px] text-slate-500">Kayıtlı fiili ödemeler</span>
            </div>

            {dailyReport.items.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Seçilen tarihte ({selectedReportDate}) kaydedilmiş nakit veya kart çıkışı bulunamadı.
                <br />
                <button
                  type="button"
                  onClick={() => setQuickExpenseModal(true)}
                  className="mt-2 text-teal-700 font-bold underline hover:text-teal-900 print:hidden"
                >
                  + Yeni Günlük Kasa Fişi Ekle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Gider / Açıklama</th>
                      <th className="py-2.5 px-3">Ödeme Kanalı</th>
                      <th className="py-2.5 px-3">İşlem Türü / Not</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyReport.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.title}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.channel === "CASH"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.channel === "CREDIT_CARD"
                                ? "bg-blue-100 text-blue-800"
                                : item.channel === "GOLD_ASSET"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.channel === "CASH"
                              ? "Nakit / Kasa"
                              : item.channel === "CREDIT_CARD"
                              ? "Kredi Kartı"
                              : item.channel === "GOLD_ASSET"
                              ? "Menkul Kıymet"
                              : "Banka / Çek"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.note}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs">
                      <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider">
                        GÜNÜN GENEL ÇIKIŞ TOPLAMI:
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-teal-300">
                        {formatCurrency(dailyReport.totalOut)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* İmza & Onay Alanı (Sadece Yazdırma & Resmi Fiş Formatında) */}
          <div className="pt-8 border-t-2 border-slate-900 hidden print:grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-900">Kasa / Muhasebe Sorumlusu</p>
              <div className="h-16 mt-2 border-b border-dashed border-slate-400" />
              <p className="text-[10px] text-slate-500 mt-1">İmza & Kaşe</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Okul Müdürü / Kurucu Onayı</p>
              <div className="h-16 mt-2 border-b border-dashed border-slate-400" />
              <p className="text-[10px] text-slate-500 mt-1">İmza</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEÇİLİ HAFTANIN / AYIN DETAYLI GİDER LİSTESİ                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs print:hidden space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-700" />
              <span>
                {selectedWeekFilter === "ALL"
                  ? `${currentMonthLabel} Tüm Giderler Listesi`
                  : `${selectedWeekFilter}. Hafta Gider Kalemleri`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplam {displayWeeklyExpenses.length} kalem kayıtlı harcama
            </p>
          </div>

          <Link
            href={`/giderler?month=${selectedMonth}`}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
          >
            <span>Okul Giderleri Sayfasına Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Vade / Gün</th>
                <th className="py-2.5 px-3">Gider Kalemi</th>
                <th className="py-2.5 px-3">Harcama Kanalı</th>
                <th className="py-2.5 px-3 text-right">Ödenecek</th>
                <th className="py-2.5 px-3 text-right">Ödenen</th>
                <th className="py-2.5 px-3 text-right">Kalan</th>
                <th className="py-2.5 px-3 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayWeeklyExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Bu hafta için kayıtlı gider bulunamadı.
                  </td>
                </tr>
              ) : (
                displayWeeklyExpenses.map((exp) => {
                  const { day, dateKey } = parseExpenseDate(exp);
                  const ch = classifyChannel(exp);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-600">
                        <span className="font-bold text-slate-900">{day}. Gün</span>
                        <span className="block text-[10px] text-slate-400">{dateKey}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{exp.title}</span>
                        {exp.installmentInfo && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            {exp.installmentInfo}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ch === "CASH"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : ch === "CREDIT_CARD"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : ch === "GOLD_ASSET"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {ch === "CASH"
                            ? "Nakit"
                            : ch === "CREDIT_CARD"
                            ? "Kredi Kartı"
                            : ch === "GOLD_ASSET"
                            ? "Menkul Kıymet"
                            : "Banka / Çek"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(exp.amountDue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(exp.amountPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {formatCurrency(exp.amountRemaining)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            exp.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : exp.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {exp.status === "PAID" ? "Ödendi" : exp.status === "PARTIAL" ? "Kısmi" : "Bekliyor"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: HIZLI GÜNLÜK KASA ÇIKIŞI EKLE                           */}
      {/* ============================================================== */}
      {quickExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-700" />
                <span>Hızlı Günlük Kasa Çıkışı / Fiş Ekle</span>
              </h3>
              <button
                onClick={() => setQuickExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickExpenseSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gider Tanımı / Fiş Başlığı *</label>
                <input
                  type="text"
                  required
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  placeholder="Örn: Kırtasiye Alımı, Ulaşım / Benzin, Mutfak Masrafı"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickForm.amount}
                    onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-rose-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi</label>
                  <input
                    type="date"
                    required
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={quickForm.paymentMethod}
                    onChange={(e) => setQuickForm({ ...quickForm, paymentMethod: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold"
                  >
                    <option value="CASH">💵 Nakit / Kasa</option>
                    <option value="CREDIT_CARD">💳 Kredi Kartı</option>
                    <option value="BANK_TRANSFER">🏦 Banka / Havale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={quickForm.category}
                    onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="OTHER">Diğer Giderler</option>
                    <option value="INVOICE">Fatura / Abonelik</option>
                    <option value="SALARY">Personel Avans / Maaş</option>
                    <option value="RENT">Kira</option>
                    <option value="GOLD_DAY">Altın Günü</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                <textarea
                  rows={2}
                  value={quickForm.description}
                  onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                  placeholder="Opsiyonel fiş no veya detay not..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {quickSubmitting ? "Kaydediliyor..." : "Kasaya İşle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GunlukKasaPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Günlük Kasa & Gider Planı Yükleniyor...
        </div>
      }
    >
      <GunlukKasaPlanContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Layers,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  RefreshCw,
  Clock,
  ArrowUpDown,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  Building2,
  DollarSign,
  History,
  Coins,
  FileText,
} from "lucide-react";
import {
  DefinedCreditCard,
  DEFAULT_DEFINED_CARDS,
  getClientLoadedCreditCards,
  saveClientCreditCards,
} from "@/lib/defined-credit-cards";

interface PaymentHistoryItem {
  date: string;
  amount: number;
  note: string;
}

interface SchoolExpense {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  period: string;
  installmentInfo?: string | null;
  monthIndex: number;
  dueDateStr: string;
  dueDate: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  periodStatus: string;
  description: string;
  isCommitment?: boolean;
  commitmentMonths?: number | null;
  commitmentEndDate?: string | null;
  paymentMethod?: string;
  cardHolder?: string | null;
  cardBank?: string | null;
  phoneLines?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  paymentHistory?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BankTheme {
  name: string;
  topBar: string;
  cardBg: string;
  selectedBg: string;
  badge: string;
  btn: string;
  text: string;
}

function getBankTheme(bankName: string | null | undefined): BankTheme {
  const b = (bankName || "").toLowerCase();
  if (b.includes("vakıf") || b.includes("vakif")) {
    return {
      name: "VakıfBank",
      topBar: "bg-amber-500",
      cardBg: "bg-amber-50/70 border-amber-300 hover:border-amber-400",
      selectedBg: "bg-amber-100/80 border-amber-500 ring-2 ring-amber-500/30",
      badge: "bg-amber-400 text-slate-950 border-amber-500",
      btn: "bg-amber-500 hover:bg-amber-600 text-slate-950",
      text: "text-amber-950",
    };
  }
  if (b.includes("ziraat")) {
    return {
      name: "Ziraat Bankası",
      topBar: "bg-red-600",
      cardBg: "bg-red-50/60 border-red-300 hover:border-red-400",
      selectedBg: "bg-red-100/80 border-red-600 ring-2 ring-red-600/30",
      badge: "bg-red-600 text-white border-red-700",
      btn: "bg-red-600 hover:bg-red-700 text-white",
      text: "text-red-950",
    };
  }
  if (b.includes("halk") || b.includes("paraf")) {
    return {
      name: "Halkbank",
      topBar: "bg-sky-600",
      cardBg: "bg-sky-50/60 border-sky-300 hover:border-sky-400",
      selectedBg: "bg-sky-100/80 border-sky-600 ring-2 ring-sky-600/30",
      badge: "bg-sky-600 text-white border-sky-700",
      btn: "bg-sky-600 hover:bg-sky-700 text-white",
      text: "text-sky-950",
    };
  }
  if (b.includes("akbank") || b.includes("axess")) {
    return {
      name: "Akbank",
      topBar: "bg-rose-600",
      cardBg: "bg-rose-50/60 border-rose-300 hover:border-rose-400",
      selectedBg: "bg-rose-100/80 border-rose-600 ring-2 ring-rose-600/30",
      badge: "bg-rose-600 text-white border-rose-700",
      btn: "bg-rose-600 hover:bg-rose-700 text-white",
      text: "text-rose-950",
    };
  }
  if (b.includes("qnb") || b.includes("finans")) {
    if (b.includes("türkiye finans") || b.includes("turkiye finans")) {
      return {
        name: "Türkiye Finans",
        topBar: "bg-green-600",
        cardBg: "bg-green-50/60 border-green-300 hover:border-green-400",
        selectedBg: "bg-green-100/80 border-green-600 ring-2 ring-green-600/30",
        badge: "bg-green-600 text-white border-green-700",
        btn: "bg-green-600 hover:bg-green-700 text-white",
        text: "text-green-950",
      };
    }
    return {
      name: "QNB Finansbank",
      topBar: "bg-purple-700",
      cardBg: "bg-purple-50/60 border-purple-300 hover:border-purple-400",
      selectedBg: "bg-purple-100/80 border-purple-700 ring-2 ring-purple-700/30",
      badge: "bg-purple-700 text-white border-purple-800",
      btn: "bg-purple-700 hover:bg-purple-800 text-white",
      text: "text-purple-950",
    };
  }
  if (b.includes("deniz")) {
    return {
      name: "Denizbank",
      topBar: "bg-cyan-600",
      cardBg: "bg-cyan-50/60 border-cyan-300 hover:border-cyan-400",
      selectedBg: "bg-cyan-100/80 border-cyan-600 ring-2 ring-cyan-600/30",
      badge: "bg-cyan-600 text-white border-cyan-700",
      btn: "bg-cyan-600 hover:bg-cyan-700 text-white",
      text: "text-cyan-950",
    };
  }
  if (b.includes("garanti") || b.includes("bonus")) {
    return {
      name: "Garanti BBVA",
      topBar: "bg-emerald-600",
      cardBg: "bg-emerald-50/60 border-emerald-300 hover:border-emerald-400",
      selectedBg: "bg-emerald-100/80 border-emerald-600 ring-2 ring-emerald-600/30",
      badge: "bg-emerald-600 text-white border-emerald-700",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      text: "text-emerald-950",
    };
  }
  if (b.includes("iş bank") || b.includes("is bank") || b.includes("maximum")) {
    return {
      name: "İş Bankası",
      topBar: "bg-indigo-700",
      cardBg: "bg-indigo-50/60 border-indigo-300 hover:border-indigo-400",
      selectedBg: "bg-indigo-100/80 border-indigo-700 ring-2 ring-indigo-700/30",
      badge: "bg-indigo-700 text-white border-indigo-800",
      btn: "bg-indigo-700 hover:bg-indigo-800 text-white",
      text: "text-indigo-950",
    };
  }
  if (b.includes("yapı") || b.includes("yapi") || b.includes("world")) {
    return {
      name: "Yapı Kredi",
      topBar: "bg-blue-700",
      cardBg: "bg-blue-50/60 border-blue-300 hover:border-blue-400",
      selectedBg: "bg-blue-100/80 border-blue-700 ring-2 ring-blue-700/30",
      badge: "bg-blue-700 text-white border-blue-800",
      btn: "bg-blue-700 hover:bg-blue-800 text-white",
      text: "text-blue-950",
    };
  }
  if (b.includes("kuveyt") || b.includes("katılım")) {
    return {
      name: "Kuveyt Türk",
      topBar: "bg-teal-600",
      cardBg: "bg-teal-50/60 border-teal-300 hover:border-teal-400",
      selectedBg: "bg-teal-100/80 border-teal-600 ring-2 ring-teal-600/30",
      badge: "bg-teal-600 text-white border-teal-700",
      btn: "bg-teal-600 hover:bg-teal-700 text-white",
      text: "text-teal-950",
    };
  }
  return {
    name: bankName || "Banka Kartı",
    topBar: "bg-slate-600",
    cardBg: "bg-slate-50 border-slate-300 hover:border-slate-400",
    selectedBg: "bg-slate-100 border-slate-600 ring-2 ring-slate-600/20",
    badge: "bg-slate-700 text-white border-slate-800",
    btn: "bg-slate-700 hover:bg-slate-800 text-white",
    text: "text-slate-900",
  };
}

const BANK_PRESETS = [
  "Vakıfbank",
  "Ziraat Bankası",
  "Halkbank",
  "Akbank",
  "QNB Finansbank",
  "Denizbank",
  "Garanti BBVA",
  "İş Bankası",
  "Yapı Kredi",
  "Kuveyt Türk",
  "Türkiye Finans",
];

const CARD_OWNER_PRESETS = [
  "Ahmet Taymaz",
  "Muhammed Ali Çağır",
  "Şirket Kartları (SIMCU)",
  "Duygu Köse",
  "Emre Helvacı",
];

const TR_MONTH_NAMES: Record<number, string> = {
  1: "Ocak",
  2: "Şubat",
  3: "Mart",
  4: "Nisan",
  5: "Mayıs",
  6: "Haziran",
  7: "Temmuz",
  8: "Ağustos",
  9: "Eylül",
  10: "Ekim",
  11: "Kasım",
  12: "Aralık",
};

const TR_MONTH_SHORT: Record<number, string> = {
  1: "Oca",
  2: "Şub",
  3: "Mar",
  4: "Nis",
  5: "May",
  6: "Haz",
  7: "Tem",
  8: "Ağu",
  9: "Eyl",
  10: "Eki",
  11: "Kas",
  12: "Ara",
};

const TR_MONTH_FULL: Record<number, string> = TR_MONTH_NAMES;

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

function formatTurkishDate(date: Date): string {
  const d = date.getDate();
  const m = TR_MONTH_NAMES[date.getMonth() + 1] || "";
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

function parseSelectedPeriod(sel: string): {
  mode: "ALL" | "YEAR" | "YM";
  year: number;
  month: number;
  ym: string;
  label: string;
} {
  if (!sel || sel === "ALL") {
    return {
      mode: "ALL",
      year: 2026,
      month: 9,
      ym: "ALL",
      label: "Tüm Yıllar & Aylar",
    };
  }
  const yearOnlyMatch = String(sel).match(/^YEAR-(\d{4})$/i);
  if (yearOnlyMatch) {
    const y = parseInt(yearOnlyMatch[1], 10);
    return {
      mode: "YEAR",
      year: y,
      month: 9,
      ym: `YEAR-${y}`,
      label: `${y} Yılı Tüm Ekstreler`,
    };
  }
  const ymMatch = String(sel).match(/^(\d{4})-(\d{1,2})$/);
  if (ymMatch) {
    const y = parseInt(ymMatch[1], 10);
    const m = parseInt(ymMatch[2], 10);
    return {
      mode: "YM",
      year: y,
      month: m,
      ym: `${y}-${m}`,
      label: `${m}. Ay (${TR_MONTH_FULL[m] || ""} ${y})`,
    };
  }
  const mOnly = parseInt(String(sel), 10);
  if (!isNaN(mOnly) && mOnly >= 1 && mOnly <= 12) {
    const y = mOnly >= 7 ? 2026 : 2027;
    return {
      mode: "YM",
      year: y,
      month: mOnly,
      ym: `${y}-${mOnly}`,
      label: `${mOnly}. Ay (${TR_MONTH_FULL[mOnly] || ""} ${y})`,
    };
  }
  return { mode: "YM", year: 2026, month: 9, ym: "2026-9", label: "9. Ay (Eylül 2026)" };
}

function getExpenseDueYM(exp: SchoolExpense): { year: number; month: number; ym: string } {
  if (exp.dueDate) {
    try {
      const d = new Date(exp.dueDate);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return { year: y, month: m, ym: `${y}-${m}` };
      }
    } catch {}
  }

  if (exp.dueDateStr) {
    const trMap: Record<string, number> = {
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
    const m = String(exp.dueDateStr).toLowerCase().match(/(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/i);
    if (m && trMap[m[2]]) {
      const y = parseInt(m[3], 10);
      const mo = trMap[m[2]];
      return { year: y, month: mo, ym: `${y}-${mo}` };
    }
    const dotMatch = String(exp.dueDateStr).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dotMatch) {
      const mo = parseInt(dotMatch[2], 10);
      const y = parseInt(dotMatch[3], 10);
      if (mo >= 1 && mo <= 12 && y >= 2000) {
        return { year: y, month: mo, ym: `${y}-${mo}` };
      }
    }
  }

  const mIdx = Number(exp.monthIndex) || 9;
  let y = mIdx >= 7 ? 2026 : 2027;
  const yearMatch = `${exp.dueDateStr || ""} ${exp.period || ""}`.match(/\b(202\d|203\d)\b/);
  if (yearMatch) {
    y = parseInt(yearMatch[1], 10);
  }
  return { year: y, month: mIdx, ym: `${y}-${mIdx}` };
}

function doesExpenseMatchSelectedPeriod(exp: SchoolExpense, sel: string): boolean {
  if (!sel || sel === "ALL") return true;
  const parsed = parseSelectedPeriod(sel);
  const expYM = getExpenseDueYM(exp);
  if (parsed.mode === "YEAR") {
    return expYM.year === parsed.year;
  }
  return expYM.year === parsed.year && expYM.month === parsed.month;
}

function projectCardDateToActiveMonth(
  dateISO: string | undefined | null,
  monthSelection: string,
  fixedDayOverride?: number
): string {
  if (!dateISO && !fixedDayOverride) return "";
  const parts = String(dateISO || "").split("-");
  const parsedDay =
    fixedDayOverride && fixedDayOverride >= 1 && fixedDayOverride <= 31
      ? fixedDayOverride
      : parts.length === 3
      ? parseInt(parts[2], 10)
      : NaN;
  if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) return dateISO || "";

  const parsedPeriod = parseSelectedPeriod(monthSelection);
  const targetYear = parsedPeriod.year;
  const targetMonth = parsedPeriod.month;
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const safeDay = Math.min(parsedDay, maxDaysInTargetMonth);

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function doesExpenseMatchAhmetCard(exp: SchoolExpense, card: DefinedCreditCard): boolean {
  const isCardPay =
    exp.paymentMethod === "CREDIT_CARD" ||
    (exp.cardHolder && exp.cardHolder.trim() !== "") ||
    (exp.cardBank && exp.cardBank.trim() !== "");
  if (!isCardPay) return false;

  const desc = `${exp.description || ""} ${exp.title || ""}`;
  const explicitTag = desc.match(/\[(card-[^\]]+)\]/i);
  if (explicitTag && explicitTag[1]) {
    return explicitTag[1].toLowerCase() === card.id.toLowerCase();
  }

  const expHolder = (exp.cardHolder || "").trim().toLowerCase();
  const expBank = (exp.cardBank || "").trim().toLowerCase();
  const cardHolder = (card.holder || "").trim().toLowerCase();
  const cardBank = (card.bankName || "").trim().toLowerCase();

  if (expHolder && cardHolder) {
    const holderMatch =
      expHolder === cardHolder ||
      (cardHolder.includes("ahmet") && expHolder.includes("ahmet")) ||
      (cardHolder.includes("muhammed") && (expHolder.includes("muhammed") || expHolder.includes("mac"))) ||
      (cardHolder.includes("simcu") && (expHolder.includes("simcu") || expHolder.includes("şirket") || expHolder.includes("sirket"))) ||
      (cardHolder.includes("duygu") && expHolder.includes("duygu")) ||
      (cardHolder.includes("emre") && expHolder.includes("emre"));

    if (holderMatch && expBank && cardBank) {
      const bSimple = (s: string) =>
        s.replace(/bankası|bankasi|bank|katılım|katilim/g, "").replace(/[^a-z0-9]/g, "");
      const b1 = bSimple(expBank);
      const b2 = bSimple(cardBank);
      return b1.includes(b2) || b2.includes(b1);
    }
  }

  return false;
}

function KrediKartlariPageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [cards, setCards] = useState<DefinedCreditCard[]>(DEFAULT_DEFINED_CARDS);
  const [allCardExpenses, setAllCardExpenses] = useState<SchoolExpense[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<
    Array<{ year: number; month: number; count: number; unpaidCount: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cardOwnerFilter, setCardOwnerFilter] = useState<string>("ALL");
  const [selectedVisualCardId, setSelectedVisualCardId] = useState<string>("ALL_5");

  // Periyot / Ay Seçimi: Varsayılan içinde bulunulan aya göre başlar
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = m >= 7 ? 2026 : 2027;
    return `${y}-${m}`;
  });

  // Asgari Tutarlar Giriş Taslakları
  const [asgariDrafts, setAsgariDrafts] = useState<Record<string, string>>({});
  const [asgariSavedFeedback, setAsgariSavedFeedback] = useState<Record<string, boolean>>({});
  const [showMinPaymentSummaryTable, setShowMinPaymentSummaryTable] = useState(true);

  // Yeni Kart Ekleme Formu
  const [newCardFormOpen, setNewCardFormOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    holder: "Ahmet Taymaz",
    bankName: "Vakıfbank",
    cardLabel: "",
    statementDateISO: "2026-09-15",
    dueDateISO: "2026-09-25",
    cardLimit: "750000",
    minPaymentAmount: "",
  });

  // Kart Düzenleme Modalı
  const [editCardModalOpen, setEditCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DefinedCreditCard | null>(null);
  const [editCardForm, setEditCardForm] = useState({
    holder: "",
    bankName: "",
    cardLabel: "",
    cardLimit: "",
    statementDateISO: "",
    dueDateISO: "",
    minPaymentAmount: "",
    minPaymentRate: "20",
  });

  // Karta Özel Harcama / Taksit Modalı
  const [cardTxModalOpen, setCardTxModalOpen] = useState(false);
  const [cardTxSubmitting, setCardTxSubmitting] = useState(false);
  const [cardTxForm, setCardTxForm] = useState({
    cardId: "card-1",
    title: "",
    amount: "",
    amountMode: "TOTAL" as "TOTAL" | "MONTHLY",
    installmentCount: 1,
    currentInstallment: 1,
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
    category: "EXPENSE",
    subCategory: "Kredi Kartı Harcaması",
  });

  // Kart Borcu / Ekstre Ödeme Modalı
  const [cardPayModalOpen, setCardPayModalOpen] = useState(false);
  const [cardPaySubmitting, setCardPaySubmitting] = useState(false);
  const [cardPayForm, setCardPayForm] = useState({
    cardId: "card-1",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    mode: "FULL" as "FULL" | "MIN" | "CUSTOM",
  });

  // Ödeme Parçası Modalı & Geçmiş
  const [paymentHistoryModalExpense, setPaymentHistoryModalExpense] = useState<SchoolExpense | null>(null);
  const [activePaymentExpense, setActivePaymentExpense] = useState<SchoolExpense | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Hatlar / Taahhüt Modal
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [activePhoneExpense, setActivePhoneExpense] = useState<SchoolExpense | null>(null);
  const [phoneLinesList, setPhoneLinesList] = useState<any[]>([]);
  const [phoneModalSubmitting, setPhoneModalSubmitting] = useState(false);
  const [hiddenPhoneRowIds, setHiddenPhoneRowIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    const loaded = getClientLoadedCreditCards();
    setCards(loaded);
  }, []);

  const saveCardsState = (updated: DefinedCreditCard[]) => {
    setCards(updated);
    saveClientCreditCards(updated);
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/giderler?period=ALL");
      if (res.ok) {
        const data = await res.json();
        if (data.allCardExpenses && Array.isArray(data.allCardExpenses)) {
          setAllCardExpenses(data.allCardExpenses);
        } else if (data.expenses && Array.isArray(data.expenses)) {
          setAllCardExpenses(
            data.expenses.filter(
              (e: SchoolExpense) =>
                e.paymentMethod === "CREDIT_CARD" ||
                Boolean(e.cardHolder) ||
                Boolean(e.cardBank)
            )
          );
        }
        if (data.availablePeriods && Array.isArray(data.availablePeriods)) {
          setAvailablePeriods(data.availablePeriods);
        }
      }
    } catch (err) {
      console.error("Giderler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Kart Hesaplamaları (Seçili aya ve genel bakiyelere göre)
  const cardsComputed = useMemo(() => {
    const monthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

    return cards.map((card) => {
      const allTx = allCardExpenses.filter((exp) => doesExpenseMatchAhmetCard(exp, card));
      const monthTx =
        selectedMonth !== "ALL"
          ? allTx.filter((exp) => doesExpenseMatchSelectedPeriod(exp, selectedMonth))
          : allTx;

      const monthStatementTotal = monthTx.reduce((s, e) => s + e.amountDue, 0);
      const monthStatementPaid = monthTx.reduce((s, e) => s + e.amountPaid, 0);
      const monthStatementRemaining = monthTx.reduce((s, e) => s + e.amountRemaining, 0);

      const limitAffectingTx = allTx.filter((e) => {
        const isFutureRecurringUtility =
          e.periodStatus === "Aylık Fatura" ||
          ((e.description || "").includes("Aylık Düzenli Fatura") && e.periodStatus !== "Cari Dönem");
        if (!isFutureRecurringUtility) return true;
        return selectedMonth !== "ALL" ? doesExpenseMatchSelectedPeriod(e, selectedMonth) : false;
      });

      const allTimeTotalDue = limitAffectingTx.reduce((s, e) => s + e.amountDue, 0);
      const allTimeTotalPaid = limitAffectingTx.reduce((s, e) => s + e.amountPaid, 0);
      const allTimeTotalRemaining = limitAffectingTx.reduce((s, e) => s + e.amountRemaining, 0);

      const cardLimit = Number(card.cardLimit) > 0 ? Number(card.cardLimit) : 750000;
      const usedLimit = Number(allTimeTotalRemaining.toFixed(2));
      const availableLimit = Math.max(0, Number((cardLimit - usedLimit).toFixed(2)));

      const monthlyBreakdown = monthOrder
        .map((mIdx) => {
          const mItems = allTx.filter((exp) => exp.monthIndex === mIdx);
          return {
            monthIndex: mIdx,
            totalDue: mItems.reduce((s, e) => s + e.amountDue, 0),
            remaining: mItems.reduce((s, e) => s + e.amountRemaining, 0),
            count: mItems.length,
            unpaidCount: mItems.filter((e) => e.status !== "PAID").length,
          };
        })
        .filter((m) => m.count > 0);

      const effectiveStatementDateISO = projectCardDateToActiveMonth(
        card.statementDateISO,
        selectedMonth,
        (card as any).statementDay
      );
      const effectiveDueDateISO = projectCardDateToActiveMonth(
        card.dueDateISO,
        selectedMonth,
        (card as any).dueDay
      );

      const curParsed = parseSelectedPeriod(selectedMonth);
      const activeMonthKey = curParsed.mode === "YM" ? curParsed.ym : "DEFAULT";
      const manualMonthlyMin = card.monthlyMinPayments?.[activeMonthKey];
      const manualGeneralMin = card.minPaymentAmount;
      const hasManualMonthly =
        manualMonthlyMin !== undefined && manualMonthlyMin !== null && Number(manualMonthlyMin) > 0;
      const hasManualGeneral =
        manualGeneralMin !== undefined && manualGeneralMin !== null && Number(manualGeneralMin) > 0;

      const manualMinNum = hasManualMonthly
        ? Number(manualMonthlyMin)
        : hasManualGeneral
        ? Number(manualGeneralMin)
        : null;

      const defaultRate = card.minPaymentRate || (cardLimit > 50000 ? 40 : 20);
      const autoCalculatedMin =
        monthStatementTotal > 0
          ? Number(((monthStatementTotal * defaultRate) / 100).toFixed(2))
          : 0;

      const effectiveMinPayment =
        monthStatementTotal > 0
          ? (manualMinNum !== null
              ? Math.min(monthStatementTotal, manualMinNum)
              : autoCalculatedMin)
          : 0;

      const isMinPaymentMet =
        monthStatementTotal > 0 &&
        (monthStatementRemaining <= 0 || (effectiveMinPayment > 0 && monthStatementPaid >= effectiveMinPayment));

      const remainingMinPayment =
        monthStatementTotal > 0 && !isMinPaymentMet
          ? Math.max(0, Number((effectiveMinPayment - monthStatementPaid).toFixed(2)))
          : 0;

      let daysLeftUntilDue: number | null = null;
      if (effectiveDueDateISO) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(effectiveDueDateISO);
        due.setHours(0, 0, 0, 0);
        if (!isNaN(due.getTime())) {
          const diffMs = due.getTime() - today.getTime();
          daysLeftUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...card,
        statementDateISO: effectiveStatementDateISO,
        dueDateISO: effectiveDueDateISO,
        cutoffDay: formatSafeDate(effectiveDueDateISO),
        daysLeftUntilDue,
        allTx,
        monthTx,
        monthStatementTotal,
        monthStatementPaid,
        monthStatementRemaining,
        allTimeTotalDue,
        allTimeTotalPaid,
        allTimeTotalRemaining,
        cardLimit,
        usedLimit,
        availableLimit,
        monthlyBreakdown,
        minPaymentAmount: manualMonthlyMin ?? card.minPaymentAmount,
        minPaymentRate: defaultRate,
        autoCalculatedMin,
        effectiveMinPayment,
        remainingMinPayment,
        isMinPaymentMet,
        isMinManual: manualMinNum !== null,
      };
    });
  }, [cards, allCardExpenses, selectedMonth]);

  // Seçili Dönem Kredi Kartları Finansal Özeti
  const creditCardsMonthlySummary = useMemo(() => {
    let totalStatementDue = 0;
    let totalStatementPaid = 0;
    let totalStatementRemaining = 0;
    let totalMinTarget = 0;
    let totalMinRemaining = 0;
    let cardsWithStatementCount = 0;
    let cardsMinPendingCount = 0;
    let cardsMinMetCount = 0;

    cardsComputed.forEach((c) => {
      if (c.monthStatementTotal > 0 || c.monthStatementRemaining > 0) {
        cardsWithStatementCount++;
        totalStatementDue += c.monthStatementTotal;
        totalStatementPaid += c.monthStatementPaid;
        totalStatementRemaining += c.monthStatementRemaining;
        totalMinTarget += c.effectiveMinPayment;
        totalMinRemaining += c.remainingMinPayment;

        if (c.isMinPaymentMet) {
          cardsMinMetCount++;
        } else if (c.remainingMinPayment > 0) {
          cardsMinPendingCount++;
        }
      }
    });

    return {
      totalStatementDue,
      totalStatementPaid,
      totalStatementRemaining,
      totalMinTarget,
      totalMinRemaining,
      cardsWithStatementCount,
      cardsMinPendingCount,
      cardsMinMetCount,
    };
  }, [cardsComputed]);

  // Genel Kalan Borç ve Limit Özeti
  const creditCardsOverallSummary = useMemo(() => {
    let totalLimits = 0;
    let totalUsed = 0;
    let totalAvailable = 0;
    let allTimeTotalDue = 0;
    let allTimeTotalPaid = 0;
    let allTimeTotalRemaining = 0;

    cardsComputed.forEach((c) => {
      totalLimits += c.cardLimit || 0;
      totalUsed += c.usedLimit || 0;
      totalAvailable += c.availableLimit || 0;
      allTimeTotalDue += c.allTimeTotalDue || 0;
      allTimeTotalPaid += c.allTimeTotalPaid || 0;
      allTimeTotalRemaining += c.allTimeTotalRemaining || 0;
    });

    return {
      totalLimits,
      totalUsed,
      totalAvailable,
      allTimeTotalDue,
      allTimeTotalPaid,
      allTimeTotalRemaining,
    };
  }, [cardsComputed]);

  // Aylara Göre Kredi Kartı Ödeme & Asgari Dağılımı (Tüm Kartlar İçin)
  const allCardsMonthlyDistribution = useMemo(() => {
    const ymMap = new Map<
      string,
      {
        year: number;
        month: number;
        ym: string;
        label: string;
        totalDue: number;
        totalPaid: number;
        totalRemaining: number;
        totalMinTarget: number;
        totalMinRemaining: number;
        activeCardsCount: number;
        pendingMinCardsCount: number;
      }
    >();

    allCardExpenses.forEach((exp) => {
      const ymInfo = getExpenseDueYM(exp);
      const ymKey = ymInfo.ym;
      if (!ymMap.has(ymKey)) {
        ymMap.set(ymKey, {
          year: ymInfo.year,
          month: ymInfo.month,
          ym: ymKey,
          label: `${ymInfo.month}. Ay (${TR_MONTH_SHORT[ymInfo.month] || ""} ${ymInfo.year})`,
          totalDue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          totalMinTarget: 0,
          totalMinRemaining: 0,
          activeCardsCount: 0,
          pendingMinCardsCount: 0,
        });
      }
    });

    const curSel = parseSelectedPeriod(selectedMonth);
    if (curSel.mode === "YM" && !ymMap.has(curSel.ym)) {
      ymMap.set(curSel.ym, {
        year: curSel.year,
        month: curSel.month,
        ym: curSel.ym,
        label: `${curSel.month}. Ay (${TR_MONTH_SHORT[curSel.month] || ""} ${curSel.year})`,
        totalDue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        totalMinTarget: 0,
        totalMinRemaining: 0,
        activeCardsCount: 0,
        pendingMinCardsCount: 0,
      });
    }

    const result: Array<{
      year: number;
      month: number;
      ym: string;
      label: string;
      totalDue: number;
      totalPaid: number;
      totalRemaining: number;
      totalMinTarget: number;
      totalMinRemaining: number;
      activeCardsCount: number;
      pendingMinCardsCount: number;
    }> = [];

    Array.from(ymMap.keys()).forEach((ymKey) => {
      const mData = ymMap.get(ymKey)!;
      let monthDue = 0;
      let monthPaid = 0;
      let monthRemaining = 0;
      let monthMinTarget = 0;
      let monthMinRemaining = 0;
      let activeCards = 0;
      let pendingMinCards = 0;

      cards.forEach((card) => {
        const cardMonthExpenses = allCardExpenses.filter(
          (exp) => doesExpenseMatchAhmetCard(exp, card) && doesExpenseMatchSelectedPeriod(exp, ymKey)
        );

        const cDue = cardMonthExpenses.reduce((s, e) => s + e.amountDue, 0);
        const cPaid = cardMonthExpenses.reduce((s, e) => s + e.amountPaid, 0);
        const cRemaining = cardMonthExpenses.reduce((s, e) => s + e.amountRemaining, 0);

        if (cDue > 0 || cRemaining > 0) {
          activeCards++;
          monthDue += cDue;
          monthPaid += cPaid;
          monthRemaining += cRemaining;

          const cardLimit = Number(card.cardLimit) > 0 ? Number(card.cardLimit) : 750000;
          const defaultRate = card.minPaymentRate || (cardLimit > 50000 ? 40 : 20);
          const manualMonthlyMin = card.monthlyMinPayments?.[ymKey];
          const manualGeneralMin = card.minPaymentAmount;
          const manualMinNum =
            manualMonthlyMin !== undefined && manualMonthlyMin !== null && Number(manualMonthlyMin) > 0
              ? Number(manualMonthlyMin)
              : manualGeneralMin !== undefined && manualGeneralMin !== null && Number(manualGeneralMin) > 0
              ? Number(manualGeneralMin)
              : null;

          const autoMin = Number(((cDue * defaultRate) / 100).toFixed(2));
          const effectiveMin = manualMinNum !== null ? Math.min(cDue, manualMinNum) : autoMin;

          const isMinMet = cRemaining <= 0 || (effectiveMin > 0 && cPaid >= effectiveMin);
          const remMin = !isMinMet ? Math.max(0, Number((effectiveMin - cPaid).toFixed(2))) : 0;

          monthMinTarget += effectiveMin;
          monthMinRemaining += remMin;

          if (remMin > 0) {
            pendingMinCards++;
          }
        }
      });

      mData.totalDue = monthDue;
      mData.totalPaid = monthPaid;
      mData.totalRemaining = monthRemaining;
      mData.totalMinTarget = monthMinTarget;
      mData.totalMinRemaining = monthMinRemaining;
      mData.activeCardsCount = activeCards;
      mData.pendingMinCardsCount = pendingMinCards;

      if (monthDue > 0 || monthRemaining > 0 || ymKey === curSel.ym) {
        result.push(mData);
      }
    });

    result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return result;
  }, [cards, allCardExpenses, selectedMonth]);

  // Yeni Kart Ekle
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.holder || !newCardForm.bankName) {
      alert("Kart sahibi ve banka adı zorunludur.");
      return;
    }
    const newCard: DefinedCreditCard = {
      id: `card-custom-${Date.now()}`,
      slotNumber: cards.length + 1,
      holder: newCardForm.holder.trim(),
      bankName: newCardForm.bankName.trim(),
      cardLabel: newCardForm.cardLabel.trim() || `${newCardForm.bankName} Kartı`,
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      statementDateISO: newCardForm.statementDateISO || "2026-09-15",
      dueDateISO: newCardForm.dueDateISO || "2026-09-25",
      cardLimit: Number(newCardForm.cardLimit) > 0 ? Number(newCardForm.cardLimit) : 750000,
      minPaymentAmount: Number(newCardForm.minPaymentAmount) || undefined,
    };
    const updated = [...cards, newCard];
    saveCardsState(updated);
    setNewCardFormOpen(false);
    setSelectedVisualCardId(newCard.id);
  };

  // Kart Düzenle
  const openEditCardModal = (card: DefinedCreditCard) => {
    setEditingCard(card);
    setEditCardForm({
      holder: card.holder,
      bankName: card.bankName,
      cardLabel: card.cardLabel,
      cardLimit: String(card.cardLimit),
      statementDateISO: card.statementDateISO || "",
      dueDateISO: card.dueDateISO || "",
      minPaymentAmount: card.minPaymentAmount ? String(card.minPaymentAmount) : "",
      minPaymentRate: card.minPaymentRate ? String(card.minPaymentRate) : "20",
    });
    setEditCardModalOpen(true);
  };

  const handleEditCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    const safeLimit = Math.max(0, Number(editCardForm.cardLimit) || 0);
    const updatedCards = cards.map((c) => {
      if (c.id === editingCard.id) {
        return {
          ...c,
          holder: editCardForm.holder.trim() || c.holder,
          bankName: editCardForm.bankName.trim() || c.bankName,
          cardLabel: editCardForm.cardLabel.trim() || c.cardLabel,
          cardLimit: safeLimit,
          statementDateISO: editCardForm.statementDateISO || c.statementDateISO,
          dueDateISO: editCardForm.dueDateISO || c.dueDateISO,
          minPaymentAmount: Number(editCardForm.minPaymentAmount) || undefined,
          minPaymentRate: Number(editCardForm.minPaymentRate) || 20,
        };
      }
      return c;
    });

    saveCardsState(updatedCards);

    // İlgili kartın giderlerinin son ödeme tarihini senkronize et
    if (editCardForm.dueDateISO) {
      const cardExpenses = allCardExpenses.filter((exp) => doesExpenseMatchAhmetCard(exp, editingCard));
      if (cardExpenses.length > 0) {
        try {
          await fetch("/api/giderler", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "SYNC_CARD_DUE_DATE",
              dueDateISO: editCardForm.dueDateISO,
              expenseIds: cardExpenses.map((exp) => exp.id),
            }),
          });
          await fetchExpenses();
        } catch {}
      }
    }

    setEditCardModalOpen(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!confirm("Bu kredi kartı tanımını silmek istediğinize emin misiniz? (Harcama kayıtları silinmez)")) return;
    const updated = cards.filter((c) => c.id !== cardId);
    saveCardsState(updated);
    if (selectedVisualCardId === cardId) {
      setSelectedVisualCardId("ALL_5");
    }
  };

  // Asgari Tutarı Kaydet
  const handleSaveMonthlyMinPayment = (cardId: string) => {
    const activeMonthKey =
      parseSelectedPeriod(selectedMonth).mode === "YM"
        ? parseSelectedPeriod(selectedMonth).ym
        : "DEFAULT";

    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    const rawInputVal = asgariDrafts[cardId];
    const prevMonthly = targetCard.monthlyMinPayments?.[activeMonthKey];
    const currentVal =
      rawInputVal !== undefined
        ? Number(rawInputVal) || 0
        : prevMonthly !== undefined
        ? prevMonthly
        : targetCard.minPaymentAmount || 0;

    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        const nextMonthly = { ...(c.monthlyMinPayments || {}) };
        if (currentVal > 0) {
          nextMonthly[activeMonthKey] = currentVal;
        } else {
          delete nextMonthly[activeMonthKey];
        }
        return {
          ...c,
          monthlyMinPayments: nextMonthly,
          minPaymentAmount: currentVal > 0 ? currentVal : c.minPaymentAmount,
        };
      }
      return c;
    });

    saveCardsState(updatedCards);
    setAsgariSavedFeedback((prev) => ({ ...prev, [cardId]: true }));
    setTimeout(() => {
      setAsgariSavedFeedback((prev) => ({ ...prev, [cardId]: false }));
    }, 2000);
  };

  // Harcama / Taksit Modalı Aç
  const openCardTxModal = (cardId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetCard = cardsComputed.find((c) => c.id === cardId) || cardsComputed[0];
    const defDueDate = targetCard?.dueDateISO || todayStr;
    setCardTxForm({
      cardId: targetCard?.id || "card-1",
      title: "",
      amount: "",
      amountMode: "TOTAL",
      installmentCount: 1,
      currentInstallment: 1,
      dueDate: defDueDate,
      description: "",
      category: "EXPENSE",
      subCategory: "Kredi Kartı Harcaması",
    });
    setCardTxModalOpen(true);
  };

  const handleCardTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = cards.find((c) => c.id === cardTxForm.cardId) || cards[0];
    if (!card) return;

    const numAmount = Number(cardTxForm.amount) || 0;
    if (numAmount <= 0) {
      alert("Geçerli bir tutar girin");
      return;
    }

    try {
      setCardTxSubmitting(true);
      const isInst = cardTxForm.installmentCount > 1;
      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cardTxForm.title.trim(),
          category: cardTxForm.category,
          subCategory: cardTxForm.subCategory,
          amountDue: numAmount,
          dueDate: cardTxForm.dueDate,
          entryType: isInst ? "INSTALLMENT" : "SINGLE",
          isInstallment: isInst,
          installmentCount: cardTxForm.installmentCount,
          currentInstallment: cardTxForm.currentInstallment || 1,
          amountMode: cardTxForm.amountMode,
          paymentMethod: "CREDIT_CARD",
          cardHolder: card.holder,
          cardBank: card.bankName,
          description: cardTxForm.description
            ? `${cardTxForm.description} [${card.id}]`
            : `[${card.id}] ${card.bankName} (${card.holder})`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Harcama eklenemedi");
        return;
      }

      setCardTxModalOpen(false);
      await fetchExpenses();
    } catch {
      alert("Hata oluştu");
    } finally {
      setCardTxSubmitting(false);
    }
  };

  // Kart Borcu / Ekstre Ödeme Modalı
  const openCardPayModal = (cardId: string, prefillMode: "FULL" | "MIN" = "FULL") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetCard = cardsComputed.find((c) => c.id === cardId) || cardsComputed[0];
    if (!targetCard) return;
    setSelectedVisualCardId(targetCard.id);
    const fullPayAmount =
      targetCard.monthStatementRemaining > 0
        ? targetCard.monthStatementRemaining
        : targetCard.allTimeTotalRemaining;
    const minPayAmount =
      targetCard.remainingMinPayment > 0
        ? targetCard.remainingMinPayment
        : targetCard.effectiveMinPayment > 0
        ? targetCard.effectiveMinPayment
        : fullPayAmount;

    const chosenAmount = prefillMode === "MIN" ? minPayAmount : fullPayAmount;
    setCardPayForm({
      cardId: targetCard.id,
      amount: chosenAmount > 0 ? chosenAmount.toFixed(2) : "",
      date: todayStr,
      note:
        prefillMode === "MIN"
          ? `${targetCard.bankName} Asgari Ekstre Ödemesi (${parseSelectedPeriod(selectedMonth).label})`
          : `${targetCard.bankName} Ekstre Ödemesi (${parseSelectedPeriod(selectedMonth).label})`,
      mode: prefillMode,
    });
    setCardPayModalOpen(true);
  };

  const handleCardPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCard = cardsComputed.find((c) => c.id === cardPayForm.cardId);
    if (!targetCard) return;

    const payNum = Number(cardPayForm.amount) || 0;
    if (payNum <= 0) {
      alert("Geçerli bir ödeme tutarı girin");
      return;
    }

    const unpaidTx = (
      targetCard.monthStatementRemaining > 0 ? targetCard.monthTx : targetCard.allTx
    ).filter((tx) => tx.status !== "PAID" && tx.amountRemaining > 0);

    if (unpaidTx.length === 0) {
      alert("Bu karta ait ödenecek bekleyen harcama bulunamadı");
      return;
    }

    try {
      setCardPaySubmitting(true);
      const res = await fetch("/api/giderler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_CARD_STATEMENT",
          expenseIds: unpaidTx.map((e) => e.id),
          amount: payNum,
          date: cardPayForm.date,
          note: cardPayForm.note,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Ödeme uygulanamadı");
        return;
      }

      setCardPayModalOpen(false);
      await fetchExpenses();
    } catch {
      alert("Hata oluştu");
    } finally {
      setCardPaySubmitting(false);
    }
  };

  // Harcama Silme
  const handleDeleteExpense = async (id: string, title: string, exp?: SchoolExpense) => {
    let deleteAllSeries = false;
    if (exp?.installmentInfo) {
      const askAll = confirm(
        `"${title}" (${exp.installmentInfo}) taksitli bir harcamadır.\n\n` +
        `Bu plana ait TÜM TAKSİTLERİ topluca silmek istiyor musunuz?\n\n` +
        `• [Tamam] = Tüm taksitleri siler\n` +
        `• [İptal] = Sadece SEÇİLİ bu taksiti siler`
      );
      if (askAll) {
        if (!confirm(`DİKKAT: "${title}" başlığına ait tüm taksitler kalıcı olarak silinecek. Emin misiniz?`)) return;
        deleteAllSeries = true;
      } else {
        if (!confirm(`Sadece bu döneme ait "${title}" taksitini silmek istediğinize emin misiniz?`)) return;
      }
    } else {
      if (!confirm(`"${title}" harcama kaydını silmek istediğinize emin misiniz?`)) return;
    }

    try {
      const url = deleteAllSeries ? `/api/giderler/${id}?deleteAllSeries=true` : `/api/giderler/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        await fetchExpenses();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Silinemedi");
      }
    } catch {
      alert("Hata oluştu");
    }
  };

  // Ödeme İptal / Sıfırlama
  const handleResetPayment = async (expense: SchoolExpense) => {
    if (
      !confirm(
        `"${expense.title}" için yapılan ödemeyi iptal etmek ve kaydı "Bekliyor" durumuna geri almak istiyor musunuz?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/giderler/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_PAYMENT" }),
      });
      if (res.ok) {
        await fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "İptal edilemedi");
      }
    } catch {
      alert("Bağlantı hatası");
    }
  };

  // Tekil Ödeme Ekleme
  const openSinglePaymentModal = (expense: SchoolExpense) => {
    setActivePaymentExpense(expense);
    setPaymentAmount(String(expense.amountRemaining));
    setPaymentNote("Kredi Kartı Ödemesi");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentModalOpen(true);
  };

  const handleAddSinglePayment = async (e: React.FormEvent) => {
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
          date: paymentDate,
          note: paymentNote,
        }),
      });
      if (res.ok) {
        setPaymentModalOpen(false);
        await fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme eklenemedi");
      }
    } catch {
      alert("Hata oluştu");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Seçili kart listesi ve kart sahibi filtreleri
  const uniqueHolders = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.holder || "Diğer")));
  }, [cards]);

  const activeCardComputed = useMemo(() => {
    return cardsComputed.find((c) => c.id === selectedVisualCardId);
  }, [cardsComputed, selectedVisualCardId]);

  const isAllCardsActive = selectedVisualCardId === "ALL_5" || !activeCardComputed;

  const filteredCardsForStatement = useMemo(() => {
    return cardOwnerFilter === "ALL"
      ? cardsComputed
      : cardsComputed.filter((c) => (c.holder || "Diğer") === cardOwnerFilter);
  }, [cardsComputed, cardOwnerFilter]);

  // Tablo harcamaları
  const currentStatementTxList = useMemo(() => {
    const listRaw = isAllCardsActive
      ? filteredCardsForStatement.flatMap((c) =>
          c.monthTx.map((tx) => ({ ...tx, _cardBank: c.bankName, _cardHolder: c.holder, _cardId: c.id }))
        )
      : activeCardComputed?.monthTx.map((tx) => ({
          ...tx,
          _cardBank: activeCardComputed.bankName,
          _cardHolder: activeCardComputed.holder,
          _cardId: activeCardComputed.id,
        })) || [];

    let filtered = listRaw;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          (tx.title || "").toLowerCase().includes(q) ||
          (tx.description || "").toLowerCase().includes(q) ||
          (tx._cardBank || "").toLowerCase().includes(q) ||
          (tx._cardHolder || "").toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const aDate = a.dueDate || a.dueDateStr || "";
      const bDate = b.dueDate || b.dueDateStr || "";
      return aDate.localeCompare(bDate);
    });
  }, [isAllCardsActive, filteredCardsForStatement, activeCardComputed, search]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-3 sm:p-6 space-y-5 animate-in fade-in duration-200">
      {/* 🧭 ÜST BAŞLIK VE HIZLI EYLEMLER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Kredi Kartları Takip</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
                  {cards.length} Tanımlı Kart
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tüm kredi kartlarının ekstreleri, asgari ödeme tutarları, taksitleri ve limit yönetimi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setNewCardFormOpen(!newCardFormOpen)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{newCardFormOpen ? "Formu Kapat" : "+ Yeni Kart Ekle"}</span>
          </button>

          <button
            type="button"
            onClick={() => openCardTxModal(selectedVisualCardId === "ALL_5" ? (cards[0]?.id || "card-1") : selectedVisualCardId)}
            className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Karta Harcama / Taksit Gir</span>
          </button>

          <Link
            href="/giderler"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
          >
            <Coins className="w-4 h-4 text-slate-600" />
            <span>Okul Giderlerine Git →</span>
          </Link>
        </div>
      </div>

      {/* 📅 PERİYOT / AY SEÇİCİ */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dönem:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedMonth("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
              selectedMonth === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Tüm Dönemler
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[2026, 2027].map((yr) => {
            const months = yr === 2026 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];
            return (
              <div key={yr} className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-black text-slate-500 px-1">{yr}:</span>
                {months.map((m) => {
                  const ymKey = `${yr}-${m}`;
                  const isCur = selectedMonth === ymKey;
                  return (
                    <button
                      key={ymKey}
                      type="button"
                      onClick={() => setSelectedMonth(ymKey)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${
                        isCur
                          ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {m}. Ay ({TR_MONTH_SHORT[m]})
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🛡️ FİNANSAL ÖZET: TÜM KREDİ KARTLARI EKSTRE & ASGARİ ÖDEME PLANI */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-md border border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                <span>{parseSelectedPeriod(selectedMonth).label} — Kredi Kartları Ekstre & Asgari Ödeme Durumu</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Kredi notunun olumsuz etkilenmemesi için tüm kredi kartlarının aylık ekstre, asgari ödeme ve kalan borç takibi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
              💳 {creditCardsMonthlySummary.cardsWithStatementCount} Aktif Ekstreli Kart
            </span>
            {creditCardsMonthlySummary.cardsMinPendingCount > 0 ? (
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950">
                ⚠️ {creditCardsMonthlySummary.cardsMinPendingCount} Kartın Asgarisi Bekliyor
              </span>
            ) : creditCardsMonthlySummary.cardsWithStatementCount > 0 ? (
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500 text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>✓ Tüm Kartların Asgarisi Ödendi (Kredi Notu Güvende)</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* 4 Kolonlu Finansal Karşılaştırma Tablosu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Seçili Dönem Toplam Ekstre Borcu */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 block">💳 Dönem Toplam Ekstre Borcu</span>
              <span className="text-[10px] text-indigo-200/70 font-semibold">Tüm Kartlar</span>
            </div>
            <span className="text-base font-black text-indigo-200 block">
              {formatCurrency(creditCardsMonthlySummary.totalStatementDue)}
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
              <span>Ödenen: {formatCurrency(creditCardsMonthlySummary.totalStatementPaid)}</span>
              <span className="font-bold text-rose-300">Kalan: {formatCurrency(creditCardsMonthlySummary.totalStatementRemaining)}</span>
            </div>
          </div>

          {/* 2. Kartların Toplam Asgari Tutar Hedefi */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300">⚡ Toplam Asgari Ödeme Hedefi</span>
              <span className="text-[10px] text-amber-400/80 font-bold">Min. Hedef</span>
            </div>
            <span className="text-base font-black text-amber-300 block">
              {formatCurrency(creditCardsMonthlySummary.totalMinTarget)}
            </span>
            <div className="flex items-center justify-between text-[11px] text-amber-200 pt-1 border-t border-amber-500/20">
              <span>
                Ödenen: {formatCurrency(Math.max(0, creditCardsMonthlySummary.totalMinTarget - creditCardsMonthlySummary.totalMinRemaining))}
              </span>
              <span className="font-black text-amber-400">
                Kalan Asgari: {formatCurrency(creditCardsMonthlySummary.totalMinRemaining)}
              </span>
            </div>
          </div>

          {/* 3. Dönem Kalan Ekstre Borcu & Asgari Durumu */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 block">💰 Dönem Kalan Kart Borcu</span>
              <span className="text-[10px] text-slate-400 font-semibold">Net Kalan</span>
            </div>
            <span className="text-base font-black text-amber-300 block">
              {formatCurrency(creditCardsMonthlySummary.totalStatementRemaining)}
            </span>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
              {creditCardsMonthlySummary.totalMinRemaining > 0 ? (
                <span className="text-amber-400 font-extrabold flex items-center gap-1">
                  ⚠️ Asgari Açığı: {formatCurrency(creditCardsMonthlySummary.totalMinRemaining)}
                </span>
              ) : creditCardsMonthlySummary.totalStatementDue > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Asgari Karşılandı
                </span>
              ) : (
                <span className="text-slate-400">Bu ay kart borcu yok</span>
              )}
            </div>
          </div>

          {/* 4. Kartların Toplam Kalan Borcu (Tüm Aylar & Taksitler) */}
          <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-400/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Genel Kalan Borç (Tüm Aylar)</span>
              </span>
              <span className="text-[10px] text-purple-300 font-extrabold">Tüm Taksitler</span>
            </div>
            <span className="text-base font-black text-purple-200 block">
              {formatCurrency(creditCardsOverallSummary.allTimeTotalRemaining)}
            </span>
            <div className="flex items-center justify-between text-[10px] text-purple-200/90 pt-1 border-t border-purple-500/20">
              <span>Limit: {formatCurrency(creditCardsOverallSummary.totalLimits)}</span>
              <span className="font-bold text-emerald-300">Kullanılabilir: {formatCurrency(creditCardsOverallSummary.totalAvailable)}</span>
            </div>
          </div>
        </div>

        {/* Aylara Göre Kredi Kartı Ödenecek Ekstre & Asgari Dağılımı */}
        {allCardsMonthlyDistribution.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Aylara Göre Kredi Kartı Ekstre & Asgari Ödeme Dağılımı ({allCardsMonthlyDistribution.length} Dönem):</span>
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (Döneme tıklayarak o aya ait harcama ve kartları filtreleyebilirsiniz)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {allCardsMonthlyDistribution.map((m) => {
                const isSelected =
                  selectedMonth === m.ym ||
                  (selectedMonth !== "ALL" && parseSelectedPeriod(selectedMonth).ym === m.ym);
                return (
                  <button
                    key={m.ym}
                    type="button"
                    onClick={() => setSelectedMonth(m.ym)}
                    className={`text-left p-2 rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 text-white shadow-xs ring-1 ring-amber-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[11px] font-extrabold truncate ${isSelected ? "text-amber-300" : "text-white"}`}>
                        {m.label}
                      </span>
                      {m.activeCardsCount > 0 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-bold shrink-0">
                          {m.activeCardsCount} K
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Ekstre:</span>
                        <span className="font-bold text-white">{formatCurrency(m.totalDue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-amber-300/90">
                        <span>Asgari:</span>
                        <span className="font-black">{formatCurrency(m.totalMinTarget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Ödenen:</span>
                        <span className="text-emerald-400 font-semibold">{formatCurrency(m.totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 border-t border-white/10 font-bold">
                        <span className="text-slate-400">Kalan:</span>
                        <span className={m.totalRemaining > 0 ? "text-rose-300" : "text-emerald-400"}>
                          {formatCurrency(m.totalRemaining)}
                        </span>
                      </div>
                    </div>
                    {m.pendingMinCardsCount > 0 ? (
                      <div className="mt-1 pt-1 border-t border-white/10 text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
                        <span>⚠️ {m.pendingMinCardsCount} Kart Asgari Bekliyor</span>
                      </div>
                    ) : m.totalDue > 0 ? (
                      <div className="mt-1 pt-1 border-t border-white/10 text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <span>✓ Asgari Ödendi</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 💳 KREDİ KARTLARI YÖNETİM & GÖRSEL KARTLAR ALANI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-4">
        {/* KART SAHİBİ FİLTRE SEKMELERİ */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCardOwnerFilter("ALL");
                setSelectedVisualCardId("ALL_5");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                cardOwnerFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tüm Kartlar ({cards.length})
            </button>
            {uniqueHolders.map((h) => {
              const cnt = cards.filter((c) => (c.holder || "Diğer") === h).length;
              const active = cardOwnerFilter === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setCardOwnerFilter(h);
                    setSelectedVisualCardId("ALL_5");
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    active
                      ? "bg-indigo-700 text-white border-indigo-700"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  👤 {h} ({cnt})
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-500">
            💡 Kartın <strong>Son Ödeme</strong> tarihini değiştirdiğinizde o kartla yapılan harcamaların vadeleri otomatik güncellenir.
          </span>
        </div>

        {/* + YENİ KART EKLE FORMU */}
        {newCardFormOpen && (
          <form
            onSubmit={handleAddCard}
            className="p-4 bg-emerald-50/60 rounded-2xl border-2 border-emerald-400 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-950 text-sm">
                ➕ Yeni Kredi Kartı Ekle
              </span>
              <button
                type="button"
                onClick={() => setNewCardFormOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Hazır Kişiler:</span>
              {CARD_OWNER_PRESETS.map((owner) => (
                <button
                  key={owner}
                  type="button"
                  onClick={() => setNewCardForm({ ...newCardForm, holder: owner })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    newCardForm.holder === owner
                      ? "bg-indigo-700 text-white border-indigo-700"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {owner}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Hazır Bankalar:</span>
              {BANK_PRESETS.map((bName) => (
                <button
                  key={bName}
                  type="button"
                  onClick={() => setNewCardForm({ ...newCardForm, bankName: bName })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    newCardForm.bankName === bName
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {bName}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Kart Sahibi *</label>
                <input
                  type="text"
                  required
                  value={newCardForm.holder}
                  onChange={(e) => setNewCardForm({ ...newCardForm, holder: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Banka Adı *</label>
                <input
                  type="text"
                  required
                  value={newCardForm.bankName}
                  onChange={(e) => setNewCardForm({ ...newCardForm, bankName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Kart Limiti (₺) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCardForm.cardLimit}
                  onChange={(e) => setNewCardForm({ ...newCardForm, cardLimit: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Kart Adı / Not</label>
                <input
                  type="text"
                  value={newCardForm.cardLabel}
                  onChange={(e) => setNewCardForm({ ...newCardForm, cardLabel: e.target.value })}
                  placeholder="Örn: World Business..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-700 mb-0.5">Hesap Kesim Tarihi</label>
                <input
                  type="date"
                  value={newCardForm.statementDateISO}
                  onChange={(e) => setNewCardForm({ ...newCardForm, statementDateISO: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Son Ödeme Tarihi *</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    value={newCardForm.dueDateISO}
                    onChange={(e) => setNewCardForm({ ...newCardForm, dueDateISO: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* 🛡️ TÜM KARTLARIN KREDİ NOTU KORUMA & AYLIK ASGARİ ÖDEME ÇİZELGESİ */}
        {(() => {
          const activeMonthKey =
            parseSelectedPeriod(selectedMonth).mode === "YM"
              ? parseSelectedPeriod(selectedMonth).ym
              : "DEFAULT";

          const statementCards = filteredCardsForStatement.filter(
            (c) => c.monthStatementTotal > 0 || c.monthStatementRemaining > 0 || c.allTimeTotalRemaining > 0
          );

          if (statementCards.length === 0) return null;

          return (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 via-amber-50/60 to-white border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5">
                      <span>🛡️ Kredi Notu Koruma & Aylık Asgari Ödeme Takip Çizelgesi</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-950">
                        {parseSelectedPeriod(selectedMonth).label}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ekstre geldikten sonra her kartın asgari tutarını girip <strong>[Kaydet]</strong> butonuna basın. Asgari ödendiğinde kredi notunuz korunur.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMinPaymentSummaryTable(!showMinPaymentSummaryTable)}
                    className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>{showMinPaymentSummaryTable ? "Çizelgeyi Daralt" : "Çizelgeyi Göster"}</span>
                    {showMinPaymentSummaryTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {showMinPaymentSummaryTable && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-[11px] font-extrabold text-slate-700 border-b border-slate-200 uppercase">
                        <th className="py-2.5 px-3">Banka & Kart</th>
                        <th className="py-2.5 px-3">Kart Sahibi</th>
                        <th className="py-2.5 px-3">Son Ödeme / Vade</th>
                        <th className="py-2.5 px-3 text-right">Bu Ayki Ekstre</th>
                        <th className="py-2.5 px-3 text-center">⚡ Asgari Tutar (Bu Ay)</th>
                        <th className="py-2.5 px-3 text-right">Bu Ay Ödenen</th>
                        <th className="py-2.5 px-3 text-center">Kredi Notu Durumu</th>
                        <th className="py-2.5 px-3 text-right">Hızlı Ödeme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {statementCards.map((c) => {
                        const theme = getBankTheme(c.bankName);
                        const isDraft = asgariDrafts[c.id] !== undefined;
                        const curInputVal = isDraft
                          ? asgariDrafts[c.id]
                          : c.monthlyMinPayments?.[activeMonthKey] !== undefined
                          ? String(c.monthlyMinPayments[activeMonthKey])
                          : c.minPaymentAmount
                          ? String(c.minPaymentAmount)
                          : "";

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${theme.badge}`}>
                                  {c.bankName}
                                </span>
                                <span className="font-extrabold text-slate-900">{c.cardLabel || `...${c.last4}`}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-700">{c.holder}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-slate-900">{formatSafeDate(c.dueDateISO)}</span>
                              {c.daysLeftUntilDue !== null && (
                                <span
                                  className={`ml-1 text-[10px] font-black px-1.5 py-0.2 rounded ${
                                    c.daysLeftUntilDue < 0
                                      ? "bg-rose-100 text-rose-800"
                                      : c.daysLeftUntilDue <= 3
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {c.daysLeftUntilDue < 0
                                    ? `${Math.abs(c.daysLeftUntilDue)}g geçti`
                                    : c.daysLeftUntilDue === 0
                                    ? "Bugün"
                                    : `${c.daysLeftUntilDue}g kaldı`}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-indigo-950 text-sm">
                              {formatCurrency(c.monthStatementTotal)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder={c.autoCalculatedMin > 0 ? String(c.autoCalculatedMin) : "0"}
                                  value={curInputVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAsgariDrafts((prev) => ({ ...prev, [c.id]: val }));
                                  }}
                                  className="w-24 px-2 py-1 text-center font-black text-amber-950 bg-amber-50/80 border border-amber-400 rounded-lg text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveMonthlyMinPayment(c.id)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                    asgariSavedFeedback[c.id]
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-900 hover:bg-slate-800 text-white"
                                  }`}
                                >
                                  {asgariSavedFeedback[c.id] ? "✓" : "Kaydet"}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {formatCurrency(c.monthStatementPaid)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {c.isMinPaymentMet ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[11px]">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>✓ Asgari Ödendi</span>
                                </span>
                              ) : c.remainingMinPayment > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-400 font-extrabold text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                  <span>⚠️ Asgari Açığı: {formatCurrency(c.remainingMinPayment)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Bekleyen yok</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {c.remainingMinPayment > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => openCardPayModal(c.id, "MIN")}
                                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold shadow-2xs"
                                  >
                                    ⚡ Asgariyi Öde
                                  </button>
                                )}
                                {c.monthStatementRemaining > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => openCardPayModal(c.id, "FULL")}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                                  >
                                    Ekstre Öde
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
              )}
            </div>
          );
        })()}

        {/* 💳 İNTERAKTİF GÖRSEL KARTLAR CAROUSEL / GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {filteredCardsForStatement.map((card) => {
            const theme = getBankTheme(card.bankName);
            const isSelected = selectedVisualCardId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedVisualCardId(isSelected ? "ALL_5" : card.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2 shadow-xs ${
                  isSelected ? `${theme.selectedBg} ring-2` : `${theme.cardBg}`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${theme.badge}`}>
                      {card.bankName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCardModal(card);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-white/80"
                      title="Kartı Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-black text-slate-900 text-xs truncate">
                    {card.cardLabel || card.bankName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-semibold">{card.holder}</p>
                </div>

                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Kart Limiti:</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(card.cardLimit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Bu Ay Ekstre:</span>
                    <span className="font-extrabold text-indigo-900">{formatCurrency(card.monthStatementTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Kalan Borç:</span>
                    <span className="font-black text-rose-600">{formatCurrency(card.monthStatementRemaining)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Kullanılabilir:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(card.availableLimit)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-500">Son Ödeme:</span>
                    <span className="font-black text-slate-900">{formatSafeDate(card.dueDateISO)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCardTxModal(card.id);
                    }}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-300"
                  >
                    + Harcama
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCardPayModal(card.id, "FULL");
                    }}
                    className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs"
                  >
                    Ekstre Öde
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 📄 SEÇİLİ KARTIN (VEYA TÜMÜNÜN) AY BAZLI EKSTRE HARCAMALARI TABLOSU */}
        <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-slate-900">
                📄{" "}
                {isAllCardsActive
                  ? cardOwnerFilter === "ALL"
                    ? "Tüm Kartlar Ortak Ekstresi"
                    : `${cardOwnerFilter} Kartları Ekstresi`
                  : `${activeCardComputed?.holder} — ${activeCardComputed?.bankName} Ekstresi`}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({currentStatementTxList.length} Kalem Harcama)
              </span>
              {!isAllCardsActive && (
                <button
                  type="button"
                  onClick={() => setSelectedVisualCardId("ALL_5")}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                >
                  Tüm Kartları Göster
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Harcama ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {currentStatementTxList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-semibold bg-white rounded-xl border border-dashed border-slate-300">
              Bu dönem ve seçilen karta ait harcama kaydı bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-[11px] font-extrabold text-slate-700 border-b border-slate-200 uppercase">
                    <th className="py-2.5 px-3">Harcama Başlığı / Açıklama</th>
                    <th className="py-2.5 px-3">Banka & Kart Sahibi</th>
                    <th className="py-2.5 px-3">Taksit</th>
                    <th className="py-2.5 px-3">Son Ödeme</th>
                    <th className="py-2.5 px-3 text-right">Bu Ay Tutar</th>
                    <th className="py-2.5 px-3 text-right">Kalan Borç</th>
                    <th className="py-2.5 px-3 text-center">Durum</th>
                    <th className="py-2.5 px-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentStatementTxList.map((tx) => {
                    const bTheme = getBankTheme(tx._cardBank || tx.cardBank);
                    const isPaid = tx.status === "PAID" || tx.amountRemaining <= 0.05;

                    return (
                      <tr key={`${tx.id}-${tx._cardId}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-extrabold text-slate-900">{tx.title}</p>
                          {tx.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {tx.description.replace(/\[card-[^\]]+\]/g, "").trim()}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bTheme.badge}`}>
                            {tx._cardBank || tx.cardBank}
                          </span>
                          <span className="text-[10px] text-slate-600 block mt-0.5">
                            {tx._cardHolder || tx.cardHolder}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {tx.installmentInfo ? (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                              {tx.installmentInfo}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold">Tek Çekim</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-800">
                          {formatSafeDate(tx.dueDate || tx.dueDateStr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {formatCurrency(tx.amountDue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-600">
                          {formatCurrency(tx.amountRemaining)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              ✓ Ödendi
                            </span>
                          ) : tx.amountPaid > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                              Kısmi Ödendi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                              Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => openSinglePaymentModal(tx)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs"
                              >
                                Öde
                              </button>
                            )}
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => handleResetPayment(tx)}
                                className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold"
                                title="Ödemeyi Sıfırla"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(tx.id, tx.title, tx)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold"
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
      </div>

      {/* ============================================================== */}
      {/* MODAL: KARTA HARCAMA / TAKSİT GİR                              */}
      {/* ============================================================== */}
      {cardTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-700" />
                <span>Kredi Kartına Harcama / Taksit Ekle</span>
              </h3>
              <button
                type="button"
                onClick={() => setCardTxModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCardTxSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kullanılan Kart *</label>
                <select
                  value={cardTxForm.cardId}
                  onChange={(e) => setCardTxForm({ ...cardTxForm, cardId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} — {c.cardLabel || `...${c.last4}`} ({c.holder})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Harcama Başlığı / Açıklama *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kırtasiye Alışverişi, Dizüstü Bilgisayar..."
                  value={cardTxForm.title}
                  onChange={(e) => setCardTxForm({ ...cardTxForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={cardTxForm.amount}
                    onChange={(e) => setCardTxForm({ ...cardTxForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Taksit Sayısı</label>
                  <select
                    value={cardTxForm.installmentCount}
                    onChange={(e) =>
                      setCardTxForm({ ...cardTxForm, installmentCount: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value={1}>Tek Çekim (Taksitsiz)</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n} Taksit
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {cardTxForm.installmentCount > 1 && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1 text-purple-950">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1 font-bold">
                      <input
                        type="radio"
                        checked={cardTxForm.amountMode === "TOTAL"}
                        onChange={() => setCardTxForm({ ...cardTxForm, amountMode: "TOTAL" })}
                      />
                      <span>Toplam Tutar (Taksitlere Bölünsün)</span>
                    </label>
                    <label className="inline-flex items-center gap-1 font-bold">
                      <input
                        type="radio"
                        checked={cardTxForm.amountMode === "MONTHLY"}
                        onChange={() => setCardTxForm({ ...cardTxForm, amountMode: "MONTHLY" })}
                      />
                      <span>Aylık Taksit Tutarı</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">İlk Ekstre / Son Ödeme Tarihi *</label>
                <input
                  type="date"
                  required
                  value={cardTxForm.dueDate}
                  onChange={(e) => setCardTxForm({ ...cardTxForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCardTxModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={cardTxSubmitting}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-xs"
                >
                  {cardTxSubmitting ? "Kaydediliyor..." : "Harcamayı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KART EKSTRE / BORÇ / ASGARİ ÖDE                         */}
      {/* ============================================================== */}
      {cardPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Kredi Kartı Borcu / Ekstre Ödemesi</span>
              </h3>
              <button
                type="button"
                onClick={() => setCardPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCardPaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ödenecek Kart</label>
                <select
                  value={cardPayForm.cardId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = cardsComputed.find((x) => x.id === cId);
                    setCardPayForm({
                      ...cardPayForm,
                      cardId: cId,
                      amount: c ? String(c.monthStatementRemaining || c.allTimeTotalRemaining) : "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {cardsComputed.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} — {c.cardLabel || `...${c.last4}`} (Kalan: {formatCurrency(c.monthStatementRemaining)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ödeme Tutarı (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cardPayForm.amount}
                  onChange={(e) => setCardPayForm({ ...cardPayForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ödeme Tarihi *</label>
                <input
                  type="date"
                  required
                  value={cardPayForm.date}
                  onChange={(e) => setCardPayForm({ ...cardPayForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Açıklama / Not</label>
                <input
                  type="text"
                  value={cardPayForm.note}
                  onChange={(e) => setCardPayForm({ ...cardPayForm, note: e.target.value })}
                  placeholder="Örn: Vakıfbank Asgari Ödeme..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCardPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={cardPaySubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {cardPaySubmitting ? "Ödeniyor..." : "Ödemeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KART BİLGİLERİNİ DÜZENLE                                */}
      {/* ============================================================== */}
      {editCardModalOpen && editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-700" />
                <span>Kart Bilgilerini Düzenle ({editingCard.bankName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCardSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kart Sahibi *</label>
                  <input
                    type="text"
                    required
                    value={editCardForm.holder}
                    onChange={(e) => setEditCardForm({ ...editCardForm, holder: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Banka Adı *</label>
                  <input
                    type="text"
                    required
                    value={editCardForm.bankName}
                    onChange={(e) => setEditCardForm({ ...editCardForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kart Limiti (₺) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editCardForm.cardLimit}
                    onChange={(e) => setEditCardForm({ ...editCardForm, cardLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kart Etiketi / Not</label>
                  <input
                    type="text"
                    value={editCardForm.cardLabel}
                    onChange={(e) => setEditCardForm({ ...editCardForm, cardLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-700 mb-1">Hesap Kesim Tarihi</label>
                  <input
                    type="date"
                    value={editCardForm.statementDateISO}
                    onChange={(e) => setEditCardForm({ ...editCardForm, statementDateISO: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Son Ödeme Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={editCardForm.dueDateISO}
                    onChange={(e) => setEditCardForm({ ...editCardForm, dueDateISO: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteCard(editingCard.id);
                    setEditCardModalOpen(false);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs"
                >
                  Kartı Sil
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCardModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TEKİL HARCAMA ÖDEMESİ                                   */}
      {/* ============================================================== */}
      {paymentModalOpen && activePaymentExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">Ödeme Yap</h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSinglePayment} className="space-y-3 text-xs">
              <p className="font-bold text-slate-800">{activePaymentExpense.title}</p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ödeme Tutarı (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ödeme Tarihi *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Not</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
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

function KrediKartlariFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Kredi Kartları Takip Ekranı Yükleniyor...</span>
      </div>
    </div>
  );
}

export default function KrediKartlariPage() {
  return (
    <Suspense fallback={<KrediKartlariFallback />}>
      <KrediKartlariPageContent />
    </Suspense>
  );
}

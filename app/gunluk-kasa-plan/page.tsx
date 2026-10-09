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
  ShoppingBag,
  Filter,
  ArrowUpRight,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_DEFINED_CARDS,
  DefinedCreditCard,
  getClientLoadedCreditCards,
  calculateCardStatementAndDueDate,
} from "@/lib/defined-credit-cards";

interface PaymentHistoryItem {
  date: string;
  amount: number;
  note?: string;
  paymentMethod?: string;
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
  isCommitment?: boolean;
  description?: string | null;
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

const EXPENSE_CATEGORY_OPTIONS = [
  { value: "Gıda & Mutfak", label: "🥗 Gıda & Mutfak / Yemek", mainCategory: "OTHER" },
  { value: "Kırtasiye & Kitap", label: "📚 Kırtasiye, Kitap & Materyal", mainCategory: "OTHER" },
  { value: "Fatura & Kurumsal", label: "⚡ Fatura (Elektrik, Su, Doğalgaz, Net)", mainCategory: "INVOICE" },
  { value: "Temizlik & Hijyen", label: "🧼 Temizlik & Hijyen Malzemeleri", mainCategory: "OTHER" },
  { value: "Akaryakıt & Servis", label: "🚌 Akaryakıt, Ulaşım & Servis", mainCategory: "OTHER" },
  { value: "Tamirat & Teknik", label: "🔧 Tamirat, Tadilat & Teknik Bakım", mainCategory: "OTHER" },
  { value: "Personel Avans / Maaş", label: "👥 Personel Avans / Maaş / Harcırah", mainCategory: "SALARY" },
  { value: "Kira & Aidat", label: "🏢 Bina Kirası & Site Aidatı", mainCategory: "RENT" },
  { value: "Diğer Okul Gideri", label: "✨ Diğer Genel Okul Gideri", mainCategory: "OTHER" },
];

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
}

function parseDateSafely(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "number") {
    const ts = val < 10000000000 ? val * 1000 : val;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const num = Number(s);
      const ts = num < 10000000000 ? num * 1000 : num;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseExpenseDate(exp: SchoolExpense): {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  dateObj: Date | null;
} {
  const d = parseDateSafely(exp.dueDate);
  if (d) {
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

// Harcamanın yapıldığı / çekildiği fiili işlem tarihini bulma
function getExpenseTransactionDate(exp: SchoolExpense): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
} {
  const createdDate = parseDateSafely(exp.createdAt);
  let timeStr = "Günün İşlemi";
  if (createdDate) {
    const trD = new Date(createdDate.getTime() + 3 * 3600 * 1000);
    const hour = String(trD.getUTCHours()).padStart(2, "0");
    const min = String(trD.getUTCMinutes()).padStart(2, "0");
    timeStr = `${hour}:${min}`;
  }

  // 1. Açıklamada açıkça tanımlanmış [txDate:YYYY-MM-DD] varsa öncelikli al
  const txMatch = (exp.description || "").match(/\[txDate:(\d{4}-\d{2}-\d{2})\]/);
  if (txMatch) {
    return {
      dateStr: txMatch[1],
      timeStr,
    };
  }

  // 2. Sisteme kaydedildiği gün (createdAt - Türkiye saati UTC+3)
  if (createdDate) {
    const trD = new Date(createdDate.getTime() + 3 * 3600 * 1000);
    const y = trD.getUTCFullYear();
    const m = String(trD.getUTCMonth() + 1).padStart(2, "0");
    const day = String(trD.getUTCDate()).padStart(2, "0");
    return {
      dateStr: `${y}-${m}-${day}`,
      timeStr,
    };
  }

  // 3. Vade tarihi üzerinden geri dönüş
  const { dateKey } = parseExpenseDate(exp);
  return {
    dateStr: dateKey,
    timeStr: "Vade Tarihi",
  };
}

// Kredi kartı detayını (Sahip • Banka) tespit eden yardımcı fonksiyon
function resolveCardInfo(
  exp: SchoolExpense,
  phNote?: string,
  availableCards: DefinedCreditCard[] = DEFAULT_DEFINED_CARDS
): string {
  const combined = `${phNote || ""} ${exp.description || ""} ${exp.title || ""}`;
  const cardTagMatch = combined.match(/\[(card-[^\]]+)\]/i);
  if (cardTagMatch) {
    const cardId = cardTagMatch[1].toLowerCase();
    const found = availableCards.find((c) => c.id.toLowerCase() === cardId);
    if (found) {
      return `${found.holder} • ${found.bankName}${found.cardLabel ? ` (${found.cardLabel})` : ""}`;
    }
  }

  if (exp.cardHolder || exp.cardBank) {
    const holder = exp.cardHolder || "Kredi Kartı";
    const bank = exp.cardBank ? ` • ${exp.cardBank}` : "";
    return `${holder}${bank}`;
  }

  const cLow = combined.toLowerCase();
  for (const c of availableCards) {
    if (cLow.includes(c.holder.toLowerCase()) && cLow.includes(c.bankName.toLowerCase())) {
      return `${c.holder} • ${c.bankName}`;
    }
  }

  return "Kredi Kartı";
}

// Harcama kanalını sınıflandırma (Nakit, Kredi Kartı, Menkul Kıymet, Banka/Çek)
function classifyChannel(exp: SchoolExpense): "CASH" | "CREDIT_CARD" | "GOLD_ASSET" | "BANK" {
  const t = (exp.title || "").toLowerCase();
  const cat = (exp.category || "").toUpperCase();
  const pm = (exp.paymentMethod || "").toUpperCase();
  const desc = (exp.description || "").toLowerCase();
  const sub = (exp.subCategory || "").toLowerCase();

  // 1. ÖNCELİKLİ: Kredi Kartı
  // Açıkça kredi kartı ile yapılmış veya kart bilgisi içeren harcamalar ASLA altın/menkul kıymet olamaz
  if (
    cat === "CREDIT_CARD" ||
    pm === "CREDIT_CARD" ||
    Boolean(exp.cardHolder) ||
    Boolean(exp.cardBank) ||
    desc.includes("[card-") ||
    desc.includes("card_slip") ||
    desc.includes("kredi kart") ||
    sub.includes("kredi kart") ||
    t.includes("kredi kartı") ||
    t.includes("bonus") ||
    t.includes("paraf") ||
    t.includes("axess") ||
    t.includes("maximum") ||
    t.includes(" kk /") ||
    t.includes(" kk ")
  ) {
    return "CREDIT_CARD";
  }

  // 2. Çek / Banka
  if (
    cat === "CHEQUE" ||
    pm === "CHEQUE" ||
    pm === "BANK_TRANSFER" ||
    pm === "BANK" ||
    t.includes("havale") ||
    t.includes("eft") ||
    (t.includes("çek") && !t.includes("çekilen") && !t.includes("çekti"))
  ) {
    return "BANK";
  }

  // 3. Menkul Kıymet / Altın Günü / Kıymetli Varlık
  // NOT: "Altın Dede Pide Fırını" gibi tedarikçi adları menkul kıymet DEĞİLDİR!
  // Sadece kategori GOLD_DAY ise veya altın yatırımına/gününe özel tam ifadeler varsa altın sayılır.
  if (
    cat === "GOLD_DAY" ||
    sub.includes("altın günü") ||
    sub.includes("menkul kıymet") ||
    t.includes("altın günü") ||
    t.includes("altın alımı") ||
    t.includes("çeyrek altın") ||
    t.includes("gram altın") ||
    t.includes("cumhuriyet altını") ||
    t.includes("ajda bilezik") ||
    t.includes("altın bilezik") ||
    t.includes("menkul kıymet") ||
    t.includes("yatırım fonu") ||
    t.includes("döviz alımı")
  ) {
    return "GOLD_ASSET";
  }

  // Varsayılan: Nakit / Kasa
  return "CASH";
}

// Kredi taksitlerini (Banka Kredileri) Günlük Kasa & Gider Raporundan tamamen ayıklamak için kontrol
function isLoanExpense(exp: any): boolean {
  if (!exp) return false;
  if (exp.category === "LOAN") return true;
  const sub = (exp.subCategory || "").toLowerCase();
  if (sub.includes("kredi") && !sub.includes("kredi kart") && !sub.includes("kart harcama")) return true;
  const desc = (exp.description || "").toLowerCase();
  if (desc.includes("[loan_id:")) return true;
  return false;
}

function GunlukKasaPlanContent() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [allExpenses, setAllExpenses] = useState<SchoolExpense[]>([]);
  const [rolloverExpenses, setRolloverExpenses] = useState<SchoolExpense[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);

  // Ana Görünüm Sekmesi: "daily" (Günlük Hareketler & Kasa Raporu) veya "weekly" (Aylık/Haftalık Projeksiyon)
  const [activeMainTab, setActiveMainTab] = useState<"daily" | "weekly">("daily");

  // Günlük Rapor Kanal Filtresi (Tümü, Yalnızca Kasa Nakit, Yalnızca Kart, Yalnızca Banka)
  const [dailyChannelFilter, setDailyChannelFilter] = useState<"ALL" | "CASH" | "CREDIT_CARD" | "BANK">("ALL");
  const [dailySearchQuery, setDailySearchQuery] = useState<string>("");

  // Seçili Ay (Haftalık plan için, varsayılan: içinde bulunulan ay)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const y = m >= 7 ? 2026 : 2027;
    return `${y}-${m}`;
  });

  // Seçili Gün (Gün Sonu Raporu için, varsayılan: Bugün Türkiye Saati)
  const [selectedReportDate, setSelectedReportDate] = useState<string>(() => {
    const today = new Date();
    const trD = new Date(today.getTime() + 3 * 3600 * 1000);
    return trD.toISOString().split("T")[0];
  });

  // Seçili Hafta Filtresi (Haftalık görünümde tümü veya belirli hafta)
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | "ALL">("ALL");

  // Tanımlı Kart Listesi
  const [availableCards, setAvailableCards] = useState<DefinedCreditCard[]>(DEFAULT_DEFINED_CARDS);

  useEffect(() => {
    setAvailableCards(getClientLoadedCreditCards());
  }, []);

  // Günlük Hızlı Harcama / Kasa & Kart Çıkışı Modalı
  const [quickExpenseModal, setQuickExpenseModal] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickForm, setQuickForm] = useState({
    paymentChannel: "CASH" as "CASH" | "CREDIT_CARD" | "BANK",
    selectedCardId: "card-dk-1",
    title: "", // Kime / Nereye Ödendi
    categoryText: "Gıda & Mutfak",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const openQuickExpenseModal = () => {
    setQuickForm({
      paymentChannel: "CASH",
      selectedCardId: availableCards[0]?.id || "card-simcu-3",
      title: "",
      categoryText: "Gıda & Mutfak",
      amount: "",
      date: selectedReportDate,
      description: "",
    });
    setQuickExpenseModal(true);
  };

  // Günlük İşlem Düzenleme Modalı
  const [editDailyItem, setEditDailyItem] = useState<any | null>(null);
  const [editDailySubmitting, setEditDailySubmitting] = useState(false);
  const [editDailyForm, setEditDailyForm] = useState({
    title: "",
    amount: "",
    date: "",
    paymentChannel: "CASH" as "CASH" | "CREDIT_CARD" | "BANK",
    selectedCardId: "card-dk-1",
    categoryText: "Gıda & Mutfak",
    description: "",
  });

  // WhatsApp Kopyalama Geri Bildirimi
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // Veri Çekme
  const fetchData = async () => {
    try {
      setLoading(true);
      const cacheBust = `_t=${Date.now()}`;
      const res = await fetch(`/api/giderler?month=${selectedMonth}&excludeLoans=true&${cacheBust}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses.filter((e: SchoolExpense) => !isLoanExpense(e)));
      }
      if (data.rolloverExpenses && Array.isArray(data.rolloverExpenses)) {
        setRolloverExpenses(data.rolloverExpenses.filter((e: SchoolExpense) => !isLoanExpense(e)));
      }
      if (data.availablePeriods && Array.isArray(data.availablePeriods)) {
        setAvailablePeriods(data.availablePeriods);
      }

      // Tüm kayıtları da gün sonu hesaplamaları için çekelim (filtresiz, krediler hariç)
      const allRes = await fetch(`/api/giderler?excludeLoans=true&${cacheBust}`, {
        cache: "no-store",
      });
      const allData = await allRes.json();
      if (allData.expenses && Array.isArray(allData.expenses)) {
        setAllExpenses(allData.expenses.filter((e: SchoolExpense) => !isLoanExpense(e)));
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

  // Hızlı Tarih Butonları
  const setDateToToday = () => {
    const today = new Date();
    const trD = new Date(today.getTime() + 3 * 3600 * 1000);
    setSelectedReportDate(trD.toISOString().split("T")[0]);
  };

  const setDateToYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 3600 * 1000 + 3 * 3600 * 1000);
    setSelectedReportDate(yesterday.toISOString().split("T")[0]);
  };

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

  // ==============================================================
  // GÜN SONU KASA, KART VE BANKA RAPORU (UÇTAN UCA HAREKET MOTORU)
  // ==============================================================
  const dailyReport = useMemo(() => {
    const targetDateStr = selectedReportDate; // e.g. "2026-10-08"
    const paymentsFound: {
      id: string;
      title: string; // Kime / Nereye Ödendi
      amount: number;
      channel: "CASH" | "CREDIT_CARD" | "GOLD_ASSET" | "BANK";
      category: string;
      subCategory?: string;
      cardInfo: string; // Hangi Kart veya Kasa
      note: string;
      time: string;
      status: "PAID" | "CHARGED" | "PENDING";
      rawExpenseId: string;
      rawExpense: SchoolExpense;
      isPaymentHistory: boolean;
      phIndex?: number;
      dateStr: string;
    }[] = [];

    allExpenses.forEach((exp) => {
      if (isLoanExpense(exp)) return;
      const ch = classifyChannel(exp);
      const { dateStr: txDateStr, timeStr } = getExpenseTransactionDate(exp);

      // 1. paymentHistory kayıtlarında bu tarih var mı? (Fiili nakit veya banka veya kart ödemeleri)
      if (exp.paymentHistory) {
        try {
          const phList: PaymentHistoryItem[] = JSON.parse(exp.paymentHistory);
          if (Array.isArray(phList)) {
            phList.forEach((ph: any, idx) => {
              const phDate = (ph.date || "").split("T")[0];
              if (phDate === targetDateStr) {
                let actualChannel = ch;
                const phMethod = (ph.paymentMethod || "").toUpperCase();
                const phNote = (ph.note || "").toLowerCase();
                const phCombined = `${ph.note || ""} ${exp.description || ""} ${exp.title || ""}`.toLowerCase();

                const isCardPay =
                  phMethod === "CREDIT_CARD" ||
                  exp.paymentMethod === "CREDIT_CARD" ||
                  exp.category === "CREDIT_CARD" ||
                  Boolean(exp.cardHolder) ||
                  Boolean(exp.cardBank) ||
                  phCombined.includes("[card-") ||
                  phNote.includes("kredi kart") ||
                  phNote.includes(" kk");

                const isBankPay =
                  !isCardPay &&
                  (phMethod === "BANK_TRANSFER" ||
                    phMethod === "BANK" ||
                    exp.paymentMethod === "BANK_TRANSFER" ||
                    exp.paymentMethod === "BANK" ||
                    phNote.includes("banka") ||
                    phNote.includes("havale") ||
                    phNote.includes("eft"));

                if (isCardPay) {
                  actualChannel = "CREDIT_CARD";
                } else if (isBankPay) {
                  actualChannel = "BANK";
                } else if (phMethod === "CASH" || exp.paymentMethod === "CASH") {
                  actualChannel = "CASH";
                }

                const resolvedCard = isCardPay
                  ? resolveCardInfo(exp, ph.note, availableCards)
                  : actualChannel === "BANK"
                  ? "Banka Hesabı (Havale / EFT)"
                  : actualChannel === "GOLD_ASSET"
                  ? "Menkul Kıymet / Altın Kasası"
                  : "Okul Kasası (Nakit)";

                const cleanNote = (ph.note || (actualChannel === "CREDIT_CARD" ? "Kredi Kartı ile Ödeme" : "Fiili Kasa Çıkışı"))
                  .replace(/\[card-[^\]]+\]/g, "")
                  .replace(/\s+/g, " ")
                  .trim();

                paymentsFound.push({
                  id: `${exp.id}-ph-${idx}`,
                  title: exp.title,
                  amount: Number(ph.amount) || 0,
                  channel: actualChannel,
                  category: exp.category || "Gider",
                  subCategory: exp.subCategory || undefined,
                  cardInfo: resolvedCard,
                  note: cleanNote,
                  time: "Fiili Ödeme",
                  status: "PAID",
                  rawExpenseId: exp.id,
                  rawExpense: exp,
                  isPaymentHistory: true,
                  phIndex: idx,
                  dateStr: phDate,
                });
              }
            });
          }
        } catch {}
      }

      // 2. KREDİ KARTI HARCAMALARI (O gün çekilen / okul adına yapılan kart harcamaları)
      if (ch === "CREDIT_CARD" && txDateStr === targetDateStr) {
        // Taahhütlü gelecekteki 12 aylık abonelik taksitleri hariç
        if (exp.isCommitment && exp.category === "INVOICE") {
          return;
        }

        // Cari kart ödemesi için oluşturulmuş gölge kayıt varsa ve paymentHistory üzerinden zaten eklendiyse mükerrer yapma
        if (exp.description?.includes("[SUPPLIER_PAY_CC:") || exp.description?.includes("[THIRD_PARTY_PAY_CC:")) {
          return;
        }

        // Eğer henüz eklenmediyse listeye ekle
        if (!paymentsFound.some((p) => p.id.startsWith(exp.id))) {
          const cleanNote = (exp.description || "")
            .replace(/\[txDate:[^\]]+\]/g, "")
            .replace(/\[CARD_SLIP:[^\]]+\]/g, "")
            .replace(/\[card-[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim() || "Kredi Kartı ile Okul Harcaması";

          paymentsFound.push({
            id: `${exp.id}-card-tx`,
            title: exp.title,
            amount: Number(exp.amountDue) || 0,
            channel: "CREDIT_CARD",
            category: exp.subCategory || exp.category || "Kredi Kartı Harcaması",
            subCategory: exp.subCategory || undefined,
            cardInfo: resolveCardInfo(exp, undefined, availableCards),
            note: cleanNote,
            time: timeStr || "İşlem",
            status: "CHARGED",
            rawExpenseId: exp.id,
            rawExpense: exp,
            isPaymentHistory: false,
            dateStr: txDateStr,
          });
        }
      }

      // 3. NAKİT VEYA BANKA ÇIKIŞI OLARAK KAYDEDİLENLER (O gün yapılmış ve ödenmiş olanlar)
      if (
        ch !== "CREDIT_CARD" &&
        (txDateStr === targetDateStr || parseExpenseDate(exp).dateKey === targetDateStr) &&
        exp.status === "PAID"
      ) {
        if (!paymentsFound.some((p) => p.id.startsWith(exp.id))) {
          paymentsFound.push({
            id: `${exp.id}-paid-today`,
            title: exp.title,
            amount: Number(exp.amountPaid || exp.amountDue) || 0,
            channel: ch,
            category: exp.subCategory || exp.category || "Gider",
            subCategory: exp.subCategory || undefined,
            cardInfo:
              ch === "CASH"
                ? "Okul Kasası (Nakit)"
                : ch === "BANK"
                ? "Banka Hesabı"
                : "Menkul Kıymet / Altın Kasası",
            note: exp.description || "Günün Ödenen Gideri",
            time: timeStr || "İşlem",
            status: "PAID",
            rawExpenseId: exp.id,
            rawExpense: exp,
            isPaymentHistory: false,
            dateStr: txDateStr,
          });
        }
      }
    });

    const cashOut = paymentsFound.filter((p) => p.channel === "CASH").reduce((s, p) => s + p.amount, 0);
    const cardOut = paymentsFound.filter((p) => p.channel === "CREDIT_CARD").reduce((s, p) => s + p.amount, 0);
    const bankOut = paymentsFound.filter((p) => p.channel === "BANK").reduce((s, p) => s + p.amount, 0);
    const goldOut = paymentsFound.filter((p) => p.channel === "GOLD_ASSET").reduce((s, p) => s + p.amount, 0);
    const totalOut = paymentsFound.reduce((s, p) => s + p.amount, 0);

    // Kart bazında detaylı harcama dağılımı
    const cardBreakdown: Record<string, { total: number; count: number; items: typeof paymentsFound }> = {};
    paymentsFound
      .filter((p) => p.channel === "CREDIT_CARD")
      .forEach((p) => {
        const cKey = p.cardInfo || "Diğer Kredi Kartları";
        if (!cardBreakdown[cKey]) {
          cardBreakdown[cKey] = { total: 0, count: 0, items: [] };
        }
        cardBreakdown[cKey].total += p.amount;
        cardBreakdown[cKey].count += 1;
        cardBreakdown[cKey].items.push(p);
      });

    return {
      dateStr: targetDateStr,
      items: paymentsFound,
      cashOut,
      cardOut,
      bankOut,
      goldOut,
      totalOut,
      cardBreakdown,
    };
  }, [allExpenses, selectedReportDate]);

  // Filtrelenmiş Günlük Hareketler
  const filteredDailyItems = useMemo(() => {
    return dailyReport.items.filter((item) => {
      // Kanal Filtresi
      if (dailyChannelFilter !== "ALL" && item.channel !== dailyChannelFilter) {
        return false;
      }
      // Arama Metni
      if (dailySearchQuery.trim() !== "") {
        const q = dailySearchQuery.toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchCat = (item.category || "").toLowerCase().includes(q);
        const matchCard = (item.cardInfo || "").toLowerCase().includes(q);
        const matchNote = (item.note || "").toLowerCase().includes(q);
        return matchTitle || matchCat || matchCard || matchNote;
      }
      return true;
    });
  }, [dailyReport.items, dailyChannelFilter, dailySearchQuery]);

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
      if (isLoanExpense(exp)) return;
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

  // Hızlı Günlük Harcama / Kasa & Kart Çıkışı Kaydet
  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.title || !quickForm.amount) return;

    try {
      setQuickSubmitting(true);
      const numAmount = parseFloat(String(quickForm.amount).replace(",", "."));
      if (isNaN(numAmount) || numAmount < 0) {
        alert("Lütfen geçerli bir tutar girin.");
        setQuickSubmitting(false);
        return;
      }
      const isCard = quickForm.paymentChannel === "CREDIT_CARD";
      const isBank = quickForm.paymentChannel === "BANK";

      const matchedCard = isCard
        ? availableCards.find((c) => c.id === quickForm.selectedCardId) || availableCards[0]
        : null;

      const payload: any = {
        title: quickForm.title.trim(),
        amountDue: numAmount,
        dueDateStr: quickForm.date,
        dueDate: new Date(`${quickForm.date}T12:00:00.000Z`).toISOString(),
      };

      if (isCard && matchedCard) {
        const stmtCalc = calculateCardStatementAndDueDate(matchedCard, quickForm.date);
        payload.category = "CREDIT_CARD";
        payload.subCategory = quickForm.categoryText || "Kart Fişi";
        payload.paymentMethod = "CREDIT_CARD";
        payload.cardHolder = matchedCard.holder;
        payload.cardBank = matchedCard.bankName;
        payload.amountPaid = 0;
        payload.amountRemaining = numAmount;
        payload.status = "PENDING";
        payload.dueDate = new Date(`${stmtCalc.dueDateISO}T12:00:00.000Z`).toISOString();
        payload.dueDateStr = stmtCalc.dueDateStr;
        payload.monthIndex = stmtCalc.periodMonth;
        payload.installmentInfo = "1t/1t";
        payload.description = `[txDate:${quickForm.date}] [${matchedCard.id}] [CARD_SLIP:${stmtCalc.statementPeriodKey}] ${quickForm.description.trim() || "Kredi Kartı ile Okul Harcaması"}`.trim();
      } else if (isBank) {
        payload.category = "OTHER";
        payload.subCategory = quickForm.categoryText;
        payload.paymentMethod = "BANK_TRANSFER";
        payload.amountPaid = numAmount;
        payload.amountRemaining = 0;
        payload.status = "PAID";
        payload.description = `[txDate:${quickForm.date}] ${quickForm.description.trim() || "Banka / Havale Çıkışı"}`.trim();
        payload.paymentHistory = JSON.stringify([
          {
            date: quickForm.date,
            amount: numAmount,
            note: "Günlük Banka / Havale Çıkışı",
            paymentMethod: "BANK_TRANSFER",
          },
        ]);
      } else {
        // NAKİT KASA
        payload.category = "OTHER";
        payload.subCategory = quickForm.categoryText;
        payload.paymentMethod = "CASH";
        payload.amountPaid = numAmount;
        payload.amountRemaining = 0;
        payload.status = "PAID";
        payload.description = `[txDate:${quickForm.date}] ${quickForm.description.trim() || "Günlük Nakit Kasa Çıkışı"}`.trim();
        payload.paymentHistory = JSON.stringify([
          {
            date: quickForm.date,
            amount: numAmount,
            note: "Günlük Nakit Kasa Çıkışı",
            paymentMethod: "CASH",
          },
        ]);
      }

      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Kayıt oluşturulamadı.");
        return;
      }

      const createdItem = await res.json().catch(() => null);
      if (createdItem && createdItem.id) {
        setAllExpenses((prev) => [createdItem, ...prev.filter((x) => x.id !== createdItem.id)]);
      }

      setQuickExpenseModal(false);
      setQuickForm({
        paymentChannel: "CASH",
        selectedCardId: availableCards[0]?.id || "card-simcu-3",
        title: "",
        categoryText: "Gıda & Mutfak",
        amount: "",
        date: selectedReportDate,
        description: "",
      });
      await fetchData();
    } catch {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Günlük İşlem Düzenleme Penceresini Aç
  const handleOpenEditModal = (item: any) => {
    let cardId = availableCards[0]?.id || "card-dk-1";
    if (item.rawExpense?.description) {
      const cMatch = item.rawExpense.description.match(/\[(card-[^\]]+)\]/);
      if (cMatch) {
        cardId = cMatch[1];
      }
    }
    if (item.cardInfo) {
      const foundCard = availableCards.find(
        (c) =>
          (c.holder && item.cardInfo.toLowerCase().includes(c.holder.toLowerCase())) ||
          (c.bankName && item.cardInfo.toLowerCase().includes(c.bankName.toLowerCase())) ||
          (c.cardLabel && item.cardInfo.toLowerCase().includes(c.cardLabel.toLowerCase()))
      );
      if (foundCard) {
        cardId = foundCard.id;
      }
    }

    const cleanNote = (item.note || "")
      .replace(/\[txDate:[^\]]+\]/g, "")
      .replace(/\[CARD_SLIP:[^\]]+\]/g, "")
      .replace(/\[card-[^\]]+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    setEditDailyForm({
      title: item.title || "",
      amount: item.amount !== undefined ? String(item.amount) : "",
      date: item.dateStr || selectedReportDate,
      paymentChannel: item.channel === "CREDIT_CARD" ? "CREDIT_CARD" : item.channel === "BANK" ? "BANK" : "CASH",
      selectedCardId: cardId,
      categoryText: item.subCategory || item.category || "Gıda & Mutfak",
      description: cleanNote,
    });
    setEditDailyItem(item);
  };

  // Günlük İşlemi Sil
  const handleDeleteDailyItem = async (item: any) => {
    if (!confirm(`"${item.title}" işlemini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      if (item.isPaymentHistory) {
        let history: any[] = [];
        try {
          if (item.rawExpense?.paymentHistory) {
            history = JSON.parse(item.rawExpense.paymentHistory);
          }
        } catch {}

        if (history.length > 1) {
          // Birden fazla ödeme varsa sadece bu ödemeyi sil
          const res = await fetch(`/api/giderler/${item.rawExpenseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "DELETE_PAYMENT",
              index: item.phIndex,
            }),
          });
          if (!res.ok) throw new Error("Ödeme silinemedi");
        } else {
          // Tek ödemeyse ve hızlı çıkışsa kaydın tamamını sil
          const res = await fetch(`/api/giderler/${item.rawExpenseId}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Kayıt silinemedi");
        }
      } else {
        // Doğrudan gider kaydını sil
        const res = await fetch(`/api/giderler/${item.rawExpenseId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Kayıt silinemedi");
      }

      await fetchData();
    } catch (err: any) {
      alert("İşlem silinirken bir hata oluştu: " + (err?.message || ""));
    }
  };

  // Günlük İşlem Düzenleme Formunu Kaydet
  const handleEditDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDailyItem) return;
    if (!editDailyForm.title.trim()) {
      alert("Lütfen kime / nereye ödendi bilgisini girin.");
      return;
    }

    const numAmount = parseFloat(String(editDailyForm.amount).replace(",", "."));
    if (isNaN(numAmount) || numAmount < 0) {
      alert("Lütfen geçerli bir tutar girin.");
      return;
    }

    try {
      setEditDailySubmitting(true);
      const isCard = editDailyForm.paymentChannel === "CREDIT_CARD";
      const isBank = editDailyForm.paymentChannel === "BANK";
      const matchedCard = isCard
        ? availableCards.find((c) => c.id === editDailyForm.selectedCardId) || availableCards[0]
        : null;

      if (!editDailyItem.isPaymentHistory) {
        // Doğrudan gider kaydını güncelle
        const payload: any = {
          title: editDailyForm.title.trim(),
          amountDue: numAmount,
          subCategory: editDailyForm.categoryText,
        };

        if (isCard && matchedCard) {
          const stmtCalc = calculateCardStatementAndDueDate(matchedCard, editDailyForm.date);
          payload.category = "CREDIT_CARD";
          payload.paymentMethod = "CREDIT_CARD";
          payload.cardHolder = matchedCard.holder;
          payload.cardBank = matchedCard.bankName;
          payload.amountPaid = 0;
          payload.amountRemaining = numAmount;
          payload.status = "PENDING";
          payload.dueDate = new Date(`${stmtCalc.dueDateISO}T12:00:00.000Z`).toISOString();
          payload.dueDateStr = stmtCalc.dueDateStr;
          payload.monthIndex = stmtCalc.periodMonth;
          payload.installmentInfo = "1t/1t";
          payload.description = `[txDate:${editDailyForm.date}] [${matchedCard.id}] [CARD_SLIP:${stmtCalc.statementPeriodKey}] ${editDailyForm.description.trim() || "Kredi Kartı ile Okul Harcaması"}`.trim();
          payload.paymentHistory = null;
        } else if (isBank) {
          payload.category = "OTHER";
          payload.paymentMethod = "BANK_TRANSFER";
          payload.cardHolder = null;
          payload.cardBank = null;
          payload.amountPaid = numAmount;
          payload.amountRemaining = 0;
          payload.status = "PAID";
          payload.dueDate = new Date(`${editDailyForm.date}T12:00:00.000Z`).toISOString();
          payload.dueDateStr = editDailyForm.date;
          payload.monthIndex = new Date(editDailyForm.date).getMonth() + 1;
          payload.description = `[txDate:${editDailyForm.date}] ${editDailyForm.description.trim() || "Banka / Havale Çıkışı"}`.trim();
          payload.paymentHistory = JSON.stringify([
            {
              date: editDailyForm.date,
              amount: numAmount,
              note: editDailyForm.description.trim() || "Banka / Havale Çıkışı",
              paymentMethod: "BANK_TRANSFER",
            },
          ]);
        } else {
          // Nakit Kasa
          payload.category = "OTHER";
          payload.paymentMethod = "CASH";
          payload.cardHolder = null;
          payload.cardBank = null;
          payload.amountPaid = numAmount;
          payload.amountRemaining = 0;
          payload.status = "PAID";
          payload.dueDate = new Date(`${editDailyForm.date}T12:00:00.000Z`).toISOString();
          payload.dueDateStr = editDailyForm.date;
          payload.monthIndex = new Date(editDailyForm.date).getMonth() + 1;
          payload.description = `[txDate:${editDailyForm.date}] ${editDailyForm.description.trim() || "Günlük Nakit Kasa Çıkışı"}`.trim();
          payload.paymentHistory = JSON.stringify([
            {
              date: editDailyForm.date,
              amount: numAmount,
              note: editDailyForm.description.trim() || "Günlük Nakit Kasa Çıkışı",
              paymentMethod: "CASH",
            },
          ]);
        }

        const res = await fetch(`/api/giderler/${editDailyItem.rawExpenseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Güncelleme başarısız.");
        }
      } else {
        // Ödeme geçmişi içindeki parçalı ödemeyi güncelle
        let history: any[] = [];
        try {
          if (editDailyItem.rawExpense?.paymentHistory) {
            history = JSON.parse(editDailyItem.rawExpense.paymentHistory);
          }
        } catch {}

        if (editDailyItem.phIndex !== undefined && history[editDailyItem.phIndex]) {
          history[editDailyItem.phIndex] = {
            ...history[editDailyItem.phIndex],
            date: editDailyForm.date,
            amount: numAmount,
            note: editDailyForm.description.trim() || history[editDailyItem.phIndex]?.note,
            paymentMethod: isCard ? "CREDIT_CARD" : isBank ? "BANK_TRANSFER" : "CASH",
          };
          if (isCard && matchedCard) {
            history[editDailyItem.phIndex].cardId = matchedCard.id;
            history[editDailyItem.phIndex].cardHolder = matchedCard.holder;
            history[editDailyItem.phIndex].cardBank = matchedCard.bankName;
          }
        }

        const newAmountPaid = Number(history.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0).toFixed(2));
        const newAmountRemaining = Math.max(0, Number((editDailyItem.rawExpense.amountDue - newAmountPaid).toFixed(2)));
        const newStatus = newAmountPaid >= editDailyItem.rawExpense.amountDue ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : "PENDING";

        const res = await fetch(`/api/giderler/${editDailyItem.rawExpenseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPaid: newAmountPaid,
            amountRemaining: newAmountRemaining,
            status: newStatus,
            paymentHistory: JSON.stringify(history),
            title: editDailyForm.title.trim(),
            subCategory: editDailyForm.categoryText,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Güncelleme başarısız.");
        }
      }

      setEditDailyItem(null);
      await fetchData();
    } catch (err: any) {
      alert("Hata: " + (err?.message || "İşlem kaydedilemedi."));
    } finally {
      setEditDailySubmitting(false);
    }
  };

  // WhatsApp Metin Özeti Kopyala
  const copyWhatsappReport = () => {
    const dParts = selectedReportDate.split("-");
    const dFormatted = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;

    let cardLines = "";
    if (Object.keys(dailyReport.cardBreakdown).length > 0) {
      cardLines =
        "\n*Kredi Kartı Detayları:*\n" +
        Object.entries(dailyReport.cardBreakdown)
          .map(([cName, data]) => `  • ${cName}: ${formatCurrency(data.total)} (${data.count} işlem)`)
          .join("\n");
    }

    const itemsSummary = dailyReport.items
      .slice(0, 10)
      .map((it) => `• [${it.channel === "CASH" ? "Kasa" : it.channel === "CREDIT_CARD" ? "Kart" : "Banka"}] ${it.title}: ${formatCurrency(it.amount)} (${it.category})`)
      .join("\n");

    const text = `📊 *COSMOS KOLEJİ - GÜN SONU KASA & KART RAPORU*
📅 *Tarih:* ${dFormatted}
───────────────────────
💵 *Kasadan Çıkan Nakit:* ${formatCurrency(dailyReport.cashOut)}
💳 *Kredi Kartlarından Harcanan:* ${formatCurrency(dailyReport.cardOut)}${cardLines}
🏦 *Banka & Çek Çıkışı:* ${formatCurrency(dailyReport.bankOut)}
🪙 *Menkul Kıymet & Altın:* ${formatCurrency(dailyReport.goldOut)}
───────────────────────
🔴 *GÜNÜN TOPLAM HARCAMASI:* ${formatCurrency(dailyReport.totalOut)}
Toplam İşlem: ${dailyReport.items.length} kalem
───────────────────────
*Nereye Ne Ödendi / Kalemler:*
${itemsSummary}
${dailyReport.items.length > 10 ? `... ve ${dailyReport.items.length - 10} kalem daha.` : ""}

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
      {/* ============================================================== */}
      {/* 1. ÜST NAVİGASYON & GÖRÜNÜM SEÇİCİ BAR                        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/10 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Günlük Kasa & Gider Raporu</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                Canlı Defter
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Nereye ne ödendi, kasadan ve kartlardan kime ne çıktı günlük hareket ve Z-raporu
            </p>
          </div>
        </div>

        {/* ANA SEKME SEÇİCİ: GÜNLÜK RAPOR vs AY/HAFTA PLANI */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveMainTab("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === "daily"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ReceiptText className="w-4 h-4 text-teal-700" />
              <span>Günlük Hareketler & Rapor</span>
            </button>
            <button
              onClick={() => setActiveMainTab("weekly")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === "weekly"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Aylık & Haftalık Kasa Planı</span>
            </button>
          </div>

          <button
            onClick={openQuickExpenseModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Harcama / Çıkış Ekle</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEKME 1: GÜNLÜK HAREKETLER & KASA / KART GİDER RAPORU (ANA)   */}
      {/* ============================================================== */}
      {activeMainTab === "daily" && (
        <div className="space-y-6">
          {/* TARİH SEÇİCİ & HIZLI BUTONLAR BAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-4 h-4 text-teal-700" /> Rapor Tarihi:
              </span>
              <button
                type="button"
                onClick={setDateToToday}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedReportDate === new Date().toISOString().split("T")[0]
                    ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={setDateToYesterday}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Dün
              </button>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <input
                  type="date"
                  value={selectedReportDate}
                  onChange={(e) => setSelectedReportDate(e.target.value)}
                  className="bg-transparent text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={fetchData}
                title="Yenile"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyWhatsappReport}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  copiedWhatsapp
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                }`}
              >
                {copiedWhatsapp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                <span>{copiedWhatsapp ? "Kopyalandı!" : "WhatsApp Özeti Kopyala"}</span>
              </button>

              <button
                onClick={handlePrintZReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Z-Raporu Yazdır / PDF</span>
              </button>
            </div>
          </div>

          {/* GÜNLÜK 4 TEMEL KPI KARTI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            {/* KART 1: KASADAN ÇIKAN NAKİT */}
            <div className="bg-white rounded-3xl border-2 border-emerald-200 p-5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  Kasadan Çıkan Nakit
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {dailyReport.items.filter((i) => i.channel === "CASH").length} Çıkış
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-emerald-800">
                  {formatCurrency(dailyReport.cashOut)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Okul kasasından elden yapılan fiili harcamalar
                </p>
              </div>
            </div>

            {/* KART 2: KREDİ KARTLARINDAN HARCANAN */}
            <div className="bg-white rounded-3xl border-2 border-blue-200 p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Kartlardan Harcanan
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  {dailyReport.items.filter((i) => i.channel === "CREDIT_CARD").length} İşlem
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-blue-700">
                  {formatCurrency(dailyReport.cardOut)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kredi kartları ile okul adına çekilen tutar
                </p>
              </div>
            </div>

            {/* KART 3: BANKA / HAVALE ÇIKIŞLARI */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-purple-600" />
                  Banka & Havale
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {dailyReport.items.filter((i) => i.channel === "BANK").length} İşlem
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-purple-900">
                  {formatCurrency(dailyReport.bankOut)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Banka hesaplarından çıkan EFT / Havale
                </p>
              </div>
            </div>

            {/* KART 4: GÜNÜN TOPLAM HARCAMASI */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Günün Toplam Harcaması
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {dailyReport.items.length} Kalem
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-white">
                  {formatCurrency(dailyReport.totalOut)}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Kasa nakit + Kredi kartı + Banka toplamı
                </p>
              </div>
            </div>
          </div>

          {/* KART BAZINDA DAĞILIM ROZETLERİ (Hangi Karttan Ne Kadar Harcandı?) */}
          {Object.keys(dailyReport.cardBreakdown).length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-3xl shadow-xs print:hidden">
              <div className="flex items-center gap-2 mb-2 text-xs font-extrabold text-blue-950">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>Günün Kredi Kartı Harcama Dağılımı ({formatCurrency(dailyReport.cardOut)})</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(dailyReport.cardBreakdown).map(([cardName, data]) => (
                  <div
                    key={cardName}
                    className="bg-white border border-blue-200 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xs"
                  >
                    <span className="text-xs font-bold text-slate-800">{cardName}:</span>
                    <span className="text-xs font-black text-blue-700 font-mono">
                      {formatCurrency(data.total)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      ({data.count} işlem)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* DETAYLI GÜNLÜK HAREKETLER TABLOSU: NEREYE NE ÖDENDİ? KİME ÇIKTI? */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-teal-700" />
                  <span>Günün Hareketleri: Nereye Ne Ödendi? Kime Çıktı?</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seçili tarihte ({selectedReportDate}) gerçekleşen fiili kasa ve kart çıkış dökümü
                </p>
              </div>

              {/* FİLTRE VE ARAMA ÇUBUĞU */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dailySearchQuery}
                    onChange={(e) => setDailySearchQuery(e.target.value)}
                    placeholder="Alıcı, kart veya açıklama ara..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700 w-52"
                  />
                  {dailySearchQuery && (
                    <button
                      onClick={() => setDailySearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-0.5 text-xs font-bold text-slate-700">
                  <button
                    onClick={() => setDailyChannelFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dailyChannelFilter === "ALL" ? "bg-white text-slate-950 shadow-2xs font-black" : "hover:text-slate-950"
                    }`}
                  >
                    Tümü ({dailyReport.items.length})
                  </button>
                  <button
                    onClick={() => setDailyChannelFilter("CASH")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dailyChannelFilter === "CASH" ? "bg-white text-emerald-800 shadow-2xs font-black" : "hover:text-slate-950"
                    }`}
                  >
                    💵 Kasa Nakit ({dailyReport.items.filter((i) => i.channel === "CASH").length})
                  </button>
                  <button
                    onClick={() => setDailyChannelFilter("CREDIT_CARD")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dailyChannelFilter === "CREDIT_CARD" ? "bg-white text-blue-800 shadow-2xs font-black" : "hover:text-slate-950"
                    }`}
                  >
                    💳 Kredi Kartı ({dailyReport.items.filter((i) => i.channel === "CREDIT_CARD").length})
                  </button>
                  <button
                    onClick={() => setDailyChannelFilter("BANK")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dailyChannelFilter === "BANK" ? "bg-white text-purple-800 shadow-2xs font-black" : "hover:text-slate-950"
                    }`}
                  >
                    🏦 Banka ({dailyReport.items.filter((i) => i.channel === "BANK").length})
                  </button>
                </div>
              </div>
            </div>

            {/* TABLO */}
            {filteredDailyItems.length === 0 ? (
              <div className="text-center p-12 bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs space-y-2">
                <ReceiptText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">
                  {selectedReportDate} tarihinde kayıtlı harcama bulunamadı
                </p>
                <p className="text-slate-500 max-w-md mx-auto">
                  Bugün kasadan elden nakit çıktıysa veya kredi kartıyla okul adına harcama yapıldıysa aşağıdaki butondan anında kaydedebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={openQuickExpenseModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yeni Harcama Ekle</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-3 w-10">#</th>
                      <th className="py-3 px-3">Kime / Nereye Ödendi</th>
                      <th className="py-3 px-3">Ne İçin (Kategori)</th>
                      <th className="py-3 px-3">Ödeme Kanalı & Kart</th>
                      <th className="py-3 px-3">Açıklama / Fiş Notu</th>
                      <th className="py-3 px-3 text-right">Tutar</th>
                      <th className="py-3 px-3 text-center w-28">Durum</th>
                      <th className="py-3 px-3 text-center w-24">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDailyItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 text-sm block">{item.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.channel === "CASH"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : item.channel === "CREDIT_CARD"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : item.channel === "GOLD_ASSET"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-purple-100 text-purple-800 border border-purple-200"
                              }`}
                            >
                              {item.channel === "CASH"
                                ? "💵 Nakit Kasa"
                                : item.channel === "CREDIT_CARD"
                                ? "💳 Kredi Kartı"
                                : item.channel === "GOLD_ASSET"
                                ? "🪙 Menkul Kıymet"
                                : "🏦 Banka / Çek"}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 mt-1 block">
                            {item.cardInfo}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={item.note}>
                          {item.note}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.channel === "CREDIT_CARD"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : item.channel === "CASH"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {item.channel === "CREDIT_CARD"
                              ? "Karttan Çekildi"
                              : item.channel === "CASH"
                              ? "Kasadan Ödendi"
                              : "Bankadan Çıktı"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="İşlemi Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDailyItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="İşlemi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs">
                      <td colSpan={5} className="py-3.5 px-3 text-right uppercase tracking-wider">
                        GÜNÜN FİLTRELENEN ÇIKIŞ TOPLAMI:
                      </td>
                      <td className="py-3.5 px-3 text-right text-sm text-teal-300 font-mono font-black">
                        {formatCurrency(filteredDailyItems.reduce((s, i) => s + i.amount, 0))}
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* YAZDIRILABİLİR Z-RAPORU ŞABLONU (A4 FİŞ / YAZICI ÇIKTISI)       */}
          {/* ============================================================== */}
          <div className="hidden print:block space-y-4 pt-4">
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

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 border border-slate-300 rounded">
                <span className="block text-[10px] font-bold">💵 Kasa Nakit Çıkışı</span>
                <span className="font-black text-sm">{formatCurrency(dailyReport.cashOut)}</span>
              </div>
              <div className="p-2 border border-slate-300 rounded">
                <span className="block text-[10px] font-bold">💳 Kredi Kartı Çıkışı</span>
                <span className="font-black text-sm">{formatCurrency(dailyReport.cardOut)}</span>
              </div>
              <div className="p-2 border border-slate-300 rounded">
                <span className="block text-[10px] font-bold">🏦 Banka Çıkışı</span>
                <span className="font-black text-sm">{formatCurrency(dailyReport.bankOut)}</span>
              </div>
              <div className="p-2 bg-slate-900 text-white rounded">
                <span className="block text-[10px] font-bold text-teal-300">🔴 GÜNÜN TOPLAMI</span>
                <span className="font-black text-sm">{formatCurrency(dailyReport.totalOut)}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="p-2">#</th>
                  <th className="p-2">Kime / Nereye Ödendi</th>
                  <th className="p-2">Kategori</th>
                  <th className="p-2">Kanal & Kart</th>
                  <th className="p-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dailyReport.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2 font-bold">{it.title}</td>
                    <td className="p-2">{it.category}</td>
                    <td className="p-2">{it.cardInfo}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs">
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
      )}

      {/* ============================================================== */}
      {/* SEKME 2: AY/HAFTA BAZINDA GİDER & BORÇ PLANLAMASI              */}
      {/* ============================================================== */}
      {activeMainTab === "weekly" && (
        <div className="space-y-6">
          {/* AY SEÇİCİ BAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
              <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="2026-10">Ekim 2026 (İçinde Bulunulan Ay)</option>
                <option value="2026-11">Kasım 2026</option>
                <option value="2026-12">Aralık 2026</option>
                <option value="2027-1">Ocak 2027</option>
                <option value="2027-2">Şubat 2027</option>
                <option value="2027-3">Mart 2027</option>
                <option value="2026-9">Eylül 2026</option>
                <option value="2026-8">Ağustos 2026</option>
              </select>
            </div>

            <Link
              href={`/giderler?month=${selectedMonth}`}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
            >
              <span>Okul Giderleri Sayfasına Git</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* DEVREDEN BORÇ BAKİYESİ & GENEL YÜK KPI KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border-2 border-rose-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Devreden Borç Bakiyesi
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800">
                  {rolloverSummary.countRollover} Kalem Gecikmiş
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-700">
                  {formatCurrency(rolloverSummary.totalRolloverRemaining)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {currentMonthLabel} öncesindeki vadesi geçmiş ve henüz kapatılmamış borçlar
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
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

            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-md">
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
                <p className="text-[11px] text-teal-200/80 mt-1">
                  Okulun kapatılması gereken toplam yükümlülüğü
                </p>
              </div>
            </div>
          </div>

          {/* HAFTALIK GİDER PROJEKSİYONU GRAFİĞİ */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {weeklyPlan.map((w) => {
                const isSelected = selectedWeekFilter === w.id;
                const completionRate = w.totalDue > 0 ? Math.min(100, Math.round((w.totalPaid / w.totalDue) * 100)) : 0;

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

          {/* HAFTALIK GİDER LİSTESİ TABLOSU */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-700" />
              <span>
                {selectedWeekFilter === "ALL"
                  ? `${currentMonthLabel} Tüm Giderler Listesi`
                  : `${selectedWeekFilter}. Hafta Gider Kalemleri`}
              </span>
            </h3>

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
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: HIZLI HARCAMA / KASA & KART ÇIKIŞI EKLE                  */}
      {/* ============================================================== */}
      {quickExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Yeni Harcama / Çıkış Ekle
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kasadan nakit çıkışı veya kredi kartından yapılan harcamayı kaydet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickExpenseSubmit} className="mt-4 space-y-4 text-xs">
              {/* 1. ÖDEME KANALI SEÇİMİ (3 BÜYÜK BUTON) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                  Harcama Kanalı / Nasıl Ödendi? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickForm({ ...quickForm, paymentChannel: "CASH" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      quickForm.paymentChannel === "CASH"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Wallet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block font-extrabold text-xs">Nakit Kasa</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Elden Çıkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickForm({ ...quickForm, paymentChannel: "CREDIT_CARD" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      quickForm.paymentChannel === "CREDIT_CARD"
                        ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="block font-extrabold text-xs">Kredi Kartı</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Karttan Çekilen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickForm({ ...quickForm, paymentChannel: "BANK" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      quickForm.paymentChannel === "BANK"
                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Landmark className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="block font-extrabold text-xs">Banka / Havale</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">EFT / FAST</span>
                  </button>
                </div>
              </div>

              {/* 2. EĞER KREDİ KARTI İSE: HANGİ KARTTAN ÇEKİLDİ? */}
              {quickForm.paymentChannel === "CREDIT_CARD" && (
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5 animate-in fade-in">
                  <label className="block font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    <span>Hangi Kredi Kartı Kullanıldı? *</span>
                  </label>
                  <select
                    value={quickForm.selectedCardId}
                    onChange={(e) => setQuickForm({ ...quickForm, selectedCardId: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.holder} • {c.bankName} ({c.cardLabel || "Kredi Kartı"})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selC = availableCards.find((c) => c.id === quickForm.selectedCardId) || availableCards[0];
                    if (!selC) return null;
                    const stmt = calculateCardStatementAndDueDate(selC, quickForm.date);
                    return (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-100/70 text-blue-900 text-[11px] font-semibold border border-blue-200 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>
                          Bu harcama <b>{selC.cardLabel}</b> kartının <b>{stmt.periodLabel}</b> ekstresinde birikecektir (Son Ödeme: <b>{stmt.dueDateStr}</b>). Okul giderlerinde tek satırda gözükecektir.
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3. KİME / NEREYE ÖDENDİ (BAŞLIK) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  Kime / Nereye Ödendi? (Alıcı / Firma / Cari Adı) *
                </label>
                <input
                  type="text"
                  required
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  placeholder="Örn: Metro Market, A101, Kırtasiyeci Ahmet Usta, KCETAŞ Elektrik, Trendyol"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                />
              </div>

              {/* 4. TUTAR VE İŞLEM TARİHİ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">Tutar (₺) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      value={quickForm.amount}
                      onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-rose-700 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* 5. NE İÇİN / KATEGORİ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">Ne İçin Yapıldı? (Kategori) *</label>
                <select
                  value={quickForm.categoryText}
                  onChange={(e) => setQuickForm({ ...quickForm, categoryText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                >
                  {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. AÇIKLAMA / FİŞ NO */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">Fiş No / Açıklama Notu</label>
                <textarea
                  rows={2}
                  value={quickForm.description}
                  onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                  placeholder="İsteğe bağlı fiş no, fatura seri no veya detay not..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
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
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{quickSubmitting ? "Kaydediliyor..." : "Harcamayı Deftere İşle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GÜNLÜK İŞLEM DÜZENLE                                    */}
      {/* ============================================================== */}
      {editDailyItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Günlük İşlemi Düzenle
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Harcama başlığını, tutarını, tarihini veya ödeme kanalını güncelleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditDailyItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDailySubmit} className="mt-4 space-y-4 text-xs">
              {/* 1. ÖDEME KANALI SEÇİMİ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
                  Harcama Kanalı / Nasıl Ödendi? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDailyForm({ ...editDailyForm, paymentChannel: "CASH" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editDailyForm.paymentChannel === "CASH"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Wallet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block font-extrabold text-xs">Nakit Kasa</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Elden Çıkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditDailyForm({ ...editDailyForm, paymentChannel: "CREDIT_CARD" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editDailyForm.paymentChannel === "CREDIT_CARD"
                        ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="block font-extrabold text-xs">Kredi Kartı</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Karttan Çekilen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditDailyForm({ ...editDailyForm, paymentChannel: "BANK" })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      editDailyForm.paymentChannel === "BANK"
                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/30 font-black shadow-xs"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Landmark className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="block font-extrabold text-xs">Banka / Havale</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">EFT / FAST</span>
                  </button>
                </div>
              </div>

              {/* 2. EĞER KREDİ KARTI İSE */}
              {editDailyForm.paymentChannel === "CREDIT_CARD" && (
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5 animate-in fade-in">
                  <label className="block font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    <span>Hangi Kredi Kartı Kullanıldı? *</span>
                  </label>
                  <select
                    value={editDailyForm.selectedCardId}
                    onChange={(e) => setEditDailyForm({ ...editDailyForm, selectedCardId: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.holder} • {c.bankName} ({c.cardLabel || "Kredi Kartı"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. KİME / NEREYE ÖDENDİ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  Kime / Nereye Ödendi? (Alıcı / Firma / Cari Adı) *
                </label>
                <input
                  type="text"
                  required
                  value={editDailyForm.title}
                  onChange={(e) => setEditDailyForm({ ...editDailyForm, title: e.target.value })}
                  placeholder="Örn: Metro Market, A101, Fırın, Benzinlik"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                />
              </div>

              {/* 4. TUTAR VE İŞLEM TARİHİ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">Tutar (₺) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={editDailyForm.amount}
                      onChange={(e) => setEditDailyForm({ ...editDailyForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-rose-700 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={editDailyForm.date}
                    onChange={(e) => setEditDailyForm({ ...editDailyForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* 5. NE İÇİN / KATEGORİ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">Ne İçin Yapıldı? (Kategori) *</label>
                <select
                  value={editDailyForm.categoryText}
                  onChange={(e) => setEditDailyForm({ ...editDailyForm, categoryText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                >
                  {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. AÇIKLAMA / FİŞ NO */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">Fiş No / Açıklama Notu</label>
                <textarea
                  rows={2}
                  value={editDailyForm.description}
                  onChange={(e) => setEditDailyForm({ ...editDailyForm, description: e.target.value })}
                  placeholder="İsteğe bağlı fiş no veya detay not..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteDailyItem(editDailyItem)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sil</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDailyItem(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={editDailySubmitting}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editDailySubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
                  </button>
                </div>
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
          Günlük Kasa & Gider Raporu Yükleniyor...
        </div>
      }
    >
      <GunlukKasaPlanContent />
    </Suspense>
  );
}

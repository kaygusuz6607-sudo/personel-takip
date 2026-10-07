"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  Banknote,
  GraduationCap,
  FileText,
  Landmark,
  Calendar,
  Layers,
  Trash2,
  Edit2,
  Check,
  X,
  Printer,
  Download,
  DollarSign,
  ArrowUpDown,
  History,
  Coins,
  Smartphone,
  Tv,
  BellRing,
  Car,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CreditCard as CardIcon,
  PhoneCall,
  QrCode,
  Camera,
  Eye,
  RefreshCw,
  Upload,
  UserMinus,
  RotateCcw,
} from "lucide-react";
import QRCode from "qrcode";
import SupplierCariPanel from "./components/SupplierCariPanel";
import GoldDaysPanel from "./components/GoldDaysPanel";

interface PaymentHistoryItem {
  date: string;
  amount: number;
  note: string;
}

interface SchoolExpense {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  period: string | null;
  installmentInfo: string | null;
  dueDate: string | null;
  dueDateStr: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  periodStatus: string | null;
  description: string | null;
  paymentHistory: string | null;
  isCommitment?: boolean;
  commitmentEndDate?: string | null;
  commitmentMonths?: number | null;
  paymentMethod?: string;
  cardHolder?: string | null;
  cardBank?: string | null;
  monthIndex?: number | null;
  phoneLines?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  createdAt: string;
}

interface AssetTrackingItem {
  id: string;
  title: string;
  assetType: string;
  owner: string | null;
  inspectionDate: string | null;
  insuranceDate: string | null;
  kaskoDate: string | null;
  housingDate: string | null;
  notes: string | null;
  inspDays?: number | null;
  insDays?: number | null;
  kaskoDays?: number | null;
  houseDays?: number | null;
  hasWarning?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; badgeBg: string }> = {
  RENT: { label: "Kira", icon: Building2, color: "text-amber-700", badgeBg: "bg-amber-50 text-amber-800 border-amber-200" },
  INVOICE: { label: "Fatura", icon: ReceiptText, color: "text-blue-700", badgeBg: "bg-blue-50 text-blue-800 border-blue-200" },
  CREDIT_CARD: { label: "Kredi Kartı", icon: CreditCard, color: "text-purple-700", badgeBg: "bg-purple-50 text-purple-800 border-purple-200" },
  LOAN: { label: "Banka Kredisi", icon: Landmark, color: "text-indigo-700", badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  STUDENT_REFUND: { label: "Kayıt Silme İadesi", icon: GraduationCap, color: "text-rose-700", badgeBg: "bg-rose-50 text-rose-800 border-rose-200" },
  CHEQUE: { label: "Çek Ödemesi", icon: FileText, color: "text-emerald-700", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  SUPPLIER: { label: "Tedarikçi Cari", icon: Building2, color: "text-teal-700", badgeBg: "bg-teal-50 text-teal-800 border-teal-200" },
  GOLD_DAY: { label: "Altın Günü", icon: Coins, color: "text-amber-700", badgeBg: "bg-amber-50 text-amber-900 border-amber-300" },
  TAX_SGK: { label: "SGK & Vergi", icon: Landmark, color: "text-cyan-700", badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  SALARY: { label: "Maaş", icon: Banknote, color: "text-teal-700", badgeBg: "bg-teal-50 text-teal-800 border-teal-200" },
  COMPENSATION: { label: "Tazminat", icon: Coins, color: "text-orange-700", badgeBg: "bg-orange-50 text-orange-800 border-orange-200" },
  OTHER: { label: "Diğer", icon: ReceiptText, color: "text-slate-700", badgeBg: "bg-slate-50 text-slate-800 border-slate-200" },
};

function formatSafeDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return typeof d === "string" ? d : "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "-";
  }
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

function GiderlerPageContent() {
  // SSR Hydration koruması
  const [isMounted, setIsMounted] = useState(false);
  // Aktif Sekme: EXPENSES (Okul Giderleri) | SUPPLIERS (Tedarikçi Carileri) | ASSETS (Araç / Mülk Sigorta & Kasko) | GOLD_DAYS (Altın Günleri)
  const [activeMainTab, setActiveMainTab] = useState<"EXPENSES" | "SUPPLIERS" | "ASSETS" | "GOLD_DAYS">("EXPENSES");

  useEffect(() => {
    setIsMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "ASSETS") {
        setActiveMainTab("ASSETS");
      } else if (params.get("tab") === "SUPPLIERS") {
        setActiveMainTab("SUPPLIERS");
      } else if (params.get("tab") === "GOLD_DAYS") {
        setActiveMainTab("GOLD_DAYS");
      }
      const mParam = params.get("month");
      if (mParam) {
        setSelectedMonth(mParam);
      }
    } catch {}
  }, []);

  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [monthBaseExpenses, setMonthBaseExpenses] = useState<SchoolExpense[]>([]);
  const [rolloverExpenses, setRolloverExpenses] = useState<SchoolExpense[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<
    { year: number; month: number; count: number; unpaidCount: number; totalDue: number; totalRemaining: number }[]
  >([]);
  const [cardHoldersSummary, setCardHoldersSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [installmentOnly, setInstallmentOnly] = useState(false);
  const [commitmentsOnly, setCommitmentsOnly] = useState(false);
  const [chequesOnly, setChequesOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  // Sıralama Seçeneği: DUE_DATE_ASC (Önce En Yakın Vade) | DUE_DATE_DESC (Önce En Uzak Vade) | CREATED_DESC | AMOUNT_DESC | AMOUNT_ASC
  const [sortBy, setSortBy] = useState<"DUE_DATE_ASC" | "DUE_DATE_DESC" | "CREATED_DESC" | "AMOUNT_DESC" | "AMOUNT_ASC">("DUE_DATE_ASC");

  const toggleDueDateSort = () => {
    setSortBy((prev) => (prev === "DUE_DATE_ASC" ? "DUE_DATE_DESC" : "DUE_DATE_ASC"));
  };

  const toggleAmountSort = () => {
    setSortBy((prev) => (prev === "AMOUNT_DESC" ? "AMOUNT_ASC" : "AMOUNT_DESC"));
  };

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayGoldDayExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.category === "GOLD_DAY" && e.dueDate && e.dueDate.slice(0, 10) === todayStr && e.status !== "PAID"
    );
  }, [expenses, todayStr]);

  const TR_MONTH_SHORT = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const TR_MONTH_FULL = [
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

  const parseSelectedPeriod = (
    sel: string
  ): { mode: "ALL" | "YEAR" | "YM"; year: number; month: number; ym: string; label: string } => {
    if (!sel || sel === "ALL") {
      return {
        mode: "ALL",
        year: 2026,
        month: 9,
        ym: "ALL",
        label: "Tüm Yıllar & Aylar (Son Ödeme Tarihine Göre)",
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
        label: `${y} Yılı Tüm Ödemeler`,
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
  };

  // Yıl ve Ay Bazında Takip: "2026-9", "2027-1", "2028-9", "YEAR-2028", "ALL" - İçinde bulunulan aya göre otomatik başlar
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = m >= 7 ? 2026 : 2027;
    return `${y}-${m}`;
  });
  // Ödeme Yöntemi Filtresi: ALL, CASH, CREDIT_CARD, CHEQUE
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");
  // Kart Sahibi Filtresi: ALL, Ahmet Taymaz, Duygu Köse, vb.
  const [selectedCardHolder, setSelectedCardHolder] = useState<string>("ALL");

  // Varlıklar (Araç & Mülk Muayene/Kasko)
  const [assets, setAssets] = useState<AssetTrackingItem[]>([]);
  const [assetWarningCount, setAssetWarningCount] = useState(0);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetTrackingItem | null>(null);
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetForm, setAssetForm] = useState({
    title: "",
    assetType: "VEHICLE",
    owner: "",
    inspectionDate: "",
    insuranceDate: "",
    kaskoDate: "",
    housingDate: "",
    notes: "",
  });

  // Yeni / Düzenle Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SchoolExpense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "INVOICE",
    subCategory: "",
    dueDateStr: "",
    dueDate: "",
    monthIndex: 9,
    amountDue: "",
    description: "",
    entryType: "SINGLE", // "SINGLE" | "INSTALLMENT" | "COMMITMENT" | "UTILITY_INVOICE"
    invoiceRepeatMonths: 12,
    invoiceFutureAmountMode: "SAME_AMOUNT", // "SAME_AMOUNT" | "FIRST_MONTH_ONLY"
    isInstallment: false,
    installmentCount: 12,
    currentInstallment: 1,
    amountMode: "TOTAL", // "TOTAL" | "MONTHLY"
    isCommitment: false,
    commitmentMonths: 12,
    paymentMethod: "CASH", // CASH, CREDIT_CARD, CHEQUE
    cardHolder: "",
    cardBank: "",
    chequeNo: "",
    chequeBank: "",
  });

  // Çoklu Telefon Hatları Giriş Listesi (Tek faturada 5 hat vb. - Numara, Kimin Kullandığı, Kullanım Ücreti, Taahhüt Tarihi)
  const [phoneLinesList, setPhoneLinesList] = useState<
    { number: string; title: string; amount?: string | number; commitmentEnd: string }[]
  >([]);
  const [showPhoneLinesInModal, setShowPhoneLinesInModal] = useState(false);

  // Tek Fatura İçi 5 Telefon Numarası & Taahhüt Takip Modalı
  const [allPhoneExpenses, setAllPhoneExpenses] = useState<SchoolExpense[]>([]);
  const [allChequeExpenses, setAllChequeExpenses] = useState<SchoolExpense[]>([]);
  const [chequePhotosMap, setChequePhotosMap] = useState<Record<string, string>>({});
  const [formChequePhotoUrl, setFormChequePhotoUrl] = useState<string | null>(null);
  const [draftChequeId, setDraftChequeId] = useState<string>("");
  const [showFormQr, setShowFormQr] = useState(false);
  const [formQrDataUrl, setFormQrDataUrl] = useState("");
  const [formQrTargetUrl, setFormQrTargetUrl] = useState("");
  const [activeQrChequeExpense, setActiveQrChequeExpense] = useState<SchoolExpense | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState("");
  const [qrModalTargetUrl, setQrModalTargetUrl] = useState("");
  const [lightboxChequePhoto, setLightboxChequePhoto] = useState<{ title: string; url: string } | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [activePhoneExpense, setActivePhoneExpense] = useState<SchoolExpense | null>(null);
  const [phoneModalLines, setPhoneModalLines] = useState<
    { number: string; title: string; amount?: string | number; commitmentEnd: string }[]
  >([]);
  const [syncPhoneAmountToInvoice, setSyncPhoneAmountToInvoice] = useState(false);
  const [phoneModalSubmitting, setPhoneModalSubmitting] = useState(false);
  const [showPhoneSection, setShowPhoneSection] = useState(true);
  const [showRolloverSection, setShowRolloverSection] = useState(true);
  const [hiddenPhoneRowIds, setHiddenPhoneRowIds] = useState<Record<string, boolean>>({});

  // Parçalı Ödeme Modalı
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentExpense, setActivePaymentExpense] = useState<SchoolExpense | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Kredi Kartları Cüzdanı (Ahmet Taymaz, Muhammed Ali Çağır, Şirket Kartları vb.)
  const [showCardSummary, setShowCardSummary] = useState(true);
  const [allCardExpenses, setAllCardExpenses] = useState<SchoolExpense[]>([]);

  const DEFAULT_AHMET_CARDS = [
    // Ahmet Taymaz Kartları
    {
      id: "card-1",
      slotNumber: 1,
      holder: "Ahmet Taymaz",
      bankName: "Vakıfbank",
      cardLabel: "Vakıfbank World KK",
      last4: "4821",
      cutoffDay: "25.09.2026",
      statementDateISO: "2026-09-15",
      dueDateISO: "2026-09-25",
      cardLimit: 750000,
    },
    {
      id: "card-2",
      slotNumber: 2,
      holder: "Ahmet Taymaz",
      bankName: "Akbank",
      cardLabel: "Akbank Business KK",
      last4: "9034",
      cutoffDay: "30.09.2026",
      statementDateISO: "2026-09-20",
      dueDateISO: "2026-09-30",
      cardLimit: 750000,
    },
    {
      id: "card-3",
      slotNumber: 3,
      holder: "Ahmet Taymaz",
      bankName: "Halkbank",
      cardLabel: "Halkbank Paraf KK",
      last4: "5512",
      cutoffDay: "30.09.2026",
      statementDateISO: "2026-09-20",
      dueDateISO: "2026-09-30",
      cardLimit: 750000,
    },
    {
      id: "card-4",
      slotNumber: 4,
      holder: "Ahmet Taymaz",
      bankName: "Ziraat Bankası",
      cardLabel: "Ziraat Bankkart KK",
      last4: "7189",
      cutoffDay: "07.09.2026",
      statementDateISO: "2026-08-28",
      dueDateISO: "2026-09-07",
      cardLimit: 750000,
    },
    {
      id: "card-5",
      slotNumber: 5,
      holder: "Ahmet Taymaz",
      bankName: "QNB Finansbank",
      cardLabel: "QNB CardFinans KK",
      last4: "6305",
      cutoffDay: "24.09.2026",
      statementDateISO: "2026-09-14",
      dueDateISO: "2026-09-24",
      cardLimit: 750000,
    },
    // Muhammed Ali Çağır (MAC) Kartları
    {
      id: "card-mac-1",
      slotNumber: 6,
      holder: "Muhammed Ali Çağır",
      bankName: "QNB Finansbank",
      cardLabel: "Mac QNB Kredi Kartı",
      last4: "3102",
      cutoffDay: "29.09.2026",
      statementDateISO: "2026-09-23",
      dueDateISO: "2026-09-29",
      cardLimit: 500000,
    },
    {
      id: "card-mac-2",
      slotNumber: 7,
      holder: "Muhammed Ali Çağır",
      bankName: "Denizbank",
      cardLabel: "Mac Denizbank KK",
      last4: "8410",
      cutoffDay: "04.09.2026",
      statementDateISO: "2026-08-24",
      dueDateISO: "2026-09-04",
      cardLimit: 500000,
    },
    {
      id: "card-mac-3",
      slotNumber: 8,
      holder: "Muhammed Ali Çağır",
      bankName: "Ziraat Bankası",
      cardLabel: "Mac Ziraat KK",
      last4: "1945",
      cutoffDay: "14.09.2026",
      statementDateISO: "2026-09-04",
      dueDateISO: "2026-09-14",
      cardLimit: 500000,
    },
    // Şirket Kartları (SIMCU)
    {
      id: "card-simcu-1",
      slotNumber: 9,
      holder: "Şirket Kartları (SIMCU)",
      bankName: "Ziraat Bankası",
      cardLabel: "SIMCU - Ziraat Kart",
      last4: "5001",
      cutoffDay: "14.09.2026",
      statementDateISO: "2026-09-04",
      dueDateISO: "2026-09-14",
      cardLimit: 750000,
    },
    {
      id: "card-simcu-2",
      slotNumber: 10,
      holder: "Şirket Kartları (SIMCU)",
      bankName: "Halkbank",
      cardLabel: "SIMCU - Paraf Esnaf",
      last4: "5002",
      cutoffDay: "07.09.2026",
      statementDateISO: "2026-09-02",
      dueDateISO: "2026-09-07",
      cardLimit: 750000,
    },
    {
      id: "card-simcu-3",
      slotNumber: 11,
      holder: "Şirket Kartları (SIMCU)",
      bankName: "Halkbank",
      cardLabel: "SIMCU - Paraf Business",
      last4: "5003",
      cutoffDay: "07.09.2026",
      statementDateISO: "2026-09-02",
      dueDateISO: "2026-09-07",
      cardLimit: 750000,
    },
    // Diğer Kartlar (Duygu Köse & Emre Helvacı)
    {
      id: "card-dk-1",
      slotNumber: 12,
      holder: "Duygu Köse",
      bankName: "Halkbank",
      cardLabel: "Halkbank Master/Troy KK",
      last4: "2210",
      cutoffDay: "30.09.2026",
      statementDateISO: "2026-09-20",
      dueDateISO: "2026-09-30",
      cardLimit: 300000,
    },
    {
      id: "card-dk-2",
      slotNumber: 13,
      holder: "Duygu Köse",
      bankName: "Kuveyt Türk",
      cardLabel: "Kuveyt Türk KK",
      last4: "2215",
      cutoffDay: "20.09.2026",
      statementDateISO: "2026-09-10",
      dueDateISO: "2026-09-20",
      cardLimit: 300000,
    },
    {
      id: "card-eh-1",
      slotNumber: 14,
      holder: "Emre Helvacı",
      bankName: "Kuveyt Türk",
      cardLabel: "Kuveyt Türk KK",
      last4: "3310",
      cutoffDay: "10.09.2026",
      statementDateISO: "2026-09-01",
      dueDateISO: "2026-09-10",
      cardLimit: 300000,
    },
    {
      id: "card-eh-2",
      slotNumber: 15,
      holder: "Emre Helvacı",
      bankName: "Türkiye Finans",
      cardLabel: "Türkiye Finans KK",
      last4: "3315",
      cutoffDay: "04.09.2026",
      statementDateISO: "2026-08-25",
      dueDateISO: "2026-09-04",
      cardLimit: 300000,
    },
  ];

  const [ahmetCards, setAhmetCards] = useState(DEFAULT_AHMET_CARDS);
  const [cardOwnerFilter, setCardOwnerFilter] = useState<string>("ALL");
  const [selectedVisualCardId, setSelectedVisualCardId] = useState<string>("ALL_5");
  const [editingCardSlot, setEditingCardSlot] = useState<string | null>(null);
  const [tempCardBankName, setTempCardBankName] = useState("");
  const [tempCardHolder, setTempCardHolder] = useState("");
  const [tempCardLabel, setTempCardLabel] = useState("");
  const [tempCardCutoff, setTempCardCutoff] = useState("");
  const [tempCardLimit, setTempCardLimit] = useState("");
  const [selectedDueDateFilter, setSelectedDueDateFilter] = useState<string>("");

  // Yeni Kart Ekleme Kutusu
  const [newCardFormOpen, setNewCardFormOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    holder: "Ahmet Taymaz",
    bankName: "Vakıfbank",
    cardLabel: "",
    statementDateISO: "2026-09-15",
    dueDateISO: "2026-09-25",
    cardLimit: "750000",
  });

  // Kart Borcu / Ekstre Ödeme Modalı
  const [cardPayModalOpen, setCardPayModalOpen] = useState(false);
  const [cardPaySubmitting, setCardPaySubmitting] = useState(false);
  const [cardPayForm, setCardPayForm] = useState({
    cardId: "card-1",
    amount: "",
    date: "",
    note: "",
  });

  // Karta Özel Hızlı Harcama & Manuel Taksit Giriş Modalı
  const [cardTxModalOpen, setCardTxModalOpen] = useState(false);
  const [cardTxSubmitting, setCardTxSubmitting] = useState(false);
  const [cardTxForm, setCardTxForm] = useState({
    cardId: "card-1",
    title: "",
    amount: "",
    amountMode: "TOTAL" as "TOTAL" | "MONTHLY",
    installmentCount: 1,
    monthIndex: 9,
    dueDate: "",
    description: "",
  });
  const [cardTxCustomInstallments, setCardTxCustomInstallments] = useState<string[]>([]);
  const [formCustomInstallments, setFormCustomInstallments] = useState<string[]>([]);

  const computeEqualSplit = (amountStr: string, countNum: number, mode: "TOTAL" | "MONTHLY"): string[] => {
    const c = Math.max(1, Number(countNum) || 1);
    if (c <= 1) return [];
    const val = Number(amountStr) || 0;
    if (val <= 0) return Array(c).fill("");
    if (mode === "MONTHLY") {
      return Array(c).fill(String(Number(val.toFixed(2))));
    }
    const base = Number((val / c).toFixed(2));
    const last = Number((val - base * (c - 1)).toFixed(2));
    return Array.from({ length: c }, (_, idx) => String(idx === c - 1 ? last : base));
  };

  useEffect(() => {
    setCardTxCustomInstallments(
      computeEqualSplit(cardTxForm.amount, Number(cardTxForm.installmentCount) || 1, cardTxForm.amountMode)
    );
  }, [cardTxForm.amount, cardTxForm.installmentCount, cardTxForm.amountMode]);

  useEffect(() => {
    if (form.entryType === "INSTALLMENT") {
      setFormCustomInstallments(
        computeEqualSplit(form.amountDue, Number(form.installmentCount) || 1, form.amountMode as "TOTAL" | "MONTHLY")
      );
    } else {
      setFormCustomInstallments([]);
    }
  }, [form.amountDue, form.installmentCount, form.amountMode, form.entryType]);

  const handleManualInstallmentChange = (
    currentArr: string[],
    idx: number,
    newValStr: string,
    targetTotal: number,
    setter: (next: string[]) => void
  ) => {
    const next = [...currentArr];
    next[idx] = newValStr;
    if (targetTotal > 0 && idx < next.length - 1) {
      const sumUpToIdx = next.slice(0, idx + 1).reduce((s, v) => s + (Number(v) || 0), 0);
      const remCount = next.length - (idx + 1);
      const remTotal = Math.max(0, Number((targetTotal - sumUpToIdx).toFixed(2)));
      const eachRem = Number((remTotal / remCount).toFixed(2));
      const lastRem = Number((remTotal - eachRem * (remCount - 1)).toFixed(2));
      for (let j = idx + 1; j < next.length; j++) {
        next[j] = String(j === next.length - 1 ? lastRem : eachRem);
      }
    }
    setter(next);
  };

  useEffect(() => {
    try {
      const savedV2 = localStorage.getItem("cosmos_all_credit_cards_v2");
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const withLimits = parsed.map((c: any) => {
            const def = DEFAULT_AHMET_CARDS.find((d) => d.id === c.id);
            return {
              ...c,
              statementDateISO: c.statementDateISO || def?.statementDateISO || "",
              cardLimit: Number(c.cardLimit) > 0 ? Number(c.cardLimit) : def?.cardLimit || 750000,
            };
          });
          setAhmetCards(withLimits);
          return;
        }
      }
      // Eski v1 varsa Ahmet Taymaz kartlarının son ödeme tarihlerini koruyarak v2'ye geçir
      const savedV1 = localStorage.getItem("cosmos_ahmet_taymaz_cards_v1");
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (Array.isArray(parsedV1)) {
          const merged = DEFAULT_AHMET_CARDS.map((defCard) => {
            const found = parsedV1.find((p: any) => p.id === defCard.id);
            return found
              ? {
                  ...defCard,
                  ...found,
                  holder: found.holder || defCard.holder,
                  statementDateISO: found.statementDateISO || defCard.statementDateISO,
                  cardLimit: Number(found.cardLimit) > 0 ? Number(found.cardLimit) : defCard.cardLimit,
                }
              : defCard;
          });
          setAhmetCards(merged);
          localStorage.setItem("cosmos_all_credit_cards_v2", JSON.stringify(merged));
        }
      }
    } catch {}
  }, []);

  const saveAhmetCards = (updated: typeof DEFAULT_AHMET_CARDS) => {
    setAhmetCards(updated);
    try {
      localStorage.setItem("cosmos_all_credit_cards_v2", JSON.stringify(updated));
    } catch {}
  };

  const handleCardLimitChange = (cardId: string, newLimitVal: number) => {
    const safeLimit = Math.max(0, Number(newLimitVal) || 0);
    const updated = ahmetCards.map((c) => (c.id === cardId ? { ...c, cardLimit: safeLimit } : c));
    saveAhmetCards(updated);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHolder = newCardForm.holder.trim() || "Şirket Kartları (SIMCU)";
    const cleanBank = newCardForm.bankName.trim() || "Banka Kartı";
    const cleanLabel = newCardForm.cardLabel.trim() || `${cleanBank} Kredi Kartı`;
    const statementISO = newCardForm.statementDateISO || "";
    const dueISO = newCardForm.dueDateISO || new Date().toISOString().split("T")[0];
    const limitNum = Math.max(0, Number(newCardForm.cardLimit) || 750000);
    const newCard = {
      id: `card-custom-${Date.now()}`,
      slotNumber: ahmetCards.length + 1,
      holder: cleanHolder,
      bankName: cleanBank,
      cardLabel: cleanLabel,
      last4: "",
      cutoffDay: formatSafeDate(dueISO),
      statementDateISO: statementISO,
      dueDateISO: dueISO,
      cardLimit: limitNum,
    };
    const updated = [...ahmetCards, newCard];
    saveAhmetCards(updated);
    setNewCardFormOpen(false);
    setSelectedVisualCardId(newCard.id);
  };

  const handleDeleteCard = (cardId: string, cardTitle: string) => {
    if (!confirm(`"${cardTitle}" kartını kart listesinden silmek istediğinize emin misiniz?`)) return;
    const updated = ahmetCards
      .filter((c) => c.id !== cardId)
      .map((c, idx) => ({ ...c, slotNumber: idx + 1 }));
    saveAhmetCards(updated);
    if (selectedVisualCardId === cardId) {
      setSelectedVisualCardId("ALL_5");
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory && selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (installmentOnly) params.set("installmentOnly", "true");
      if (commitmentsOnly) params.set("commitmentsOnly", "true");
      if (chequesOnly) params.set("chequesOnly", "true");
      if (selectedMonth && selectedMonth !== "ALL") params.set("month", selectedMonth);
      if (selectedPaymentMethod && selectedPaymentMethod !== "ALL") params.set("paymentMethod", selectedPaymentMethod);
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/giderler?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const data = await res.json();
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
      if (data.monthExpenses && Array.isArray(data.monthExpenses)) {
        setMonthBaseExpenses(data.monthExpenses);
      } else if (data.expenses && Array.isArray(data.expenses)) {
        setMonthBaseExpenses(data.expenses);
      }
      if (data.rolloverExpenses && Array.isArray(data.rolloverExpenses)) {
        setRolloverExpenses(data.rolloverExpenses);
      } else {
        setRolloverExpenses([]);
      }
      if (data.availablePeriods && Array.isArray(data.availablePeriods)) {
        setAvailablePeriods(data.availablePeriods);
      }
      if (data.cardHoldersSummary) {
        setCardHoldersSummary(data.cardHoldersSummary);
      }
      if (data.allCardExpenses && Array.isArray(data.allCardExpenses)) {
        setAllCardExpenses(data.allCardExpenses);
      }
      if (data.allPhoneExpenses && Array.isArray(data.allPhoneExpenses)) {
        setAllPhoneExpenses(data.allPhoneExpenses);
      }
      if (data.allChequeExpenses && Array.isArray(data.allChequeExpenses)) {
        setAllChequeExpenses(data.allChequeExpenses);
      }
      if (data.chequePhotosMap && typeof data.chequePhotosMap === "object") {
        setChequePhotosMap(data.chequePhotosMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.assets && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
      if (typeof data.warningCount === "number") {
        setAssetWarningCount(data.warningCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    search,
    selectedCategory,
    selectedStatus,
    installmentOnly,
    commitmentsOnly,
    chequesOnly,
    selectedMonth,
    selectedPaymentMethod,
    selectedCardHolder,
  ]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const stats = useMemo(() => {
    const isCardPm = (e: SchoolExpense) =>
      e.category !== "CREDIT_CARD" &&
      e.category !== "CHEQUE" &&
      e.paymentMethod === "CREDIT_CARD";

    const totalDue = monthBaseExpenses.reduce((sum, e) => sum + (Number(e.amountDue) || 0), 0);
    const totalPaid = monthBaseExpenses.reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);
    const totalRemaining = monthBaseExpenses.reduce((sum, e) => sum + (Number(e.amountRemaining) || 0), 0);

    const cardDue = monthBaseExpenses
      .filter(isCardPm)
      .reduce((sum, e) => sum + (Number(e.amountDue) || 0), 0);
    const cashDue = Math.max(0, totalDue - cardDue);

    const cardPaid = monthBaseExpenses
      .filter(isCardPm)
      .reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);
    const cashPaid = Math.max(0, totalPaid - cardPaid);

    const cardRemaining = monthBaseExpenses
      .filter(isCardPm)
      .reduce((sum, e) => sum + (Number(e.amountRemaining) || 0), 0);
    const cashRemaining = Math.max(0, totalRemaining - cardRemaining);

    const countTotal = monthBaseExpenses.length;
    const countPending = monthBaseExpenses.filter((e) => e.status === "PENDING").length;
    const countPartial = monthBaseExpenses.filter((e) => e.status === "PARTIAL").length;
    const countPaid = monthBaseExpenses.filter((e) => e.status === "PAID").length;
    const countInstallment = monthBaseExpenses.filter((e) => Boolean(e.installmentInfo)).length;
    const countCommitment = monthBaseExpenses.filter((e) => Boolean(e.isCommitment) || Boolean(e.phoneLines)).length;
    const countCheques = monthBaseExpenses.filter(
      (e) => e.category === "CHEQUE" || e.paymentMethod === "CHEQUE"
    ).length;
    return {
      totalDue,
      totalPaid,
      totalRemaining,
      cashDue,
      cardDue,
      cashPaid,
      cardPaid,
      cashRemaining,
      cardRemaining,
      countTotal,
      countPending,
      countPartial,
      countPaid,
      countInstallment,
      countCommitment,
      countCheques,
    };
  }, [monthBaseExpenses]);

  const getDaysUntilCommitmentEnd = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      if (isNaN(end.getTime())) return null;
      end.setHours(0, 0, 0, 0);
      return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const hasValidPhoneLines = (exp: SchoolExpense): boolean => {
    if (!exp.phoneLines || exp.phoneLines === "null" || exp.phoneLines === "[]") return false;
    try {
      const parsed = typeof exp.phoneLines === "string" ? JSON.parse(exp.phoneLines) : exp.phoneLines;
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  };

  const isTelecomOrPhoneExpense = (exp: SchoolExpense): boolean => {
    if (hasValidPhoneLines(exp)) return true;
    const t = (exp.title || "").toLowerCase();
    const sub = (exp.subCategory || "").toLowerCase();
    if (t.includes("millenicom") || t.includes("internet") || t.includes("İNTERNET".toLowerCase())) {
      return false;
    }
    return (
      t.includes("vodafone") ||
      t.includes("turkcell") ||
      t.includes("türk telekom") ||
      t.includes("turk telekom") ||
      t.includes("telefon") ||
      sub.includes("telefon")
    );
  };

  const formatDisplayPhone = (raw: string | undefined | null): string => {
    if (!raw) return "";
    let digits = String(raw).replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("5")) {
      digits = "0" + digits;
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    }
    return String(raw);
  };

  const createDefault5PhoneLines = () => [
    { number: "", title: "", amount: "", commitmentEnd: "" },
    { number: "", title: "", amount: "", commitmentEnd: "" },
    { number: "", title: "", amount: "", commitmentEnd: "" },
    { number: "", title: "", amount: "", commitmentEnd: "" },
    { number: "", title: "", amount: "", commitmentEnd: "" },
    { number: "", title: "", amount: "", commitmentEnd: "" },
  ];

  // Telefon Numaralarının Taahhüt Bitişine 10 Gün (veya daha az) Kala Hatırlatma Listesi
  const expiringPhoneLines10Days = useMemo(() => {
    if (!isMounted) return [];
    const combinedSource = [...allPhoneExpenses, ...expenses];
    const seen = new Set<string>();
    const list: {
      exp: SchoolExpense;
      lineIndex: number;
      number: string;
      userTitle: string;
      amount: number;
      commitmentEnd: string;
      daysLeft: number;
    }[] = [];

    combinedSource.forEach((e) => {
      if (!e.phoneLines) return;
      try {
        const parsed = typeof e.phoneLines === "string" ? JSON.parse(e.phoneLines) : e.phoneLines;
        if (!Array.isArray(parsed)) return;
        parsed.forEach((pl: any, idx: number) => {
          if (!pl || !pl.commitmentEnd || !pl.number) return;
          const numStr = String(pl.number).trim();
          if (numStr.length < 7 || numStr.includes("100 00 0") || numStr.includes("100 00 05")) return;
          const daysLeft = getDaysUntilCommitmentEnd(pl.commitmentEnd);
          if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 10) {
            const key = `${pl.number}__${pl.commitmentEnd}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                exp: e,
                lineIndex: idx + 1,
                number: pl.number,
                userTitle: pl.title || "Belirtilmedi",
                amount: Number(pl.amount) || 0,
                commitmentEnd: pl.commitmentEnd,
                daysLeft,
              });
            }
          }
        });
      } catch {}
    });

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [allPhoneExpenses, expenses, isMounted]);

  // Taahhüt Bitişi Yaklaşan Genel Abonelikler (Son 10 gün / 45 gün)
  const expiringCommitments = useMemo(() => {
    if (!isMounted) return [];
    const map = new Map<string, { exp: SchoolExpense; daysLeft: number }>();
    const combinedSource = [...allPhoneExpenses, ...expenses];
    combinedSource.forEach((e) => {
      if (e.isCommitment && e.commitmentEndDate) {
        const diffDays = getDaysUntilCommitmentEnd(e.commitmentEndDate);
        if (diffDays !== null && diffDays <= 10) {
          if (!map.has(e.title)) {
            map.set(e.title, { exp: e, daysLeft: diffDays });
          }
        }
      }
    });
    return Array.from(map.values());
  }, [allPhoneExpenses, expenses, isMounted]);

  // Bir giderin hangi kredi kartına ait olduğunu bulma (Ahmet Taymaz, Muhammed Ali Çağır, Şirket Kartları vb.)
  const doesExpenseMatchAhmetCard = (exp: SchoolExpense, card: (typeof DEFAULT_AHMET_CARDS)[0]) => {
    if (exp.category === "LOAN" || exp.category === "CHEQUE") return false;
    const holder = (exp.cardHolder || "").toLowerCase();
    const title = (exp.title || "").toLowerCase();
    const bank = (exp.cardBank || "").toLowerCase();
    const desc = (exp.description || "").toLowerCase();
    const combinedText = `${bank} ${title} ${desc}`;

    const explicitCardTag = desc.match(/\[(card-[^\]]+)\]/i);
    if (explicitCardTag) {
      return explicitCardTag[1].toLowerCase() === card.id.toLowerCase();
    }

    const cardHolderLower = (card.holder || "").toLowerCase();
    const targetBank = (card.bankName || "").toLowerCase();
    const bankKeyword = targetBank.split(" ")[0]; // "vakıfbank", "akbank", "halkbank", "ziraat", "qnb", "denizbank", "kuveyt"

    const hasBankMatch =
      combinedText.includes(bankKeyword) ||
      (bankKeyword.includes("vak") && combinedText.includes("vak")) ||
      (bankKeyword.includes("halk") && (combinedText.includes("paraf") || combinedText.includes("halk"))) ||
      (bankKeyword.includes("kuveyt") && combinedText.includes("kuveyt")) ||
      (bankKeyword.includes("qnb") && (combinedText.includes("qnb") || combinedText.includes("cardfinans"))) ||
      (bankKeyword.includes("türkiye") && combinedText.includes("türkiye finans"));

    if (!hasBankMatch) return false;

    // 1. Ahmet Taymaz kartı mı?
    if (cardHolderLower.includes("ahmet")) {
      const isAhmet =
        holder.includes("ahmet") ||
        combinedText.includes("ahmet taymaz") ||
        combinedText.includes("(at kart");
      return isAhmet;
    }

    // 2. Muhammed Ali Çağır (MAC) kartı mı?
    if (cardHolderLower.includes("muhammed") || cardHolderLower.includes("mac")) {
      return (
        holder.includes("muhammed") ||
        holder.includes("çağır") ||
        holder.includes("mac") ||
        combinedText.includes("muhammed") ||
        combinedText.includes("mac ") ||
        combinedText.includes("(mac)")
      );
    }

    // 3. Şirket Kartları (SIMCU) mı?
    if (cardHolderLower.includes("şirket") || cardHolderLower.includes("simcu")) {
      const isSimcu =
        holder.includes("simcu") ||
        holder.includes("şirket") ||
        combinedText.includes("simcu") ||
        combinedText.includes("sır yapı") ||
        combinedText.includes("sir yapı");
      if (!isSimcu) return false;

      const labelLower = (card.cardLabel || "").toLowerCase();
      if (labelLower.includes("esnaf") && combinedText.includes("business")) return false;
      if (labelLower.includes("business") && !combinedText.includes("business")) return false;
      return true;
    }

    // 4. Diğer kart sahipleri (Duygu Köse, Emre Helvacı veya yeni eklenen kişi)
    const ownerFirstWord = cardHolderLower.split(" ")[0];
    if (ownerFirstWord && (holder.includes(ownerFirstWord) || combinedText.includes(ownerFirstWord))) {
      return true;
    }

    return false;
  };

  const findMatchingCardForExpense = (e: SchoolExpense) => {
    // 1. Doğrudan açıklamadaki kart etiketine bak ([card-1], [card-2] vb.)
    const explicitTag = (e.description || "").match(/\[(card-[^\]]+)\]/i);
    if (explicitTag) {
      const found = ahmetCards.find((c) => c.id.toLowerCase() === explicitTag[1].toLowerCase());
      if (found) return found;
    }

    // 2. Kart sahibi veya banka tanımlıysa eşleştir
    if (e.cardHolder || e.cardBank) {
      for (const card of ahmetCards) {
        if (doesExpenseMatchAhmetCard(e, card)) {
          return card;
        }
      }
    }

    return null;
  };

  // Bir giderin Son Ödeme Tarihine (dueDate / dueDateStr) göre ait olduğu Yıl ve Ayı (YYYY-M) belirler
  const getExpenseDueYM = (exp: SchoolExpense): { year: number; month: number; ym: string } => {
    if (exp.dueDate) {
      const isoMatch = String(exp.dueDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10);
        if (y >= 2000 && m >= 1 && m <= 12) {
          return { year: y, month: m, ym: `${y}-${m}` };
        }
      }
      try {
        const d = new Date(exp.dueDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          if (y >= 2000 && m >= 1 && m <= 12) {
            return { year: y, month: m, ym: `${y}-${m}` };
          }
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
  };

  const doesExpenseMatchSelectedPeriod = (exp: SchoolExpense, sel: string): boolean => {
    if (!sel || sel === "ALL") return true;
    const parsed = parseSelectedPeriod(sel);
    const expYM = getExpenseDueYM(exp);
    if (parsed.mode === "YEAR") {
      return expYM.year === parsed.year;
    }
    return expYM.year === parsed.year && expYM.month === parsed.month;
  };

  // Kartın bir kez girilen hesap kesim veya son ödeme gününü (gün sabit kalarak)
  // ilgili aya ve yıla göre otomatik yeniler:
  // 2026-10 -> 2026-10-GG, 2027-1 -> 2027-01-GG, 2028-9 -> 2028-09-GG
  const projectCardDateToActiveMonth = (
    dateISO: string | undefined | null,
    monthSelection: string,
    fixedDayOverride?: number
  ): string => {
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
  };

  const getExpenseEffectiveDateISO = (e: SchoolExpense): string | null => {
    // 1. Önce bu gider bir kredi kartına bağlıysa, o kartın sabit son ödeme gününü giderin yıl ve ayına göre baz al
    const matchedCard = findMatchingCardForExpense(e);
    if (matchedCard && (matchedCard.dueDateISO || (matchedCard as any).dueDay)) {
      const expYM = getExpenseDueYM(e);
      return projectCardDateToActiveMonth(
        matchedCard.dueDateISO,
        expYM.ym,
        (matchedCard as any).dueDay
      );
    }

    // 2. Kart eşleşmesi yoksa giderin kendi dueDate alanını kullan
    if (e.dueDate) {
      const isoMatch = String(e.dueDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
      try {
        const d = new Date(e.dueDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        }
      } catch {}
    }

    // 3. dueDate yoksa dueDateStr içinden Türkçe tarih ayrıştır (örn: "15 Ekim 2026")
    if (e.dueDateStr) {
      const trMonths: Record<string, string> = {
        ocak: "01",
        şubat: "02",
        subat: "02",
        mart: "03",
        nisan: "04",
        mayıs: "05",
        mayis: "05",
        haziran: "06",
        temmuz: "07",
        ağustos: "08",
        agustos: "08",
        eylül: "09",
        eylul: "09",
        ekim: "10",
        kasım: "11",
        kasim: "11",
        aralık: "12",
        aralik: "12",
      };
      const m = e.dueDateStr.toLowerCase().match(/(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/i);
      if (m && trMonths[m[2]]) {
        return `${m[3]}-${trMonths[m[2]]}-${String(m[1]).padStart(2, "0")}`;
      }
    }
    return null;
  };

  const getDaysUntilDateISO = (dateISO?: string | null): number | null => {
    if (!dateISO) return null;
    const m = String(dateISO).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    if (isNaN(target.getTime())) return null;
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Çek Ödeme Tarihine 3 Gün (veya daha az) Kala Hatırlatma Listesi
  const upcomingCheques3Days = useMemo(() => {
    if (!isMounted) return [];
    const combined = [...allChequeExpenses, ...expenses];
    const map = new Map<string, { exp: SchoolExpense; dateISO: string; daysLeft: number }>();
    combined.forEach((e) => {
      if (e.category !== "CHEQUE" && e.paymentMethod !== "CHEQUE") return;
      if (e.status === "PAID" || e.amountRemaining <= 0) return;
      const effISO = getExpenseEffectiveDateISO(e);
      if (!effISO) return;
      const daysLeft = getDaysUntilDateISO(effISO);
      if (daysLeft !== null && daysLeft <= 3) {
        if (!map.has(e.id)) {
          map.set(e.id, { exp: e, dateISO: effISO, daysLeft });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [allChequeExpenses, expenses, isMounted]);

  // Bugün veya Vadesi Geçmiş Olan Faturalar & Kartlar (Seçili ayın tüm kayıtları üzerinden, filtrelerden bağımsız)
  const dueTodayOrOverdue = useMemo(() => {
    if (!isMounted) return [];
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return monthBaseExpenses.filter((e) => {
      if (e.status === "PAID") return false;
      const effISO = getExpenseEffectiveDateISO(e);
      if (!effISO) return false;
      return effISO <= todayISO;
    });
  }, [monthBaseExpenses, ahmetCards, isMounted]);

  // Tabloda gösterilecek liste (Girilen çek ödemelerini ödeme listesinde her zaman gösterir, 3 gün kalan çekleri ve bugün son ödemesi olanları en üste alır)
  const displayedExpenses = useMemo(() => {
    if (!isMounted) return expenses;
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Girilen çek ödemeleri kendi yıl ve ayında (veya Tüm Aylar seçiliyse) ödeme listesinde her zaman görünsün
    const baseListMap = new Map<string, SchoolExpense>();
    expenses.forEach((e) => baseListMap.set(e.id, e));
    if (
      (selectedCategory === "ALL" || selectedCategory === "CHEQUE") &&
      !installmentOnly &&
      !commitmentsOnly &&
      selectedPaymentMethod !== "CREDIT_CARD" &&
      selectedCardHolder === "ALL"
    ) {
      allChequeExpenses.forEach((chq) => {
        if (!doesExpenseMatchSelectedPeriod(chq, selectedMonth)) return;
        if (selectedStatus !== "ALL") {
          if (selectedStatus === "PENDING") {
            if (chq.status !== "PENDING" && chq.status !== "PARTIAL") return;
          } else if (chq.status !== selectedStatus) {
            return;
          }
        }
        if (search) {
          const q = search.toLowerCase();
          const hay = `${chq.title} ${chq.subCategory || ""} ${chq.description || ""} ${chq.chequeNo || ""} ${chq.chequeBank || ""}`.toLowerCase();
          if (!hay.includes(q)) return;
        }
        if (!baseListMap.has(chq.id)) {
          baseListMap.set(chq.id, chq);
        }
      });
    }
    const mergedExpenses = Array.from(baseListMap.values());

    let baseList = mergedExpenses;

    if (selectedDueDateFilter) {
      baseList = baseList.filter((e) => {
        const effISO = getExpenseEffectiveDateISO(e);
        return effISO === selectedDueDateFilter;
      });
    }

    if (dueTodayOnly) {
      baseList = baseList.filter((e) => {
        if (e.status === "PAID") return false;
        const effISO = getExpenseEffectiveDateISO(e);
        if (!effISO) return false;
        return effISO <= todayISO;
      });
    }

    return [...baseList].sort((a, b) => {
      const aISO = getExpenseEffectiveDateISO(a);
      const bISO = getExpenseEffectiveDateISO(b);

      if (sortBy === "DUE_DATE_ASC") {
        // En Yakın Vade (Önce Vadesi Gelenler / Artan)
        if (aISO && bISO) {
          const cmp = aISO.localeCompare(bISO);
          if (cmp !== 0) return cmp;
        } else if (aISO) {
          return -1;
        } else if (bISO) {
          return 1;
        }

        // Aynı tarihte ise: Ödenmemişler (PENDING / PARTIAL) önce, ödenenler sonra
        if (a.status !== b.status) {
          if (a.status === "PAID") return 1;
          if (b.status === "PAID") return -1;
        }

        // Sonra kalan tutara göre (yüksekten düşüğe)
        if (b.amountRemaining !== a.amountRemaining) {
          return b.amountRemaining - a.amountRemaining;
        }
        return a.title.localeCompare(b.title, "tr");
      }

      if (sortBy === "DUE_DATE_DESC") {
        // En Uzak Vade (İleri Vadeli Olanlar / Azalan)
        if (aISO && bISO) {
          const cmp = bISO.localeCompare(aISO);
          if (cmp !== 0) return cmp;
        } else if (aISO) {
          return -1;
        } else if (bISO) {
          return 1;
        }

        if (a.status !== b.status) {
          if (a.status === "PAID") return 1;
          if (b.status === "PAID") return -1;
        }

        if (b.amountRemaining !== a.amountRemaining) {
          return b.amountRemaining - a.amountRemaining;
        }
        return a.title.localeCompare(b.title, "tr");
      }

      if (sortBy === "CREATED_DESC") {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      }

      if (sortBy === "AMOUNT_DESC") {
        if (b.amountRemaining !== a.amountRemaining) {
          return b.amountRemaining - a.amountRemaining;
        }
        return b.amountDue - a.amountDue;
      }

      if (sortBy === "AMOUNT_ASC") {
        if (a.amountRemaining !== b.amountRemaining) {
          return a.amountRemaining - b.amountRemaining;
        }
        return a.amountDue - b.amountDue;
      }

      return 0;
    });
  }, [
    expenses,
    allChequeExpenses,
    selectedMonth,
    selectedCategory,
    selectedStatus,
    installmentOnly,
    commitmentsOnly,
    selectedPaymentMethod,
    selectedCardHolder,
    search,
    dueTodayOnly,
    selectedDueDateFilter,
    ahmetCards,
    isMounted,
    sortBy,
  ]);

  // Çek görselini sıkıştıran yardımcı fonksiyon
  const compressChequeImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
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
          if (!ctx) return reject("Canvas hatası");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject("Görsel okunamadı");
        img.src = ev.target?.result as string;
      };
      reader.onerror = () => reject("Dosya okunamadı");
      reader.readAsDataURL(file);
    });
  };

  // Modal içindeki "QR ile Çek Fotoğrafı Ekle" butonuna tıklandığında QR oluştur
  const handleToggleFormQr = async () => {
    if (showFormQr) {
      setShowFormQr(false);
      return;
    }
    const targetId = editingExpense ? editingExpense.id : draftChequeId || `draft-${Date.now()}`;
    if (!editingExpense && !draftChequeId) {
      setDraftChequeId(targetId);
    }
    setShowFormQr(true);
    try {
      const res = await fetch(`/api/giderler/cek/${targetId}/foto`);
      const data = await res.json();
      const lanIp = data?.lanIp;
      const port = window.location.port ? `:${window.location.port}` : "";
      const isLocal =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const baseOrigin =
        isLocal && lanIp ? `http://${lanIp}${port}` : window.location.origin;
      const targetUrl = `${baseOrigin}/foto-yukle/cek/${targetId}`;
      setFormQrTargetUrl(targetUrl);
      const qrData = await QRCode.toDataURL(targetUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#064e3b", light: "#ffffff" },
      });
      setFormQrDataUrl(qrData);
    } catch {
      const fallbackUrl = `${window.location.origin}/foto-yukle/cek/${targetId}`;
      setFormQrTargetUrl(fallbackUrl);
      const qrData = await QRCode.toDataURL(fallbackUrl, { width: 240, margin: 2 });
      setFormQrDataUrl(qrData);
    }
  };

  // Ödeme listesindeki veya üst uyarıdaki bir çek için doğrudan QR & Görsel Modalını aç
  const openChequeQrModal = async (expense: SchoolExpense) => {
    setActiveQrChequeExpense(expense);
    setQrModalDataUrl("");
    setQrModalTargetUrl("");
    try {
      const res = await fetch(`/api/giderler/cek/${expense.id}/foto`);
      const data = await res.json();
      if (data?.photoUrl) {
        setChequePhotosMap((prev) => ({ ...prev, [expense.id]: data.photoUrl }));
      }
      const lanIp = data?.lanIp;
      const port = window.location.port ? `:${window.location.port}` : "";
      const isLocal =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const baseOrigin =
        isLocal && lanIp ? `http://${lanIp}${port}` : window.location.origin;
      const targetUrl = `${baseOrigin}/foto-yukle/cek/${expense.id}`;
      setQrModalTargetUrl(targetUrl);
      const qrData = await QRCode.toDataURL(targetUrl, {
        width: 260,
        margin: 2,
        color: { dark: "#064e3b", light: "#ffffff" },
      });
      setQrModalDataUrl(qrData);
    } catch {
      const fallbackUrl = `${window.location.origin}/foto-yukle/cek/${expense.id}`;
      setQrModalTargetUrl(fallbackUrl);
      const qrData = await QRCode.toDataURL(fallbackUrl, { width: 260, margin: 2 });
      setQrModalDataUrl(qrData);
    }
  };

  // Modal içinde QR açıkken telefondan yüklenen çek fotoğrafını otomatik dinle (Polling)
  useEffect(() => {
    if (!modalOpen || !showFormQr) return;
    const targetId = editingExpense ? editingExpense.id : draftChequeId;
    if (!targetId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/giderler/cek/${targetId}/foto`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.photoUrl && data.photoUrl !== formChequePhotoUrl) {
          setFormChequePhotoUrl(data.photoUrl);
          if (editingExpense) {
            setChequePhotosMap((prev) => ({ ...prev, [editingExpense.id]: data.photoUrl }));
          }
          setShowFormQr(false);
        }
      } catch {}
    }, 2200);

    return () => clearInterval(interval);
  }, [modalOpen, showFormQr, editingExpense, draftChequeId, formChequePhotoUrl]);

  // Liste satırından açılan QR Çek Modalı açıkken telefondan yüklenen fotoğrafı otomatik dinle
  useEffect(() => {
    if (!activeQrChequeExpense) return;
    const expId = activeQrChequeExpense.id;
    const currentPhoto = chequePhotosMap[expId] || null;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/giderler/cek/${expId}/foto`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.photoUrl && data.photoUrl !== currentPhoto) {
          setChequePhotosMap((prev) => ({ ...prev, [expId]: data.photoUrl }));
        }
      } catch {}
    }, 2200);

    return () => clearInterval(interval);
  }, [activeQrChequeExpense, chequePhotosMap]);

  const openNewModal = () => {
    setEditingExpense(null);
    setFormChequePhotoUrl(null);
    setDraftChequeId(`draft-${Date.now()}`);
    setShowFormQr(false);
    setFormQrDataUrl("");
    const todayStr = new Date().toISOString().split("T")[0];
    const parsedSel = parseSelectedPeriod(selectedMonth);
    setPhoneLinesList([]);
    setShowPhoneLinesInModal(false);
    setForm({
      title: "",
      category: "INVOICE",
      subCategory: "",
      dueDateStr: "",
      dueDate: todayStr,
      monthIndex: parsedSel.month,
      amountDue: "",
      description: "",
      entryType: "SINGLE",
      invoiceRepeatMonths: 12,
      invoiceFutureAmountMode: "SAME_AMOUNT",
      isInstallment: false,
      installmentCount: 12,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: false,
      commitmentMonths: 12,
      paymentMethod: "CASH",
      cardHolder: "",
      cardBank: "",
      chequeNo: "",
      chequeBank: "",
    });
    setModalOpen(true);
  };

  const openNewChequeModal = () => {
    setEditingExpense(null);
    setFormChequePhotoUrl(null);
    setDraftChequeId(`draft-${Date.now()}`);
    setShowFormQr(false);
    setFormQrDataUrl("");
    const todayStr = new Date().toISOString().split("T")[0];
    const parsedSel = parseSelectedPeriod(selectedMonth);
    setPhoneLinesList([]);
    setShowPhoneLinesInModal(false);
    setForm({
      title: "Çek Ödemesi",
      category: "CHEQUE",
      subCategory: "Çek Ödemesi",
      dueDateStr: "",
      dueDate: todayStr,
      monthIndex: parsedSel.month,
      amountDue: "",
      description: "",
      entryType: "CHEQUE_PAYMENT",
      invoiceRepeatMonths: 1,
      invoiceFutureAmountMode: "SAME_AMOUNT",
      isInstallment: false,
      installmentCount: 1,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: false,
      commitmentMonths: 12,
      paymentMethod: "CASH",
      cardHolder: "",
      cardBank: "",
      chequeNo: "",
      chequeBank: "",
    });
    setModalOpen(true);
  };

  const openNewUtilityInvoiceModal = (presetType?: "DOGALGAZ" | "ELEKTRIK" | "SU" | "INTERNET") => {
    setEditingExpense(null);
    const todayStr = new Date().toISOString().split("T")[0];
    const parsedSel = parseSelectedPeriod(selectedMonth);
    setPhoneLinesList([]);
    setShowPhoneLinesInModal(false);
    const defaultTitle =
      presetType === "DOGALGAZ"
        ? "Doğalgaz Faturası (Kayserigaz)"
        : presetType === "ELEKTRIK"
        ? "Elektrik Faturası (KCETAŞ)"
        : presetType === "SU"
        ? "Su Faturası (KASKİ)"
        : presetType === "INTERNET"
        ? "İnternet Faturası"
        : "Doğalgaz / Elektrik Faturası";
    const defaultSub =
      presetType === "DOGALGAZ"
        ? "F-Doğalgaz"
        : presetType === "ELEKTRIK"
        ? "F-Elektrik"
        : presetType === "SU"
        ? "F-Su"
        : presetType === "INTERNET"
        ? "F-Haberleşme & İnternet"
        : "F-Doğalgaz & Elektrik";
    setForm({
      title: defaultTitle,
      category: "INVOICE",
      subCategory: defaultSub,
      dueDateStr: "",
      dueDate: todayStr,
      monthIndex: parsedSel.month,
      amountDue: "",
      description: "",
      entryType: "UTILITY_INVOICE",
      invoiceRepeatMonths: 12,
      invoiceFutureAmountMode: "SAME_AMOUNT",
      isInstallment: false,
      installmentCount: 12,
      currentInstallment: 1,
      amountMode: "MONTHLY",
      isCommitment: false,
      commitmentMonths: 12,
      paymentMethod: "CASH",
      cardHolder: "",
      cardBank: "",
      chequeNo: "",
      chequeBank: "",
    });
    setModalOpen(true);
  };

  const openNewPhoneInvoiceModal = () => {
    setEditingExpense(null);
    const todayStr = new Date().toISOString().split("T")[0];
    const parsedSel = parseSelectedPeriod(selectedMonth);
    let parsedLines: any[] = [];
    const otherWithLines = [...allPhoneExpenses, ...expenses].find(
      (e) => e.phoneLines && e.phoneLines !== "null" && e.phoneLines !== "[]"
    );
    if (otherWithLines?.phoneLines) {
      try {
        parsedLines =
          typeof otherWithLines.phoneLines === "string"
            ? JSON.parse(otherWithLines.phoneLines)
            : otherWithLines.phoneLines;
      } catch {}
    }
    const normalized = Array.isArray(parsedLines) && parsedLines.length > 0
      ? parsedLines.map((p: any) => ({
          number: p.number || "",
          title: p.title || "",
          amount: p.amount !== undefined && p.amount !== null ? String(p.amount) : "",
          commitmentEnd: p.commitmentEnd || "",
        }))
      : createDefault5PhoneLines();
    while (normalized.length < 6) {
      normalized.push({ number: "", title: "", amount: "", commitmentEnd: "" });
    }
    const lineCount = normalized.filter((p) => p.number || p.title).length || normalized.length;
    setPhoneLinesList(normalized);
    setShowPhoneLinesInModal(true);
    setForm({
      title: `Vodafone Kurumsal Hatlar (Tek Fatura - ${lineCount} Hat)`,
      category: "INVOICE",
      subCategory: "F-Haberleşme & Telefon",
      dueDateStr: "",
      dueDate: todayStr,
      monthIndex: parsedSel.month,
      amountDue: "",
      description: `Tek fatura içerisinde ${lineCount} kurumsal hat kullanım ücreti ve taahhüt takibi`,
      entryType: "COMMITMENT",
      invoiceRepeatMonths: 12,
      invoiceFutureAmountMode: "SAME_AMOUNT",
      isInstallment: false,
      installmentCount: 12,
      currentInstallment: 1,
      amountMode: "MONTHLY",
      isCommitment: true,
      commitmentMonths: 12,
      paymentMethod: "CASH",
      cardHolder: "",
      cardBank: "",
      chequeNo: "",
      chequeBank: "",
    });
    setModalOpen(true);
  };

  const phoneInvoicesForPanel = useMemo(() => {
    const combined = [...expenses, ...allPhoneExpenses];
    const map = new Map<string, SchoolExpense>();
    combined.forEach((e) => {
      if (!isTelecomOrPhoneExpense(e)) return;
      if (!doesExpenseMatchSelectedPeriod(e, selectedMonth)) return;
      if (!map.has(e.id)) {
        map.set(e.id, e);
      }
    });
    // Seçili ayda henüz fatura yoksa diğer aylardaki vodafone/telefon faturasını da göster
    if (map.size === 0) {
      combined.forEach((e) => {
        if (!isTelecomOrPhoneExpense(e)) return;
        if (!map.has(e.title)) {
          map.set(e.title, e);
        }
      });
    }
    return Array.from(map.values());
  }, [expenses, allPhoneExpenses, selectedMonth]);

  const openEditModal = (expense: SchoolExpense) => {
    setEditingExpense(expense);
    setFormChequePhotoUrl(chequePhotosMap[expense.id] || null);
    setDraftChequeId(expense.id);
    setShowFormQr(false);
    setFormQrDataUrl("");
    setPhoneLinesList([]);
    setShowPhoneLinesInModal(false);
    const effectiveISO = getExpenseEffectiveDateISO(expense) || new Date().toISOString().split("T")[0];
    const expYM = getExpenseDueYM(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      subCategory: expense.subCategory || "",
      dueDateStr: "",
      dueDate: effectiveISO,
      monthIndex: expYM.month || expense.monthIndex || 9,
      amountDue: String(expense.amountDue),
      description: expense.description || "",
      entryType:
        expense.category === "CHEQUE"
          ? "CHEQUE_PAYMENT"
          : expense.isCommitment
          ? "COMMITMENT"
          : expense.installmentInfo
          ? "INSTALLMENT"
          : "SINGLE",
      invoiceRepeatMonths: 12,
      invoiceFutureAmountMode: "SAME_AMOUNT",
      isInstallment: Boolean(expense.installmentInfo),
      installmentCount: 1,
      currentInstallment: 1,
      amountMode: "TOTAL",
      isCommitment: Boolean(expense.isCommitment),
      commitmentMonths: expense.commitmentMonths || 12,
      paymentMethod: expense.paymentMethod || "CASH",
      cardHolder: expense.cardHolder || "",
      cardBank: expense.cardBank || "",
      chequeNo: expense.chequeNo || "",
      chequeBank: expense.chequeBank || "",
    });
    setModalOpen(true);
  };

  const openPhoneLinesModal = (expense: SchoolExpense) => {
    setActivePhoneExpense(expense);
    let parsedLines: any[] = [];
    try {
      if (expense.phoneLines && expense.phoneLines !== "null" && expense.phoneLines !== "[]") {
        parsedLines =
          typeof expense.phoneLines === "string"
            ? JSON.parse(expense.phoneLines)
            : expense.phoneLines;
      } else {
        const otherWithLines = [...allPhoneExpenses, ...expenses].find(
          (e) => e.phoneLines && e.phoneLines !== "null" && e.phoneLines !== "[]"
        );
        if (otherWithLines?.phoneLines) {
          parsedLines =
            typeof otherWithLines.phoneLines === "string"
              ? JSON.parse(otherWithLines.phoneLines)
              : otherWithLines.phoneLines;
        }
      }
    } catch (e) {}

    const normalized = Array.isArray(parsedLines)
      ? parsedLines.map((p: any) => ({
          number: p.number || "",
          title: p.title || "",
          amount: p.amount !== undefined && p.amount !== null ? String(p.amount) : "",
          commitmentEnd: p.commitmentEnd || "",
        }))
      : [];
    while (normalized.length < 6) {
      normalized.push({ number: "", title: "", amount: "", commitmentEnd: "" });
    }
    setPhoneModalLines(normalized);
    setSyncPhoneAmountToInvoice(false);
    setPhoneModalOpen(true);
  };

  const handleSavePhoneLines = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhoneExpense) return;
    try {
      setPhoneModalSubmitting(true);
      const validLines = phoneModalLines
        .filter(
          (p) =>
            (p.number || "").trim() !== "" ||
            (p.title || "").trim() !== "" ||
            Number(p.amount) > 0 ||
            (p.commitmentEnd || "").trim() !== ""
        )
        .map((p) => {
          let num = (p.number || "").trim().replace(/\s+/g, "");
          if (num.length === 10 && num.startsWith("5")) {
            num = "0" + num;
          }
          return {
            number: num || (p.number || "").trim(),
            title: (p.title || "").trim(),
            amount: Number(p.amount) || 0,
            commitmentEnd: (p.commitmentEnd || "").trim(),
          };
        });

      const linesTotalAmount = Number(
        validLines.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)
      );

      const res = await fetch(`/api/giderler/${activePhoneExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PHONE_LINES",
          phoneLines: validLines.length > 0 ? validLines : null,
          syncAmountToTotal: syncPhoneAmountToInvoice,
          linesTotalAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Telefon numaraları kaydedilemedi");
        return;
      }

      const updatedExpense: SchoolExpense = await res.json();
      const serialized = validLines.length > 0 ? JSON.stringify(validLines) : null;
      const lineCount = validLines.length;

      // Anında arayüze yansıt (Optimistic Update)
      const updateListWithPhoneLines = (list: SchoolExpense[]) =>
        list.map((exp) => {
          if (
            exp.id === activePhoneExpense.id ||
            exp.title === activePhoneExpense.title ||
            (exp.title || "").toLowerCase().includes("vodafone") ||
            Boolean(exp.phoneLines)
          ) {
            let nextTitle = exp.title;
            if (lineCount > 0 && nextTitle && /Tek Fatura\s*-\s*\d+\s*(Numara|Hat)/i.test(nextTitle)) {
              nextTitle = nextTitle.replace(/Tek Fatura\s*-\s*\d+\s*(Numara|Hat)/i, `Tek Fatura - ${lineCount} Hat`);
            }
            return {
              ...exp,
              ...(nextTitle !== exp.title ? { title: nextTitle } : {}),
              phoneLines: serialized,
              isCommitment: serialized ? true : exp.isCommitment,
              ...(syncPhoneAmountToInvoice && linesTotalAmount > 0
                ? {
                    amountDue: linesTotalAmount,
                    amountRemaining: Math.max(0, Number((linesTotalAmount - exp.amountPaid).toFixed(2))),
                    status: (exp.amountPaid >= linesTotalAmount
                      ? "PAID"
                      : exp.amountPaid > 0
                      ? "PARTIAL"
                      : "PENDING") as any,
                  }
                : {}),
            };
          }
          return exp;
        });

      setExpenses((prev) => updateListWithPhoneLines(prev));
      setAllPhoneExpenses((prev) => updateListWithPhoneLines(prev));
      setMonthBaseExpenses((prev) => updateListWithPhoneLines(prev));
      setActivePhoneExpense(updatedExpense);

      setPhoneModalOpen(false);
      await fetchExpenses();
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setPhoneModalSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingExpense ? `/api/giderler/${editingExpense.id}` : "/api/giderler";
      const method = editingExpense ? "PUT" : "POST";

      const filteredLines = form.entryType === "COMMITMENT"
        ? phoneLinesList
            .filter(
              (p) =>
                (p.number || "").trim() !== "" ||
                (p.title || "").trim() !== "" ||
                Number(p.amount) > 0 ||
                (p.commitmentEnd || "").trim() !== ""
            )
            .map((p) => ({
              number: (p.number || "").trim(),
              title: (p.title || "").trim(),
              amount: Number(p.amount) || 0,
              commitmentEnd: (p.commitmentEnd || "").trim(),
            }))
        : [];

      const isCommitment = form.entryType === "COMMITMENT";
      const isInstallment = form.entryType === "INSTALLMENT";
      const isRecurringInvoice = form.entryType === "UTILITY_INVOICE";

      let finalCardHolder = form.cardHolder;
      let finalCardBank = form.cardBank;
      let finalDescription = form.description || "";

      if (form.category === "CREDIT_CARD" || form.paymentMethod === "CREDIT_CARD") {
        // Yalnızca kullanıcı modal içinde açıkça bir kart seçtiyse veya kart sahibi & banka girdiyse karta bağla
        const explicitTag = (finalDescription.match(/\[(card-[^\]]+)\]/i) || [])[1];
        let matchedCard = explicitTag
          ? ahmetCards.find((c) => c.id.toLowerCase() === explicitTag.toLowerCase())
          : null;

        if (!matchedCard && form.cardHolder && form.cardBank) {
          matchedCard = ahmetCards.find(
            (c) =>
              c.holder.toLowerCase() === form.cardHolder.toLowerCase() &&
              c.bankName.toLowerCase() === form.cardBank.toLowerCase()
          );
        }

        if (matchedCard) {
          if (!finalCardHolder) finalCardHolder = matchedCard.holder;
          if (!finalCardBank) finalCardBank = matchedCard.bankName;
          if (!/\[(card-[^\]]+)\]/i.test(finalDescription)) {
            finalDescription = `${finalDescription ? finalDescription + " " : ""}[${matchedCard.id}]`.trim();
          }
        }
      }

      const isChequeEntry =
        form.entryType === "CHEQUE_PAYMENT" ||
        form.category === "CHEQUE" ||
        form.paymentMethod === "CHEQUE";
      const finalCategory = isChequeEntry ? "CHEQUE" : form.category;
      const finalPaymentMethod =
        finalCategory === "CREDIT_CARD" || finalCategory === "CHEQUE"
          ? "CASH"
          : form.paymentMethod;

      let effectiveMonthIndex = Number(form.monthIndex) || 9;
      let targetSavedYM: string | null = null;
      if (form.dueDate) {
        const isoMatch = String(form.dueDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const y = parseInt(isoMatch[1], 10);
          const m = parseInt(isoMatch[2], 10);
          if (y >= 2000 && m >= 1 && m <= 12) {
            effectiveMonthIndex = m;
            targetSavedYM = `${y}-${m}`;
          }
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monthIndex: effectiveMonthIndex,
          category: finalCategory,
          paymentMethod: finalPaymentMethod,
          cardHolder: finalCardHolder,
          cardBank: finalCardBank,
          description: finalDescription,
          isCommitment,
          isInstallment,
          isRecurringInvoice,
          invoiceRepeatMonths: Number(form.invoiceRepeatMonths) || 12,
          invoiceFutureAmountMode: form.invoiceFutureAmountMode || "SAME_AMOUNT",
          amountDue: Number(form.amountDue) || 0,
          customInstallments:
            isInstallment && Number(form.installmentCount) > 1
              ? formCustomInstallments.map((v) => Number(v) || 0)
              : null,
          phoneLines: filteredLines.length > 0 ? filteredLines : null,
          chequePhotoUrl: isChequeEntry ? formChequePhotoUrl : undefined,
          draftChequeId: !editingExpense && isChequeEntry ? draftChequeId : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "İşlem başarısız");
        return;
      }

      if (filteredLines.length > 0) {
        const serialized = JSON.stringify(filteredLines);
        const updatePhoneLinesEverywhere = (list: SchoolExpense[]) =>
          list.map((exp) => {
            if (
              (editingExpense && exp.id === editingExpense.id) ||
              exp.title === form.title ||
              (exp.title || "").toLowerCase().includes("vodafone") ||
              Boolean(exp.phoneLines)
            ) {
              return {
                ...exp,
                phoneLines: serialized,
                isCommitment: true,
              };
            }
            return exp;
          });
        setExpenses((prev) => updatePhoneLinesEverywhere(prev));
        setAllPhoneExpenses((prev) => updatePhoneLinesEverywhere(prev));
        setMonthBaseExpenses((prev) => updatePhoneLinesEverywhere(prev));
      }

      setModalOpen(false);
      if (targetSavedYM && selectedMonth !== "ALL") {
        const curParsed = parseSelectedPeriod(selectedMonth);
        if (curParsed.ym !== targetSavedYM) {
          setSelectedMonth(targetSavedYM);
          return;
        }
      }
      await fetchExpenses();
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string, exp?: SchoolExpense) => {
    let deleteAllSeries = false;
    if (exp?.installmentInfo) {
      const askAll = confirm(
        `"${title}" (${exp.installmentInfo}) taksitli bir ödemedir.\n\n` +
        `Bu plana ait TÜM TAKSİTLERİ topluca silmek istiyor musunuz?\n\n` +
        `• [Tamam] = Bu başlığa ait TÜM taksitleri siler\n` +
        `• [İptal] = Sadece SEÇİLİ BU TAKSİTİ silme adımına geçer`
      );
      if (askAll) {
        if (!confirm(`DİKKAT: "${title}" başlığına ait tüm taksitler kalıcı olarak silinecek. Emin misiniz?`)) return;
        deleteAllSeries = true;
      } else {
        if (!confirm(`Sadece bu döneme ait "${title} (${exp.installmentInfo})" taksitini silmek istediğinize emin misiniz?`)) return;
      }
    } else {
      if (!confirm(`"${title}" gider kaydını silmek istediğinize emin misiniz?`)) return;
    }

    try {
      const url = deleteAllSeries ? `/api/giderler/${id}?deleteAllSeries=true` : `/api/giderler/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchExpenses();
      } else {
        alert(data.error || "Gider kaydı silinemedi.");
      }
    } catch (e) {
      alert("Gider kaydı silinemedi (Bağlantı hatası)");
    }
  };

  const handleMarkPaid = async (expense: SchoolExpense) => {
    if (!confirm(`"${expense.title}" ödemesinin tamamını ödendi olarak işaretlemek istiyor musunuz?`)) return;
    try {
      const res = await fetch(`/api/giderler/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_PAID" }),
      });
      if (res.ok) fetchExpenses();
    } catch (e) {
      alert("İşlem yapılamadı");
    }
  };

  const handleResetPayment = async (expense: SchoolExpense) => {
    if (
      !confirm(
        `"${expense.title}" için yapılan ödemeyi iptal etmek ve kaydı "Bekliyor" durumuna geri almak istiyor musunuz?\n\n(Ödenen tutar sıfırlanacak ve borç tekrar bekliyor olacaktır.)`
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
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme iptal edilemedi");
      }
    } catch (e) {
      alert("Ödeme iptal edilemedi (Bağlantı hatası)");
    }
  };

  const handleDeletePaymentItem = async (expense: SchoolExpense, index: number) => {
    if (!confirm("Bu ödeme parçası kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/giderler/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_PAYMENT", index }),
      });
      if (res.ok) {
        fetchExpenses();
        if (activePaymentExpense && activePaymentExpense.id === expense.id) {
          const updated = await res.json();
          setActivePaymentExpense(updated);
          setPaymentAmount(String(updated.amountRemaining));
        }
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme silinemedi");
      }
    } catch (e) {
      alert("İşlem yapılamadı");
    }
  };

  const openPaymentModal = (expense: SchoolExpense) => {
    setActivePaymentExpense(expense);
    setPaymentAmount(String(expense.amountRemaining));
    setPaymentNote("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
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

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Ödeme eklenemedi");
        return;
      }

      setPaymentModalOpen(false);
      fetchExpenses();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const ahmetCardsComputed = useMemo(() => {
    const monthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

    return ahmetCards.map((card) => {
      const allTx = allCardExpenses.filter((exp) => doesExpenseMatchAhmetCard(exp, card));
      const monthTx =
        selectedMonth !== "ALL"
          ? allTx.filter((exp) => doesExpenseMatchSelectedPeriod(exp, selectedMonth))
          : allTx;

      // O ayki ekstre toplamı
      const monthStatementTotal = monthTx.reduce((s, e) => s + e.amountDue, 0);
      const monthStatementPaid = monthTx.reduce((s, e) => s + e.amountPaid, 0);
      const monthStatementRemaining = monthTx.reduce((s, e) => s + e.amountRemaining, 0);

      // Tüm aylar (yaptığım tüm harcamaların toplam ödeyeceğim tutarı)
      // Düzenli aylık fatura talimatlarında ("Aylık Düzenli Fatura") henüz kesilmemiş gelecek 11 ay yerine cari/seçili ay baz alınır;
      // normal kart harcamaları ve taksitli alışverişlerin tamamı kullanılabilir limitten düşer.
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

      // Kart Limiti, Kullanılan (Toplam Kalan Borç) ve Kullanılabilir Limit
      const cardLimit = Number((card as any).cardLimit) > 0 ? Number((card as any).cardLimit) : 750000;
      const usedLimit = Number(allTimeTotalRemaining.toFixed(2));
      const availableLimit = Math.max(0, Number((cardLimit - usedLimit).toFixed(2)));

      // Aylara göre taksit/ekstre dağılımı
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
        (card as any).statementDateISO,
        selectedMonth,
        (card as any).statementDay
      );
      const effectiveDueDateISO = projectCardDateToActiveMonth(
        card.dueDateISO,
        selectedMonth,
        (card as any).dueDay
      );

      return {
        ...card,
        statementDateISO: effectiveStatementDateISO,
        dueDateISO: effectiveDueDateISO,
        cutoffDay: formatSafeDate(effectiveDueDateISO),
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
      };
    });
  }, [ahmetCards, allCardExpenses, selectedMonth]);

  const openCardPayModal = (cardId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetCard = ahmetCardsComputed.find((c) => c.id === cardId) || ahmetCardsComputed[0];
    if (!targetCard) return;
    setSelectedVisualCardId(targetCard.id);
    const defaultPayAmount =
      targetCard.monthStatementRemaining > 0
        ? targetCard.monthStatementRemaining
        : targetCard.allTimeTotalRemaining;

    const parsedSel = parseSelectedPeriod(selectedMonth);
    setCardPayForm({
      cardId: targetCard.id,
      amount: defaultPayAmount > 0 ? String(Number(defaultPayAmount.toFixed(2))) : "",
      date: todayStr,
      note: `${selectedMonth === "ALL" ? "Tüm Dönem" : parsedSel.label} Kart Borcu / Ekstre Ödemesi (${targetCard.bankName})`,
    });
    setCardPayModalOpen(true);
  };

  const handlePayCardStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCard = ahmetCardsComputed.find((c) => c.id === cardPayForm.cardId);
    if (!targetCard) return;

    const unpaidInMonth = targetCard.monthTx.filter((tx) => tx.status !== "PAID");
    const targetTxList =
      unpaidInMonth.length > 0 ? unpaidInMonth : targetCard.allTx.filter((tx) => tx.status !== "PAID");

    if (targetTxList.length === 0) {
      alert("Bu kartın seçili dönemde ödenmemiş harcaması bulunmuyor.");
      return;
    }

    const payAmount = Number(cardPayForm.amount) || 0;
    if (payAmount <= 0) {
      alert("Lütfen geçerli bir ödeme tutarı girin.");
      return;
    }

    try {
      setCardPaySubmitting(true);
      const res = await fetch("/api/giderler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_CARD_STATEMENT",
          expenseIds: targetTxList.map((tx) => tx.id),
          amount: payAmount,
          date: cardPayForm.date,
          note: cardPayForm.note,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Kart borcu ödemesi işlenemedi");
        return;
      }

      setCardPayModalOpen(false);
      setSelectedVisualCardId(targetCard.id);
      fetchExpenses();
    } catch (err) {
      alert("Kart borcu ödenirken hata oluştu");
    } finally {
      setCardPaySubmitting(false);
    }
  };

  const handleCardStatementDateChange = (cardId: string, newStatementDateISO: string) => {
    if (!newStatementDateISO) return;
    const dayNum = parseInt(newStatementDateISO.split("-")[2], 10);
    const updatedCards = ahmetCards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            statementDateISO: newStatementDateISO,
            ...(dayNum >= 1 && dayNum <= 31 ? { statementDay: dayNum } : {}),
          }
        : c
    );
    saveAhmetCards(updatedCards);
  };

  const handleCardDueDateChange = async (cardId: string, newDateISO: string) => {
    if (!newDateISO) return;
    const formattedShort = formatSafeDate(newDateISO);
    const dayNum = parseInt(newDateISO.split("-")[2], 10);
    const prevCard = ahmetCards.find((c) => c.id === cardId);
    if (!prevCard) return;

    if (selectedDueDateFilter) {
      setSelectedDueDateFilter(newDateISO);
    }

    const updatedCards = ahmetCards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            dueDateISO: newDateISO,
            cutoffDay: formattedShort,
            ...(dayNum >= 1 && dayNum <= 31 ? { dueDay: dayNum } : {}),
          }
        : c
    );
    saveAhmetCards(updatedCards);

    // Bu kartla (veya bu kartın bankasıyla) yapılan tüm ödemelerin son ödeme gününü veritabanında da güncelle
    const cardComputed = ahmetCardsComputed.find((c) => c.id === cardId);
    const matchedIds = new Set<string>();
    if (cardComputed) {
      cardComputed.allTx.forEach((tx) => matchedIds.add(tx.id));
    }
    // Ayrıca listedeki giderlerden bu kartla eşleşenlerin tamamını ekle
    expenses.forEach((exp) => {
      if (doesExpenseMatchAhmetCard(exp, prevCard)) {
        matchedIds.add(exp.id);
      }
    });

    if (matchedIds.size > 0) {
      try {
        await fetch("/api/giderler", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SYNC_CARD_DUE_DATE",
            dueDateISO: newDateISO,
            expenseIds: Array.from(matchedIds),
          }),
        });
        fetchExpenses();
      } catch (e) {
        console.error("Kart son ödeme tarihi diğer ödemelere yansıtılırken hata:", e);
      }
    }
  };

  const openCardTxModal = (cardId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetCard = ahmetCardsComputed.find((c) => c.id === cardId) || ahmetCardsComputed[0];
    if (targetCard) {
      setSelectedVisualCardId(targetCard.id);
    }
    const parsedSel = parseSelectedPeriod(selectedMonth);
    setCardTxForm({
      cardId: targetCard ? targetCard.id : "card-1",
      title: "",
      amount: "",
      amountMode: "TOTAL",
      installmentCount: 1,
      monthIndex: parsedSel.month,
      dueDate: targetCard?.dueDateISO || todayStr,
      description: "",
    });
    setCardTxModalOpen(true);
  };

  const handleCardTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = ahmetCards.find((c) => c.id === cardTxForm.cardId) || ahmetCards[0];
    const numAmount = Number(cardTxForm.amount) || 0;
    const count = Math.max(1, Number(cardTxForm.installmentCount) || 1);

    if (!cardTxForm.title.trim() || numAmount <= 0) {
      alert("Lütfen yaptığınız harcamanın adını ve geçerli bir tutar girin.");
      return;
    }

    try {
      setCardTxSubmitting(true);
      const cleanTitle = cardTxForm.title.trim();
      const holderName = card.holder || "Ahmet Taymaz";
      const fullTitle = cleanTitle.toLowerCase().includes(holderName.toLowerCase().split(" ")[0])
        ? cleanTitle
        : `${holderName} / ${card.bankName} KK / ${cleanTitle}`;

      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fullTitle,
          category: "CREDIT_CARD",
          subCategory: count > 1 ? `Kredi Kartı (${count} Taksit)` : "Kredi Kartı (Tek Çekim)",
          dueDate: cardTxForm.dueDate || card.dueDateISO || null,
          monthIndex: Number(cardTxForm.monthIndex) || 9,
          amountDue: numAmount,
          amountMode: cardTxForm.amountMode,
          isInstallment: count > 1,
          installmentCount: count,
          currentInstallment: 1,
          customInstallments:
            count > 1 ? cardTxCustomInstallments.map((v) => Number(v) || 0) : null,
          isCommitment: false,
          paymentMethod: "CASH",
          cardHolder: holderName,
          cardBank: card.bankName,
          description: `${cardTxForm.description ? cardTxForm.description + " " : ""}[${card.id}]`.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Harcama kaydedilemedi");
        return;
      }

      setCardTxModalOpen(false);
      setSelectedVisualCardId(card.id);
      fetchExpenses();
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setCardTxSubmitting(false);
    }
  };

  // Varlık Ekle / Düzenle
  const openNewAssetModal = () => {
    setEditingAsset(null);
    setAssetForm({
      title: "",
      assetType: "VEHICLE",
      owner: "Cosmos Koleji",
      inspectionDate: "",
      insuranceDate: "",
      kaskoDate: "",
      housingDate: "",
      notes: "",
    });
    setAssetModalOpen(true);
  };

  const openEditAssetModal = (asset: AssetTrackingItem) => {
    setEditingAsset(asset);
    setAssetForm({
      title: asset.title,
      assetType: asset.assetType,
      owner: asset.owner || "",
      inspectionDate: asset.inspectionDate ? new Date(asset.inspectionDate).toISOString().split("T")[0] : "",
      insuranceDate: asset.insuranceDate ? new Date(asset.insuranceDate).toISOString().split("T")[0] : "",
      kaskoDate: asset.kaskoDate ? new Date(asset.kaskoDate).toISOString().split("T")[0] : "",
      housingDate: asset.housingDate ? new Date(asset.housingDate).toISOString().split("T")[0] : "",
      notes: asset.notes || "",
    });
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssetSubmitting(true);
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "İşlem başarısız");
        return;
      }

      setAssetModalOpen(false);
      fetchAssets();
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string, title: string) => {
    if (!confirm(`"${title}" varlık kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) fetchAssets();
    } catch (e) {
      alert("Silinemedi");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);
  };

  const exportToCSV = () => {
    const headers = ["Cari / Kurum", "Tür", "Alt Tür", "Dönem / Taksit", "Tarih / Vade", "Ödenecek", "Ödenen", "Kalan", "Durum", "Ödeme Yöntemi", "Açıklama"];
    const rows = expenses.map((e) => [
      `"${e.title}"`,
      `"${CATEGORY_MAP[e.category]?.label || e.category}"`,
      `"${e.subCategory || ""}"`,
      `"${e.installmentInfo || e.period || ""}"`,
      `"${e.dueDateStr || ""}"`,
      e.amountDue,
      e.amountPaid,
      e.amountRemaining,
      `"${e.status === "PAID" ? "Ödendi" : e.status === "PARTIAL" ? "Kısmi" : "Bekliyor"}"`,
      `"${e.paymentMethod || "Nakit"}"`,
      `"${e.description || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Okul_Giderleri_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Üst Sekmeler: Okul Giderleri | Tedarikçi Carileri | Araç & Mülk Takibi | Personel Cari */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveMainTab("EXPENSES")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "EXPENSES"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Okul Giderleri & Taksit Takibi</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeMainTab === "EXPENSES" ? "bg-teal-800 text-teal-100" : "bg-slate-200 text-slate-700"}`}>
              {stats.countPending + stats.countPartial} Bekleyen
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("SUPPLIERS")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "SUPPLIERS"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>🏪 Tedarikçi & Ürün Carileri (Alınan / Ödenen)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("ASSETS")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "ASSETS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Car className="w-4 h-4 text-amber-500" />
            <span>Araç & Mülk Muayene / Kasko Takibi</span>
            {assetWarningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-600 text-white animate-pulse">
                {assetWarningCount} Acil Uyarı
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("GOLD_DAYS")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeMainTab === "GOLD_DAYS"
                ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>🪙 Altın Günleri Takibi</span>
            {todayGoldDayExpenses.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-black animate-pulse">
                BUGÜN GÜN VAR!
              </span>
            )}
          </button>

          <Link
            href="/kayit-silme-iadeleri"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors border border-transparent hover:border-rose-200"
          >
            <UserMinus className="w-4 h-4 text-rose-600" />
            <span>Kayıt Silme İadeleri</span>
          </Link>

          <Link
            href="/cari"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Personel Cari & Ekstreler</span>
          </Link>
        </div>

        {activeMainTab === "EXPENSES" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Yazdır</span>
            </button>
            <button
              type="button"
              onClick={openNewChequeModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>+ Çek Ödemesi Ekle</span>
            </button>
            <button
              type="button"
              onClick={() => openNewUtilityInvoiceModal("DOGALGAZ")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <ReceiptText className="w-4 h-4" />
              <span>+ Fatura Ödemesi Ekle (Doğalgaz / Elektrik)</span>
            </button>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Gider / Taksit Ekle</span>
            </button>
          </div>
        )}

        {activeMainTab === "ASSETS" && (
          <button
            type="button"
            onClick={openNewAssetModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Araç / Mülk Ekle</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* SEKME 1: OKUL GİDERLERİ & BORÇ TAKİBİ                          */}
      {/* ============================================================== */}
      {activeMainTab === "EXPENSES" && (
        <div className="space-y-6">
          {/* BUGÜN ALTIN GÜNÜ UYARI BİLDİRİMİ */}
          {todayGoldDayExpenses.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 border-2 border-amber-600/40 rounded-2xl p-4 shadow-md text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow">
                  <Coins className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide flex items-center gap-2">
                    <span>🔔 BUGÜN ALTIN GÜNÜ VAR! ({todayGoldDayExpenses.length} Adet Ödeme)</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">
                    {todayGoldDayExpenses.map((g) => `${g.title}: ₺${g.amountDue.toLocaleString("tr-TR")}`).join(" • ")}
                    {" — "}
                    <span className="underline">Altın günü borçları nakit olarak ödenir.</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMainTab("GOLD_DAYS")}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 rounded-xl font-black text-xs shrink-0 shadow transition-all flex items-center gap-1.5"
              >
                <span>Altın Günleri Paneline Git</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
                  <span>Okul Gider & Borç Takibi</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {parseSelectedPeriod(selectedMonth).label}
                  </span>
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Kiralar, krediler, kredi kartları, veli iadeleri, tedarikçi çekleri ve telefon hatları
                </p>
              </div>
            </div>

            {/* Yıllara Göre Sıralı Ay Bazında Hızlı Gezinme Butonları (2026, 2027, 2028 ve Son Ödeme Tarihine Göre Tüm Yıllar) */}
            {(() => {
              const curSel = parseSelectedPeriod(selectedMonth);
              const periodMap = new Map<string, { year: number; month: number; count: number; unpaidCount: number }>();
              availablePeriods.forEach((p) => {
                periodMap.set(`${p.year}-${p.month}`, p);
              });

              // Varsayılan 2026 (7..12) ve 2027 (1..6) aylarını ve veritabanında kaydı olan tüm yıl/ayları birleştir
              const yearsSet = new Set<number>([2026, 2027]);
              availablePeriods.forEach((p) => {
                if (p.year >= 2000) yearsSet.add(p.year);
              });
              if (curSel.mode !== "ALL" && curSel.year >= 2000) {
                yearsSet.add(curSel.year);
              }
              const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

              const yearStyles: Record<
                number,
                {
                  box: string;
                  badgeActive: string;
                  badgeIdle: string;
                  btnActive: string;
                  btnIdle: string;
                }
              > = {
                2026: {
                  box: "bg-amber-50/90 border-amber-200/90",
                  badgeActive: "bg-amber-700 text-white border-amber-800 shadow-2xs",
                  badgeIdle: "bg-amber-200/80 text-amber-950 border-amber-300 hover:bg-amber-300/80",
                  btnActive: "bg-teal-700 text-white shadow-xs border-teal-800",
                  btnIdle: "bg-white/90 text-slate-700 border-amber-200 hover:text-slate-950 hover:bg-amber-100/60",
                },
                2027: {
                  box: "bg-indigo-50/90 border-indigo-200/90",
                  badgeActive: "bg-indigo-800 text-white border-indigo-900 shadow-2xs",
                  badgeIdle: "bg-indigo-200/80 text-indigo-950 border-indigo-300 hover:bg-indigo-300/80",
                  btnActive: "bg-indigo-700 text-white shadow-xs border-indigo-800",
                  btnIdle: "bg-white/90 text-slate-700 border-indigo-200 hover:text-slate-950 hover:bg-indigo-100/60",
                },
              };

              const defaultFutureStyle = {
                box: "bg-purple-50/90 border-purple-200/90",
                badgeActive: "bg-purple-800 text-white border-purple-900 shadow-2xs",
                badgeIdle: "bg-purple-200/80 text-purple-950 border-purple-300 hover:bg-purple-300/80",
                btnActive: "bg-purple-700 text-white shadow-xs border-purple-800",
                btnIdle: "bg-white/90 text-slate-700 border-purple-200 hover:text-slate-950 hover:bg-purple-100/60",
              };

              return (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-700 px-2 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" /> Ekstre & Gider Ayı:
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedMonth("ALL")}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                      curSel.mode === "ALL"
                        ? "bg-teal-700 text-white shadow-xs border border-teal-800"
                        : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-200/60"
                    }`}
                  >
                    Tüm Yıllar & Aylar
                  </button>

                  {sortedYears.map((yr) => {
                    const st = yearStyles[yr] || defaultFutureStyle;
                    const monthsSet = new Set<number>(
                      yr === 2026 ? [7, 8, 9, 10, 11, 12] : yr === 2027 ? [1, 2, 3, 4, 5, 6] : []
                    );
                    availablePeriods
                      .filter((p) => p.year === yr)
                      .forEach((p) => monthsSet.add(p.month));
                    if (curSel.mode === "YM" && curSel.year === yr) {
                      monthsSet.add(curSel.month);
                    }
                    const monthsList = Array.from(monthsSet).sort((a, b) => a - b);
                    const yearTotalCount = availablePeriods
                      .filter((p) => p.year === yr)
                      .reduce((s, p) => s + p.count, 0);
                    const isYearSelected = curSel.mode === "YEAR" && curSel.year === yr;

                    return (
                      <div
                        key={yr}
                        className={`flex items-center flex-wrap gap-1 px-2 py-1 rounded-xl border ${st.box}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedMonth(`YEAR-${yr}`)}
                          title={`${yr} yılındaki tüm ödemeleri son ödeme tarihine göre listele`}
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md border transition-all shrink-0 cursor-pointer ${
                            isYearSelected ? st.badgeActive : st.badgeIdle
                          }`}
                        >
                          📅 {yr} Yılı{yearTotalCount > 0 ? ` (${yearTotalCount})` : ""}
                        </button>
                        {monthsList.map((m) => {
                          const ymKey = `${yr}-${m}`;
                          const isSelected = curSel.mode === "YM" && curSel.year === yr && curSel.month === m;
                          const pInfo = periodMap.get(ymKey);
                          return (
                            <button
                              key={ymKey}
                              type="button"
                              onClick={() => setSelectedMonth(ymKey)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border flex items-center gap-1 ${
                                isSelected ? st.btnActive : st.btnIdle
                              }`}
                            >
                              <span>
                                {m}. Ay ({TR_MONTH_SHORT[m]} {yr})
                              </span>
                              {pInfo && pInfo.count > 0 && yr >= 2028 && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                    isSelected ? "bg-white/25 text-white" : "bg-purple-100 text-purple-900"
                                  }`}
                                >
                                  {pInfo.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 🚨 ÇEK ÖDEMESİNDEN 3 GÜN ÖNCE OTOMATİK HATIRLATMA & UYARI BİLDİRİMİ (YUKARIDA) */}
          {upcomingCheques3Days.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border-2 border-rose-400 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-sm animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-rose-950">
                      🚨 Çek Ödeme Hatırlatması ({upcomingCheques3Days.length} Çek Ödemesine 3 Gün veya Daha Az Kaldı!)
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                      3 Gün Önce Otomatik Uyarı
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      💵 Nakit Olarak Ödenir
                    </span>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 bg-rose-600 text-white rounded-full">
                    Toplam Çek: {formatCurrency(upcomingCheques3Days.reduce((s, c) => s + c.exp.amountRemaining, 0))}
                  </span>
                </div>
                <p className="text-xs text-rose-900">
                  Aşağıdaki çeklerin ödeme tarihine <strong>3 gün veya daha az</strong> kalmıştır. Çek ödemeleri vadesinde <strong>nakit olarak ödenir</strong> ve ödeme listesinde en üstte gösterilir:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {upcomingCheques3Days.map((item) => {
                    const chqPhoto = chequePhotosMap[item.exp.id];
                    return (
                      <div
                        key={item.exp.id}
                        className="p-3 bg-white border-2 border-rose-300 rounded-xl flex items-center justify-between gap-2 text-xs shadow-2xs"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 truncate">📝 {item.exp.title}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold text-[10px]">
                              💵 Nakit Ödenir
                            </span>
                          </div>
                          <p className="text-[11px] font-extrabold text-rose-700">
                            📅 Çek Ödeme Tarihi: {formatSafeDate(item.dateISO)}
                          </p>
                          {(item.exp.chequeNo || item.exp.chequeBank) && (
                            <p className="text-[10px] font-bold text-slate-500 truncate">
                              {item.exp.chequeNo ? `Çek No: ${item.exp.chequeNo}` : ""}{" "}
                              {item.exp.chequeBank ? `• ${item.exp.chequeBank}` : ""}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                            {chqPhoto ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxChequePhoto({ title: item.exp.title, url: chqPhoto })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold"
                                >
                                  <img
                                    src={chqPhoto}
                                    alt="Çek"
                                    className="w-5 h-3.5 object-cover rounded border border-emerald-400"
                                  />
                                  <span>🖼️ Çek Görseli</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openChequeQrModal(item.exp)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                                >
                                  <QrCode className="w-3 h-3 text-teal-700" />
                                  <span>QR</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openChequeQrModal(item.exp)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold transition-colors"
                              >
                                <QrCode className="w-3 h-3 text-amber-700" />
                                <span>📱 QR ile Çek Fotoğrafı Ekle</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="font-black text-sm text-slate-950">
                            {formatCurrency(item.exp.amountRemaining)}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.daysLeft < 0
                                ? "bg-rose-700 text-white"
                                : item.daysLeft === 0
                                ? "bg-rose-600 text-white animate-pulse"
                                : "bg-amber-100 text-rose-900 border border-rose-300"
                            }`}
                          >
                            {item.daysLeft < 0
                              ? `${Math.abs(item.daysLeft)} Gün Geçti!`
                              : item.daysLeft === 0
                              ? "BUGÜN ÖDENECEK!"
                              : `${item.daysLeft} Gün Kaldı`}
                          </span>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(item.exp)}
                              className="text-[10px] font-extrabold text-emerald-700 hover:underline"
                            >
                              Nakit Öde →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(item.exp)}
                              className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 hover:bg-teal-100"
                            >
                              ✓ Ödendi
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 🔴 GEÇMİŞ AYLARDAN KALAN ÖDENMEMİŞ BORÇLAR / DEVREDEN KİRALAR (Özdemirler & İlyas Bey) */}
          {(() => {
            const curSel = parseSelectedPeriod(selectedMonth);
            if (curSel.mode === "ALL" || curSel.mode === "YEAR") return null;

            const validRolloverList = rolloverExpenses.filter((re) => {
              if ((Number(re.amountRemaining) || 0) <= 0) return false;
              const reYM = getExpenseDueYM(re);
              return reYM.year < curSel.year || (reYM.year === curSel.year && reYM.month < curSel.month);
            });

            if (validRolloverList.length === 0) return null;

            if (!showRolloverSection) {
              return (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRolloverSection(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-extrabold shadow-2xs transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      🔴 Geçmiş Aylardan Kalan Borçları Göster ({validRolloverList.length} Kalem •{" "}
                      {formatCurrency(validRolloverList.reduce((s, e) => s + e.amountRemaining, 0))})
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            const prevM = curSel.month === 1 ? 12 : curSel.month - 1;
            const prevY = curSel.month === 1 ? curSel.year - 1 : curSel.year;

            return (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 text-rose-950 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-extrabold text-sm text-rose-950">
                      🔴 Geçmiş Aylardan Kalan Ödenmemiş Borçlar ({validRolloverList.length} Kalem Devreden)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-3 py-1 bg-rose-200 text-rose-900 rounded-full">
                      Toplam Devreden: {formatCurrency(validRolloverList.reduce((s, e) => s + e.amountRemaining, 0))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRolloverSection(false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold shadow-2xs transition-colors"
                      title="Bu Uyarı Alanını Gizle"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Gizle</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-rose-800">
                  {`${curSel.label} öncesindeki geçmiş aylardan (${prevM}. Ay ${prevY} ve öncesi) kalan ve henüz kapatılmamış ödemeler:`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {validRolloverList.map((re) => {
                    const reYM = getExpenseDueYM(re);
                    return (
                      <div key={re.id} className="p-2.5 bg-white border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{re.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {`${reYM.month}. Ay (${reYM.year})`} • Vade: {re.dueDateStr || "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-rose-600 block">{formatCurrency(re.amountRemaining)}</span>
                          <button
                            type="button"
                            onClick={() => openPaymentModal(re)}
                            className="text-[10px] font-bold text-emerald-700 hover:underline"
                          >
                            Ödeme Yap →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 📞 TELEFON HATLARI TAAHHÜT BİTİŞİ 10 GÜN KALA ERKEN HATIRLATMA BİLDİRİMİ */}
          {expiringPhoneLines10Days.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-sm animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-rose-950">
                      🔔 Telefon Numarası Taahhüt Bitiş Hatırlatması ({expiringPhoneLines10Days.length} Hat Son 10 Gün İçinde!)
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                      10 Gün Önce Otomatik Uyarı
                    </span>
                  </div>
                </div>
                <p className="text-xs text-rose-800">
                  Aşağıdaki telefon numaralarının taahhüt bitiş tarihine <strong>10 gün veya daha az</strong> kalmıştır. Fatura aşımı olmaması için taahhüt yenilemesi yapabilirsiniz:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {expiringPhoneLines10Days.map((item, idx) => (
                    <div
                      key={`${item.exp.id}-${idx}`}
                      className="p-2.5 bg-white border border-rose-300 rounded-xl flex items-center justify-between gap-2 text-xs shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900">📞 {item.number}</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[10px]">
                            👤 {item.userTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          {item.exp.title} {item.amount > 0 ? `• ${formatCurrency(item.amount)}` : ""}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          Taahhüt Bitiş: {formatSafeDate(item.commitmentEnd)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            item.daysLeft < 0
                              ? "bg-rose-600 text-white"
                              : item.daysLeft === 0
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-amber-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {item.daysLeft < 0
                            ? `${Math.abs(item.daysLeft)} Gün Geçti!`
                            : item.daysLeft === 0
                            ? "Bugün Bitiyor!"
                            : `${item.daysLeft} Gün Kaldı`}
                        </span>
                        <button
                          type="button"
                          onClick={() => openPhoneLinesModal(item.exp)}
                          className="text-[10px] font-extrabold text-blue-700 hover:underline"
                        >
                          Hatları Düzenle →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Taahhüt Bitişi Yaklaşanlar Erken Uyarı Bildirimi */}
          {expiringCommitments.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-amber-700 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-amber-950">
                    ⚠️ Dikkat: Taahhüt Süresi Dolan / 10 Günden Az Kalan Abonelikler ({expiringCommitments.length} Kurum)
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Son 10 Gün Hatırlatması
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Taahhüdü biten telefon veya internet aboneliklerinde indirimler sona erer ve faturalar katlanır:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {expiringCommitments.map(({ exp, daysLeft }) => (
                    <div
                      key={exp.id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{exp.title}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          daysLeft <= 0
                            ? "bg-rose-100 text-rose-800"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {daysLeft <= 0 ? "Süre Doldu!" : `${daysLeft} Gün Kaldı`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4 Özet Finans Kartı (Kompakt & Tıklanabilir Filtreleme — Tıklandığında Diğer Kartların Verileri Değişmez) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Toplam Ödenecek (Tıklayınca Tümünü Gösterir) */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("ALL");
                setInstallmentOnly(false);
                setCommitmentsOnly(false);
                setChequesOnly(false);
              }}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 ${
                selectedStatus === "ALL" && !installmentOnly && !commitmentsOnly && !chequesOnly
                  ? "bg-slate-50 border-slate-500 ring-1 ring-slate-500/20"
                  : "bg-white border-slate-200/80 hover:border-slate-400 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-slate-700">Toplam Ödenecek</p>
                    <span className="text-[9px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded font-bold">Tümü ({stats.countTotal})</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatCurrency(stats.totalDue)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-200/70 flex flex-col gap-0.5 text-[10px] w-full">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">💵 Nakit:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(stats.cashDue)}</span>
                </div>
                <div className="flex items-center justify-between text-purple-800">
                  <span className="font-semibold">💳 Kartla:</span>
                  <span className="font-extrabold">{formatCurrency(stats.cardDue)}</span>
                </div>
              </div>
            </button>

            {/* Toplam Ödenen (Tıklayınca Ödenenleri Filtreler — Kart Tutarları Sabit Kalır) */}
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "PAID" ? "ALL" : "PAID")}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 ${
                selectedStatus === "PAID"
                  ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20"
                  : "bg-white border-slate-200/80 hover:border-emerald-300 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-emerald-700">Toplam Ödenen</p>
                    <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded font-bold">Filtrele ({stats.countPaid})</span>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-1.5 border-t border-emerald-200/60 flex flex-col gap-0.5 text-[10px] w-full">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="font-semibold">💵 Nakit:</span>
                  <span className="font-extrabold">{formatCurrency(stats.cashPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-purple-800">
                  <span className="font-semibold">💳 Kartla:</span>
                  <span className="font-extrabold">{formatCurrency(stats.cardPaid)}</span>
                </div>
              </div>
            </button>

            {/* Kalan Net Borç (Tıklayınca Kalanları Filtreler — Kart Tutarları Sabit Kalır) */}
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "PENDING" ? "ALL" : "PENDING")}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 ${
                selectedStatus === "PENDING"
                  ? "bg-rose-50 border-rose-500 ring-1 ring-rose-500/20"
                  : "bg-white border-slate-200/80 hover:border-rose-300 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-rose-700">Kalan Net Borç</p>
                    <span className="text-[9px] text-rose-600 bg-rose-100 px-1 py-0.2 rounded font-bold">
                      Filtrele ({stats.countPending + stats.countPartial})
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-rose-600 mt-0.5">{formatCurrency(stats.totalRemaining)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-1.5 border-t border-rose-200/60 flex flex-col gap-0.5 text-[10px] w-full">
                <div className="flex items-center justify-between text-rose-900">
                  <span className="font-semibold">💵 Nakit:</span>
                  <span className="font-extrabold">{formatCurrency(stats.cashRemaining)}</span>
                </div>
                <div className="flex items-center justify-between text-purple-800">
                  <span className="font-semibold">💳 Kartla:</span>
                  <span className="font-extrabold">{formatCurrency(stats.cardRemaining)}</span>
                </div>
              </div>
            </button>

            {/* Taksit & Taahhüt & Çek */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <p className="text-[11px] font-semibold text-purple-700">Taksit, Taahhüt & Çek</p>
                  <p className="text-lg font-extrabold text-purple-700 mt-0.5">
                    {stats.countInstallment + stats.countCommitment + stats.countCheques} Kalem
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-100 text-[10px] text-purple-700 font-semibold">
                {stats.countInstallment} Taksit • {stats.countCommitment} Taahhüt • {stats.countCheques} Çek
              </div>
            </div>
          </div>

          {/* Son Ödeme Günü Gelen / Geciken Faturalar ve Kartlar Uyarısı */}
          {dueTodayOrOverdue.length > 0 && !dueTodayOnly && (
            <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  🔔
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-950 text-sm">
                    Bugün veya Vadesi Gelmiş {dueTodayOrOverdue.length} Kalem Fatura & Borç Ödemesi Var!
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Son ödeme tarihi bugün olan veya günü geçmiş bekleyen faturaları ve kredi kartlarını tek tıkla listeleyin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDueTodayOnly(true)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                Günü Gelenleri Listele ({dueTodayOrOverdue.length}) →
              </button>
            </div>
          )}

          {/* 💳 TÜM KREDİ KARTLARI, SON ÖDEME TARİHLERİ & AYLIK EKSTRE (AHMET TAYMAZ, MUHAMMED ALİ ÇAĞIR, ŞİRKET KARTLARI) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Kompakt Üst Başlık ve Kart Sahibi Sekmeleri */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CreditCard className="w-4 h-4 text-indigo-700" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Kredi Kartları, Son Ödeme Tarihleri & Ekstre Takibi
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                  {ahmetCards.length} Kart
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setNewCardFormOpen(!newCardFormOpen)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{newCardFormOpen ? "Kart Ekleme Kapat" : "+ Yeni Kart Ekle"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCardTxModal(selectedVisualCardId === "ALL_5" ? (ahmetCards[0]?.id || "card-1") : selectedVisualCardId)}
                  className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Karta Harcama / Taksit Gir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCardSummary(!showCardSummary)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1"
                >
                  <span>{showCardSummary ? "Gizle" : "Göster"}</span>
                  {showCardSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showCardSummary && (
              <div className="p-3 space-y-3 bg-slate-50/40">
                {/* KART SAHİBİ FİLTRE SEKMELERİ (Ahmet Taymaz | Muhammed Ali Çağır | Şirket Kartları | Tümü) */}
                {(() => {
                  const uniqueHolders = Array.from(new Set(ahmetCards.map((c) => c.holder || "Diğer")));
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/70">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCardOwnerFilter("ALL");
                            setSelectedVisualCardId("ALL_5");
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            cardOwnerFilter === "ALL"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Tüm Kartlar ({ahmetCards.length})
                        </button>
                        {uniqueHolders.map((h) => {
                          const cnt = ahmetCards.filter((c) => (c.holder || "Diğer") === h).length;
                          const active = cardOwnerFilter === h;
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                setCardOwnerFilter(h);
                                setSelectedVisualCardId("ALL_5");
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
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
                      <span className="text-[10px] text-slate-500">
                        💡 Kartın <strong>Son Ödeme</strong> tarihini değiştirdiğinizde o kartla yapılan tüm ödemelerin tarihi otomatik güncellenir.
                      </span>
                    </div>
                  );
                })()}

                {/* + YENİ KART EKLEME FORMU (Açılır/Kapanır Kompakt Alan) */}
                {newCardFormOpen && (
                  <form
                    onSubmit={handleAddCard}
                    className="p-3 bg-white rounded-xl border-2 border-emerald-400 shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-900">
                        ➕ Yeni Kredi Kartı Ekle (Ahmet Taymaz, Muhammed Ali Çağır, Şirket Kartı vb.)
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewCardFormOpen(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hızlı Kişi ve Banka Seçimi */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">Kişi / Şirket:</span>
                        {CARD_OWNER_PRESETS.map((owner) => (
                          <button
                            key={owner}
                            type="button"
                            onClick={() => setNewCardForm({ ...newCardForm, holder: owner })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              newCardForm.holder === owner
                                ? "bg-indigo-700 text-white border-indigo-700"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {owner}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">Banka:</span>
                        {BANK_PRESETS.map((bName) => {
                          const bTheme = getBankTheme(bName);
                          const isChosen = newCardForm.bankName === bName;
                          return (
                            <button
                              key={bName}
                              type="button"
                              onClick={() => setNewCardForm({ ...newCardForm, bankName: bName })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                isChosen
                                  ? `${bTheme.badge} ring-2 ring-offset-1 ring-slate-400`
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {bName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kart Sahibi / Şirket *</label>
                        <input
                          type="text"
                          required
                          value={newCardForm.holder}
                          onChange={(e) => setNewCardForm({ ...newCardForm, holder: e.target.value })}
                          placeholder="Örn: Muhammed Ali Çağır"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Banka Adı *</label>
                        <input
                          type="text"
                          required
                          value={newCardForm.bankName}
                          onChange={(e) => setNewCardForm({ ...newCardForm, bankName: e.target.value })}
                          placeholder="Örn: Vakıfbank, Ziraat..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kart Limiti (₺) *</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={newCardForm.cardLimit}
                          onChange={(e) => setNewCardForm({ ...newCardForm, cardLimit: e.target.value })}
                          placeholder="Örn: 750000"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kart Adı / Not (Opsiyonel)</label>
                        <input
                          type="text"
                          value={newCardForm.cardLabel}
                          onChange={(e) => setNewCardForm({ ...newCardForm, cardLabel: e.target.value })}
                          placeholder="Örn: Paraf Business, World..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-700 mb-0.5">Hesap Kesim Tarihi</label>
                        <input
                          type="date"
                          value={newCardForm.statementDateISO}
                          onChange={(e) => setNewCardForm({ ...newCardForm, statementDateISO: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Son Ödeme Tarihi *</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            required
                            value={newCardForm.dueDateISO}
                            onChange={(e) => setNewCardForm({ ...newCardForm, dueDateISO: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0"
                          >
                            Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* 1. BÖLÜM: HERKESİN VEYA ŞİRKETİN KREDİ KARTLARI BİR ÇATI ALTINDA GRUPLANDIRILMIŞ GÖRÜNÜM */}
                {(() => {
                  const visibleCards =
                    cardOwnerFilter === "ALL"
                      ? ahmetCardsComputed
                      : ahmetCardsComputed.filter((c) => (c.holder || "Diğer") === cardOwnerFilter);

                  const groupedByHolder = Array.from(
                    new Set(visibleCards.map((c) => c.holder || "Diğer"))
                  ).map((holderName) => {
                    const cardsOfHolder = visibleCards.filter((c) => (c.holder || "Diğer") === holderName);
                    const totalLimit = cardsOfHolder.reduce((s, c) => s + c.cardLimit, 0);
                    const totalUsed = cardsOfHolder.reduce((s, c) => s + c.usedLimit, 0);
                    const totalAvailable = cardsOfHolder.reduce((s, c) => s + c.availableLimit, 0);
                    const monthRemaining = cardsOfHolder.reduce((s, c) => s + c.monthStatementRemaining, 0);
                    return {
                      holderName,
                      cards: cardsOfHolder,
                      totalLimit,
                      totalUsed,
                      totalAvailable,
                      monthRemaining,
                    };
                  });

                  return (
                    <div className="space-y-3">
                      {groupedByHolder.map((group) => {
                        const isCompany =
                          group.holderName.toLowerCase().includes("şirket") ||
                          group.holderName.toLowerCase().includes("simcu");

                        return (
                          <div
                            key={group.holderName}
                            className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
                          >
                            {/* Çatı (Grup) Üst Başlığı & Grup Toplam Limit / Kullanılabilir Özeti */}
                            <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-extrabold text-[11px]">
                                  {isCompany ? "🏢" : "👤"} {group.holderName} Kredi Kartları Çatısı
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {group.cards.length} Kart
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                  Toplam Limit: <strong className="text-slate-900">{formatCurrency(group.totalLimit)}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
                                  Kullanılan: <strong>{formatCurrency(group.totalUsed)}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                                  Kullanılabilir: <strong>{formatCurrency(group.totalAvailable)}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                                  {selectedMonth === "ALL"
                                    ? "Ekstre Kalan:"
                                    : `${parseSelectedPeriod(selectedMonth).label} Kalan:`}{" "}
                                  <strong>{formatCurrency(group.monthRemaining)}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Bu Çatı Altındaki Banka Renkli Kart Kutucukları */}
                            <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                              {group.cards.map((card) => {
                                const isSelected = selectedVisualCardId === card.id;
                                const isEditingName = editingCardSlot === card.id;
                                const theme = getBankTheme(card.bankName);
                                const usagePct =
                                  card.cardLimit > 0
                                    ? Math.min(100, Math.round((card.usedLimit / card.cardLimit) * 100))
                                    : 0;

                                return (
                                  <div
                                    key={card.id}
                                    onClick={() => setSelectedVisualCardId(card.id)}
                                    className={`rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between border text-xs ${
                                      isSelected ? theme.selectedBg : theme.cardBg
                                    }`}
                                  >
                                    {/* Bankanın Kendi Renginde Üst Şerit */}
                                    <div className={`h-1.5 w-full ${theme.topBar}`} />

                                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                                      {/* Üst Satır: Banka Rozeti + Kart Sahibi + Düzenle/Sil */}
                                      <div>
                                        <div className="flex items-start justify-between gap-1">
                                          <div className="min-w-0 flex-1">
                                            {isEditingName ? (
                                              <div
                                                className="space-y-1 bg-white p-1.5 rounded border border-slate-300"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <input
                                                  type="text"
                                                  value={tempCardHolder}
                                                  onChange={(e) => setTempCardHolder(e.target.value)}
                                                  placeholder="Kart Sahibi"
                                                  className="w-full px-1.5 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200 rounded"
                                                />
                                                <input
                                                  type="text"
                                                  value={tempCardBankName}
                                                  onChange={(e) => setTempCardBankName(e.target.value)}
                                                  placeholder="Banka Adı"
                                                  className="w-full px-1.5 py-0.5 text-[11px] font-bold text-slate-900 border border-slate-200 rounded"
                                                />
                                                <input
                                                  type="text"
                                                  value={tempCardLabel}
                                                  onChange={(e) => setTempCardLabel(e.target.value)}
                                                  placeholder="Kart Notu"
                                                  className="w-full px-1.5 py-0.5 text-[10px] text-slate-700 border border-slate-200 rounded"
                                                />
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="1000"
                                                  value={tempCardLimit}
                                                  onChange={(e) => setTempCardLimit(e.target.value)}
                                                  placeholder="Kart Limiti (₺)"
                                                  className="w-full px-1.5 py-0.5 text-[10px] font-extrabold text-slate-900 border border-slate-200 rounded"
                                                />
                                                <div className="flex justify-end gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditingCardSlot(null)}
                                                    className="px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded"
                                                  >
                                                    İptal
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (tempCardBankName.trim()) {
                                                        const updated = ahmetCards.map((c) =>
                                                          c.id === card.id
                                                            ? {
                                                                ...c,
                                                                holder: tempCardHolder.trim() || c.holder,
                                                                bankName: tempCardBankName.trim(),
                                                                cardLabel:
                                                                  tempCardLabel.trim() || `${tempCardBankName.trim()} KK`,
                                                                cardLimit:
                                                                  Math.max(0, Number(tempCardLimit)) || c.cardLimit || 750000,
                                                              }
                                                            : c
                                                        );
                                                        saveAhmetCards(updated);
                                                      }
                                                      setEditingCardSlot(null);
                                                    }}
                                                    className="px-2 py-0.5 text-[10px] bg-indigo-700 text-white font-bold rounded"
                                                  >
                                                    Kaydet
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                  <span
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${theme.badge}`}
                                                  >
                                                    {card.bankName}
                                                  </span>
                                                </div>
                                                <p className="font-extrabold text-slate-900 text-[11px] mt-1 truncate">
                                                  {isCompany ? "🏢" : "👤"} {card.holder}
                                                </p>
                                                {card.cardLabel && card.cardLabel !== `${card.bankName} KK` && (
                                                  <p className="text-[10px] text-slate-500 truncate">{card.cardLabel}</p>
                                                )}
                                              </>
                                            )}
                                          </div>

                                          {!isEditingName && (
                                            <div
                                              className="flex items-center gap-0.5 shrink-0"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingCardSlot(card.id);
                                                  setTempCardHolder(card.holder || "");
                                                  setTempCardBankName(card.bankName);
                                                  setTempCardLabel(card.cardLabel || "");
                                                  setTempCardCutoff(card.cutoffDay);
                                                  setTempCardLimit(String(card.cardLimit || 750000));
                                                }}
                                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white/70"
                                                title="Kartı düzenle"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteCard(card.id, `${card.holder} - ${card.bankName}`)
                                                }
                                                className="p-1 text-rose-400 hover:text-rose-700 rounded hover:bg-white/70"
                                                title="Kartı sil"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Manuel Hesap Kesim Tarihi */}
                                        <div
                                          className="mt-1.5 flex items-center justify-between gap-1 bg-white/90 px-2 py-1 rounded-lg border border-slate-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-[10px] font-bold text-indigo-700 shrink-0">Hesap Kesim:</span>
                                          <input
                                            type="date"
                                            value={(card as any).statementDateISO || ""}
                                            onChange={(e) => handleCardStatementDateChange(card.id, e.target.value)}
                                            className="bg-transparent text-slate-900 font-extrabold text-[11px] focus:outline-none cursor-pointer w-[102px]"
                                            title="Kartın hesap kesim tarihini girin"
                                          />
                                        </div>

                                        {/* Manuel Son Ödeme Tarihi (Değiştirildiğinde Tüm Ödemelere Yansır) */}
                                        <div
                                          className="mt-1 flex items-center justify-between gap-1 bg-white/90 px-2 py-1 rounded-lg border border-slate-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-[10px] font-bold text-slate-600 shrink-0">Son Ödeme:</span>
                                          <input
                                            type="date"
                                            value={card.dueDateISO || ""}
                                            onChange={(e) => handleCardDueDateChange(card.id, e.target.value)}
                                            className="bg-transparent text-slate-900 font-extrabold text-[11px] focus:outline-none cursor-pointer w-[102px]"
                                          />
                                          {card.dueDateISO && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (selectedDueDateFilter === card.dueDateISO) {
                                                  setSelectedDueDateFilter("");
                                                } else {
                                                  setSelectedDueDateFilter(card.dueDateISO);
                                                  setDueTodayOnly(false);
                                                }
                                              }}
                                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                                selectedDueDateFilter === card.dueDateISO
                                                  ? "bg-amber-500 text-slate-950"
                                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                              }`}
                                              title="O tarihteki ödemeleri listede göster"
                                            >
                                              {selectedDueDateFilter === card.dueDateISO ? "Seçili" : "Listele"}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Kart Limiti, Kullanılan & Kullanılabilir Limit Alanı */}
                                      <div
                                        className="my-1.5 p-1.5 rounded-lg bg-white/90 border border-slate-200/80 space-y-1 text-[10px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-slate-600 font-semibold">Kart Limiti:</span>
                                          <div className="flex items-center gap-0.5">
                                            <input
                                              type="number"
                                              min="0"
                                              step="10000"
                                              value={card.cardLimit}
                                              onChange={(e) =>
                                                handleCardLimitChange(card.id, Number(e.target.value) || 0)
                                              }
                                              className="w-20 px-1 py-0.5 text-right font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded text-[10px] focus:outline-none focus:border-indigo-600"
                                              title="Kart limitini doğrudan değiştirebilirsiniz"
                                            />
                                            <span className="font-bold text-slate-700">₺</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-600">Kullanılan Borç:</span>
                                          <span className="font-extrabold text-rose-600">
                                            {formatCurrency(card.usedLimit)}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <span className="text-emerald-800 font-bold">Kullanılabilir:</span>
                                          <span className="font-extrabold text-emerald-700">
                                            {formatCurrency(card.availableLimit)}
                                          </span>
                                        </div>

                                        {/* Doluluk Çubuğu */}
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all ${
                                              usagePct > 85
                                                ? "bg-rose-600"
                                                : usagePct > 60
                                                ? "bg-amber-500"
                                                : "bg-emerald-600"
                                            }`}
                                            style={{ width: `${usagePct}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Bu Ayki Taksitler / Ekstre & Taksitli Aylar Dağılımı */}
                                      <div className="mb-1.5 space-y-1 text-[10px]">
                                        <div className="flex items-center justify-between px-1">
                                          <span className="text-slate-700 font-bold">
                                            {selectedMonth === "ALL"
                                              ? "Ekstre Kalan:"
                                              : `${parseSelectedPeriod(selectedMonth).label}:`}
                                          </span>
                                          <span className="font-extrabold text-slate-950">
                                            {formatCurrency(card.monthStatementRemaining)}
                                          </span>
                                        </div>

                                        {/* Taksitlerin Bulunduğu Aylar (Tıklayınca O Aya Geçer) */}
                                        {card.monthlyBreakdown.length > 0 && (
                                          <div
                                            className="flex flex-wrap gap-1 pt-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {card.monthlyBreakdown.map((mb) => {
                                              const mbYear = Number(mb.monthIndex) >= 7 ? 2026 : 2027;
                                              const mbYM = `${mbYear}-${mb.monthIndex}`;
                                              const isActiveM = parseSelectedPeriod(selectedMonth).ym === mbYM;
                                              return (
                                                <button
                                                  key={mb.monthIndex}
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedMonth(mbYM);
                                                    setSelectedVisualCardId(card.id);
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                                    isActiveM
                                                      ? "bg-indigo-700 text-white border-indigo-700"
                                                      : mb.remaining > 0
                                                      ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  }`}
                                                  title={`${mb.monthIndex}. Ay (${mbYear}) taksitlerini ve harcamalarını listele`}
                                                >
                                                  {mb.monthIndex}.Ay ({mbYear}): {formatCurrency(mb.remaining > 0 ? mb.remaining : mb.totalDue)}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Alt Kısım: Harcama Gir | Kart Borcu Öde | Ekstre */}
                                      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                        {card.monthStatementRemaining > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => openCardPayModal(card.id)}
                                            className="w-full py-1.5 px-2 rounded-lg font-extrabold text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-2xs transition-all"
                                          >
                                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                                            <span className="truncate">
                                              Kart Borcu Öde ({formatCurrency(card.monthStatementRemaining)})
                                            </span>
                                          </button>
                                        ) : card.allTimeTotalRemaining > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => openCardPayModal(card.id)}
                                            className="w-full py-1 px-2 rounded-lg font-bold text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1"
                                          >
                                            <span>💳 Kart Borcu Öde</span>
                                          </button>
                                        ) : (
                                          <div className="w-full py-1 px-2 rounded-lg font-bold text-[10px] bg-slate-100 text-slate-500 text-center">
                                            ✓ Bu Ay Borcu Yok
                                          </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-1">
                                          <button
                                            type="button"
                                            onClick={() => openCardTxModal(card.id)}
                                            className={`py-1 px-1.5 rounded-md font-bold text-[10px] flex items-center justify-center gap-0.5 ${theme.btn}`}
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>Harcama Gir</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedVisualCardId(card.id)}
                                            className={`py-1 px-1.5 rounded-md font-bold text-[10px] flex items-center justify-center gap-0.5 border ${
                                              isSelected
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                          >
                                            <span>Ekstre ({card.monthTx.length})</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* 2. BÖLÜM: SEÇİLİ KARTIN VEYA KART SAHİBİNİN AYLIK EKSTRESİ & TOPLAM ÖDENECEK TUTAR DETAYI */}
                {(() => {
                  const activeCard = ahmetCardsComputed.find((c) => c.id === selectedVisualCardId);
                  const isAll5 = selectedVisualCardId === "ALL_5" || !activeCard;
                  const filteredCardsForStatement =
                    cardOwnerFilter === "ALL"
                      ? ahmetCardsComputed
                      : ahmetCardsComputed.filter((c) => (c.holder || "Diğer") === cardOwnerFilter);

                  const monthTxListRaw = isAll5
                    ? filteredCardsForStatement.flatMap((c) =>
                        c.monthTx.map((tx) => ({ ...tx, _cardBank: c.bankName, _cardHolder: c.holder, _cardId: c.id }))
                      )
                    : activeCard.monthTx.map((tx) => ({
                        ...tx,
                        _cardBank: activeCard.bankName,
                        _cardHolder: activeCard.holder,
                        _cardId: activeCard.id,
                      }));

                  const monthTxList = [...monthTxListRaw].sort((a, b) => {
                    const aISO = getExpenseEffectiveDateISO(a) || "";
                    const bISO = getExpenseEffectiveDateISO(b) || "";
                    return aISO.localeCompare(bISO);
                  });

                  const allTimeTxList = isAll5
                    ? filteredCardsForStatement.flatMap((c) =>
                        c.allTx.map((tx) => ({ ...tx, _cardBank: c.bankName, _cardHolder: c.holder, _cardId: c.id }))
                      )
                    : activeCard.allTx.map((tx) => ({
                        ...tx,
                        _cardBank: activeCard.bankName,
                        _cardHolder: activeCard.holder,
                        _cardId: activeCard.id,
                      }));

                  const statementMonthDue = monthTxList.reduce((s, e) => s + e.amountDue, 0);
                  const statementMonthRemaining = monthTxList.reduce((s, e) => s + e.amountRemaining, 0);
                  const totalAllExpensesDue = allTimeTxList.reduce((s, e) => s + e.amountDue, 0);
                  const totalAllExpensesRemaining = allTimeTxList.reduce((s, e) => s + e.amountRemaining, 0);

                  const monthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
                  const statementMonthlySummary = monthOrder
                    .map((mIdx) => {
                      const items = allTimeTxList.filter((tx) => tx.monthIndex === mIdx);
                      return {
                        monthIndex: mIdx,
                        due: items.reduce((s, e) => s + e.amountDue, 0),
                        remaining: items.reduce((s, e) => s + e.amountRemaining, 0),
                        count: items.length,
                      };
                    })
                    .filter((m) => m.count > 0);

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      {/* Kompakt Ekstre Başlığı ve Özet Şeridi */}
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-700">
                            📄{" "}
                            {isAll5
                              ? cardOwnerFilter === "ALL"
                                ? "Tüm Kartlar Ortak Ekstresi"
                                : `${cardOwnerFilter} Kartları Ekstresi`
                              : `${activeCard.holder} — ${activeCard.bankName} Ekstresi`}
                            :
                          </span>
                          {!isAll5 && (
                            <button
                              type="button"
                              onClick={() => setSelectedVisualCardId("ALL_5")}
                              className="px-2 py-0.5 rounded text-[11px] font-bold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            >
                              Tümünü Göster
                            </button>
                          )}
                          {!isAll5 && statementMonthRemaining > 0 && (
                            <button
                              type="button"
                              onClick={() => openCardPayModal(activeCard.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                Bu Ayki Kart Borcunu Öde ({formatCurrency(statementMonthRemaining)})
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Tek Satırda Net Rakamlar */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          {!isAll5 && (
                            <>
                              <div>
                                <span className="text-slate-500">Kart Limiti: </span>
                                <strong className="text-slate-900">{formatCurrency(activeCard.cardLimit)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Kullanılabilir Limit: </span>
                                <strong className="text-emerald-700">{formatCurrency(activeCard.availableLimit)}</strong>
                              </div>
                            </>
                          )}
                          <div>
                            <span className="text-slate-500">Bu Ay Ekstre: </span>
                            <strong className="text-slate-900">{formatCurrency(statementMonthDue)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Bu Ay Kalan: </span>
                            <strong className="text-rose-600">{formatCurrency(statementMonthRemaining)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Tüm Harcamalar: </span>
                            <strong className="text-purple-800">{formatCurrency(totalAllExpensesDue)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Toplam Kalan Borç: </span>
                            <strong className="text-amber-800">{formatCurrency(totalAllExpensesRemaining)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Taksitli Aylar Hızlı Geçiş Şeridi */}
                      {statementMonthlySummary.length > 0 && (
                        <div className="px-3 py-1.5 bg-indigo-50/50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-indigo-950">📅 Taksitlerin Olduğu Aylar:</span>
                          {statementMonthlySummary.map((ms) => {
                            const msYear = Number(ms.monthIndex) >= 7 ? 2026 : 2027;
                            const msYM = `${msYear}-${ms.monthIndex}`;
                            const activeM = parseSelectedPeriod(selectedMonth).ym === msYM;
                            return (
                              <button
                                key={ms.monthIndex}
                                type="button"
                                onClick={() => setSelectedMonth(msYM)}
                                className={`px-2 py-0.5 rounded-md font-bold border transition-all ${
                                  activeM
                                    ? "bg-indigo-700 text-white border-indigo-700"
                                    : ms.remaining > 0
                                    ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {ms.monthIndex}. Ay ({msYear}): {formatCurrency(ms.remaining > 0 ? ms.remaining : ms.due)}{" "}
                                {ms.remaining <= 0 ? "✓" : `(${ms.count} taksit/işlem)`}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Ekstre İşlem ve Taksit Detay Tablosu */}
                      <div className="overflow-x-auto">
                        {monthTxList.length === 0 ? (
                          <div className="p-6 text-center space-y-1">
                            <p className="text-xs font-bold text-slate-600">
                              Seçili kartta {selectedMonth === "ALL" ? "henüz kayıtlı harcama yok." : `${parseSelectedPeriod(selectedMonth).label} için kayıtlı harcama bulunmuyor.`}
                            </p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100/90 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                                <th className="py-2.5 px-3">Harcama / İşlem Detayı</th>
                                <th className="py-2.5 px-3">Kart Sahibi & Banka</th>
                                <th className="py-2.5 px-3">Taksit Bilgisi</th>
                                <th className="py-2.5 px-3">Son Ödeme Tarihi</th>
                                <th className="py-2.5 px-3 text-right">Toplam Harcama</th>
                                <th className="py-2.5 px-3 text-right">Bu Ayki Ekstre</th>
                                <th className="py-2.5 px-3 text-right">Kalan</th>
                                <th className="py-2.5 px-3 text-center">Durum</th>
                                <th className="py-2.5 px-3 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 text-xs">
                              {monthTxList.map((tx) => {
                                let totalPurchase = tx.amountDue;
                                const instMatch = (tx.installmentInfo || tx.period || "").match(/(\d+)t\/(\d+)t/i);
                                const curInst = instMatch ? parseInt(instMatch[1]) : 1;
                                const totalInst = instMatch ? parseInt(instMatch[2]) : 1;
                                if (totalInst > 1) {
                                  const siblingInstallments = allTimeTxList.filter(
                                    (other) =>
                                      other.title === tx.title &&
                                      (other.installmentInfo || "").endsWith(`/${totalInst}t`)
                                  );
                                  if (siblingInstallments.length > 1) {
                                    totalPurchase = Number(
                                      siblingInstallments.reduce((s, o) => s + o.amountDue, 0).toFixed(2)
                                    );
                                  } else {
                                    totalPurchase = Number((tx.amountDue * totalInst).toFixed(2));
                                  }
                                }
                                const bTheme = getBankTheme(tx.cardBank || tx._cardBank);
                                let txPhoneLines: any[] = [];
                                if (tx.phoneLines) {
                                  try {
                                    const parsed =
                                      typeof tx.phoneLines === "string"
                                        ? JSON.parse(tx.phoneLines)
                                        : tx.phoneLines;
                                    if (Array.isArray(parsed)) txPhoneLines = parsed;
                                  } catch {}
                                }

                                return (
                                  <tr key={`${tx.id}-${tx._cardId}`} className="hover:bg-slate-50/90 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <p className="font-extrabold text-slate-900">{tx.title}</p>
                                      {tx.description && (
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          {tx.description.replace(/\[card-[^\]]+\]/g, "").trim()}
                                        </p>
                                      )}
                                      {txPhoneLines.length > 0 ? (
                                        <div className="mt-1.5 p-2 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1">
                                              <PhoneCall className="w-3 h-3 text-blue-700" />
                                              <span>Fatura İçi Telefon Hatları ({txPhoneLines.length} Numara)</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setHiddenPhoneRowIds((prev) => ({
                                                    ...prev,
                                                    [tx.id]: !prev[tx.id],
                                                  }))
                                                }
                                                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200"
                                              >
                                                {hiddenPhoneRowIds[tx.id] ? "👁️ Numaraları Göster" : "🙈 Numaraları Gizle"}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => openPhoneLinesModal(tx)}
                                                className="text-[10px] font-extrabold text-blue-700 hover:underline"
                                              >
                                                ✏️ Numaraları / Taahhüdü Düzenle
                                              </button>
                                            </div>
                                          </div>
                                          {!hiddenPhoneRowIds[tx.id] && (
                                            <div className="flex flex-wrap gap-1">
                                              {txPhoneLines.map((pl: any, pIdx: number) => {
                                                const dLeft = isMounted ? getDaysUntilCommitmentEnd(pl.commitmentEnd) : null;
                                                const isUrgent10 = dLeft !== null && dLeft <= 10;
                                                return (
                                                  <span
                                                    key={pIdx}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${
                                                      isUrgent10
                                                        ? "bg-rose-100 text-rose-950 border-rose-400 font-extrabold"
                                                        : "bg-white text-slate-800 border-blue-200 font-semibold"
                                                    }`}
                                                  >
                                                    <span>📞 {formatDisplayPhone(pl.number) || `${pIdx + 1}. Hat`}</span>
                                                    {pl.title && (
                                                      <span className="text-blue-800 font-bold">• 👤 {pl.title}</span>
                                                    )}
                                                    {Number(pl.amount) > 0 && (
                                                      <span className="text-emerald-800 font-extrabold">
                                                        • {formatCurrency(Number(pl.amount))}
                                                      </span>
                                                    )}
                                                    {pl.commitmentEnd && (
                                                      <span className="text-slate-600">
                                                        • Taahhüt: {formatSafeDate(pl.commitmentEnd)}
                                                      </span>
                                                    )}
                                                    {isUrgent10 && (
                                                      <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">
                                                        {dLeft <= 0 ? "Taahhüt Bitti!" : `${dLeft} Gün Kaldı!`}
                                                      </span>
                                                    )}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        isTelecomOrPhoneExpense(tx) && (
                                          <button
                                            type="button"
                                            onClick={() => openPhoneLinesModal(tx)}
                                            className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 transition-colors"
                                          >
                                            <PhoneCall className="w-3 h-3 text-blue-700" />
                                            <span>+ Hat / Kullanan Kişi / Taahhüt Tarihi Gir</span>
                                          </button>
                                        )
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] border ${bTheme.badge}`}>
                                          💳 {tx.cardBank || tx._cardBank}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-600">
                                          ({tx.cardHolder || tx._cardHolder})
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {totalInst > 1 ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[10px]">
                                          {curInst}/{totalInst} Taksit
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                                          Tek Çekim
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-800 font-extrabold">
                                      {getExpenseEffectiveDateISO(tx)
                                        ? formatSafeDate(getExpenseEffectiveDateISO(tx))
                                        : tx.dueDate
                                        ? formatSafeDate(tx.dueDate)
                                        : tx.dueDateStr || "-"}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-slate-600">
                                      {formatCurrency(totalPurchase)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-950">
                                      {formatCurrency(tx.amountDue)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">
                                      {formatCurrency(tx.amountRemaining)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {tx.status === "PAID" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          <CheckCircle2 className="w-3 h-3" /> Ödendi
                                        </span>
                                      ) : tx.status === "PARTIAL" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          <Clock className="w-3 h-3" /> Kısmi
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                          <AlertCircle className="w-3 h-3" /> Bekliyor
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {tx.status === "PAID" ? (
                                          <button
                                            type="button"
                                            onClick={() => handleResetPayment(tx)}
                                            className="inline-flex items-center gap-1 px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors"
                                            title="Ödemeyi İptal Et (Bekliyor Durumuna Al)"
                                          >
                                            <RotateCcw className="w-3 h-3 text-rose-600" />
                                            <span>İptal Et</span>
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => openPaymentModal(tx)}
                                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                                              title="Ödeme Gir"
                                            >
                                              Öde
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleMarkPaid(tx)}
                                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200"
                                              title="Tamamını Ödendi İşaretle"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                            {tx.status === "PARTIAL" && (
                                              <button
                                                type="button"
                                                onClick={() => handleResetPayment(tx)}
                                                className="p-1 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Kısmi Ödemeleri İptal Et / Sıfırla"
                                              >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(tx)}
                                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                          title="Düzenle"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(tx.id, tx.title, tx)}
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
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 📞 TELEFON FATURALARI & TAAHHÜT TAKİP EKRANI (MİNİMALİST BAR)   */}
          {/* ============================================================== */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                  Telefon Faturaları & Kurumsal Hat Taahhüt Takibi
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                  {phoneInvoicesForPanel.length} Fatura
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={openNewPhoneInvoiceModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Fatura Ekle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (phoneInvoicesForPanel.length > 0) {
                      openPhoneLinesModal(phoneInvoicesForPanel[0]);
                    } else {
                      openNewPhoneInvoiceModal();
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Numara / Taahhüt Gir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhoneSection(!showPhoneSection)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-semibold transition-colors"
                >
                  <span>{showPhoneSection ? "Gizle" : "Göster"}</span>
                  {showPhoneSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showPhoneSection && (
              <div className="p-3 bg-slate-50/40 border-t border-slate-200/80 space-y-2.5">
                {phoneInvoicesForPanel.length === 0 ? (
                  <div className="bg-white rounded-lg border border-dashed border-slate-300 px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">
                      Henüz kayıtlı bir Telefon / Vodafone faturası bulunmuyor.
                    </p>
                    <button
                      type="button"
                      onClick={openNewPhoneInvoiceModal}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ekle</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {phoneInvoicesForPanel.map((inv) => {
                      let invLines: { number: string; title: string; amount?: string | number; commitmentEnd: string }[] = [];
                      if (inv.phoneLines) {
                        try {
                          const parsed = typeof inv.phoneLines === "string" ? JSON.parse(inv.phoneLines) : inv.phoneLines;
                          if (Array.isArray(parsed)) invLines = parsed;
                        } catch {}
                      }
                      const mLabel = inv.period || (inv.monthIndex ? `${inv.monthIndex}. Ay` : "");
                      return (
                        <div
                          key={inv.id}
                          className="bg-white rounded-xl border border-blue-200/90 p-3.5 shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-extrabold text-xs">
                                <PhoneCall className="w-3.5 h-3.5 text-blue-700" />
                                <span>{inv.title}</span>
                              </span>
                              {mLabel && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                  📅 {mLabel}
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-extrabold">
                                Tek Fatura Tutarı: {formatCurrency(inv.amountDue)}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                ({invLines.length > 0 ? `${invLines.length} Hat Tanımlı` : "Henüz Numara Girilmedi"})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openPhoneLinesModal(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>
                                  {invLines.length > 0
                                    ? `✏️ ${invLines.length} Numarayı / Kullanan Kişiyi Düzenle`
                                    : "+ Telefon Numarası / Taahhüt Gir"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Faturayı Düzenle</span>
                              </button>
                            </div>
                          </div>

                          {invLines.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                              {invLines.map((pl, idx) => {
                                const dLeft = isMounted ? getDaysUntilCommitmentEnd(pl.commitmentEnd) : null;
                                const isUrgent10 = dLeft !== null && dLeft <= 10;
                                return (
                                  <div
                                    key={idx}
                                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1 ${
                                      isUrgent10
                                        ? "bg-rose-50 border-rose-300 text-rose-950"
                                        : "bg-blue-50/40 border-blue-200/80 text-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                                        {idx + 1}. NUMARA
                                      </span>
                                      {Number(pl.amount) > 0 && (
                                        <span className="text-[11px] font-black text-emerald-700">
                                          {formatCurrency(Number(pl.amount))}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs font-extrabold text-slate-900 truncate">
                                      📞 {formatDisplayPhone(pl.number) || "Numara Girilmedi"}
                                    </p>
                                    <p className="text-[11px] font-bold text-blue-900 truncate">
                                      👤 {pl.title || "Kullanan Kişi Yok"}
                                    </p>
                                    <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between gap-1 flex-wrap">
                                      <span className="text-[10px] font-semibold text-slate-600">
                                        Taahhüt: {pl.commitmentEnd ? formatSafeDate(pl.commitmentEnd) : "Belirtilmedi"}
                                      </span>
                                      {dLeft !== null && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                            isUrgent10
                                              ? "bg-rose-600 text-white animate-pulse"
                                              : "bg-blue-100 text-blue-800"
                                          }`}
                                        >
                                          {dLeft < 0
                                            ? `${Math.abs(dLeft)} gün geçti!`
                                            : dLeft === 0
                                            ? "Bugün bitiyor!"
                                            : `${dLeft} gün kaldı`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-blue-50/60 border border-dashed border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-900">
                              <span>
                                Bu faturaya ait kurumsal telefon numaralarını, kullanan kişileri ve taahhüt bitiş tarihlerini tek tıkla girebilirsiniz.
                              </span>
                              <button
                                type="button"
                                onClick={() => openPhoneLinesModal(inv)}
                                className="font-extrabold text-blue-700 hover:underline shrink-0 ml-2"
                              >
                                + Şimdi Numaraları Gir →
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filtreleme ve Arama Çubuğu */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari, kişi, veli, elektrik, telefon veya açıklama ara..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              {/* Hızlı Filtre Butonları */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Taksitliler */}
                <button
                  type="button"
                  onClick={() => {
                    setInstallmentOnly(!installmentOnly);
                    if (!installmentOnly) {
                      setCommitmentsOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    installmentOnly
                      ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Taksitliler ({stats.countInstallment})</span>
                </button>

                {/* Taahhütlüler */}
                <button
                  type="button"
                  onClick={() => {
                    setCommitmentsOnly(!commitmentsOnly);
                    if (!commitmentsOnly) {
                      setInstallmentOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    commitmentsOnly
                      ? "bg-blue-700 text-white border-blue-700 shadow-2xs"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Taahhütlüler ({stats.countCommitment})</span>
                </button>

                {/* Çekler */}
                <button
                  type="button"
                  onClick={() => {
                    setChequesOnly(!chequesOnly);
                    if (!chequesOnly) {
                      setInstallmentOnly(false);
                      setCommitmentsOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    chequesOnly
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Verilen Çekler ({stats.countCheques})</span>
                </button>

                {/* Son Ödeme Günü Gelenler / Bugün Ödenecekler */}
                <button
                  type="button"
                  onClick={() => {
                    setDueTodayOnly(!dueTodayOnly);
                    setSelectedDueDateFilter("");
                    if (!dueTodayOnly) {
                      setInstallmentOnly(false);
                      setCommitmentsOnly(false);
                      setChequesOnly(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    dueTodayOnly
                      ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Son Günü Gelenler ({dueTodayOrOverdue.length})</span>
                </button>

                {/* Manuel Son Ödeme Tarihine Göre Filtreleme */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-amber-800" />
                  <span className="text-[11px] font-extrabold text-amber-950">Son Ödeme Tarihi:</span>
                  <input
                    type="date"
                    value={selectedDueDateFilter}
                    onChange={(e) => {
                      setSelectedDueDateFilter(e.target.value);
                      if (e.target.value) setDueTodayOnly(false);
                    }}
                    className="bg-white border border-amber-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  {selectedDueDateFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedDueDateFilter("")}
                      className="text-[10px] font-extrabold text-rose-700 hover:underline px-1"
                    >
                      Temizle ✕
                    </button>
                  )}
                </div>

                {/* Sıralama Seçimi */}
                <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-300 px-2.5 py-1 rounded-xl shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                  <span className="text-[11px] font-extrabold text-teal-950 shrink-0">Sırala:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-teal-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="DUE_DATE_ASC">📅 Vade: En Yakın / Önce Vadesi Gelen (Artan)</option>
                    <option value="DUE_DATE_DESC">📅 Vade: En Uzak / İleri Tarihli (Azalan)</option>
                    <option value="CREATED_DESC">🕒 Eklenme: Yeniden Eskiye</option>
                    <option value="AMOUNT_DESC">💰 Kalan Tutar: En Yüksek</option>
                    <option value="AMOUNT_ASC">💰 Kalan Tutar: En Düşük</option>
                  </select>
                </div>

                {/* Ödeme Yöntemi Filtresi */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { key: "ALL", label: "Tüm Türler" },
                    { key: "CASH", label: "💵 Nakit/Banka" },
                    { key: "CREDIT_CARD", label: "💳 Kredi Kartı" },
                  ].map((pm) => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedPaymentMethod === pm.key
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {/* Durum Filtreleri */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { key: "ALL", label: "Tümü" },
                    { key: "PENDING", label: "Bekleyenler" },
                    { key: "PARTIAL", label: "Kısmi" },
                    { key: "PAID", label: "Ödenenler" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSelectedStatus(st.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedStatus === st.key
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Kategori Butonları */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tüm Kategoriler
              </button>
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                const Icon = cat.icon;
                const count = monthBaseExpenses.filter((e) => e.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 flex items-center gap-1.5 transition-colors border ${
                      selectedCategory === key
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedCategory === key ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giderler Tablosu (Vade Takvim Sıralı) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Giderler yükleniyor...</div>
            ) : displayedExpenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                {selectedDueDateFilter
                  ? `${formatSafeDate(selectedDueDateFilter)} son ödeme tarihli kayıt bulunamadı.`
                  : dueTodayOnly
                  ? "Bugün veya vadesi geçmiş bekleyen ödeme bulunmuyor. Harika! 🎉"
                  : "Kayıt bulunamadı."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Cari / Kurum / Kişi</th>
                      <th className="py-3 px-3">Tür & Ödeme Şekli</th>
                      <th className="py-3 px-3 text-center">Dönem / Taksit</th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                        onClick={toggleDueDateSort}
                        title="Vade / Son Ödeme Tarihine göre sıralamak için tıklayın"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Son Ödeme / Vade Tarihi</span>
                          {sortBy === "DUE_DATE_ASC" ? (
                            <span className="inline-flex items-center text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded border border-teal-300 normal-case whitespace-nowrap">
                              ▲ En Yakın
                            </span>
                          ) : sortBy === "DUE_DATE_DESC" ? (
                            <span className="inline-flex items-center text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded border border-teal-300 normal-case whitespace-nowrap">
                              ▼ En Uzak
                            </span>
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-right">Ödenecek</th>
                      <th className="py-3 px-3 text-right">Ödenen</th>
                      <th
                        className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                        onClick={toggleAmountSort}
                        title="Kalan tutara göre sıralamak için tıklayın"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Kalan</span>
                          {sortBy === "AMOUNT_DESC" ? (
                            <span className="inline-flex items-center text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded border border-teal-300 normal-case whitespace-nowrap">
                              ▼ Yüksek
                            </span>
                          ) : sortBy === "AMOUNT_ASC" ? (
                            <span className="inline-flex items-center text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded border border-teal-300 normal-case whitespace-nowrap">
                              ▲ Düşük
                            </span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center">Durum</th>
                      <th className="py-3 px-3 text-center min-w-[130px]">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedExpenses.map((exp) => {
                      const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                      const Icon = cat.icon;

                      // Çoklu Hat Ayrıştırması
                      let phoneLines: any[] = [];
                      if (exp.phoneLines) {
                        try {
                          const parsed = typeof exp.phoneLines === "string" ? JSON.parse(exp.phoneLines) : exp.phoneLines;
                          if (Array.isArray(parsed)) phoneLines = parsed;
                        } catch (e) {}
                      }

                      // Ödeme Geçmişi Ayrıştırması
                      let paymentHistoryList: any[] = [];
                      if (exp.paymentHistory) {
                        try {
                          const parsed = typeof exp.paymentHistory === "string" ? JSON.parse(exp.paymentHistory) : exp.paymentHistory;
                          if (Array.isArray(parsed)) paymentHistoryList = parsed;
                        } catch (e) {}
                      }

                      return (
                        <tr
                          key={exp.id}
                          className={`hover:bg-slate-50/60 transition-colors border-l-4 ${
                            exp.status === "PAID"
                              ? "border-l-emerald-500 bg-emerald-50/20"
                              : exp.status === "PARTIAL"
                              ? "border-l-amber-500 bg-amber-50/20"
                              : "border-l-transparent"
                          }`}
                        >
                          {/* Cari Başlığı */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                              <span>{exp.title}</span>

                              {/* Kart Sahibi Rozeti */}
                              {exp.cardHolder && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>{exp.cardHolder}</span>
                                </span>
                              )}

                              {/* Taahhüt Rozeti */}
                              {exp.isCommitment && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                  <Smartphone className="w-2.5 h-2.5 text-blue-700" />
                                  <span>Taahhütlü</span>
                                </span>
                              )}

                              {exp.periodStatus && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  {exp.periodStatus}
                                </span>
                              )}
                            </div>

                            {/* Açıklama / Not */}
                            {exp.description && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {(exp.status === "PAID" || exp.amountRemaining <= 0) && exp.description.toLowerCase().includes("kaldı")
                                  ? "Tüm taksitler ödendi - Borç tamamen kapandı ✅"
                                  : exp.description.replace(/\[SUPPLIER_CARI:[^\]]+\]|\[STUDENT_REFUND:[^\]]+\]/g, "").trim()}
                              </span>
                            )}

                            {exp.category === "STUDENT_REFUND" && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <Link
                                  href="/kayit-silme-iadeleri"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors"
                                >
                                  <UserMinus className="w-3 h-3 text-rose-600" />
                                  <span>İade Dosyası & Taksit Tablosu →</span>
                                </Link>
                              </div>
                            )}

                            {/* Çoklu Telefon Hatları Dökümü (Tek Fatura İçi 5 Numara, Kullanan Kişi, Ücret ve Taahhüt Tarihi) */}
                            {phoneLines.length > 0 ? (
                              <div className="mt-1.5 p-2 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1">
                                    <PhoneCall className="w-3 h-3 text-blue-700" />
                                    <span>Fatura İçi Telefon Numaraları ({phoneLines.length} Hat)</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setHiddenPhoneRowIds((prev) => ({
                                          ...prev,
                                          [exp.id]: !prev[exp.id],
                                        }))
                                      }
                                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200"
                                    >
                                      {hiddenPhoneRowIds[exp.id] ? "👁️ Numaraları Göster" : "🙈 Numaraları Gizle"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openPhoneLinesModal(exp)}
                                      className="text-[10px] font-extrabold text-blue-700 hover:underline"
                                    >
                                      ✏️ Numaraları / Taahhüdü Düzenle
                                    </button>
                                  </div>
                                </div>
                                {!hiddenPhoneRowIds[exp.id] && (
                                  <div className="flex flex-wrap gap-1">
                                    {phoneLines.map((pl, pIdx) => {
                                      const dLeft = isMounted ? getDaysUntilCommitmentEnd(pl.commitmentEnd) : null;
                                      const isUrgent10 = dLeft !== null && dLeft <= 10;
                                      return (
                                        <span
                                          key={pIdx}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${
                                            isUrgent10
                                              ? "bg-rose-100 text-rose-950 border-rose-400 font-extrabold"
                                              : "bg-white text-slate-800 border-blue-200 font-semibold"
                                          }`}
                                        >
                                          <PhoneCall className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                          <span>{formatDisplayPhone(pl.number) || `${pIdx + 1}. Hat`}</span>
                                          {pl.title && (
                                            <span className="text-blue-800 font-bold">• 👤 {pl.title}</span>
                                          )}
                                          {Number(pl.amount) > 0 && (
                                            <span className="text-emerald-800 font-extrabold">
                                              • {formatCurrency(Number(pl.amount))}
                                            </span>
                                          )}
                                          {pl.commitmentEnd && (
                                            <span className="text-slate-600">
                                              • Taahhüt: {formatSafeDate(pl.commitmentEnd)}
                                            </span>
                                          )}
                                          {isUrgent10 && (
                                            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black animate-pulse">
                                              🔔 {dLeft <= 0 ? "Taahhüt Bitti!" : `${dLeft} Gün Kaldı!`}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              isTelecomOrPhoneExpense(exp) && (
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => openPhoneLinesModal(exp)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 transition-colors"
                                  >
                                    <PhoneCall className="w-3 h-3 text-blue-700" />
                                    <span>+ Hat / Kullanan Kişi / Taahhüt Tarihi Gir</span>
                                  </button>
                                </div>
                              )
                            )}

                            {/* Çek Detayı & QR ile Çek Fotoğrafı Ekleme / Görüntüleme */}
                            {(exp.category === "CHEQUE" || exp.paymentMethod === "CHEQUE" || exp.chequeNo) && (
                              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                {(exp.chequeNo || exp.chequeBank) && (
                                  <span className="text-[10px] font-bold text-emerald-800">
                                    📝 {exp.chequeNo ? `Çek No: ${exp.chequeNo}` : ""}{" "}
                                    {exp.chequeBank ? `• Banka: ${exp.chequeBank}` : ""}
                                  </span>
                                )}
                                {chequePhotosMap[exp.id] ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightboxChequePhoto({
                                          title: exp.title,
                                          url: chequePhotosMap[exp.id],
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold shadow-2xs transition-colors"
                                    >
                                      <img
                                        src={chequePhotosMap[exp.id]}
                                        alt="Çek Fotoğrafı"
                                        className="w-6 h-4 object-cover rounded border border-emerald-400"
                                      />
                                      <span>🖼️ Çek Fotoğrafını Gör</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openChequeQrModal(exp)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold transition-colors"
                                      title="QR ile Telefondan Çek Görselini Güncelle"
                                    >
                                      <QrCode className="w-3 h-3 text-teal-700" />
                                      <span>QR ile Değiştir</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openChequeQrModal(exp)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-extrabold shadow-2xs transition-colors"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-amber-700" />
                                    <span>📱 QR ile Çek Fotoğrafı Ekle</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Taahhüt Süresi Uyarısı (10 Gün Kala) */}
                            {isMounted && exp.isCommitment && exp.commitmentEndDate && (() => {
                              const diffDays = getDaysUntilCommitmentEnd(exp.commitmentEndDate);
                              if (diffDays !== null && diffDays <= 10) {
                                return (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                      <AlertCircle className="w-3 h-3 text-rose-700" />
                                      <span>
                                        {diffDays <= 0 ? "Taahhüt Süresi Doldu!" : `Taahhüt Bitiyor (${diffDays} gün kaldı)`}
                                      </span>
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </td>

                          {/* Tür & Ödeme Şekli */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cat.badgeBg}`}>
                                <Icon className="w-3 h-3" />
                                <span>{exp.subCategory || cat.label}</span>
                              </span>
                              <div className="flex flex-wrap items-center gap-1">
                                {(() => {
                                  const isChequeRow =
                                    exp.category === "CHEQUE" || exp.paymentMethod === "CHEQUE";
                                  const effectivePm =
                                    exp.category === "CREDIT_CARD" || isChequeRow
                                      ? "CASH"
                                      : exp.paymentMethod;
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${
                                        isChequeRow
                                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                          : effectivePm === "CREDIT_CARD"
                                          ? "bg-purple-50 text-purple-800 border-purple-200"
                                          : "bg-slate-50 text-slate-700 border-slate-200"
                                      }`}
                                    >
                                      {isChequeRow
                                        ? "💵 Nakit Olarak Ödenir"
                                        : effectivePm === "CREDIT_CARD"
                                        ? "💳 Kredi Kartı"
                                        : "💵 Nakit/Banka"}
                                    </span>
                                  );
                                })()}
                                {(() => {
                                  const matchedC = findMatchingCardForExpense(exp);
                                  const bName = exp.cardBank || matchedC?.bankName;
                                  if (!bName) return null;
                                  const bt = getBankTheme(bName);
                                  return (
                                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${bt.badge}`}>
                                      {bName}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>

                          {/* Dönem / Taksit */}
                          <td className="py-3 px-3 text-center">
                            {(() => {
                              const expYM = getExpenseDueYM(exp);
                              const ymLabel = `${expYM.month}. Ay (${expYM.year})`;
                              if (exp.installmentInfo) {
                                return (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 font-extrabold rounded-md border border-purple-300 text-[11px]">
                                      <Layers className="w-3 h-3 text-purple-700" />
                                      <span>{exp.installmentInfo}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">{ymLabel}</span>
                                  </div>
                                );
                              }
                              return (
                                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {exp.period && /\b20\d{2}\b/.test(exp.period) ? exp.period : ymLabel}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Vade / Tarih */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-semibold flex flex-col gap-0.5">
                              <span>
                                {getExpenseEffectiveDateISO(exp)
                                  ? formatSafeDate(getExpenseEffectiveDateISO(exp))
                                  : exp.dueDate
                                  ? formatSafeDate(exp.dueDate)
                                  : exp.dueDateStr || "-"}
                              </span>
                              {isMounted && (() => {
                                const effISO = getExpenseEffectiveDateISO(exp);
                                if (!effISO || exp.status === "PAID") return null;
                                const diffDays = getDaysUntilDateISO(effISO);
                                if (diffDays === null) return null;
                                const isChequeRow =
                                  exp.category === "CHEQUE" || exp.paymentMethod === "CHEQUE";
                                if (diffDays === 0) {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded w-fit animate-pulse">
                                      {isChequeRow
                                        ? "🔔 BUGÜN ÇEK ÖDEME GÜNÜ! (Nakit)"
                                        : "🔔 BUGÜN SON GÜN!"}
                                    </span>
                                  );
                                }
                                if (diffDays < 0) {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded w-fit">
                                      {isChequeRow
                                        ? `⚠️ Çek Günü Geçti (${Math.abs(diffDays)} gün)`
                                        : `⚠️ Günü Geçti (${Math.abs(diffDays)} gün)`}
                                    </span>
                                  );
                                }
                                if (diffDays <= 3) {
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded w-fit border ${
                                        isChequeRow
                                          ? "text-rose-900 bg-rose-100 border-rose-300 animate-pulse"
                                          : "text-amber-700 bg-amber-50 border-amber-200"
                                      }`}
                                    >
                                      {isChequeRow
                                        ? `🚨 Çek Ödemesine ${diffDays} Gün Kaldı!`
                                        : `⏰ ${diffDays} gün kaldı`}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>

                          {/* Ödenecek */}
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(exp.amountDue)}
                          </td>

                          {/* Ödenen & Kısmi Ödeme Geçmişi */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-emerald-700 block">
                              {exp.amountPaid > 0 ? formatCurrency(exp.amountPaid) : "-"}
                            </span>
                            {paymentHistoryList.length > 0 && (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                {paymentHistoryList.map((ph, idx) => (
                                  <div key={idx} className="text-emerald-700">
                                    {idx + 1}. Parça: {formatCurrency(ph.amount)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Kalan */}
                          <td className="py-3 px-3 text-right font-extrabold">
                            {exp.amountRemaining > 0 ? (
                              <span className="text-rose-600">{formatCurrency(exp.amountRemaining)}</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                <Check className="w-3.5 h-3.5" /> ₺0,00
                              </span>
                            )}
                          </td>

                          {/* Durum */}
                          <td className="py-3 px-3 text-center">
                            {exp.status === "PAID" ? (
                              <button
                                type="button"
                                onClick={() => handleResetPayment(exp)}
                                title="Ödemeyi İptal Etmek / Bekliyor Yapmak İçin Tıklayın"
                                className="group inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-700 group-hover:hidden" />
                                <RotateCcw className="w-3 h-3 text-rose-700 hidden group-hover:inline" />
                                <span className="group-hover:hidden">Ödendi</span>
                                <span className="hidden group-hover:inline">İptal Et</span>
                              </button>
                            ) : exp.status === "PARTIAL" ? (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(exp)}
                                title="Kısmi Ödeme Yapıldı - Ödeme Eklemek veya İptal İçin Tıklayın"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px] cursor-pointer transition-colors"
                              >
                                <Clock className="w-3 h-3 text-amber-700" />
                                Kısmi
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-[10px]">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Bekliyor
                              </span>
                            )}
                          </td>

                          {/* İşlemler */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {exp.status === "PAID" ? (
                                <button
                                  type="button"
                                  onClick={() => handleResetPayment(exp)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                                  title="Ödemeyi İptal Et (Bekliyor Durumuna Al)"
                                >
                                  <RotateCcw className="w-3 h-3 text-rose-600" />
                                  <span>Ödemeyi İptal Et</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(exp)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                                  >
                                    Ödeme Gir
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPaid(exp)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Tamamını Ödendi Yap"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  {exp.status === "PARTIAL" && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetPayment(exp)}
                                      className="p-1 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Kısmi Ödemeleri İptal Et / Sıfırla"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(exp)}
                                className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(exp.id, exp.title, exp)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      )}

      {/* ============================================================== */}
      {/* SEKME 2: TEDARİKÇİ & ÜRÜN CARİLERİ (ALINAN / ÖDENEN TAKİBİ)    */}
      {/* ============================================================== */}
      {activeMainTab === "SUPPLIERS" && (
        <SupplierCariPanel
          onSynced={fetchExpenses}
          onNavigateToMonthExpense={(ym) => {
            setSelectedMonth(ym);
            setActiveMainTab("EXPENSES");
          }}
        />
      )}

      {/* ============================================================== */}
      {/* SEKME 3: ARAÇ & MÜLK TAKİBİ (Kasko, Muayene, Sigorta)         */}
      {/* ============================================================== */}
      {activeMainTab === "ASSETS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-6 h-6 text-amber-600" />
                <span>Şirket & Bireysel Araç / Mülk Takip Sistemi</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                TÜVTÜRK muayeneleri, kasko poliçeleri, trafik sigortaları ve bina DASK bitiş tarihleri
              </p>
            </div>
            <button
              type="button"
              onClick={openNewAssetModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Araç / Mülk Ekle</span>
            </button>
          </div>

          {/* 10 Gün Erken Uyarı Bildirimi */}
          {assetWarningCount > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-950">
                  ⚠️ Acil Hatırlatma: Muayene veya Kasko Süresine 10 Günden Az Kalan Varlıklar ({assetWarningCount} Kalem)
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Trafik cezası ve sigortasız kalma riskini önlemek için muayene randevusu alınız ve kaskonuzu yenileyiniz.
                </p>
              </div>
            </div>
          )}

          {/* Varlık Kartları Izgarası */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                Henüz kayıtlı araç veya mülk bulunamadı. &quot;Yeni Araç / Mülk Ekle&quot; butonuyla ekleyebilirsiniz.
              </div>
            ) : (
              assets.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative transition-all ${
                    item.hasWarning ? "border-rose-400 ring-2 ring-rose-300/30" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.assetType === "VEHICLE" ? "🚗 Araç / Servis" : "🏢 Gayrimenkul / Mülk"}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">Sahibi: {item.owner || "Kurum"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAssetModal(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(item.id, item.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {item.assetType === "VEHICLE" ? (
                      <>
                        {/* TÜVTÜRK Muayene */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">TÜVTÜRK Muayene:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.inspectionDate ? formatSafeDate(item.inspectionDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.inspDays === "number" && (
                              <span className={`text-[10px] font-black ${item.inspDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.inspDays <= 0 ? "Süresi Doldu!" : `${item.inspDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kasko Poliçesi */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">Kasko Bitiş:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.kaskoDate ? formatSafeDate(item.kaskoDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.kaskoDays === "number" && (
                              <span className={`text-[10px] font-black ${item.kaskoDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.kaskoDays <= 0 ? "Süresi Doldu!" : `${item.kaskoDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Trafik Sigortası */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">Trafik Sigortası:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.insuranceDate ? formatSafeDate(item.insuranceDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.insDays === "number" && (
                              <span className={`text-[10px] font-black ${item.insDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.insDays <= 0 ? "Süresi Doldu!" : `${item.insDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Gayrimenkul / DASK */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-600 font-semibold">DASK / Yangın Sigortası:</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {item.housingDate ? formatSafeDate(item.housingDate) : "Belirtilmedi"}
                            </span>
                            {typeof item.houseDays === "number" && (
                              <span className={`text-[10px] font-black ${item.houseDays <= 10 ? "text-rose-600" : "text-slate-500"}`}>
                                {item.houseDays <= 0 ? "Süresi Doldu!" : `${item.houseDays} gün kaldı`}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1">{item.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEKME 4: ALTIN GÜNLERİ TAKİBİ                                  */}
      {/* ============================================================== */}
      {activeMainTab === "GOLD_DAYS" && (
        <GoldDaysPanel
          onRefreshMainExpenses={fetchExpenses}
          onNavigateToMonthExpense={(ym) => {
            setSelectedMonth(ym);
            setActiveMainTab("EXPENSES");
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 1: YENİ GİDER / TAKSİT EKLE                              */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <span>{editingExpense ? "Gider Kaydını Düzenle" : "Yeni Okul Gideri / Taksit Ekle"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* Düzenlenen giderin ödeme durumunu iptal edebilme kutusu */}
              {editingExpense && (editingExpense.status === "PAID" || Number(editingExpense.amountPaid) > 0) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Ödeme Durumu: {editingExpense.status === "PAID" ? "Tamamı Ödendi" : "Kısmi Ödendi"} (
                        {formatCurrency(editingExpense.amountPaid)})
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Bu gider için yapılan ödemeyi iptal edip borcu tekrar &quot;Bekliyor&quot; durumuna alabilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setModalOpen(false);
                      await handleResetPayment(editingExpense);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ödemeyi İptal Et</span>
                  </button>
                </div>
              )}

              {/* İşlem Türü Seçimi */}
              {!editingExpense && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Ödeme / Plan Tipi</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          entryType: "SINGLE",
                          isInstallment: false,
                          isCommitment: false,
                        })
                      }
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "SINGLE"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ReceiptText className="w-4 h-4 text-slate-600" />
                      <span>Tek Seferlik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          entryType: "INSTALLMENT",
                          isInstallment: true,
                          isCommitment: false,
                        })
                      }
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "INSTALLMENT"
                          ? "bg-purple-700 text-white shadow-2xs"
                          : "text-purple-800 hover:bg-purple-100/50"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Taksitli Borç</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          entryType: "COMMITMENT",
                          isCommitment: true,
                          isInstallment: false,
                          category: "INVOICE",
                          subCategory: form.subCategory || "Haberleşme & TV",
                          amountMode: "MONTHLY",
                        })
                      }
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "COMMITMENT"
                          ? "bg-blue-700 text-white shadow-2xs"
                          : "text-blue-800 hover:bg-blue-100/50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Taahhütlü Abonelik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneLinesInModal(false);
                        setForm({
                          ...form,
                          entryType: "UTILITY_INVOICE",
                          isCommitment: false,
                          isInstallment: false,
                          category: "INVOICE",
                          title:
                            form.title && !form.title.includes("Vodafone")
                              ? form.title
                              : "Doğalgaz Faturası (Kayserigaz)",
                          subCategory:
                            form.subCategory && !form.subCategory.includes("Telefon")
                              ? form.subCategory
                              : "F-Doğalgaz",
                          amountMode: "MONTHLY",
                          invoiceRepeatMonths: 12,
                          invoiceFutureAmountMode: "SAME_AMOUNT",
                        });
                      }}
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "UTILITY_INVOICE"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "text-amber-900 hover:bg-amber-100/60"
                      }`}
                    >
                      <ReceiptText className="w-4 h-4" />
                      <span>Fatura Ödemesi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneLinesInModal(false);
                        setForm({
                          ...form,
                          entryType: "CHEQUE_PAYMENT",
                          isCommitment: false,
                          isInstallment: false,
                          category: "CHEQUE",
                          paymentMethod: "CASH",
                          title:
                            form.title && !form.title.includes("Faturası") && !form.title.includes("Vodafone")
                              ? form.title
                              : "Çek Ödemesi",
                          subCategory: "Çek Ödemesi",
                          amountMode: "TOTAL",
                        });
                      }}
                      className={`py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        form.entryType === "CHEQUE_PAYMENT"
                          ? "bg-emerald-700 text-white shadow-2xs"
                          : "text-emerald-900 hover:bg-emerald-100/60"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Çek Ödemesi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ÇEK ÖDEMESİ EKRANI (TARİH & TUTAR GİRİŞİ, 3 GÜN ÖNCE UYARI, NAKİT ÖDENİR) */}
              {(form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE") && !editingExpense && (
                <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>📝 Çek Ödemesi Girişi (Tarih & Tutar)</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-extrabold">
                        ⏰ 3 Gün Önce Yukarıda Hatırlatır
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950 text-[10px] font-extrabold">
                        💵 Nakit Olarak Ödenir
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-900 font-semibold bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    💡 Aşağıdan <strong>Çek Tutarı</strong> ve <strong>Çek Ödeme Tarihini</strong> girdiğinizde ödeme listesinde <strong>Nakit Olarak Ödenir</strong> şeklinde gösterilir ve çek tarihinden <strong>3 gün önce</strong> sayfanın üst kısmında otomatik uyarı verir.
                  </p>
                </div>
              )}

              {/* FATURA ÖDEMESİ EKRANI (DOĞALGAZ, ELEKTRİK, SU, İNTERNET - HER AY ÖDEME LİSTESİNDE GÖZÜKSÜN) */}
              {form.entryType === "UTILITY_INVOICE" && !editingExpense && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                      <ReceiptText className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>🔥⚡💧 Fatura Ödemesi Girişi (Doğalgaz, Elektrik, Su vb.)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-extrabold">
                      Her Ay Ödeme Listesinde Gözükür
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1.5">
                      Fatura Türünü Hızlı Seçin (veya aşağıdan adını yazın):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        {
                          label: "🔥 Doğalgaz",
                          title: "Doğalgaz Faturası (Kayserigaz)",
                          sub: "F-Doğalgaz",
                        },
                        {
                          label: "⚡ Elektrik",
                          title: "Elektrik Faturası (KCETAŞ)",
                          sub: "F-Elektrik",
                        },
                        {
                          label: "💧 Su (KASKİ)",
                          title: "Su Faturası (KASKİ)",
                          sub: "F-Su",
                        },
                        {
                          label: "🌐 İnternet",
                          title: "Kurumsal İnternet Faturası",
                          sub: "F-Haberleşme & İnternet",
                        },
                      ].map((preset) => {
                        const isSelectedPreset =
                          form.subCategory === preset.sub || form.title === preset.title;
                        return (
                          <button
                            key={preset.sub}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                title: preset.title,
                                category: "INVOICE",
                                subCategory: preset.sub,
                              })
                            }
                            className={`px-2.5 py-2 rounded-xl text-xs font-extrabold border transition-all text-center ${
                              isSelectedPreset
                                ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                                : "bg-white text-amber-950 border-amber-300 hover:bg-amber-100/70"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-amber-200/80">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Ödeme Listesinde Gösterim Süresi
                      </label>
                      <select
                        value={form.invoiceRepeatMonths}
                        onChange={(e) =>
                          setForm({ ...form, invoiceRepeatMonths: parseInt(e.target.value) || 12 })
                        }
                        className="w-full px-2.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:outline-none"
                      >
                        <option value={12}>Her Ay Ödeme Listesinde Gözüksün (12 Ay Boyunca)</option>
                        <option value={6}>6 Ay Boyunca Her Ay Gözüksün</option>
                        <option value={1}>Sadece Seçili Ayda Gözüksün (Tek Ay)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Gelecek Ayların Tutar Ayarı
                      </label>
                      <select
                        value={form.invoiceFutureAmountMode}
                        onChange={(e) =>
                          setForm({ ...form, invoiceFutureAmountMode: e.target.value })
                        }
                        className="w-full px-2.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:outline-none"
                      >
                        <option value="SAME_AMOUNT">Girilen Tutarı Her Aya Yansıt (Sonradan Düzenlenebilir)</option>
                        <option value="FIRST_MONTH_ONLY">Tutarı İlk Aya Yaz, Sonraki Aylar 0 ₺ Beklesin</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-900 font-semibold bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                    💡 Aşağıdan <strong>Fatura Son Ödeme Tarihini</strong> girdiğinizde (örn. ayın 20&apos;si), sistem her ayın aynı günü için faturayı otomatik oluşturur ve her ay ödeme listesinde gösterir.
                  </p>
                </div>
              )}

              {/* Cari / Kurum Adı */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {form.entryType === "UTILITY_INVOICE"
                    ? "Fatura / Kurum Adı (Doğalgaz, Elektrik, Su vb.) *"
                    : form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE"
                    ? "Çek Açıklaması / Kime Verildiği *"
                    : "Cari / Kurum / Kişi Adı *"}
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.entryType === "UTILITY_INVOICE"
                      ? "Örn: Doğalgaz Faturası (Kayserigaz), Elektrik Faturası (KCETAŞ)"
                      : form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE"
                      ? "Örn: Çek Ödemesi - Uğur Gıda San. Tic."
                      : form.entryType === "COMMITMENT"
                      ? "Örn: Türk Telekom, Turkcell Superonline, Digiturk"
                      : "Örn: Özdemirler A.Ş., İlyas Yılmaz, Kayseri Elektrik"
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              {/* Kategori ve Alt Tür */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setForm({
                        ...form,
                        category: nextCat,
                        paymentMethod:
                          (nextCat === "CREDIT_CARD" || nextCat === "CHEQUE")
                            ? "CASH"
                            : form.paymentMethod,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alt Tür / Detay</label>
                  <input
                    type="text"
                    value={form.subCategory}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    placeholder="Örn: Bina Kirası, F-Elektrik, Kurumsal Hat"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* Ödeme Şekli (Nakit, Kredi Kartı, Çek) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800 text-xs">Bu Gider Nasıl Ödenecek? *</label>
                {form.category === "CREDIT_CARD" ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-900">
                      💵 Nakit / Banka Havalesi ile Ödenir
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800">
                      (Kredi kartı borcu kredi kartı ile ödenemez)
                    </span>
                  </div>
                ) : form.category === "CHEQUE" || form.entryType === "CHEQUE_PAYMENT" ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-900">
                      💵 Nakit Olarak Ödenir
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800">
                      (Çek ödemeleri vadesinde nakit olarak ödenir)
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH"
                        checked={form.paymentMethod === "CASH"}
                        onChange={() => setForm({ ...form, paymentMethod: "CASH" })}
                      />
                      <span className="font-semibold text-[11px] text-slate-800">💵 Nakit / Havale</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CREDIT_CARD"
                        checked={form.paymentMethod === "CREDIT_CARD"}
                        onChange={() => setForm({ ...form, paymentMethod: "CREDIT_CARD" })}
                      />
                      <span className="font-semibold text-[11px] text-purple-900">💳 Kredi Kartı</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CHEQUE"
                        checked={form.paymentMethod === "CHEQUE"}
                        onChange={() => setForm({ ...form, category: "CHEQUE", paymentMethod: "CASH" })}
                      />
                      <span className="font-semibold text-[11px] text-emerald-900">📝 Çek (Nakit Ödenir)</span>
                    </label>
                  </div>
                )}

                {/* Kredi Kartı Detayı (Kredi kartı borcuysa veya başka bir gider kredi kartıyla ödendiyse hangi kart olduğunu seçtir) */}
                {(form.category === "CREDIT_CARD" || form.paymentMethod === "CREDIT_CARD") && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <div>
                      <span className="block text-[10px] font-bold text-purple-900 mb-1">
                        {form.category === "CREDIT_CARD"
                          ? "Hangi Kredi Kartının Borcu / Harcaması? (Harcama kullanılabilir limitten düşer):"
                          : "Kayıtlı Kartlardan Seç (Harcama seçilen kartın kullanılabilir limitinden düşer):"}
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const cleanedDesc = (form.description || "")
                              .replace(/\[(card-[^\]]+)\]/gi, "")
                              .trim();
                            setForm({
                              ...form,
                              cardHolder: "",
                              cardBank: "",
                              description: cleanedDesc,
                            });
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all text-left ${
                            !/\[(card-[^\]]+)\]/i.test(form.description || "") && !form.cardHolder && !form.cardBank
                              ? "bg-slate-800 text-white border-slate-900 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ✕ Kart Tanımlama (Genel Kredi Kartı)
                        </button>
                        {ahmetCardsComputed.map((c) => {
                          const bt = getBankTheme(c.bankName);
                          const hasTag = (form.description || "").includes(`[${c.id}]`);
                          const isChosen =
                            hasTag ||
                            (!/\[(card-[^\]]+)\]/i.test(form.description || "") &&
                              Boolean(form.cardHolder) &&
                              Boolean(form.cardBank) &&
                              form.cardHolder.toLowerCase() === c.holder.toLowerCase() &&
                              form.cardBank.toLowerCase() === c.bankName.toLowerCase());
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                const cleanedDesc = (form.description || "")
                                  .replace(/\[(card-[^\]]+)\]/gi, "")
                                  .trim();
                                if (isChosen) {
                                  // Zaten seçiliyse seçimi kaldır
                                  setForm({
                                    ...form,
                                    cardHolder: "",
                                    cardBank: "",
                                    description: cleanedDesc,
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    cardHolder: c.holder,
                                    cardBank: c.bankName,
                                    dueDate: c.dueDateISO || form.dueDate,
                                    description: `${cleanedDesc ? cleanedDesc + " " : ""}[${c.id}]`.trim(),
                                  });
                                }
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all text-left ${
                                isChosen
                                  ? `${bt.badge} ring-2 ring-offset-1 ring-slate-400`
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>
                                {c.holder} • {c.cardLabel || c.bankName}
                              </span>
                              <span className="ml-1 text-[9px] text-emerald-700 font-extrabold">
                                (Kalan Limit: {formatCurrency(c.availableLimit)})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Kart Sahibi</label>
                        <input
                          type="text"
                          value={form.cardHolder}
                          onChange={(e) => setForm({ ...form, cardHolder: e.target.value })}
                          placeholder="Örn: Ahmet Taymaz, Muhammed Ali Çağır, Şirket"
                          className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Banka</label>
                        <input
                          type="text"
                          value={form.cardBank}
                          onChange={(e) => setForm({ ...form, cardBank: e.target.value })}
                          placeholder="Örn: Vakıfbank, Ziraat, Halkbank"
                          className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Çek Detayı & QR ile Çek Fotoğrafı Yükleme */}
                {(form.paymentMethod === "CHEQUE" || form.category === "CHEQUE" || form.entryType === "CHEQUE_PAYMENT") && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Çek No (Opsiyonel)</label>
                        <input
                          type="text"
                          value={form.chequeNo}
                          onChange={(e) => setForm({ ...form, chequeNo: e.target.value })}
                          placeholder="Örn: TR-884219"
                          className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Keşide Bankası (Opsiyonel)</label>
                        <input
                          type="text"
                          value={form.chequeBank}
                          onChange={(e) => setForm({ ...form, chequeBank: e.target.value })}
                          placeholder="Örn: Halkbank Kayseri Şubesi"
                          className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Çek Fotoğrafı Ekleme Alanı (QR ile Telefondan veya Bilgisayardan) */}
                    <div className="p-3 bg-white border-2 border-dashed border-emerald-300 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-700" />
                          <span className="font-extrabold text-[11px] text-emerald-950">
                            Çek Fotoğrafı / Görseli
                          </span>
                          {formChequePhotoUrl && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                              ✓ Yüklendi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleToggleFormQr}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold shadow-2xs transition-all ${
                              showFormQr
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-emerald-700 hover:bg-emerald-800 text-white"
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{showFormQr ? "QR Kodu Kapat" : "📱 QR ile Ekle (Telefondan Yükle)"}</span>
                          </button>

                          <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>Bilgisayardan Seç</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (ev) => {
                                const f = ev.target.files?.[0];
                                if (!f) return;
                                try {
                                  const b64 = await compressChequeImageFile(f);
                                  setFormChequePhotoUrl(b64);
                                } catch {
                                  alert("Görsel işlenemedi");
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* QR Kod Açıldığında Gösterilen Kutu */}
                      {showFormQr && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left animate-in fade-in duration-200">
                          <div className="p-2 bg-white rounded-xl border border-emerald-200 shadow-xs shrink-0">
                            {formQrDataUrl ? (
                              <img src={formQrDataUrl} alt="Çek QR" className="w-36 h-36 object-contain" />
                            ) : (
                              <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <p className="font-extrabold text-emerald-950 text-xs">
                              📱 Telefonunuzun Kamerasıyla QR Kodu Okutun
                            </p>
                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                              QR kodu okuttuğunuzda telefonunuzda <strong>Çek Fotoğrafı Yükleme</strong> ekranı açılır. Çekin fotoğrafını çekip yüklediğinizde bu ekrana <strong>otomatik olarak</strong> yansır.
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
                              <span>Telefondan fotoğraf yüklenmesi bekleniyor...</span>
                            </div>
                            {formQrTargetUrl && (
                              <p className="text-[9px] text-slate-500 break-all pt-0.5">
                                Bağlantı: {formQrTargetUrl}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Yüklenen Çek Görseli Önizlemesi */}
                      {formChequePhotoUrl && (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={formChequePhotoUrl}
                              alt="Çek Önizleme"
                              onClick={() =>
                                setLightboxChequePhoto({
                                  title: form.title || "Çek Görseli",
                                  url: formChequePhotoUrl,
                                })
                              }
                              className="w-24 h-14 object-cover rounded-lg border border-emerald-400 cursor-pointer hover:opacity-90"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-extrabold text-emerald-900">
                                ✓ Çek Görseli Hazır
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxChequePhoto({
                                    title: form.title || "Çek Görseli",
                                    url: formChequePhotoUrl,
                                  })
                                }
                                className="text-[10px] font-bold text-teal-700 hover:underline"
                              >
                                🔍 Görseli Tam Ekran İncele
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormChequePhotoUrl(null)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0"
                          >
                            Kaldır
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TAAHHÜTLÜ ABONELİK AYARLARI */}
              {form.entryType === "COMMITMENT" && !editingExpense && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-blue-700" />
                    <span>Taahhütlü Abonelik Planı (Telefon, İnternet, TV vb.)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">Taahhüt Süresi</label>
                      <select
                        value={form.commitmentMonths}
                        onChange={(e) => setForm({ ...form, commitmentMonths: parseInt(e.target.value) || 12 })}
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none"
                      >
                        <option value={6}>6 Ay Taahhüt</option>
                        <option value={12}>12 Ay (1 Yıl) Taahhüt</option>
                        <option value={24}>24 Ay (2 Yıl) Taahhüt</option>
                        <option value={36}>36 Ay Taahhüt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">Tutar Şekli</label>
                      <select
                        value={form.amountMode}
                        onChange={(e) => setForm({ ...form, amountMode: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none"
                      >
                        <option value="MONTHLY">Aylık Fatura Tutarı (Her Ay)</option>
                        <option value="TOTAL">Toplam Taahhüt Tutarını Böl</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAKSİTLİ BORÇ AYARLARI */}
              {form.entryType === "INSTALLMENT" && !editingExpense && (
                <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-purple-950 font-bold text-xs">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>Taksitli Borç Planı (Veli İadesi, Kredi vb.)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Toplam Taksit Sayısı</label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={form.installmentCount}
                        onChange={(e) => setForm({ ...form, installmentCount: parseInt(e.target.value) || 2 })}
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Tutar Şekli</label>
                      <select
                        value={form.amountMode}
                        onChange={(e) => setForm({ ...form, amountMode: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none"
                      >
                        <option value="TOTAL">Toplam Borcu Taksitlere Böl</option>
                        <option value="MONTHLY">Girilen Tutar Aylık Taksittir</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutar ve Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.entryType === "UTILITY_INVOICE"
                      ? "Fatura Tutarı (TL) *"
                      : form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE"
                      ? "💰 Çek Tutarı (TL) *"
                      : form.entryType === "COMMITMENT" || form.amountMode === "MONTHLY"
                      ? "Aylık Tutar (TL) *"
                      : "Ödenecek Tutar (TL) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={form.entryType !== "UTILITY_INVOICE"}
                    value={form.amountDue}
                    onChange={(e) => setForm({ ...form, amountDue: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      {form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE"
                        ? "📅 Çek Ödeme Tarihi *"
                        : form.entryType === "UTILITY_INVOICE" || form.category === "INVOICE"
                        ? "📅 Fatura Son Ödeme Tarihi *"
                        : form.category === "CREDIT_CARD"
                        ? "💳 Kart Son Ödeme Tarihi *"
                        : form.entryType === "SINGLE"
                        ? "Vade / Son Ödeme Tarihi *"
                        : "İlk Vade / Başlangıç Tarihi *"}
                    </span>
                    {form.entryType === "CHEQUE_PAYMENT" || form.category === "CHEQUE" ? (
                      <span className="text-[10px] text-rose-800 font-extrabold bg-rose-100 px-1.5 py-0.2 rounded">
                        3 Gün Önce Uyarı
                      </span>
                    ) : (
                      (form.entryType === "UTILITY_INVOICE" ||
                        form.category === "INVOICE" ||
                        form.category === "CREDIT_CARD") && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                          Günü Gelince Hatırlatılır
                        </span>
                      )
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      let nextMonth = form.monthIndex;
                      if (nextDate) {
                        const isoMatch = String(nextDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (isoMatch) {
                          nextMonth = parseInt(isoMatch[2], 10);
                        } else {
                          const d = new Date(nextDate);
                          if (!isNaN(d.getTime())) {
                            nextMonth = d.getMonth() + 1;
                          }
                        }
                      }
                      setForm({ ...form, dueDate: nextDate, monthIndex: nextMonth });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {/* Manuel Düzenlenebilir Taksit Planı (Genel Modal) */}
              {form.entryType === "INSTALLMENT" && !editingExpense && Number(form.installmentCount) > 1 && (
                <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-purple-950 text-[11px]">
                      ✏️ Taksit Planı (Otomatik {form.installmentCount} Taksite Bölündü — Manuel Düzenleyebilirsiniz)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormCustomInstallments(
                          computeEqualSplit(
                            form.amountDue,
                            Number(form.installmentCount) || 2,
                            form.amountMode as "TOTAL" | "MONTHLY"
                          )
                        )
                      }
                      className="px-2 py-0.5 rounded bg-white border border-purple-300 text-[10px] font-bold text-purple-800 hover:bg-purple-100 shrink-0"
                    >
                      Eşit Böl (Sıfırla)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-0.5">
                    {formCustomInstallments.map((instVal, idx) => {
                      const startMonth = Number(form.monthIndex) || 9;
                      const startYear = (() => {
                        const m = String(form.dueDate || "").match(/^(\d{4})-/);
                        return m ? parseInt(m[1], 10) : startMonth >= 7 ? 2026 : 2027;
                      })();
                      const totalM = startMonth - 1 + idx;
                      const mNum = (totalM % 12) + 1;
                      const yNum = startYear + Math.floor(totalM / 12);
                      const targetTotal =
                        form.amountMode === "MONTHLY"
                          ? (Number(form.amountDue) || 0) * (Number(form.installmentCount) || 2)
                          : Number(form.amountDue) || 0;
                      return (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-purple-200">
                          <label className="block text-[10px] font-extrabold text-purple-900 mb-0.5">
                            {idx + 1}. Taksit ({mNum}. Ay • {yNum})
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={instVal}
                              onChange={(e) =>
                                handleManualInstallmentChange(
                                  formCustomInstallments,
                                  idx,
                                  e.target.value,
                                  targetTotal,
                                  setFormCustomInstallments
                                )
                              }
                              placeholder="0.00"
                              className="w-full px-2 py-1 border border-purple-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:border-purple-600"
                            />
                            <span className="text-[10px] font-bold text-slate-500">₺</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-200/80 text-[11px]">
                    <span className="text-purple-900">
                      1. Taksit: <strong>{formatCurrency(Number(formCustomInstallments[0]) || 0)}</strong>
                    </span>
                    <span className="text-purple-950 font-extrabold">
                      Taksitler Toplamı:{" "}
                      {formatCurrency(formCustomInstallments.reduce((s, v) => s + (Number(v) || 0), 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Ay Seçimi */}
              {(() => {
                const dueYearMatch = String(form.dueDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
                const dueYear = dueYearMatch ? parseInt(dueYearMatch[1], 10) : null;
                return (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {form.entryType === "UTILITY_INVOICE" && Number(form.invoiceRepeatMonths) > 1
                        ? "Faturanın Başlangıç Ayı (Sonraki Aylar Otomatik Oluşturulur)"
                        : `Giderin Ait Olduğu Ay (${dueYear ? `${dueYear} Yılı Son Ödeme Tarihine Göre` : "Son Ödeme Tarihine Göre"})`}
                    </label>
                    <select
                      value={form.monthIndex}
                      onChange={(e) => {
                        const newM = parseInt(e.target.value, 10) || 9;
                        let nextDue = form.dueDate;
                        if (dueYearMatch) {
                          const y = parseInt(dueYearMatch[1], 10);
                          const day = parseInt(dueYearMatch[3], 10);
                          const maxD = new Date(y, newM, 0).getDate();
                          const safeD = Math.min(day, maxD);
                          nextDue = `${y}-${String(newM).padStart(2, "0")}-${String(safeD).padStart(2, "0")}`;
                        }
                        setForm({ ...form, monthIndex: newM, dueDate: nextDue });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {dueYear && dueYear !== 2026 && dueYear !== 2027 ? (
                        <optgroup label={`📅 ${dueYear} Yılı (Son Ödeme Tarihi Yılı)`}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                            <option key={m} value={m}>
                              {m}. Ay ({TR_MONTH_FULL[m]} {dueYear})
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <>
                          <optgroup label="📅 2026 Yılı (Temmuz – Aralık 2026)">
                            <option value={7}>7. Ay (Temmuz 2026)</option>
                            <option value={8}>8. Ay (Ağustos 2026)</option>
                            <option value={9}>9. Ay (Eylül 2026)</option>
                            <option value={10}>10. Ay (Ekim 2026)</option>
                            <option value={11}>11. Ay (Kasım 2026)</option>
                            <option value={12}>12. Ay (Aralık 2026)</option>
                          </optgroup>
                          <optgroup label="📅 2027 Yılı (Ocak – Haziran 2027)">
                            <option value={1}>1. Ay (Ocak 2027)</option>
                            <option value={2}>2. Ay (Şubat 2027)</option>
                            <option value={3}>3. Ay (Mart 2027)</option>
                            <option value={4}>4. Ay (Nisan 2027)</option>
                            <option value={5}>5. Ay (Mayıs 2027)</option>
                            <option value={6}>6. Ay (Haziran 2027)</option>
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>
                );
              })()}

              {/* Açıklama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opsiyonel notlar veya detaylar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? "Kaydediliyor..." : editingExpense ? "Güncelle" : "Gideri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: PARÇALI ÖDEME & ÖDEME GEÇMİŞİ                         */}
      {/* ============================================================== */}
      {paymentModalOpen && activePaymentExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-700" />
                <span>Ödeme Girişi Yap</span>
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="mt-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">{activePaymentExpense.title}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>Toplam Borç: <strong>{formatCurrency(activePaymentExpense.amountDue)}</strong></span>
                  <span>Şu Ana Kadar Ödenen: <strong className="text-emerald-700">{formatCurrency(activePaymentExpense.amountPaid)}</strong></span>
                </div>
                <div className="text-right text-[11px] font-extrabold text-rose-600 pt-0.5">
                  Kalan Tutar: {formatCurrency(activePaymentExpense.amountRemaining)}
                </div>

                {/* Önceki Ödeme Geçmişi Dökümü */}
                {activePaymentExpense.paymentHistory && (() => {
                  try {
                    const list = JSON.parse(activePaymentExpense.paymentHistory);
                    if (Array.isArray(list) && list.length > 0) {
                      return (
                        <div className="space-y-1 pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-[10px] text-slate-700 block">Yapılan Ödemeler Geçmişi:</span>
                          <div className="space-y-1 max-h-28 overflow-y-auto">
                            {list.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-lg text-[10px]">
                                <span className="font-semibold text-slate-700">{item.date} - {item.note || `${idx + 1}. Ödeme`}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-emerald-800">{formatCurrency(item.amount)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePaymentItem(activePaymentExpense, idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                    title="Bu Ödeme Parçasını Sil"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şimdi Ödenecek Tutar (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={activePaymentExpense.amountRemaining}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-extrabold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödeme Tarihi *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ödeme Notu / Dekont No</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Örn: Ziraat Havale, 2. Kısmi Dekont..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {activePaymentExpense.amountPaid > 0 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setPaymentModalOpen(false);
                      await handleResetPayment(activePaymentExpense);
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tüm Ödemeleri İptal Et</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {paymentSubmitting ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: YENİ ARAÇ / MÜLK EKLE                                 */}
      {/* ============================================================== */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                <span>{editingAsset ? "Varlık Düzenle" : "Yeni Araç / Mülk Ekle"}</span>
              </h3>
              <button
                onClick={() => setAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Varlık Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="VEHICLE"
                      checked={assetForm.assetType === "VEHICLE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "VEHICLE" })}
                    />
                    <span className="font-bold text-slate-800">🚗 Araç / Servis</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="assetType"
                      value="REAL_ESTATE"
                      checked={assetForm.assetType === "REAL_ESTATE"}
                      onChange={() => setAssetForm({ ...assetForm, assetType: "REAL_ESTATE" })}
                    />
                    <span className="font-bold text-slate-800">🏢 Ev / Bina / Mülk</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {assetForm.assetType === "VEHICLE" ? "Araç Plakası & Modeli *" : "Mülk / Ev Adresi & Tanımı *"}
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.title}
                  onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                  placeholder={assetForm.assetType === "VEHICLE" ? "Örn: 38 AB 123 - Ford Transit" : "Örn: Kampüs Ana Binası"}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kimin Üzerine / Sahibi</label>
                <input
                  type="text"
                  value={assetForm.owner}
                  onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                  placeholder="Örn: Şirket Aracı, Ahmet Bey, Kiralık Mülk"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              {assetForm.assetType === "VEHICLE" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">TÜVTÜRK Muayene Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.inspectionDate}
                        onChange={(e) => setAssetForm({ ...assetForm, inspectionDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kasko Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={assetForm.kaskoDate}
                        onChange={(e) => setAssetForm({ ...assetForm, kaskoDate: e.target.value })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trafik Sigortası Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={assetForm.insuranceDate}
                      onChange={(e) => setAssetForm({ ...assetForm, insuranceDate: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DASK / Bina Sigortası Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={assetForm.housingDate}
                    onChange={(e) => setAssetForm({ ...assetForm, housingDate: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notlar / Poliçe No</label>
                <textarea
                  rows={2}
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  placeholder="Opsiyonel notlar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={assetSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {assetSubmitting ? "Kaydediliyor..." : editingAsset ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AHMET TAYMAZ KREDİ KARTI HARCAMA & MANUEL TAKSİT GİRİŞİ */}
      {/* ============================================================== */}
      {cardTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    💳 Kredi Kartı Harcama & Manuel Taksit Girişi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ahmet Taymaz, Muhammed Ali Çağır veya Şirket kartlarından yapılan harcamayı ekleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCardTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCardTxSubmit} className="mt-4 space-y-4 text-xs">
              {/* 1. Hangi Kart Kullanıldı? */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  1. Hangi Kredi Kartı Kullanıldı? ({ahmetCardsComputed.length} Kayıtlı Kart)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-0.5">
                  {ahmetCardsComputed.map((c) => {
                    const active = cardTxForm.cardId === c.id;
                    const bt = getBankTheme(c.bankName);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setCardTxForm({
                            ...cardTxForm,
                            cardId: c.id,
                            dueDate: c.dueDateISO || cardTxForm.dueDate,
                          })
                        }
                        className={`p-2 rounded-lg border text-left transition-all ${
                          active ? bt.selectedBg : bt.cardBg
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${bt.badge}`}>
                            {c.bankName}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-500">
                            {formatSafeDate(c.dueDateISO)}
                          </span>
                        </div>
                        <span className="font-bold text-[11px] text-slate-900 block truncate mt-0.5">
                          👤 {c.holder}
                        </span>
                        <span className="text-[9px] font-extrabold text-emerald-700 block truncate">
                          Kullanılabilir: {formatCurrency(c.availableLimit)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Harcama / İşlem Adı */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  2. Yapılan Harcama / İşlem Nedir? *
                </label>
                <input
                  type="text"
                  required
                  value={cardTxForm.title}
                  onChange={(e) => setCardTxForm({ ...cardTxForm, title: e.target.value })}
                  placeholder="Örn: Kırtasiye Alımı, Market, N11, Yurt Dışı Harcaması, Bilgisayar..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>

              {/* 3. Kaç Taksite Bölünecek? (Manuel Taksit Girişi) */}
              <div className="p-3.5 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>3. Kaç Taksite Bölünecek? (Manuel Seçim veya Yazım)</span>
                  </label>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-700 text-white">
                    {Number(cardTxForm.installmentCount) > 1
                      ? `${cardTxForm.installmentCount} Taksit`
                      : "Tek Çekim (1)"}
                  </span>
                </div>

                {/* Hızlı Taksit Butonları */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { count: 1, label: "Tek Çekim (1)" },
                    { count: 2, label: "2 Taksit" },
                    { count: 3, label: "3 Taksit" },
                    { count: 4, label: "4 Taksit" },
                    { count: 6, label: "6 Taksit" },
                    { count: 9, label: "9 Taksit" },
                    { count: 12, label: "12 Taksit" },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setCardTxForm({ ...cardTxForm, installmentCount: opt.count })}
                      className={`px-2.5 py-1.5 rounded-lg font-extrabold text-[11px] border transition-all ${
                        Number(cardTxForm.installmentCount) === opt.count
                          ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                          : "bg-white text-purple-900 border-purple-200 hover:bg-purple-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Manuel Taksit Sayısı Yazma Kutusu */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] font-bold text-purple-900">
                    Farklı bir taksit sayısıysa manuel girin (1 - 60 Ay):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={cardTxForm.installmentCount}
                      onChange={(e) =>
                        setCardTxForm({
                          ...cardTxForm,
                          installmentCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-20 px-2.5 py-1.5 bg-white border-2 border-purple-400 rounded-xl text-center font-extrabold text-sm text-purple-950 focus:outline-none"
                    />
                    <span className="font-extrabold text-purple-950">Taksit</span>
                  </div>
                </div>
              </div>

              {/* 4. Harcama Tutarı ve Bölünme Şekli */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                {Number(cardTxForm.installmentCount) > 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardTxForm({ ...cardTxForm, amountMode: "TOTAL" })}
                      className={`p-2 rounded-xl font-bold text-[11px] border text-center transition-all ${
                        cardTxForm.amountMode === "TOTAL"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Toplam Harcama Tutarını Gireceğim (Taksite Bölsün)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardTxForm({ ...cardTxForm, amountMode: "MONTHLY" })}
                      className={`p-2 rounded-xl font-bold text-[11px] border text-center transition-all ${
                        cardTxForm.amountMode === "MONTHLY"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Aylık Taksit Tutarını Gireceğim
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">
                      {Number(cardTxForm.installmentCount) > 1 && cardTxForm.amountMode === "MONTHLY"
                        ? "Aylık Taksit Tutarı (₺) *"
                        : "Toplam Harcama Tutarı (₺) *"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={cardTxForm.amount}
                      onChange={(e) => setCardTxForm({ ...cardTxForm, amount: e.target.value })}
                      placeholder="Örn: 30000"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">
                      İlk Ekstre Ayı (Başlangıç)
                    </label>
                    <select
                      value={cardTxForm.monthIndex}
                      onChange={(e) => setCardTxForm({ ...cardTxForm, monthIndex: parseInt(e.target.value) || 9 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <optgroup label="📅 2026 Yılı (Temmuz – Aralık 2026)">
                        <option value={7}>7. Ay (Temmuz 2026)</option>
                        <option value={8}>8. Ay (Ağustos 2026)</option>
                        <option value={9}>9. Ay (Eylül 2026)</option>
                        <option value={10}>10. Ay (Ekim 2026)</option>
                        <option value={11}>11. Ay (Kasım 2026)</option>
                        <option value={12}>12. Ay (Aralık 2026)</option>
                      </optgroup>
                      <optgroup label="📅 2027 Yılı (Ocak – Haziran 2027)">
                        <option value={1}>1. Ay (Ocak 2027)</option>
                        <option value={2}>2. Ay (Şubat 2027)</option>
                        <option value={3}>3. Ay (Mart 2027)</option>
                        <option value={4}>4. Ay (Nisan 2027)</option>
                        <option value={5}>5. Ay (Mayıs 2027)</option>
                        <option value={6}>6. Ay (Haziran 2027)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Manuel Düzenlenebilir Taksit Planı (Örn: 205.000 TL -> 2 Taksit -> 1. Taksit 105.000, 2. Taksit 100.000) */}
                {Number(cardTxForm.installmentCount) > 1 && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-purple-950 text-[11px]">
                        ✏️ Taksit Planı (Otomatik {cardTxForm.installmentCount} Taksite Bölündü — Taksit Tutarlarını Manuel Düzenleyebilirsiniz)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCardTxCustomInstallments(
                            computeEqualSplit(
                              cardTxForm.amount,
                              Number(cardTxForm.installmentCount) || 1,
                              cardTxForm.amountMode
                            )
                          )
                        }
                        className="px-2 py-0.5 rounded bg-white border border-purple-300 text-[10px] font-bold text-purple-800 hover:bg-purple-100 shrink-0"
                      >
                        Eşit Böl (Sıfırla)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
                      {cardTxCustomInstallments.map((instVal, idx) => {
                        const mNum = (((Number(cardTxForm.monthIndex) || 9) - 1 + idx) % 12) + 1;
                        const targetTotal =
                          cardTxForm.amountMode === "MONTHLY"
                            ? (Number(cardTxForm.amount) || 0) * (Number(cardTxForm.installmentCount) || 1)
                            : Number(cardTxForm.amount) || 0;

                        return (
                          <div key={idx} className="p-2 bg-white rounded-xl border border-purple-200 shadow-2xs">
                            <label className="block text-[10px] font-extrabold text-purple-900 mb-0.5">
                              {idx + 1}. Taksit ({mNum}. Ay • {mNum >= 7 ? "2026" : "2027"})
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={instVal}
                                onChange={(e) =>
                                  handleManualInstallmentChange(
                                    cardTxCustomInstallments,
                                    idx,
                                    e.target.value,
                                    targetTotal,
                                    setCardTxCustomInstallments
                                  )
                                }
                                placeholder="Örn: 105000"
                                className="w-full px-2 py-1 bg-slate-50 border border-purple-300 rounded-lg text-xs font-extrabold text-slate-950 focus:outline-none focus:bg-white focus:border-purple-600"
                              />
                              <span className="text-[10px] font-bold text-slate-600">₺</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Canlı Hesaplama Özeti (Bu Ayki Taksit, Toplam Ödenecek Tutar & Kullanılabilir Limitten Düşüm) */}
                {(() => {
                  const selectedCardObj =
                    ahmetCardsComputed.find((c) => c.id === cardTxForm.cardId) || ahmetCardsComputed[0];
                  const totalTxSpending =
                    Number(cardTxForm.installmentCount) > 1
                      ? cardTxCustomInstallments.reduce((s, v) => s + (Number(v) || 0), 0)
                      : Number(cardTxForm.amount) || 0;
                  const firstInstAmount =
                    Number(cardTxForm.installmentCount) > 1
                      ? Number(cardTxCustomInstallments[0]) || 0
                      : Number(cardTxForm.amount) || 0;
                  const currentAvail = selectedCardObj ? selectedCardObj.availableLimit : 0;
                  const remainingAvailAfterTx = Math.max(0, Number((currentAvail - totalTxSpending).toFixed(2)));

                  if (totalTxSpending <= 0) return null;

                  return (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">
                            1. Taksit (Bu Ay Ekstreye Yansıyacak):
                          </span>
                          <span className="text-base font-extrabold text-slate-950">
                            {formatCurrency(firstInstAmount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-amber-900 block">
                            Toplam Harcama (Limitten Düşecek):
                          </span>
                          <span className="text-base font-extrabold text-rose-600">
                            -{formatCurrency(totalTxSpending)}
                          </span>
                        </div>
                      </div>
                      {selectedCardObj && (
                        <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-700">
                            Mevcut Kullanılabilir Limit: <strong>{formatCurrency(currentAvail)}</strong>
                          </span>
                          <span className="text-emerald-800 font-extrabold">
                            Harcama Sonrası Kalan Limit: {formatCurrency(remainingAvailAfterTx)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 5. İşlem / Son Ödeme Tarihi ve Açıklama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İşlem / Son Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={cardTxForm.dueDate}
                    onChange={(e) => setCardTxForm({ ...cardTxForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Not / Açıklama (Opsiyonel)</label>
                  <input
                    type="text"
                    value={cardTxForm.description}
                    onChange={(e) => setCardTxForm({ ...cardTxForm, description: e.target.value })}
                    placeholder="Örn: Okul alışverişi..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCardTxModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={cardTxSubmitting}
                  className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-amber-300 rounded-xl font-extrabold shadow-sm disabled:opacity-50"
                >
                  {cardTxSubmitting
                    ? "Ekstreye İşleniyor..."
                    : Number(cardTxForm.installmentCount) > 1
                    ? `${cardTxForm.installmentCount} Taksit Olarak Karta İşle`
                    : "Tek Çekim Olarak Karta İşle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KART BORCU / AYLIK EKSTRE ÖDEME & HARCAMALARI ÖDENDİ İŞARETLEME */}
      {/* ============================================================== */}
      {cardPayModalOpen &&
        (() => {
          const payCard = ahmetCardsComputed.find((c) => c.id === cardPayForm.cardId) || ahmetCardsComputed[0];
          if (!payCard) return null;
          const unpaidMonthTx = payCard.monthTx.filter((tx) => tx.status !== "PAID");
          const targetUnpaidTx =
            unpaidMonthTx.length > 0 ? unpaidMonthTx : payCard.allTx.filter((tx) => tx.status !== "PAID");
          const enteredPayNum = Math.max(0, Number(cardPayForm.amount) || 0);
          const afterPayUsed = Math.max(0, Number((payCard.usedLimit - enteredPayNum).toFixed(2)));
          const afterPayAvailable = Math.max(0, Number((payCard.cardLimit - afterPayUsed).toFixed(2)));

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        💳 Kart Borcu Öde ({payCard.bankName})
                      </h3>
                      <p className="text-xs text-slate-500">
                        👤 {payCard.holder} • Ödeme yapıldığında listedeki harcamalar otomatik{" "}
                        <strong>Ödendi</strong> işaretlenir
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCardPayModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handlePayCardStatement} className="mt-4 space-y-4 text-xs">
                  {/* Kart Limiti & Ödeme Sonrası Kullanılabilir Limit Özeti */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Kart Limiti</span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {formatCurrency(payCard.cardLimit)}
                      </span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-700 block">Toplam Kullanılan</span>
                      <span className="font-extrabold text-sm text-rose-600">
                        {formatCurrency(payCard.usedLimit)}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        Ödeme Sonrası Kullanılabilir
                      </span>
                      <span className="font-extrabold text-sm text-emerald-700">
                        {formatCurrency(afterPayAvailable)}
                      </span>
                    </div>
                  </div>

                  {/* Bu Ayki Ödenecek Harcamalar / Taksitler Listesi */}
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-950">
                        📋 Ödendi Olarak İşaretlenecek Harcamalar ({targetUnpaidTx.length} Kalem)
                      </span>
                      <span className="font-extrabold text-emerald-800">
                        Toplam: {formatCurrency(targetUnpaidTx.reduce((s, t) => s + t.amountRemaining, 0))}
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {targetUnpaidTx.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2 bg-white rounded-lg border border-emerald-200/80 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{tx.title}</p>
                            <p className="text-[10px] text-slate-500">
                              {tx.installmentInfo || "Tek Çekim"} • {tx.monthIndex || 9}. Ay
                            </p>
                          </div>
                          <span className="font-extrabold text-slate-900 shrink-0">
                            {formatCurrency(tx.amountRemaining)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ödeme Tutarı ve Tarihi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-800 mb-1">
                        Ödenecek Kart Borcu Tutarı (₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={cardPayForm.amount}
                        onChange={(e) => setCardPayForm({ ...cardPayForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-emerald-500 rounded-xl text-sm font-extrabold text-slate-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-800 mb-1">Ödeme Tarihi</label>
                      <input
                        type="date"
                        value={cardPayForm.date}
                        onChange={(e) => setCardPayForm({ ...cardPayForm, date: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ödeme Notu</label>
                    <input
                      type="text"
                      value={cardPayForm.note}
                      onChange={(e) => setCardPayForm({ ...cardPayForm, note: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCardPayModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={cardPaySubmitting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-sm disabled:opacity-50"
                    >
                      {cardPaySubmitting
                        ? "Ödeme İşleniyor..."
                        : "💳 Kart Borcunu Öde & Harcamaları Ödendi İşaretle"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* ============================================================== */}
      {/* MODAL: TEK FATURA İÇİ 5 TELEFON NUMARASI, KULLANAN KİŞİ, ÜCRET & TAAHHÜT TARİHİ */}
      {/* ============================================================== */}
      {phoneModalOpen && activePhoneExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    📞 Tek Fatura İçi Telefon Numaraları & Taahhüt Takibi ({phoneModalLines.filter(p => p.number || p.title).length || phoneModalLines.length} Hat)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fatura: <strong className="text-slate-800">{activePhoneExpense.title}</strong> • Ödeme listesinde tek kalem görünür, taahhüt bitimine <strong>10 gün kala</strong> otomatik hatırlatır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoneLines} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-blue-950 block">
                    Vodafone / Kurumsal Tek Fatura İçindeki Numaraları Tek Tek Girin
                  </span>
                  <span className="text-[11px] text-blue-800 block">
                    Her numaranın yanına kimin kullandığını, aylık kullanım ücretini ve taahhüt bitiş tarihini yazabilirsiniz.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPhoneModalLines([
                      ...phoneModalLines,
                      { number: "", title: "", amount: "", commitmentEnd: "" },
                    ])
                  }
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-xs shadow-2xs shrink-0"
                >
                  + Yeni Numara Satırı Ekle
                </button>
              </div>

              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 text-[11px] font-extrabold text-slate-600 uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Telefon Numarası</div>
                  <div className="col-span-3">Kimin Kullandığı</div>
                  <div className="col-span-2">Kullanım Ücreti (₺)</div>
                  <div className="col-span-3">Taahhüt Bitiş Tarihi</div>
                </div>

                {phoneModalLines.map((pl, idx) => {
                  const dLeft = getDaysUntilCommitmentEnd(pl.commitmentEnd);
                  const isUrgent10 = dLeft !== null && dLeft <= 10;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center transition-colors ${
                        isUrgent10
                          ? "bg-rose-50/70 border-rose-300"
                          : "bg-slate-50/80 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="sm:col-span-1 flex items-center justify-between sm:justify-start">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-100 text-blue-900 font-extrabold text-[11px]">
                          {idx + 1}. Hat
                        </span>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-500 mb-0.5">
                          Telefon Numarası
                        </label>
                        <input
                          type="text"
                          value={pl.number}
                          onChange={(e) => {
                            const copy = [...phoneModalLines];
                            copy[idx] = { ...copy[idx], number: e.target.value };
                            setPhoneModalLines(copy);
                          }}
                          placeholder="Örn: 0542 123 45 67"
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-500 mb-0.5">
                          Kimin Kullandığı
                        </label>
                        <input
                          type="text"
                          value={pl.title}
                          onChange={(e) => {
                            const copy = [...phoneModalLines];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setPhoneModalLines(copy);
                          }}
                          placeholder="Örn: Ahmet Bey, Müdürlük, Muhasebe"
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-500 mb-0.5">
                          Kullanım Ücreti (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pl.amount ?? ""}
                          onChange={(e) => {
                            const copy = [...phoneModalLines];
                            copy[idx] = { ...copy[idx], amount: e.target.value };
                            setPhoneModalLines(copy);
                          }}
                          placeholder="Örn: 1450"
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-emerald-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-500 mb-0.5">
                          Taahhüt Bitiş Tarihi
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={pl.commitmentEnd}
                            onChange={(e) => {
                              const copy = [...phoneModalLines];
                              copy[idx] = { ...copy[idx], commitmentEnd: e.target.value };
                              setPhoneModalLines(copy);
                            }}
                            className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                          {phoneModalLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...phoneModalLines];
                                copy[idx] = { number: "", title: "", amount: "", commitmentEnd: "" };
                                setPhoneModalLines(copy);
                              }}
                              title="Satırı Temizle"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {dLeft !== null && (
                          <span
                            className={`mt-1 inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              dLeft <= 0
                                ? "bg-rose-600 text-white"
                                : dLeft <= 10
                                ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {dLeft < 0
                              ? `⚠️ Taahhüt ${Math.abs(dLeft)} gün önce bitti!`
                              : dLeft === 0
                              ? "🔔 Bugün taahhüt son günü!"
                              : dLeft <= 10
                              ? `🔔 Son ${dLeft} gün kaldı (10 Gün Uyarısı)`
                              : `✓ ${dLeft} gün var`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toplam Ücret ve Tek Faturaya Yansıtma Özeti */}
              {(() => {
                const enteredSum = Number(
                  phoneModalLines.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)
                );
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-slate-600">
                          Mevcut Tek Fatura Tutarı:{" "}
                          <strong className="text-slate-900">
                            {formatCurrency(activePhoneExpense.amountDue)}
                          </strong>
                        </span>
                        <span className="text-xs text-blue-900">
                          Girilen Hatların Kullanım Ücreti Toplamı:{" "}
                          <strong className="text-emerald-700 text-sm">
                            {formatCurrency(enteredSum)}
                          </strong>
                        </span>
                      </div>
                      {enteredSum > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={syncPhoneAmountToInvoice}
                            onChange={(e) => setSyncPhoneAmountToInvoice(e.target.checked)}
                            className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          />
                          <span className="text-[11px] font-bold text-slate-800">
                            Hat kullanım ücretleri toplamını ({formatCurrency(enteredSum)}) bu tek faturanın ödenecek tutarına da eşitle
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhoneModalOpen(false)}
                        className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="submit"
                        disabled={phoneModalSubmitting}
                        className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-extrabold shadow-sm disabled:opacity-50"
                      >
                        {phoneModalSubmitting
                          ? "Kaydediliyor..."
                          : "📞 Numaraları ve Taahhüt Tarihlerini Kaydet"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QR İLE TELEFONDAN ÇEK FOTOĞRAFI YÜKLEME & ÖNİZLEME       */}
      {/* ============================================================== */}
      {activeQrChequeExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    📱 QR ile Çek Fotoğrafı Ekle
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeQrChequeExpense.title} • {formatCurrency(activeQrChequeExpense.amountDue)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrChequeExpense(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* QR Kod Kutusu */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="p-2.5 bg-white rounded-2xl border border-emerald-200 shadow-sm shrink-0">
                  {qrModalDataUrl ? (
                    <img src={qrModalDataUrl} alt="Çek QR Kodu" className="w-44 h-44 object-contain" />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                    <Camera className="w-3.5 h-3.5" />
                    Telefon Kamerasıyla Okutun
                  </span>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    Telefondan Çek Görselini Yükleyin
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Telefonunuzun kamerasını açıp QR kodu okutun. Açılan sayfada çekin fotoğrafını çekip onayladığınızda <strong>bu ekrana otomatik olarak</strong> yansır.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
                    <span>Telefondan yükleme canlı dinleniyor...</span>
                  </div>
                  {qrModalTargetUrl && (
                    <p className="text-[10px] text-slate-500 break-all pt-1">
                      Mobil Link: {qrModalTargetUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* Mevcut veya Yüklenen Çek Görseli */}
              {chequePhotosMap[activeQrChequeExpense.id] ? (
                <div className="p-3.5 bg-slate-50 border-2 border-emerald-400 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Çek Görseli Yüklendi!
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxChequePhoto({
                            title: activeQrChequeExpense.title,
                            url: chequePhotosMap[activeQrChequeExpense.id],
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold"
                      >
                        🔍 Tam Ekran Aç
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Bu çekin fotoğrafını silmek istediğinize emin misiniz?")) return;
                          await fetch(`/api/giderler/cek/${activeQrChequeExpense.id}/foto`, {
                            method: "DELETE",
                          });
                          setChequePhotosMap((prev) => {
                            const next = { ...prev };
                            delete next[activeQrChequeExpense.id];
                            return next;
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold"
                      >
                        Görseli Sil
                      </button>
                    </div>
                  </div>
                  <img
                    src={chequePhotosMap[activeQrChequeExpense.id]}
                    alt="Çek Görseli"
                    onClick={() =>
                      setLightboxChequePhoto({
                        title: activeQrChequeExpense.title,
                        url: chequePhotosMap[activeQrChequeExpense.id],
                      })
                    }
                    className="w-full max-h-60 object-contain rounded-xl border border-slate-200 bg-white cursor-pointer"
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-semibold">
                    İsterseniz doğrudan bilgisayardan da çek görseli seçebilirsiniz:
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                    <span>Bilgisayardan Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        if (!f) return;
                        try {
                          const b64 = await compressChequeImageFile(f);
                          const res = await fetch(
                            `/api/giderler/cek/${activeQrChequeExpense.id}/foto`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                photoUrl: b64,
                                title: activeQrChequeExpense.title,
                              }),
                            }
                          );
                          if (res.ok) {
                            setChequePhotosMap((prev) => ({
                              ...prev,
                              [activeQrChequeExpense.id]: b64,
                            }));
                          }
                        } catch {
                          alert("Görsel yüklenemedi");
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveQrChequeExpense(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  Tamam / Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TAM EKRAN ÇEK GÖRSELİ İNCELEME (LIGHTBOX)               */}
      {/* ============================================================== */}
      {lightboxChequePhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxChequePhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>📝 {lightboxChequePhoto.title} — Çek Fotoğrafı</span>
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxChequePhoto.url}
                  download={`cek-fotografi-${Date.now()}.jpg`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndir</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxChequePhoto(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center max-h-[78vh]">
              <img
                src={lightboxChequePhoto.url}
                alt={lightboxChequePhoto.title}
                className="max-w-full max-h-[76vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GiderlerPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span>Giderler ve Borç Takibi Yükleniyor...</span>
      </div>
    </div>
  );
}

export default function GiderlerPage() {
  return (
    <Suspense fallback={<GiderlerPageFallback />}>
      <GiderlerPageContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Mail,
  Save,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  ChevronDown,
  Building2,
  Phone,
  User,
  Calendar,
  CreditCard,
  Percent,
  Check,
  Eye,
  Sliders,
  Sparkles,
  Send,
  X,
  Copy,
  Receipt,
  Download,
  Settings,
  ListOrdered,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Loader2,
} from "lucide-react";

export interface QuoteItem {
  id: string;
  desc: string;
  qty: number | string;
  unit: string;
  listPrice: number;
  discountPercent: number;
  netPrice: number;
  total: number;
}

export interface BankCampaign {
  id: string;
  bankName: string;
  installmentCount: number | string;
  campaignText: string;
}

export interface MasterPrices {
  academicYear: string;
  educationPrice: number;
  diningPrice: number;
  stationeryPrice: number;
  stationeryProportionalPrice: number;
  publicationFixedPrice: number;
  totalServiceDays: number;
  summerPrice: number;
}

export interface MonthlyPriceRow {
  id: string;
  year: string; // Örn: "2026", "2027", "2028"
  monthName: string; // Örn: "Eylül", "Ekim"...
  month: string; // Birleşik etiket: Örn: "Eylül 2026"
  remainingDays: number;
  education: number;
  dining: number;
  stationeryTotal: number;
  stationeryProportional: number;
  publicationFixed: number;
  totalPrice: number;
  roundedPrice: number;
}

const TURKISH_MONTHS = [
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

const DEFAULT_MASTER_PRICES: MasterPrices = {
  academicYear: "2026-2027",
  educationPrice: 220000,
  diningPrice: 80000,
  stationeryPrice: 65000,
  stationeryProportionalPrice: 40000,
  publicationFixedPrice: 25000,
  totalServiceDays: 183.5,
  summerPrice: 45000,
};

const DEFAULT_MONTHLY_PRICES: MonthlyPriceRow[] = [
  { id: "m1", year: "2026", monthName: "Eylül", month: "Eylül 2026", remainingDays: 183.5, education: 220000, dining: 80000, stationeryTotal: 65000, stationeryProportional: 40000, publicationFixed: 25000, totalPrice: 365000, roundedPrice: 365000 },
  { id: "m2", year: "2026", monthName: "Ekim", month: "Ekim 2026", remainingDays: 165.5, education: 200000, dining: 72000, stationeryTotal: 60000, stationeryProportional: 35000, publicationFixed: 25000, totalPrice: 332000, roundedPrice: 332000 },
  { id: "m3", year: "2026", monthName: "Kasım", month: "Kasım 2026", remainingDays: 145.0, education: 175000, dining: 64000, stationeryTotal: 55000, stationeryProportional: 30000, publicationFixed: 25000, totalPrice: 294000, roundedPrice: 294000 },
  { id: "m4", year: "2026", monthName: "Aralık", month: "Aralık 2026", remainingDays: 129.0, education: 156250, dining: 58000, stationeryTotal: 50000, stationeryProportional: 25000, publicationFixed: 25000, totalPrice: 264250, roundedPrice: 264000 },
  { id: "m5", year: "2027", monthName: "Ocak", month: "Ocak 2027", remainingDays: 106.0, education: 127500, dining: 49000, stationeryTotal: 45000, stationeryProportional: 20000, publicationFixed: 25000, totalPrice: 221500, roundedPrice: 222000 },
  { id: "m6", year: "2027", monthName: "Şubat", month: "Şubat 2027", remainingDays: 91.0, education: 112500, dining: 42000, stationeryTotal: 40000, stationeryProportional: 15000, publicationFixed: 25000, totalPrice: 194500, roundedPrice: 195000 },
  { id: "m7", year: "2027", monthName: "Mart", month: "Mart 2027", remainingDays: 76.0, education: 93750, dining: 38000, stationeryTotal: 35000, stationeryProportional: 10000, publicationFixed: 25000, totalPrice: 166750, roundedPrice: 167000 },
  { id: "m8", year: "2027", monthName: "Nisan", month: "Nisan 2027", remainingDays: 58.0, education: 72500, dining: 32000, stationeryTotal: 30000, stationeryProportional: 5000, publicationFixed: 25000, totalPrice: 134500, roundedPrice: 135000 },
  { id: "m9", year: "2027", monthName: "Mayıs", month: "Mayıs 2027", remainingDays: 37.0, education: 47500, dining: 25000, stationeryTotal: 25000, stationeryProportional: 0, publicationFixed: 25000, totalPrice: 97500, roundedPrice: 98000 },
  { id: "m10", year: "2027", monthName: "Haziran", month: "Haziran 2027", remainingDays: 19.0, education: 22500, dining: 10000, stationeryTotal: 15000, stationeryProportional: 2500, publicationFixed: 12500, totalPrice: 47500, roundedPrice: 48000 },
];

function normalizeMonthlyRow(raw: any, idx = 0): MonthlyPriceRow {
  const rawLabel = String(raw?.month || raw?.monthName || `Eylül 2026`).trim();
  const parts = rawLabel.split(/\s+/);
  const detectedYear =
    raw?.year ||
    (parts.length > 1 && /^\d{4}$/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : "2026");
  const detectedMonthName =
    raw?.monthName && !/\d{4}/.test(String(raw.monthName))
      ? String(raw.monthName).trim()
      : parts.filter((p) => !/^\d{4}$/.test(p)).join(" ") || "Eylül";

  const education = Number(raw?.education) || 0;
  const dining = Number(raw?.dining) || 0;
  const stationeryProportional = Number(raw?.stationeryProportional ?? raw?.stationeryProRated ?? 0);
  const publicationFixed = Number(raw?.publicationFixed ?? raw?.publicationsFixed ?? 0);
  const stationeryTotal =
    raw?.stationeryTotal !== undefined
      ? Number(raw.stationeryTotal) || 0
      : stationeryProportional + publicationFixed;
  const totalPrice =
    Number(raw?.totalPrice ?? raw?.totalFee) || education + dining + stationeryTotal;
  const roundedPrice =
    Number(raw?.roundedPrice ?? raw?.roundedFee) || Math.round(totalPrice / 1000) * 1000;

  return {
    id: String(raw?.id || `m_${idx + 1}`),
    year: String(detectedYear),
    monthName: detectedMonthName,
    month: `${detectedMonthName} ${detectedYear}`.trim(),
    remainingDays: Number(raw?.remainingDays ?? 183.5),
    education,
    dining,
    stationeryTotal,
    stationeryProportional,
    publicationFixed,
    totalPrice,
    roundedPrice,
  };
}

const DEFAULT_POLICY_NOTES = [
  "2026-2027 eğitim-öğretim yılı için geçerli olan erken kayıt kampanyası, yalnızca kampanyanın uygulandığı ve teklifin verildiği ay için geçerlidir. Takip eden aylarda eğitim ücretlerinde artış uygulanacaktır. %20 Kurumsal İndirim yalnızca eğitim ücreti ve yaz okulu ücreti için geçerlidir.",
  "Peşin ödemelerde %10 Peşin Ödeme İndirimi ve %5 Kardeş İndirimi (her bir kardeşe ayrı ayrı), toplam kayıt bedeli üzerinden uygulanır.",
  "Eğitim seti (yerli ve yabancı yayınlar, kırtasiye materyalleri, atölye eğitim kitleri) bedeli Temmuz ayında belirlenecektir ve satışa sunulacaktır.",
  "Çek ödemelerinizde ortalama vade esas alınarak peşin ödemede sağlanan fayda 6'ya bölünerek çıkan tutar vade sayısına çarpılarak tekrar peşin tutarın üzerine eklenir.",
  "Yaz okulu ücretleri her şey dahil olarak belirlenmiştir. Yaz okulu kapsamında herhangi bir ek ücret talep edilmez ve yalnızca yaz okuluna kayıt olunursa Ağustos 2026 dahil olacak şekilde taksitlendirilir.",
  "Belirtilen tüm ücretlere %10 KDV dahildir.",
  "Eğitim yılı içerisinde yer alan resmi tatillerde (ara tatil, yarıyıl tatili vb.) katılım, veli dilekçesi ile alınır ve katılım sağlanan günler için ayrıca ücretlendirme yapılır. Geziler, okul etkinlikleri, ulaşım giderleri ve gösteri kostümleri veli tarafından karşılanır.",
  "Kayıt silme işlemleri yalnızca kayıt silme dilekçesi ile yapılır.",
  "5580 sayılı Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği'nin 56. maddesi gereğince: Eğitim dönemi başlamadan önce kayıt iptali talep eden veliler, yıllık eğitim ücretinin %10'unu ödemekle yükümlüdür. Eğitim dönemi başladıktan sonra kayıt iptali halinde; yıllık ücretin %10'u ile öğrencinin eğitim aldığı gün sayısına göre hesaplanan tutar tahsil edilir. Eğitim, yemek ve yaz okulu ücretleri hizmet alınan gün bazında hesaplanır. Eğitim setleri öğrenciye özel hazırlandığından iade edilmez ve bedeli tam tahsil edilir. İade oluşması durumunda, geri ödeme taksitli olarak gerçekleştirilir.",
  "Banka ve Ödeme Kampanyaları: Banka kampanyaları, kredi kartı özelliklerine göre değişiklik gösterebilir. Güncel kampanyaların banka mobil uygulamaları üzerinden kontrol edilmesi gerekmektedir. Eğitim harcamalarına özel tek çekim vade farksız taksitlendirme seçenekleri hakkında okul muhasebemizden bilgi alınabilir.",
];

const DEFAULT_BANK_CAMPAIGNS: BankCampaign[] = [
  { id: "b1", bankName: "ZİRAAT BANKASI", installmentCount: 7, campaignText: "2 taksitli okul ödemelerinizde +5 taksit fırsatından faydalanabilirsiniz.(25 BİN VE ÜZERİ) 7 TAKSİT" },
  { id: "b2", bankName: "ZİRAAT BANKASI", installmentCount: 3, campaignText: "K.K PEŞİN FİYATINA 3 TAKSİT (25 BİN VE ÜZERİ) 3 TAKSİT" },
  { id: "b3", bankName: "İŞBANKASI", installmentCount: 5, campaignText: "2 taksitli okul ödemelerinizde +3 taksit fırsatından faydalanabilirsiniz. 5 TAKSİT" },
  { id: "b4", bankName: "HALK BANK VISA/MASTER", installmentCount: 7, campaignText: "2 taksitli okul ödemelerinizde +5 taksit fırsatından faydalanabilirsiniz. 7 TAKSİT / TEK ÇEKİMDE 5 TAKSİT" },
  { id: "b5", bankName: "HALKBANK PARAF TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ) 6 TAKSİT" },
  { id: "b6", bankName: "VAKIFBANK VISA/MASTER", installmentCount: 4, campaignText: "K.K PEŞİN FİYATINA 4 TAKSİT (10 BİN VE ÜZERİ) 4 TAKSİT" },
  { id: "b7", bankName: "VAKIFBANK TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ) 6 TAKSİT" },
  { id: "b8", bankName: "AKBANK VISA/MASTER", installmentCount: 4, campaignText: "K.K PEŞİN FİYATINA 4 TAKSİT Jüzdan uygulamasından kontrol edilmelidir. 4 TAKSİT" },
  { id: "b9", bankName: "AKBANK TROY", installmentCount: 4, campaignText: "K.K PEŞİN FİYATINA 4 TAKSİT Jüzdan uygulamasından kontrol edilmelidir." },
  { id: "b10", bankName: "TEB BANK TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b11", bankName: "TEB BANK VISA/MASTER", installmentCount: 3, campaignText: "K.K PEŞİN FİYATINA 3 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b12", bankName: "ALBARAKA WORLD KART", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (30.000 TL İLE 500.000 TL ARASI)" },
  { id: "b13", bankName: "KUVEYT TÜRK SAĞLAM KART", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (1 BİN VE ÜZERİ)" },
  { id: "b_1791008388005", bankName: "DENİZ BANK", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (100 BİN VE ÜZERİ)" },
];

export default function TekliflerPage() {
  // Aktif Sekme: "LIST" (Tarih Sıralı Verilen Teklifler) | "EDITOR" (Teklif Düzenle & A4 Görünüm)
  const [activeTab, setActiveTab] = useState<"LIST" | "EDITOR">("LIST");

  // Editör İçi Görünüm: "PREVIEW" (A4 Belge Görünümü) | "EDIT" (Form Giriş Modu)
  const [editorView, setEditorView] = useState<"PREVIEW" | "EDIT">("EDIT");

  // Önceden Kaydedilen Standart Fiyatlar & Aylık Kayıt Ücretleri Tablosu
  const [masterPrices, setMasterPrices] = useState<MasterPrices>(DEFAULT_MASTER_PRICES);
  const [monthlyPrices, setMonthlyPrices] = useState<MonthlyPriceRow[]>(DEFAULT_MONTHLY_PRICES);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("m1");
  const [splitStationeryItems, setSplitStationeryItems] = useState<boolean>(false);
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [savingMaster, setSavingMaster] = useState(false);
  const [tableYearFilter, setTableYearFilter] = useState<string>("ALL");

  // Hızlı Yıl & Aya Özel Fiyat Tanımlama Formu (Modal içinde üstte)
  const [quickMonthForm, setQuickMonthForm] = useState({
    year: "2026",
    monthName: "Eylül",
    remainingDays: 183.5,
    education: 220000,
    dining: 80000,
    stationeryTotal: 65000,
    stationeryProportional: 40000,
    publicationFixed: 25000,
  });

  // "Teklif Ver" İlk Adım Modalı
  const [newQuoteModalOpen, setNewQuoteModalOpen] = useState(false);
  const [initForm, setInitForm] = useState({
    parentName: "",
    phone: "",
    studentName: "",
    quoteDate: new Date().toISOString().split("T")[0],
    selectedMonthId: "m1",
    includeEducation: true,
    includeDining: true,
    includeStationery: true,
    includePublication: true,
    includeSummer: false,
    splitStationeryRows: false,
  });

  // Aktif Teklif State'leri
  const [schoolName, setSchoolName] = useState("ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ");
  const [schoolAddress, setSchoolAddress] = useState(
    "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ"
  );
  const [schoolPhone, setSchoolPhone] = useState("0(352) 503 91 93 - 0(537) 380 0 380");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [parentName, setParentName] = useState("YUSUF GÜVENER");
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("0530 832 26 62");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState(
    "2026 - 2027 Eğitim Öğretim Yılı mevcut aya özel erken kayıt ücretlerimizi bilgilerinize sunarız."
  );

  // Kalemler ve Banka
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [policyNotes, setPolicyNotes] = useState<string[]>(DEFAULT_POLICY_NOTES);
  const [bankInfo, setBankInfo] = useState(
    "VAKIFBANK - HESAP ADI: SİMCÜ ÖZEL EĞİTİM HİZMETLERİ A.Ş.  IBAN: TR40 0001 5001 5800 7349 4889 17"
  );
  const [bankCampaigns, setBankCampaigns] = useState<BankCampaign[]>(DEFAULT_BANK_CAMPAIGNS);
  const [masterBankCampaigns, setMasterBankCampaigns] = useState<BankCampaign[]>(DEFAULT_BANK_CAMPAIGNS);
  const [savingBanks, setSavingBanks] = useState(false);
  const [savedBanksSuccess, setSavedBanksSuccess] = useState(false);
  const [includeStamp, setIncludeStamp] = useState(true);

  // Kayıt ve Durum
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [quoteNo, setQuoteNo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Tarih Sıralı Teklif Listesi
  const [quotesList, setQuotesList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // E-Posta Modalı
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipient: "",
    subject: "Özel Kayseri Simya Çocuk Üniversitesi - Fiyat Teklif Formu",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Para formatlayıcı
  const formatCurrency = (val: number) => {
    return (
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(val || 0) + " ₺"
    );
  };

  // Hesaplamalar
  const grossTotal = items.reduce((sum, item) => sum + (Number(item.listPrice) || 0), 0);
  const netTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountTotal = grossTotal - netTotal;
  const kdvPercent = 0;
  const kdvTotal = 0;
  const grandTotal = netTotal;

  // Başlangıç: Standart fiyatları, aylık tabloyu, banka kampanyalarını ve teklif listesini çek
  useEffect(() => {
    try {
      const savedMaster = localStorage.getItem("cosmos_master_bank_campaigns_v1") || localStorage.getItem("cosmos_teklif_bank_campaigns_v1");
      if (savedMaster) {
        const parsed = JSON.parse(savedMaster);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBankCampaigns(parsed);
          setMasterBankCampaigns(parsed);
        }
      }
      const savedSchedule = localStorage.getItem("cosmos_monthly_price_schedule_v1");
      if (savedSchedule) {
        const parsedSched = JSON.parse(savedSchedule);
        if (parsedSched?.monthlyPrices && Array.isArray(parsedSched.monthlyPrices)) {
          setMonthlyPrices(parsedSched.monthlyPrices.map((r: any, i: number) => normalizeMonthlyRow(r, i)));
        }
        if (parsedSched?.masterPrices) {
          setMasterPrices((prev) => ({
            ...prev,
            ...parsedSched.masterPrices,
            stationeryProportionalPrice:
              Number(
                parsedSched.masterPrices.stationeryProportionalPrice ??
                  parsedSched.masterPrices.stationeryProRatedPrice ??
                  40000
              ),
            publicationFixedPrice:
              Number(
                parsedSched.masterPrices.publicationFixedPrice ??
                  parsedSched.masterPrices.publicationsFixedPrice ??
                  25000
              ),
          }));
        }
      }
    } catch {}
    fetchMasterPrices();
    fetchQuotesList();
  }, []);

  const fetchMasterPrices = async () => {
    try {
      const res = await fetch("/api/teklifler/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && data.educationPrice) {
          setMasterPrices((prev) => ({
            ...prev,
            academicYear: data.academicYear || "2026-2027",
            educationPrice: Number(data.educationPrice) || 220000,
            diningPrice: Number(data.diningPrice) || 80000,
            stationeryPrice: Number(data.stationeryPrice) || 65000,
            summerPrice: Number(data.summerPrice) || 45000,
          }));
        }
        if (data && data.monthlyScheduleData) {
          const sched = data.monthlyScheduleData;
          if (sched.monthlyPrices && Array.isArray(sched.monthlyPrices) && sched.monthlyPrices.length > 0) {
            setMonthlyPrices(sched.monthlyPrices.map((r: any, i: number) => normalizeMonthlyRow(r, i)));
          }
          if (sched.masterPrices) {
            setMasterPrices((prev) => ({
              ...prev,
              ...sched.masterPrices,
              stationeryProportionalPrice: Number(
                sched.masterPrices.stationeryProportionalPrice ??
                  sched.masterPrices.stationeryProRatedPrice ??
                  40000
              ),
              publicationFixedPrice: Number(
                sched.masterPrices.publicationFixedPrice ??
                  sched.masterPrices.publicationsFixedPrice ??
                  25000
              ),
            }));
          }
          try {
            localStorage.setItem("cosmos_monthly_price_schedule_v1", JSON.stringify(sched));
          } catch {}
        }
        if (data && data.bankCampaigns) {
          try {
            const parsedBanks =
              typeof data.bankCampaigns === "string"
                ? JSON.parse(data.bankCampaigns)
                : data.bankCampaigns;
            if (Array.isArray(parsedBanks) && parsedBanks.length > 0) {
              setBankCampaigns(parsedBanks);
              setMasterBankCampaigns(parsedBanks);
              localStorage.setItem("cosmos_master_bank_campaigns_v1", JSON.stringify(parsedBanks));
              localStorage.setItem("cosmos_teklif_bank_campaigns_v1", JSON.stringify(parsedBanks));
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Standart fiyat ayarları çekilemedi, varsayılanlar devrede:", err);
    }
  };

  const fetchQuotesList = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/teklifler");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt).getTime();
            const dateB = new Date(b.date || b.createdAt).getTime();
            return dateB - dateA;
          });
          setQuotesList(sorted);
        }
      }
    } catch (err) {
      console.error("Teklif listesi yüklenemedi:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // Hızlı Formda Yıl veya Ay Seçildiğinde Mevcut Kayıt Varsa Otomatik Doldur
  const handleQuickYearMonthSelect = (yearVal: string, monthNameVal: string) => {
    const existing = monthlyPrices.find(
      (r) => r.year === yearVal && r.monthName.toLowerCase() === monthNameVal.toLowerCase()
    );
    if (existing) {
      setQuickMonthForm({
        year: yearVal,
        monthName: monthNameVal,
        remainingDays: existing.remainingDays,
        education: existing.education,
        dining: existing.dining,
        stationeryTotal: existing.stationeryTotal,
        stationeryProportional: existing.stationeryProportional,
        publicationFixed: existing.publicationFixed,
      });
    } else {
      setQuickMonthForm((prev) => ({
        ...prev,
        year: yearVal,
        monthName: monthNameVal,
      }));
    }
  };

  // Hızlı Formdan Yıl ve Aya Özel Eğitim, Yemek, Kırtasiye Fiyatını Tabloya Ekle / Güncelle
  const handleUpsertQuickYearMonth = () => {
    const y = String(quickMonthForm.year || "2026").trim();
    const mName = String(quickMonthForm.monthName || "Eylül").trim();
    const fullLabel = `${mName} ${y}`;
    const edu = Number(quickMonthForm.education) || 0;
    const dine = Number(quickMonthForm.dining) || 0;
    const statTotal = Number(quickMonthForm.stationeryTotal) || 0;
    const pubFixed = Number(quickMonthForm.publicationFixed) || 0;
    const statPro = Math.max(0, statTotal - pubFixed);
    const totalPrice = edu + dine + statTotal;
    const roundedPrice = Math.round(totalPrice / 1000) * 1000;

    setMonthlyPrices((prev) => {
      const idx = prev.findIndex(
        (r) => r.year === y && r.monthName.toLowerCase() === mName.toLowerCase()
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          year: y,
          monthName: mName,
          month: fullLabel,
          remainingDays: Number(quickMonthForm.remainingDays) || updated[idx].remainingDays,
          education: edu,
          dining: dine,
          stationeryTotal: statTotal,
          stationeryProportional: statPro,
          publicationFixed: pubFixed,
          totalPrice,
          roundedPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `m_${Date.now()}`,
            year: y,
            monthName: mName,
            month: fullLabel,
            remainingDays: Number(quickMonthForm.remainingDays) || 183.5,
            education: edu,
            dining: dine,
            stationeryTotal: statTotal,
            stationeryProportional: statPro,
            publicationFixed: pubFixed,
            totalPrice,
            roundedPrice,
          },
        ];
      }
    });
  };

  // Üstteki Baz Değerlere ve Hizmet Günlerine Göre Tüm Ayları Otomatik Oranla
  const handleRecalculateAllMonthsFromBase = () => {
    const totalDays = Number(masterPrices.totalServiceDays) || 183.5;
    const baseEdu = Number(masterPrices.educationPrice) || 220000;
    const baseDine = Number(masterPrices.diningPrice) || 80000;
    const baseStatPro = Number(masterPrices.stationeryProportionalPrice) || 40000;
    const basePubFixed = Number(masterPrices.publicationFixedPrice) || 25000;

    setMonthlyPrices((prev) =>
      prev.map((row) => {
        const ratio = totalDays > 0 ? row.remainingDays / totalDays : 1;
        const edu = Math.round(baseEdu * ratio);
        const dine = Math.round(baseDine * ratio);
        const statPro = Math.round(baseStatPro * ratio);
        const pubFixed = row.monthName.toLowerCase().includes("haziran")
          ? Math.round(basePubFixed / 2)
          : basePubFixed;
        const stationeryTotal = statPro + pubFixed;
        const totalPrice = edu + dine + stationeryTotal;
        const roundedPrice = Math.round(totalPrice / 1000) * 1000;
        return {
          ...row,
          education: edu,
          dining: dine,
          stationeryTotal,
          stationeryProportional: statPro,
          publicationFixed: pubFixed,
          totalPrice,
          roundedPrice,
        };
      })
    );
  };

  // Aylık Tablodaki Tek Bir Hücreyi Güncelleme (Yıl, Ay, Eğitim, Yemek, Kırtasiye vb.)
  const handleMonthlyRowChange = (id: string, field: keyof MonthlyPriceRow, val: any) => {
    const totalDays = Number(masterPrices.totalServiceDays) || 183.5;
    const baseEdu = Number(masterPrices.educationPrice) || 220000;
    const baseDine = Number(masterPrices.diningPrice) || 80000;
    const baseStatPro = Number(masterPrices.stationeryProportionalPrice) || 40000;

    setMonthlyPrices((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === "year") {
          const y = String(val);
          return { ...row, year: y, month: `${row.monthName} ${y}`.trim() };
        }

        if (field === "monthName") {
          const mName = String(val);
          return { ...row, monthName: mName, month: `${mName} ${row.year}`.trim() };
        }

        if (field === "month") {
          const rawLabel = String(val);
          const parts = rawLabel.trim().split(/\s+/);
          const y = parts.length > 1 && /^\d{4}$/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : row.year;
          const mName = parts.filter((p) => !/^\d{4}$/.test(p)).join(" ") || row.monthName;
          return { ...row, month: rawLabel, year: y, monthName: mName };
        }

        const numVal = parseFloat(val) || 0;
        const updated = { ...row, [field]: numVal };

        // Kalan Hizmet Günü değişirse o satırın oranlı kalemlerini otomatik hesapla
        if (field === "remainingDays") {
          const ratio = totalDays > 0 ? numVal / totalDays : 1;
          updated.education = Math.round(baseEdu * ratio);
          updated.dining = Math.round(baseDine * ratio);
          updated.stationeryProportional = Math.round(baseStatPro * ratio);
          updated.stationeryTotal = updated.stationeryProportional + updated.publicationFixed;
          updated.totalPrice = updated.education + updated.dining + updated.stationeryTotal;
          updated.roundedPrice = Math.round(updated.totalPrice / 1000) * 1000;
        } else if (field === "stationeryTotal") {
          // Doğrudan Toplam Kırtasiye fiyatı girildiğinde
          updated.stationeryTotal = numVal;
          updated.stationeryProportional = Math.max(0, numVal - updated.publicationFixed);
          updated.totalPrice = updated.education + updated.dining + updated.stationeryTotal;
          updated.roundedPrice = Math.round(updated.totalPrice / 1000) * 1000;
        } else if (field === "stationeryProportional" || field === "publicationFixed") {
          updated.stationeryTotal = updated.stationeryProportional + updated.publicationFixed;
          updated.totalPrice = updated.education + updated.dining + updated.stationeryTotal;
          updated.roundedPrice = Math.round(updated.totalPrice / 1000) * 1000;
        } else if (field === "education" || field === "dining") {
          updated.totalPrice = updated.education + updated.dining + updated.stationeryTotal;
          updated.roundedPrice = Math.round(updated.totalPrice / 1000) * 1000;
        }

        return updated;
      })
    );
  };

  const addMonthlyRow = () => {
    const defaultYear = tableYearFilter !== "ALL" ? tableYearFilter : "2027";
    const edu = Number(masterPrices.educationPrice) || 220000;
    const dine = Number(masterPrices.diningPrice) || 80000;
    const statPro = Number(masterPrices.stationeryProportionalPrice) || 40000;
    const pubFixed = Number(masterPrices.publicationFixedPrice) || 25000;
    const statTotal = statPro + pubFixed;
    const totalPrice = edu + dine + statTotal;

    const newRow: MonthlyPriceRow = {
      id: `m_${Date.now()}`,
      year: defaultYear,
      monthName: "Temmuz",
      month: `Temmuz ${defaultYear}`,
      remainingDays: 183.5,
      education: edu,
      dining: dine,
      stationeryTotal: statTotal,
      stationeryProportional: statPro,
      publicationFixed: pubFixed,
      totalPrice,
      roundedPrice: Math.round(totalPrice / 1000) * 1000,
    };
    setMonthlyPrices((prev) => [...prev, newRow]);
  };

  const removeMonthlyRow = (id: string) => {
    if (monthlyPrices.length <= 1) return;
    setMonthlyPrices((prev) => prev.filter((r) => r.id !== id));
  };

  // Standart Fiyatları ve Aylık Tabloyu Kaydet (Settings API + LocalStorage)
  const handleSaveMasterPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMaster(true);
      const totalStat =
        (Number(masterPrices.stationeryProportionalPrice) || 0) +
        (Number(masterPrices.publicationFixedPrice) || 0);
      const updatedMaster: MasterPrices = {
        ...masterPrices,
        stationeryPrice: totalStat,
      };
      setMasterPrices(updatedMaster);

      const monthlyScheduleData = {
        masterPrices: updatedMaster,
        monthlyPrices,
      };

      try {
        localStorage.setItem("cosmos_monthly_price_schedule_v1", JSON.stringify(monthlyScheduleData));
      } catch {}

      const res = await fetch("/api/teklifler/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedMaster,
          monthlyScheduleData,
        }),
      });

      if (res.ok) {
        setMasterModalOpen(false);
        setSaveSuccessMsg("Yıl ve Aylara Özel Kayıt Ücretleri ve Liste Fiyatları Başarıyla Kaydedildi!");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        alert("Fiyatlar kaydedilemedi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setSavingMaster(false);
    }
  };

  // Seçilen Ayın Liste Fiyatlarından Teklif Kalemlerini Oluşturma Yardımcı Fonksiyonu
  const buildQuoteItemsForMonth = (
    monthId: string,
    opts: {
      includeEducation: boolean;
      includeDining: boolean;
      includeStationery: boolean;
      includePublication?: boolean;
      includeSummer: boolean;
      splitStationery?: boolean;
    }
  ): QuoteItem[] => {
    const mRow = monthlyPrices.find((m) => m.id === monthId) || monthlyPrices[0] || DEFAULT_MONTHLY_PRICES[0];
    const mLabel = mRow ? mRow.month.toUpperCase() : masterPrices.academicYear;
    const newItems: QuoteItem[] = [];

    if (opts.includeSummer) {
      newItems.push({
        id: `item_summer_${Date.now()}`,
        desc: `Yaz Okulu (${masterPrices.academicYear} Dönemi)`,
        qty: 1,
        unit: "dnm",
        listPrice: masterPrices.summerPrice,
        discountPercent: 0,
        netPrice: masterPrices.summerPrice,
        total: masterPrices.summerPrice,
      });
    }

    if (opts.includeEducation && mRow) {
      newItems.push({
        id: `item_edu_${Date.now()}_1`,
        desc: `Eğitim Ücreti (${mLabel} Kayıt Dönemi)`,
        qty: 1,
        unit: "dnm",
        listPrice: mRow.education,
        discountPercent: 0,
        netPrice: mRow.education,
        total: mRow.education,
      });
    }

    if (opts.includeDining && mRow) {
      newItems.push({
        id: `item_dine_${Date.now()}_2`,
        desc: `Yemek Ücreti (${mLabel} Kayıt Dönemi)`,
        qty: 1,
        unit: "dnm",
        listPrice: mRow.dining,
        discountPercent: 0,
        netPrice: mRow.dining,
        total: mRow.dining,
      });
    }

    if (opts.includeStationery && mRow) {
      const statAmount =
        mRow.stationeryTotal > 0
          ? mRow.stationeryTotal
          : (mRow.stationeryProportional || 0) + (mRow.publicationFixed || 0);
      newItems.push({
        id: `item_stat_${Date.now()}_3`,
        desc: `Kırtasiye / Yayın Set Ücreti (${mLabel} Kayıt Dönemi)`,
        qty: 1,
        unit: "ad",
        listPrice: statAmount,
        discountPercent: 0,
        netPrice: statAmount,
        total: statAmount,
      });
    }

    return newItems;
  };

  // Editör İçinden Seçilen Ayın Liste Fiyatlarını Mevcut Teklife Uygulama
  const applyMonthlyPricesToCurrentQuote = (monthId: string, splitStat = splitStationeryItems) => {
    setSelectedMonthId(monthId);
    const mRow = monthlyPrices.find((m) => m.id === monthId);
    if (!mRow) return;
    const generated = buildQuoteItemsForMonth(monthId, {
      includeEducation: true,
      includeDining: true,
      includeStationery: true,
      includePublication: true,
      includeSummer: false,
      splitStationery: splitStat,
    });
    setItems(generated);
  };

  // 1. ADIM: "Teklif Ver" Butonuna Basıldığında Modalı Aç
  const handleOpenNewQuoteModal = () => {
    setInitForm({
      parentName: "",
      phone: "",
      studentName: "",
      quoteDate: new Date().toISOString().split("T")[0],
      selectedMonthId: selectedMonthId || (monthlyPrices[0]?.id ?? "m1"),
      includeEducation: true,
      includeDining: true,
      includeStationery: true,
      includePublication: true,
      includeSummer: false,
      splitStationeryRows: splitStationeryItems,
    });
    setNewQuoteModalOpen(true);
  };

  // 1. ADIM KAYDET VE 2. ADIMA (FİYAT DÜZENLEME) GEÇ
  const handleCreateQuoteFromInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initForm.parentName.trim()) {
      alert("Lütfen isim ve soyisim giriniz.");
      return;
    }

    setParentName(initForm.parentName.toUpperCase().trim());
    setPhone(initForm.phone.trim());
    setStudentName(initForm.studentName.toUpperCase().trim());
    setQuoteDate(initForm.quoteDate);
    setSelectedMonthId(initForm.selectedMonthId);
    setSplitStationeryItems(initForm.splitStationeryRows);
    setSavedQuoteId(null);
    setQuoteNo(null);

    const newItems = buildQuoteItemsForMonth(initForm.selectedMonthId, {
      includeEducation: initForm.includeEducation,
      includeDining: initForm.includeDining,
      includeStationery: initForm.includeStationery,
      includePublication: initForm.includePublication,
      includeSummer: initForm.includeSummer,
      splitStationery: initForm.splitStationeryRows,
    });

    setItems(newItems);
    if (masterBankCampaigns && masterBankCampaigns.length > 0) {
      setBankCampaigns(JSON.parse(JSON.stringify(masterBankCampaigns)));
    }
    setNewQuoteModalOpen(false);
    setActiveTab("EDITOR");
    setEditorView("EDIT");
  };

  // Kalem Değişikliği (Liste Fiyatı, % İndirim veya Elle Net Fiyat Girişi)
  const handleItemChange = (id: string, field: keyof QuoteItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val };

        if (field === "listPrice") {
          const list = parseFloat(val) || 0;
          const disc = item.discountPercent || 0;
          const net = Number((list * (1 - disc / 100)).toFixed(2));
          updated.netPrice = net;
          updated.total = net;
        }

        if (field === "discountPercent") {
          const disc = parseFloat(val) || 0;
          const list = item.listPrice || 0;
          const net = Number((list * (1 - disc / 100)).toFixed(2));
          updated.netPrice = net;
          updated.total = net;
        }

        // Elle Net Fiyat Girildiğinde: % indirim otomatik güncellenir
        if (field === "total" || field === "netPrice") {
          const manualNet = parseFloat(val) || 0;
          updated.netPrice = manualNet;
          updated.total = manualNet;
          if (updated.listPrice > 0) {
            const calculatedDisc = Number(
              (((updated.listPrice - manualNet) / updated.listPrice) * 100).toFixed(1)
            );
            updated.discountPercent = calculatedDisc > 0 ? calculatedDisc : 0;
          }
        }

        return updated;
      })
    );
  };

  // Kalem Ekle
  const addItem = (presetDesc?: string, defaultPrice = 0, defaultDisc = 0) => {
    const newItem: QuoteItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      desc: presetDesc || "Yeni Hizmet / Kalem",
      qty: 1,
      unit: "dnm",
      listPrice: defaultPrice,
      discountPercent: defaultDisc,
      netPrice: defaultPrice * (1 - defaultDisc / 100),
      total: defaultPrice * (1 - defaultDisc / 100),
    };
    setItems([...items, newItem]);
  };

  // Kalem Sil
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      alert("Teklifte en az bir hizmet kalemi bulunmalıdır.");
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  };

  // Banka Kampanyası Taksit Sayısı veya Kampanya Metnini Manuel Güncelleme (Otomatik tutar bölme yok)
  const persistBanksLocal = (updated: BankCampaign[]) => {
    try {
      localStorage.setItem("cosmos_teklif_bank_campaigns_v1", JSON.stringify(updated));
    } catch {}
  };

  const handleBankChange = (id: string, field: keyof BankCampaign, val: any) => {
    setBankCampaigns((prev) => {
      const updated = prev.map((bank) => {
        if (bank.id !== id) return bank;
        return { ...bank, [field]: val };
      });
      persistBanksLocal(updated);
      return updated;
    });
  };

  // Banka Ekle / Sil
  const addBankCampaign = () => {
    const newBank: BankCampaign = {
      id: `b_${Date.now()}`,
      bankName: "YENİ BANKA",
      installmentCount: 6,
      campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT",
    };
    const updated = [...bankCampaigns, newBank];
    setBankCampaigns(updated);
    persistBanksLocal(updated);
  };

  const removeBankCampaign = (id: string) => {
    const updated = bankCampaigns.filter((b) => b.id !== id);
    setBankCampaigns(updated);
    persistBanksLocal(updated);
  };

  const saveBankCampaignsToSettings = async () => {
    try {
      setSavingBanks(true);
      persistBanksLocal(bankCampaigns);
      const res = await fetch("/api/teklifler/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...masterPrices,
          bankCampaigns,
        }),
      });

      if (!res.ok) {
        throw new Error("Sunucu yanıt vermedi (Durum: " + res.status + ")");
      }

      setMasterBankCampaigns(JSON.parse(JSON.stringify(bankCampaigns)));
      try {
        localStorage.setItem("cosmos_master_bank_campaigns_v1", JSON.stringify(bankCampaigns));
      } catch {}

      setSavedBanksSuccess(true);
      setSaveSuccessMsg("Bu ayın eğitime özel banka taksit kampanyaları başarıyla sabitlendi!");
      setTimeout(() => {
        setSavedBanksSuccess(false);
        setSaveSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      console.error("Kampanya sabitleme hatası:", err);
      alert("Banka kampanyaları sabitlenirken hata oluştu: " + (err?.message || "Bilinmeyen hata"));
    } finally {
      setSavingBanks(false);
    }
  };

  const handleResetToPinnedCampaigns = () => {
    if (masterBankCampaigns && masterBankCampaigns.length > 0) {
      const cloned = JSON.parse(JSON.stringify(masterBankCampaigns));
      setBankCampaigns(cloned);
      persistBanksLocal(cloned);
      setSavedBanksSuccess(true);
      setTimeout(() => setSavedBanksSuccess(false), 2000);
    }
  };

  // Teklifi Kaydet (API)
  const handleSaveQuote = async (): Promise<{ success: boolean; quoteNo?: string; id?: string }> => {
    if (!parentName.trim()) {
      alert("Lütfen veli adını giriniz.");
      return { success: false };
    }

    try {
      setSaving(true);
      setSaveSuccessMsg(null);

      const payload = {
        schoolName,
        schoolAddress,
        schoolPhone,
        date: quoteDate,
        parentName,
        studentName,
        phone,
        email,
        title,
        items,
        grossTotal,
        discountTotal,
        netTotal,
        kdvPercent,
        kdvTotal,
        grandTotal,
        policyNotes: JSON.stringify(policyNotes),
        bankInfo,
        bankCampaigns,
        includeStamp,
      };

      let res;
      if (savedQuoteId) {
        res = await fetch(`/api/teklifler/${savedQuoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/teklifler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSavedQuoteId(data.id);
        setQuoteNo(data.quoteNo);
        setSaveSuccessMsg(`Teklif başarıyla kaydedildi (${data.quoteNo})`);
        fetchQuotesList();
        setTimeout(() => setSaveSuccessMsg(null), 3500);
        return { success: true, quoteNo: data.quoteNo, id: data.id };
      } else {
        alert(data.error || "Teklif kaydedilemedi");
        return { success: false };
      }
    } catch (err) {
      alert("Teklif kaydedilirken bir hata oluştu.");
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  // "KAYDET VE YAZDIR (PDF)"
  const handleSaveAndPrint = async () => {
    const result = await handleSaveQuote();
    if (result.success) {
      setEditorView("PREVIEW");
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  // Doğrudan Yazdır
  const handlePrint = () => {
    setEditorView("PREVIEW");
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Geçmiş Teklifi Yükle
  const loadSavedQuote = (q: any, autoPrint = false) => {
    setSavedQuoteId(q.id);
    setQuoteNo(q.quoteNo);
    setSchoolName(q.schoolName || "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ");
    setSchoolAddress(q.schoolAddress || "");
    setSchoolPhone(q.schoolPhone || "");
    setQuoteDate(q.date ? new Date(q.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setParentName(q.parentName || "");
    setStudentName(q.studentName || "");
    setPhone(q.phone || "");
    setEmail(q.email || "");
    setTitle(q.title || "");
    setBankInfo(q.bankInfo || "");
    setIncludeStamp(q.includeStamp !== undefined ? q.includeStamp : true);

    try {
      const parsedItems = typeof q.items === "string" ? JSON.parse(q.items) : q.items;
      if (Array.isArray(parsedItems)) setItems(parsedItems);
    } catch {}

    try {
      const parsedPolicy = typeof q.policyNotes === "string" ? JSON.parse(q.policyNotes) : q.policyNotes;
      if (Array.isArray(parsedPolicy)) setPolicyNotes(parsedPolicy);
    } catch {}

    try {
      const parsedCampaigns = typeof q.bankCampaigns === "string" ? JSON.parse(q.bankCampaigns) : q.bankCampaigns;
      if (Array.isArray(parsedCampaigns) && parsedCampaigns.length > 0) {
        setBankCampaigns(parsedCampaigns);
      } else if (masterBankCampaigns && masterBankCampaigns.length > 0) {
        setBankCampaigns(JSON.parse(JSON.stringify(masterBankCampaigns)));
      }
    } catch {
      if (masterBankCampaigns && masterBankCampaigns.length > 0) {
        setBankCampaigns(JSON.parse(JSON.stringify(masterBankCampaigns)));
      }
    }

    setActiveTab("EDITOR");
    if (autoPrint) {
      setEditorView("PREVIEW");
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      setEditorView("PREVIEW");
    }
  };

  // Teklifi Sil
  const handleDeleteQuote = async (id: string, qNo: string) => {
    if (!window.confirm(`${qNo} numaralı teklifi silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/teklifler/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuotesList((prev) => prev.filter((item) => item.id !== id));
        if (savedQuoteId === id) {
          setSavedQuoteId(null);
          setQuoteNo(null);
        }
      } else {
        alert("Teklif silinemedi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  // E-Posta Gönderme
  const handleOpenEmailModal = () => {
    setEmailForm({
      recipient: email || "",
      subject: `${schoolName} - 2026-2027 Erken Kayıt Fiyat Teklif Formu (${parentName})`,
      message: `Sayın ${parentName},\n\n${title}\n\nToplam Net Tutar: ${formatCurrency(
        grandTotal
      )}\n\nTeklif detayları ekte bilgilerinize sunulmuştur. Sorularınız ve kayıt işlemleri için kurumumuzla iletişime geçebilirsiniz.\n\nSaygılarımızla,\n${schoolName}\nTel: ${schoolPhone}`,
    });
    setEmailSentSuccess(false);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipient || !emailForm.recipient.includes("@")) {
      alert("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    try {
      setSendingEmail(true);
      const res = await fetch("/api/teklifler/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: savedQuoteId,
          recipientEmail: emailForm.recipient,
          subject: emailForm.subject,
          customMessage: emailForm.message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailSentSuccess(true);
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailSentSuccess(false);
        }, 2000);
      } else {
        alert(data.error || "E-posta gönderilemedi");
      }
    } catch (err) {
      alert("E-posta gönderilirken hata oluştu");
    } finally {
      setSendingEmail(false);
    }
  };

  // Filtrelenmiş Geçmiş Teklifler
  const filteredQuotes = quotesList.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (q.parentName && q.parentName.toLowerCase().includes(query)) ||
      (q.phone && q.phone.includes(query)) ||
      (q.quoteNo && q.quoteNo.toLowerCase().includes(query)) ||
      (q.studentName && q.studentName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* 1. ÜST BAŞLIK VE EYLEM DÜĞMELERİ */}
      {/* ========================================================================= */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold">
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Fiyat Teklif Formu & Matbu Şablon
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                2026-2027 Erken Kayıt Teklifleri, Matbu A4 Baskı ve Tarih Sıralı Takip
              </p>
            </div>
          </div>
        </div>

        {/* Ana Butonlar: "Teklif Ver" & "Fiyat Ayarları" */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* TEKLİF VER BUTONU (Kullanıcının İstediği Başlatıcı) */}
          <button
            onClick={handleOpenNewQuoteModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Teklif Ver</span>
          </button>

          {/* Aylık Liste Fiyatlarını Kaydetme Modalı Butonu */}
          <button
            onClick={() => setMasterModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-900 dark:text-slate-200 font-bold text-xs transition"
            title="Simya Anaokulu 2026-2027 Aylık Kayıt Ücretleri ve Liste Fiyatlarını Tanımla"
          >
            <Settings className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">2026-2027 Aylık Liste Fiyatları</span>
            <span className="sm:hidden">Aylık Fiyatlar</span>
          </button>

          {/* Sekme Geçişi */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("LIST")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "LIST"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Verilen Teklifler ({quotesList.length})</span>
            </button>
            <button
              onClick={() => {
                if (items.length === 0) {
                  handleOpenNewQuoteModal();
                } else {
                  setActiveTab("EDITOR");
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "EDITOR"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Teklif Düzenle & Baskı</span>
            </button>
          </div>
        </div>
      </div>

      {/* Başarı Bildirimi */}
      {saveSuccessMsg && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VERİLEN TEKLİFLER LİSTESİ (TARİH SIRALAMASINA GÖRE) */}
      {/* ========================================================================= */}
      {activeTab === "LIST" && (
        <div className="space-y-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>Tarih Sıralı Verilen Teklifler</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-semibold">
                    {filteredQuotes.length} Teklif
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tarih sırasına göre en yeni tekliften en eskiye doğru listelenir.
                </p>
              </div>

              {/* Arama Kutusu */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Veli adı, telefon veya teklif no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {loadingList ? (
              <div className="text-center py-12 text-slate-400 text-xs">Teklifler yükleniyor...</div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-14 px-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Henüz kayıtlı teklif bulunmuyor
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Yukarıdaki <strong>"Teklif Ver"</strong> butonuna basarak ilk fiyat teklifinizi saniyeler içinde
                  oluşturabilir ve çıktısını alabilirsiniz.
                </p>
                <button
                  onClick={handleOpenNewQuoteModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Hemen Teklif Ver</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Teklif No</th>
                      <th className="py-3 px-3">Tarih</th>
                      <th className="py-3 px-3">Veli Adı Soyadı</th>
                      <th className="py-3 px-3">Telefon</th>
                      <th className="py-3 px-3">Hizmet Kalemleri</th>
                      <th className="py-3 px-3 text-right">Net Teklif Tutarı</th>
                      <th className="py-3 px-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredQuotes.map((q) => {
                      let parsedItems = [];
                      try {
                        parsedItems = typeof q.items === "string" ? JSON.parse(q.items) : q.items;
                      } catch {}

                      return (
                        <tr
                          key={q.id}
                          className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                            {q.quoteNo || "TASLAK"}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(q.date || q.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{q.parentName}</div>
                            {q.studentName && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                Öğrenci: {q.studentName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {q.phone ? (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {q.phone}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {parsedItems.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 whitespace-nowrap"
                                >
                                  {item.desc?.split(" ")[0] || "Hizmet"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {formatCurrency(q.netTotal || q.grandTotal)}
                            </div>
                            {q.discountTotal > 0 && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold line-through">
                                {formatCurrency(q.grossTotal)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Görüntüle & Yazdır */}
                              <button
                                onClick={() => loadSavedQuote(q, true)}
                                className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 font-bold transition"
                                title="A4 Şablonunda Aç ve Yazdır"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Düzenle */}
                              <button
                                onClick={() => {
                                  loadSavedQuote(q, false);
                                  setEditorView("EDIT");
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                                title="Teklifi Düzenle"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Sil */}
                              <button
                                onClick={() => handleDeleteQuote(q.id, q.quoteNo || "Teklif")}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                                title="Teklifi Sil"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* 3. TEKLİF DÜZENLE & A4 BASKI SEKMESİ */}
      {/* ========================================================================= */}
      {activeTab === "EDITOR" && (
        <div className="space-y-6">
          {/* Editör Üst Buton Çubuğu */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("LIST")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                ← Listeye Dön
              </button>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {quoteNo ? (
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-black">{quoteNo}</span>
                ) : (
                  <span className="text-amber-600 font-semibold">[Yeni Teklif - Henüz Kaydedilmedi]</span>
                )}
                <span className="mx-2">•</span>
                <span className="font-black text-slate-900 dark:text-white uppercase">{parentName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Görünüm Değiştir: Form Düzenle / A4 Belge Önizleme */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
                <button
                  type="button"
                  onClick={() => setEditorView("EDIT")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    editorView === "EDIT"
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Fiyat & Oran Düzenle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorView("PREVIEW")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    editorView === "PREVIEW"
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Matbu A4 Belge</span>
                </button>
              </div>

              {/* Sadece Kaydet */}
              <button
                type="button"
                onClick={() => handleSaveQuote()}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>{saving ? "Kaydediliyor..." : "Kaydet"}</span>
              </button>

              {/* KAYDET VE YAZDIR (PDF) BUTONU */}
              <button
                type="button"
                onClick={handleSaveAndPrint}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Kaydet & Yazdır (PDF)</span>
              </button>

              {/* E-Posta Gönder */}
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition"
                title="Teklifi Veliye E-Posta Gönder"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EDITÖR DÜZENLEME FORMU */}
          {editorView === "EDIT" && (
            <div className="no-print space-y-6">
              {/* Veli Bilgileri ve Üst Ayarlar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Veli & İletişim Bilgileri</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Veli Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Telefon Numarası
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                      placeholder="0530 000 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Öğrenci Adı (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Teklif Tarihi
                    </label>
                    <input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* FİYAT TEKLİFİ KALEMLERİ VE İNDİRİM / ELLE FİYAT GİRİŞİ */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>Hizmet Kalemleri, İndirim Oranları ve Fiyatlar</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kayıt ayına göre tanımlı liste fiyatları otomatik gelir. İster % indirim yapın, ister Net Fiyatı elle girin.
                    </p>
                  </div>

                  {/* Kayıt Ayı Seçimi (Aylık Liste Fiyatı Yükleyici) */}
                  <div className="flex flex-wrap items-center gap-2 bg-teal-50/70 dark:bg-slate-800/70 border border-teal-200/80 dark:border-slate-700 px-3 py-2 rounded-xl w-full lg:w-auto">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                      <span className="text-[11px] font-black text-teal-900 dark:text-teal-300 uppercase">
                        Kayıt Ayı:
                      </span>
                    </div>
                    <select
                      value={selectedMonthId}
                      onChange={(e) => applyMonthlyPricesToCurrentQuote(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-teal-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500"
                    >
                      {monthlyPrices.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.month} — Toplam: {formatCurrency(m.totalPrice)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setMasterModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition"
                      title="Aylık Fiyatları Tanımla"
                    >
                      Fiyat Tanımla
                    </button>
                  </div>
                </div>

                {/* Hızlı Kalem Ekleme Butonları (Seçili Ayın Fiyatlarıyla) */}
                {(() => {
                  const activeRow =
                    monthlyPrices.find((r) => r.id === selectedMonthId) ||
                    monthlyPrices[0] ||
                    DEFAULT_MONTHLY_PRICES[0];
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                        Seçili Dönem: <strong className="text-teal-700 dark:text-teal-400">{activeRow.month}</strong> • Toplam Liste:{" "}
                        <strong>{formatCurrency(activeRow.totalPrice)}</strong>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            addItem(
                              `Eğitim Ücreti (${activeRow.month} Kayıt Dönemi)`,
                              activeRow.education,
                              0
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                        >
                          + Eğitim ({formatCurrency(activeRow.education)})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addItem(`Yemek Ücreti (${activeRow.month} Kayıt Dönemi)`, activeRow.dining, 0)
                          }
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                        >
                          + Yemek ({formatCurrency(activeRow.dining)})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addItem(
                              `Kırtasiye / Yayın Set Ücreti (${activeRow.month} Kayıt Dönemi)`,
                              activeRow.stationeryTotal,
                              0
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                        >
                          + Kırtasiye / Yayın Set ({formatCurrency(activeRow.stationeryTotal)})
                        </button>
                        <button
                          type="button"
                          onClick={() => addItem("Özel Hizmet / Kalem", 0, 0)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                        >
                          + Özel Kalem
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Kalem Listesi */}
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-stretch md:items-center gap-3"
                    >
                      <div className="w-6 text-center font-bold text-xs text-slate-400">{idx + 1}</div>

                      {/* Kalem Adı */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => handleItemChange(item.id, "desc", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                          placeholder="Hizmet Açıklaması"
                        />
                      </div>

                      {/* Standart Liste Fiyatı */}
                      <div className="w-full md:w-36">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Standart Liste Fiyatı
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.listPrice}
                            onChange={(e) => handleItemChange(item.id, "listPrice", e.target.value)}
                            className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-slate-400">₺</span>
                        </div>
                      </div>

                      {/* % İndirim Oranı & Hızlı İndirim Butonları */}
                      <div className="w-full md:w-44">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-bold text-slate-500">% İndirim</label>
                          <div className="flex gap-1">
                            {[0, 10, 20, 24].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleItemChange(item.id, "discountPercent", pct)}
                                className={`text-[9px] px-1 py-0.2 rounded font-bold transition ${
                                  Number(item.discountPercent) === pct
                                    ? "bg-teal-600 text-white"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                              >
                                %{pct}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(item.id, "discountPercent", e.target.value)}
                            className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-700"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      {/* Elle Net Fiyat Girişi (Manuel Override) */}
                      <div className="w-full md:w-40">
                        <label className="block text-[10px] font-black text-teal-800 dark:text-teal-300 mb-0.5">
                          Net Fiyat (Elle Giriş)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.total}
                            onChange={(e) => handleItemChange(item.id, "total", e.target.value)}
                            className="w-full pl-2 pr-6 py-1.5 rounded-lg border-2 border-teal-500 bg-teal-50/20 text-xs font-mono font-extrabold text-teal-900 dark:text-teal-200"
                          />
                          <span className="absolute right-2 top-1.5 text-xs font-bold text-teal-700">₺</span>
                        </div>
                      </div>

                      {/* Sil Butonu */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="Kalemi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Toplam Özeti */}
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 font-bold text-xs">
                  <div>
                    <span className="text-slate-500">Brüt Liste Toplamı:</span>{" "}
                    <span className={`${discountTotal > 0 ? "line-through text-slate-600" : "text-slate-900 dark:text-white"} font-mono`}>
                      {formatCurrency(grossTotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600">Toplam İndirim:</span>{" "}
                    <span className="text-emerald-700 font-mono">-{formatCurrency(discountTotal)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-800 dark:text-white">NET KAYIT BEDELİ:</span>{" "}
                    <span className="text-teal-700 dark:text-teal-300 text-base font-black font-mono ml-1">
                      {formatCurrency(netTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* BANKA KREDİ KARTI EĞİTİME ÖZEL TAKSİT KAMPANYALARI (KOMPAKT & KUTUCUKSUZ MANUEL LİSTE) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                      <span>Anlaşmalı Banka Kampanyaları (Manuel Düzenleme)</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={savingBanks}
                      onClick={saveBankCampaignsToSettings}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition shadow-sm ${
                        savedBanksSuccess
                          ? "bg-emerald-600 text-white border-emerald-600 shadow"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      } ${savingBanks ? "opacity-70 cursor-wait" : ""}`}
                      title="Yaptığınız banka kampanya düzenlemelerini bu ayın tüm yeni teklifleri için kalıcı kaydet"
                    >
                      {savingBanks ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Sabitleniyor...</span>
                        </>
                      ) : savedBanksSuccess ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>✓ Kampanyalar Sabitlendi!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>Bu Ayın Kampanyalarını Sabitle</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToPinnedCampaigns}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition"
                      title="Bu ay için sabitlediğiniz orijinal kampanya listesini bu teklife geri yükle"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Sabit Listeyi Yükle</span>
                    </button>
                    <button
                      type="button"
                      onClick={addBankCampaign}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Banka Ekle</span>
                    </button>
                  </div>
                </div>

                {savedBanksSuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Başarılı!</strong> Bu ayın eğitime özel banka kampanyaları kalıcı olarak sabitlendi. Artık oluşturulacak tüm yeni tekliflerde bu liste varsayılan olarak gelecektir.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSavedBanksSuccess(false)}
                      className="text-emerald-600 hover:text-emerald-800 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {bankCampaigns.map((bank) => (
                    <div
                      key={bank.id}
                      className="py-1 flex items-center gap-2"
                    >
                      <span className="text-slate-400 font-bold text-[10px]">•</span>
                      {/* Banka Adı */}
                      <input
                        type="text"
                        value={bank.bankName}
                        onChange={(e) => handleBankChange(bank.id, "bankName", e.target.value.toUpperCase())}
                        className="w-44 shrink-0 font-bold text-[11px] uppercase px-1.5 py-0.5 border-b border-transparent hover:border-slate-300 focus:border-teal-600 bg-transparent focus:outline-none text-slate-900 dark:text-white"
                        placeholder="BANKA ADI"
                      />
                      <span className="text-slate-400 font-bold">:</span>
                      {/* Kampanya Açıklaması */}
                      <input
                        type="text"
                        value={bank.campaignText}
                        onChange={(e) => handleBankChange(bank.id, "campaignText", e.target.value)}
                        className="flex-1 text-[11px] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 border-b border-transparent hover:border-slate-300 focus:border-teal-600 bg-transparent focus:outline-none font-medium"
                        placeholder="O ayki eğitime özel kampanya bilgisini yazın..."
                      />
                      {/* Sil */}
                      <button
                        type="button"
                        onClick={() => removeBankCampaign(bank.id)}
                        className="text-slate-300 hover:text-rose-600 p-0.5 shrink-0"
                        title="Bankayı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kurallar & Şartlar (9 Madde) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Kayıt Koşulları ve Şartlar (Dipnotlar)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPolicyNotes([...policyNotes, "Yeni kural / şart maddesi."])}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700"
                  >
                    + Madde Ekle
                  </button>
                </div>
                <div className="space-y-2">
                  {policyNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-slate-400 mt-1 shrink-0">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => {
                          const updated = [...policyNotes];
                          updated[idx] = e.target.value;
                          setPolicyNotes(updated);
                        }}
                        className="flex-1 p-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPolicyNotes(policyNotes.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* A4 BASKI / MATBU PDF ŞABLONU (PAYLAŞILAN GÖRSEL İLE BİREBİR AYNI) */}
          {/* ========================================================================= */}
          <div className="flex justify-center">
            <div
              ref={printRef}
              id="printable-quote"
              className="bg-white text-slate-900 border border-slate-300 shadow-xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[12mm] flex flex-col justify-between text-[11px] leading-relaxed relative print:p-0 print:border-0 print:shadow-none print:max-w-none print:w-full print:m-0"
              style={{ fontFamily: "'Arial', 'Segoe UI', sans-serif" }}
            >
              <div>
                {/* 1. ÜST LOGO & KURUM ADI */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/simya-logo.png"
                      alt="Simya Çocuk Üniversitesi Logo"
                      className="h-12 sm:h-14 w-auto object-contain shrink-0"
                    />
                    <div>
                      <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase">
                        {schoolName}
                      </h1>
                      <p className="text-[9px] text-slate-500 font-medium tracking-tight mt-0.5">
                        {schoolAddress} • Tel: {schoolPhone}
                      </p>
                    </div>
                  </div>

                  {/* Tarih & Teklif No */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-700">
                      Tarih: {new Date(quoteDate).toLocaleDateString("tr-TR")}
                    </span>
                    {quoteNo && <p className="text-[9px] font-mono text-slate-400 mt-0.5">{quoteNo}</p>}
                  </div>
                </div>

                {/* 2. MUHATAP & GİRİŞ BAŞLIĞI */}
                <div className="mt-5 space-y-1">
                  <h2 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">
                    SAYIN {parentName}
                  </h2>
                  {studentName && (
                    <p className="text-[10px] text-slate-600 font-semibold">
                      Öğrenci: {studentName}
                    </p>
                  )}
                  {phone && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      İletişim: {phone}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-700 leading-normal pt-1">{title}</p>
                </div>

                {/* 3. FİYAT TABLOSU (ÇİZGİLİ MATBU FORMAT) */}
                <div className="mt-4 border border-slate-400">
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800 text-center">
                        <th className="border-r border-slate-400 py-1.5 px-2 text-left w-[42%]">HİZMET ADI</th>
                        <th className="border-r border-slate-400 py-1.5 px-1.5 w-[8%]">MİKTAR</th>
                        <th className="border-r border-slate-400 py-1.5 px-1.5 w-[10%]">BİRİM</th>
                        <th className="border-r border-slate-400 py-1.5 px-2 text-right w-[18%]">LİSTE FİYATI</th>
                        <th className="border-r border-slate-400 py-1.5 px-1.5 text-center w-[10%]">İNDİRİM %</th>
                        <th className="py-1.5 px-2 text-right w-[20%]">NET TUTAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {items.map((item, idx) => {
                        const hasDiscount =
                          Number(item.discountPercent) > 0 ||
                          (Number(item.listPrice) > 0 && Number(item.total) < Number(item.listPrice));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="border-r border-slate-300 py-1.5 px-2 font-bold text-slate-900">
                              {item.desc}
                            </td>
                            <td className="border-r border-slate-300 py-1.5 px-1.5 text-center font-semibold">
                              {item.qty}
                            </td>
                            <td className="border-r border-slate-300 py-1.5 px-1.5 text-center text-slate-600 font-medium">
                              {item.unit}
                            </td>
                            <td
                              className={`border-r border-slate-300 py-1.5 px-2 text-right font-mono ${
                                hasDiscount
                                  ? "line-through text-slate-500 font-medium"
                                  : "text-slate-900 font-semibold"
                              }`}
                            >
                              {formatCurrency(item.listPrice)}
                            </td>
                            <td className="border-r border-slate-300 py-1.5 px-1.5 text-center font-bold text-slate-700">
                              {item.discountPercent > 0 ? `%${item.discountPercent}` : "-"}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900 text-[11px]">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOPLAM ALANI (BRÜT, İNDİRİM, NET KAYIT BEDELİ) */}
                <div className="mt-2.5 flex justify-end">
                  <div className="w-64 border border-slate-400 bg-slate-50 p-2 space-y-1 text-[10px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Brüt Toplam:</span>
                      <span className={`font-mono ${discountTotal > 0 ? "line-through" : "font-bold text-slate-900"}`}>
                        {formatCurrency(grossTotal)}
                      </span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 font-bold">
                        <span>İndirim Tutarı:</span>
                        <span className="font-mono">-{formatCurrency(discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-slate-300 pt-1 text-slate-900 font-black text-xs">
                      <span>NET KAYIT BEDELİ:</span>
                      <span className="font-mono text-slate-950 font-black text-sm">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. RESMİ KOŞULLAR VE ŞARTLAR (9 MADDE) */}
                <div className="mt-4 pt-3 border-t border-slate-300 text-[9px] text-slate-600 leading-tight space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[9.5px] mb-1">
                    KAYIT VE ÖDEME KOŞULLARI:
                  </h4>
                  {policyNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="font-bold text-slate-700 shrink-0">{idx + 1}.</span>
                      <p className="text-justify">{note}</p>
                    </div>
                  ))}
                </div>

                {/* 6. BANKA KREDİ KARTI KAMPANYA SEÇENEKLERİ (KUTUCUKSUZ, KOMPAKT DÜZ METİN SATIRLARI) */}
                <div className="mt-2.5 pt-2 border-t border-slate-300">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[9px] mb-1">
                    BANKA KREDİ KARTI VE TAKSİT KAMPANYALARI:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[8px] leading-tight">
                    {bankCampaigns.map((b) => (
                      <div key={b.id} className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-900 shrink-0">• {b.bankName}:</span>
                        <span className="text-slate-700">{b.campaignText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. BANKA VE IBAN BİLGİSİ */}
                {bankInfo && (
                  <div className="mt-2.5 p-1.5 bg-slate-100 border border-slate-300 text-[8.5px] font-mono text-slate-700">
                    <span className="font-bold">Havale / EFT:</span> {bankInfo}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. "TEKLİF VER" 1. ADIM MODALI (İSİM SOYİSİM + TELEFON + HİZMET SEÇİMİ) */}
      {/* ========================================================================= */}
      {newQuoteModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10">
                  <FileText className="w-5 h-5 text-teal-200" />
                </span>
                <div>
                  <h3 className="font-black text-base tracking-wide">Yeni Fiyat Teklifi Ver</h3>
                  <p className="text-xs text-teal-100">
                    Kayıt ayını seçip o aya tanımlı liste fiyatları ile teklifi hazırlayın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewQuoteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuoteFromInit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Veli Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Yusuf Güvener"
                  value={initForm.parentName}
                  onChange={(e) => setInitForm({ ...initForm, parentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold uppercase focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    placeholder="0530 000 00 00"
                    value={initForm.phone}
                    onChange={(e) => setInitForm({ ...initForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teklif Tarihi
                  </label>
                  <input
                    type="date"
                    value={initForm.quoteDate}
                    onChange={(e) => setInitForm({ ...initForm, quoteDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Öğrenci Adı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Güvener"
                    value={initForm.studentName}
                    onChange={(e) => setInitForm({ ...initForm, studentName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm uppercase focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Kayıt Ayı Seçimi */}
                <div>
                  <label className="block text-xs font-bold text-teal-800 dark:text-teal-300 mb-1.5">
                    Kayıt Ayı (Aylık Liste Fiyatı) *
                  </label>
                  <select
                    value={initForm.selectedMonthId}
                    onChange={(e) => setInitForm({ ...initForm, selectedMonthId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-teal-500/60 dark:border-teal-600 bg-teal-50/40 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {monthlyPrices.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.month} — {formatCurrency(m.totalPrice)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seçili Kayıt Ayına Göre Dahil Edilecek Hizmetler */}
              {(() => {
                const selectedRow =
                  monthlyPrices.find((r) => r.id === initForm.selectedMonthId) ||
                  monthlyPrices[0] ||
                  DEFAULT_MONTHLY_PRICES[0];
                return (
                  <div className="border border-teal-200 dark:border-slate-800 rounded-2xl p-3.5 bg-teal-50/40 dark:bg-slate-800/40 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-slate-700 pb-2">
                      <span className="text-[11px] font-black uppercase text-teal-900 dark:text-teal-300">
                        {selectedRow.month} Liste Fiyatları
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Toplam: <strong>{formatCurrency(selectedRow.totalPrice)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={initForm.includeEducation}
                          onChange={(e) => setInitForm({ ...initForm, includeEducation: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>Eğitim ({formatCurrency(selectedRow.education)})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={initForm.includeDining}
                          onChange={(e) => setInitForm({ ...initForm, includeDining: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>Yemek ({formatCurrency(selectedRow.dining)})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={initForm.includeStationery}
                          onChange={(e) => setInitForm({ ...initForm, includeStationery: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>Kırtasiye / Yayın Set ({formatCurrency(selectedRow.stationeryTotal)})</span>
                      </label>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewQuoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Kaydet ve Fiyatları Düzenle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SADE FİYAT TANIMLAMA MODALI (EĞİTİM, YEMEK, KIRTASİYE / YAYIN SET) */}
      {/* ========================================================================= */}
      {masterModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            {/* Üst Başlık */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/30">
                  <Settings className="w-5 h-5 text-teal-400" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-wide">
                    Aylık Liste Fiyatları Tanımlama
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Her yıl ve aya özel Eğitim, Yemek ve Kırtasiye / Yayın Set ücretlerini tanımlayın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMasterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* İçerik Formu */}
            <form onSubmit={handleSaveMasterPrices} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* 1. HIZLI YIL VE AY FİYATI EKLEME / GÜNCELLEME */}
              <div className="border border-teal-500/40 dark:border-teal-700/60 rounded-2xl p-3.5 bg-teal-50/40 dark:bg-slate-800/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-950 dark:text-teal-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Yıl ve Aya Özel Fiyat Tanımla</span>
                  </span>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-300">
                    Toplam:{" "}
                    <strong>
                      {formatCurrency(
                        (Number(quickMonthForm.education) || 0) +
                          (Number(quickMonthForm.dining) || 0) +
                          (Number(quickMonthForm.stationeryTotal) || 0)
                      )}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yıl
                    </label>
                    <input
                      type="number"
                      min={2024}
                      max={2035}
                      value={quickMonthForm.year}
                      onChange={(e) => handleQuickYearMonthSelect(e.target.value, quickMonthForm.monthName)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs font-black text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ay
                    </label>
                    <select
                      value={quickMonthForm.monthName}
                      onChange={(e) => handleQuickYearMonthSelect(quickMonthForm.year, e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs font-black"
                    >
                      {TURKISH_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 dark:text-teal-300 mb-1">
                      Eğitim (TL)
                    </label>
                    <input
                      type="number"
                      value={quickMonthForm.education}
                      onChange={(e) =>
                        setQuickMonthForm({
                          ...quickMonthForm,
                          education: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-teal-300 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 dark:text-teal-300 mb-1">
                      Yemek (TL)
                    </label>
                    <input
                      type="number"
                      value={quickMonthForm.dining}
                      onChange={(e) =>
                        setQuickMonthForm({
                          ...quickMonthForm,
                          dining: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-teal-300 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 dark:text-teal-300 mb-1">
                      Kırtasiye / Yayın Set (TL)
                    </label>
                    <input
                      type="number"
                      value={quickMonthForm.stationeryTotal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setQuickMonthForm({
                          ...quickMonthForm,
                          stationeryTotal: val,
                        });
                      }}
                      className="w-full px-2.5 py-2 rounded-xl border border-teal-300 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleUpsertQuickYearMonth}
                      className="w-full py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-sm transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ekle / Güncelle</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. SADE AYLIK LİSTE FİYATLARI TABLOSU */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Tanımlı Aylık Liste Fiyatları
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-500">Yıl:</span>
                      <select
                        value={tableYearFilter}
                        onChange={(e) => setTableYearFilter(e.target.value)}
                        className="font-black text-slate-800 dark:text-white bg-transparent focus:outline-none"
                      >
                        <option value="ALL">Tümü</option>
                        {Array.from(new Set(monthlyPrices.map((r) => r.year))).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={addMonthlyRow}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Satır Ekle</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-24">Yıl</th>
                        <th className="py-2.5 px-3 w-36">Ay</th>
                        <th className="py-2.5 px-3 text-right">Eğitim Ücreti (TL)</th>
                        <th className="py-2.5 px-3 text-right">Yemek Ücreti (TL)</th>
                        <th className="py-2.5 px-3 text-right">Kırtasiye / Yayın Set (TL)</th>
                        <th className="py-2.5 px-3 text-right bg-teal-900/60">Toplam (TL)</th>
                        <th className="py-2.5 px-2 text-center w-12">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {monthlyPrices
                        .filter((r) => tableYearFilter === "ALL" || r.year === tableYearFilter)
                        .map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-teal-50/40 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* Yıl */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={2024}
                                max={2035}
                                value={row.year}
                                onChange={(e) => handleMonthlyRowChange(row.id, "year", e.target.value)}
                                className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-black text-center text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-xs"
                              />
                            </td>

                            {/* Ay */}
                            <td className="py-2 px-2">
                              <select
                                value={row.monthName}
                                onChange={(e) => handleMonthlyRowChange(row.id, "monthName", e.target.value)}
                                className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-xs"
                              >
                                {TURKISH_MONTHS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                                {!TURKISH_MONTHS.includes(row.monthName) && (
                                  <option value={row.monthName}>{row.monthName}</option>
                                )}
                              </select>
                            </td>

                            {/* Eğitim Ücreti */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={row.education}
                                onChange={(e) =>
                                  handleMonthlyRowChange(
                                    row.id,
                                    "education",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-right font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-xs"
                              />
                            </td>

                            {/* Yemek Ücreti */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={row.dining}
                                onChange={(e) =>
                                  handleMonthlyRowChange(row.id, "dining", parseFloat(e.target.value) || 0)
                                }
                                className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-right font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-xs"
                              />
                            </td>

                            {/* Kırtasiye / Yayın Set Ücreti */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={row.stationeryTotal}
                                onChange={(e) =>
                                  handleMonthlyRowChange(
                                    row.id,
                                    "stationeryTotal",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-right font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-xs"
                              />
                            </td>

                            {/* Toplam */}
                            <td className="py-2 px-3 text-right bg-teal-50/40 dark:bg-teal-950/20 font-mono font-black text-teal-900 dark:text-teal-300">
                              {formatCurrency(row.totalPrice)}
                            </td>

                            {/* Sil */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeMonthlyRow(row.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Satırı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kaydet & Kapat */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setMasterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={savingMaster}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition"
                >
                  {savingMaster ? "Kaydediliyor..." : "Fiyatları Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. E-POSTA GÖNDERME MODALI */}
      {/* ========================================================================= */}
      {emailModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-sm">Fiyat Teklifini E-Posta ile Gönder</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {emailSentSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    E-Posta Başarıyla Gönderildi!
                  </h4>
                  <p className="text-xs text-slate-500">Veliye teklif özeti iletilmiştir.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alıcı E-Posta Adresi *
                    </label>
                    <input
                      type="email"
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                      placeholder="veli@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Konu
                    </label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mesaj İçeriği
                    </label>
                    <textarea
                      rows={6}
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={`mailto:${emailForm.recipient}?subject=${encodeURIComponent(
                        emailForm.subject
                      )}&body=${encodeURIComponent(emailForm.message)}`}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>E-Posta Programında Aç (Mailto)</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingEmail ? "Gönderiliyor..." : "Gönder"}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

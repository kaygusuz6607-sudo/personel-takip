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
  installmentCount: number;
  monthlyAmount?: number | string;
  campaignText: string;
}

export interface MasterPrices {
  academicYear: string;
  educationPrice: number;
  diningPrice: number;
  stationeryPrice: number;
  summerPrice: number;
}

const DEFAULT_MASTER_PRICES: MasterPrices = {
  academicYear: "2026-2027",
  educationPrice: 220000,
  diningPrice: 80000,
  stationeryPrice: 65000,
  summerPrice: 45000,
};

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
  { id: "b1", bankName: "ZİRAAT BANKASI", installmentCount: 10, campaignText: "2 taksitli okul ödemelerinizde +8 taksit fırsatından faydalanabilirsiniz." },
  { id: "b2", bankName: "İŞBANKASI", installmentCount: 6, campaignText: "2 taksitli okul ödemelerinizde +4 taksit fırsatından faydalanabilirsiniz." },
  { id: "b3", bankName: "HALKBANK PARAF TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b4", bankName: "HALK BANK VISA/MASTER", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b5", bankName: "VAKIFBANK TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ) takip" },
  { id: "b6", bankName: "VAKIFBANK VISA/MASTER", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (10 BİN VE ÜZERİ) takip" },
  { id: "b7", bankName: "AKBANK TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT" },
  { id: "b8", bankName: "AKBANK VISA/MASTER", installmentCount: 3, campaignText: "K.K PEŞİN FİYATINA 3 TAKSİT" },
  { id: "b9", bankName: "DENİZ BANK", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (100.000 TL VE ÜZERİ)" },
  { id: "b10", bankName: "TEB BANK TROY", installmentCount: 6, campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT" },
  { id: "b11", bankName: "TEB BANK VISA/MASTER", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT" },
  { id: "b12", bankName: "ALBARAKA WORLD KART", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (30.000 TL İLE 500.000 TL ARASI)" },
  { id: "b13", bankName: "KUVEYT TÜRK SAĞLAM KART", installmentCount: 5, campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (1 BİN VE ÜZERİ)" },
];

export default function TekliflerPage() {
  // Aktif Sekme: "LIST" (Tarih Sıralı Verilen Teklifler) | "EDITOR" (Teklif Düzenle & A4 Görünüm)
  const [activeTab, setActiveTab] = useState<"LIST" | "EDITOR">("LIST");

  // Editör İçi Görünüm: "PREVIEW" (A4 Belge Görünümü) | "EDIT" (Form Giriş Modu)
  const [editorView, setEditorView] = useState<"PREVIEW" | "EDIT">("EDIT");

  // Önceden Kaydedilen Standart Fiyatlar (Master Pricing)
  const [masterPrices, setMasterPrices] = useState<MasterPrices>(DEFAULT_MASTER_PRICES);
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [savingMaster, setSavingMaster] = useState(false);

  // "Teklif Ver" İlk Adım Modalı
  const [newQuoteModalOpen, setNewQuoteModalOpen] = useState(false);
  const [initForm, setInitForm] = useState({
    parentName: "",
    phone: "",
    studentName: "",
    quoteDate: new Date().toISOString().split("T")[0],
    includeEducation: true,
    includeDining: true,
    includeStationery: true,
    includeSummer: true,
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

  // Başlangıç: Standart fiyatları ve teklif listesini çek
  useEffect(() => {
    fetchMasterPrices();
    fetchQuotesList();
  }, []);

  const fetchMasterPrices = async () => {
    try {
      const res = await fetch("/api/teklifler/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && data.educationPrice) {
          setMasterPrices({
            academicYear: data.academicYear || "2026-2027",
            educationPrice: Number(data.educationPrice) || 220000,
            diningPrice: Number(data.diningPrice) || 80000,
            stationeryPrice: Number(data.stationeryPrice) || 65000,
            summerPrice: Number(data.summerPrice) || 45000,
          });
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
          // Tarih sıralı (en yeniden eskiye)
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

  // Standart Fiyatları Kaydet (Settings API)
  const handleSaveMasterPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMaster(true);
      const res = await fetch("/api/teklifler/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterPrices),
      });

      if (res.ok) {
        setMasterModalOpen(false);
        setSaveSuccessMsg("2026-2027 Standart Fiyatları Başarıyla Kaydedildi!");
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

  // 1. ADIM: "Teklif Ver" Butonuna Basıldığında Modalı Aç
  const handleOpenNewQuoteModal = () => {
    setInitForm({
      parentName: "",
      phone: "",
      studentName: "",
      quoteDate: new Date().toISOString().split("T")[0],
      includeEducation: true,
      includeDining: true,
      includeStationery: true,
      includeSummer: true,
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
    setSavedQuoteId(null);
    setQuoteNo(null);

    // Önceden kayıtlı standart fiyatları otomatik kalem olarak yükle
    const newItems: QuoteItem[] = [];

    if (initForm.includeSummer) {
      newItems.push({
        id: `item_summer_${Date.now()}`,
        desc: `Yaz Okulu *HAZİRAN* ${masterPrices.academicYear} Dönemi`,
        qty: 1,
        unit: "dnm",
        listPrice: masterPrices.summerPrice,
        discountPercent: 24, // varsayılan erken kayıt indirimi
        netPrice: Number((masterPrices.summerPrice * 0.76).toFixed(2)),
        total: Number((masterPrices.summerPrice * 0.76).toFixed(2)),
      });
    }

    if (initForm.includeEducation) {
      newItems.push({
        id: `item_edu_${Date.now()}`,
        desc: `Eğitim Ücreti *HAZİRAN* ${masterPrices.academicYear} Dönemi`,
        qty: 1,
        unit: "dnm",
        listPrice: masterPrices.educationPrice,
        discountPercent: 24,
        netPrice: Number((masterPrices.educationPrice * 0.76).toFixed(2)),
        total: Number((masterPrices.educationPrice * 0.76).toFixed(2)),
      });
    }

    if (initForm.includeDining) {
      newItems.push({
        id: `item_dine_${Date.now()}`,
        desc: `Yemek Ücreti ${masterPrices.academicYear} Dönemi`,
        qty: 1,
        unit: "dnm",
        listPrice: masterPrices.diningPrice,
        discountPercent: 0,
        netPrice: masterPrices.diningPrice,
        total: masterPrices.diningPrice,
      });
    }

    if (initForm.includeStationery) {
      newItems.push({
        id: `item_stat_${Date.now()}`,
        desc: `Kırtasiye ${masterPrices.academicYear} Dönemi`,
        qty: 1,
        unit: "ad",
        listPrice: masterPrices.stationeryPrice,
        discountPercent: 0,
        netPrice: masterPrices.stationeryPrice,
        total: masterPrices.stationeryPrice,
      });
    }

    setItems(newItems);
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

  // Banka Kampanyası Aylık Tutarı veya Kampanya Metnini Güncelleme
  const handleBankChange = (id: string, field: keyof BankCampaign, val: any) => {
    setBankCampaigns((prev) =>
      prev.map((bank) => {
        if (bank.id !== id) return bank;
        return { ...bank, [field]: val };
      })
    );
  };

  // Bankanın Aylık Taksit Tutarını Hesaplama (Otomatik veya Kullanıcının Elle Girdiği)
  const getMonthlyAmount = (bank: BankCampaign) => {
    if (bank.monthlyAmount !== undefined && bank.monthlyAmount !== null && bank.monthlyAmount !== "") {
      return Number(bank.monthlyAmount);
    }
    const count = Number(bank.installmentCount) || 1;
    return count > 0 ? Math.round(netTotal / count) : netTotal;
  };

  // Banka Ekle / Sil
  const addBankCampaign = () => {
    const newBank: BankCampaign = {
      id: `b_${Date.now()}`,
      bankName: "YENİ BANKA",
      installmentCount: 6,
      campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT",
    };
    setBankCampaigns([...bankCampaigns, newBank]);
  };

  const removeBankCampaign = (id: string) => {
    setBankCampaigns(bankCampaigns.filter((b) => b.id !== id));
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
      if (Array.isArray(parsedCampaigns)) setBankCampaigns(parsedCampaigns);
    } catch {}

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

          {/* Standart Fiyatları Kaydetme Modalı Butonu */}
          <button
            onClick={() => setMasterModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
            title="Eğitim, Yemek ve Kırtasiye Standart Liste Fiyatlarını Önceden Belirle"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">2026-2027 Fiyat Ayarları</span>
            <span className="sm:hidden">Fiyatlar</span>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>Hizmet Kalemleri, İndirim Oranları ve Fiyatlar</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Standart fiyatlar otomatik gelir. İster % indirim yapın, ister doğrudan Net Fiyatı elle girin.
                    </p>
                  </div>

                  {/* Hızlı Kalem Ekleme Butonları */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          `Eğitim Ücreti *HAZİRAN* ${masterPrices.academicYear} Dönemi`,
                          masterPrices.educationPrice,
                          24
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                    >
                      + Eğitim
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem(`Yemek Ücreti ${masterPrices.academicYear} Dönemi`, masterPrices.diningPrice, 0)
                      }
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                    >
                      + Yemek
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem(`Kırtasiye ${masterPrices.academicYear} Dönemi`, masterPrices.stationeryPrice, 0)
                      }
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                    >
                      + Kırtasiye
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          `Yaz Okulu *HAZİRAN* ${masterPrices.academicYear} Dönemi`,
                          masterPrices.summerPrice,
                          24
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold"
                    >
                      + Yaz Okulu
                    </button>
                    <button
                      type="button"
                      onClick={() => addItem("Özel Hizmet / Kalem", 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      + Özel Kalem
                    </button>
                  </div>
                </div>

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
                    <span className="line-through text-slate-600 font-mono">{formatCurrency(grossTotal)}</span>
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

              {/* BANKA KREDİ KARTI TAKSİT SEÇENEKLERİ (AYLIK TUTAR DÜZENLEME) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>Banka Kredi Kartı Taksit Seçenekleri (Aylık Tutarlar)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Net tutara göre aylık taksit tutarı otomatik hesaplanır, dilediğiniz gibi kutucuktan elle düzeltebilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addBankCampaign}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Banka Ekle</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bankCampaigns.map((bank) => {
                    const monthly = getMonthlyAmount(bank);
                    return (
                      <div
                        key={bank.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Banka Adı */}
                          <input
                            type="text"
                            value={bank.bankName}
                            onChange={(e) => handleBankChange(bank.id, "bankName", e.target.value.toUpperCase())}
                            className="font-bold text-xs uppercase px-2 py-1 rounded border border-slate-200 w-1/2"
                          />
                          {/* Taksit Sayısı */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={bank.installmentCount || 6}
                              onChange={(e) =>
                                handleBankChange(bank.id, "installmentCount", parseInt(e.target.value) || 1)
                              }
                              className="w-12 px-1 py-1 rounded border border-slate-200 text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-slate-500">Taksit</span>
                          </div>
                          {/* Sil */}
                          <button
                            type="button"
                            onClick={() => removeBankCampaign(bank.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Aylık Taksit Tutarı (Elle Düzeltilebilir) */}
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-teal-800 dark:text-teal-300 shrink-0">
                            Aylık Taksit:
                          </label>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={bank.monthlyAmount !== undefined ? bank.monthlyAmount : monthly}
                              onChange={(e) => handleBankChange(bank.id, "monthlyAmount", e.target.value)}
                              className="w-full px-2 py-1 rounded border border-teal-300 bg-white text-xs font-bold font-mono text-teal-900"
                              placeholder={monthly.toString()}
                            />
                            <span className="absolute right-2 top-1 text-[10px] text-slate-400">₺/ay</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            (Toplam: {formatCurrency((Number(bank.monthlyAmount) || monthly) * (bank.installmentCount || 1))})
                          </span>
                        </div>

                        {/* Kampanya Açıklaması */}
                        <input
                          type="text"
                          value={bank.campaignText}
                          onChange={(e) => handleBankChange(bank.id, "campaignText", e.target.value)}
                          className="text-[10px] text-slate-600 px-2 py-1 rounded border border-slate-200"
                          placeholder="Kampanya şartı / detayı"
                        />
                      </div>
                    );
                  })}
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-extrabold tracking-widest shrink-0">
                      <span className="text-base font-serif">S</span>
                      <span className="text-[7px] uppercase tracking-normal">SİMYA</span>
                    </div>
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
                      {items.map((item, idx) => (
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
                          <td className="border-r border-slate-300 py-1.5 px-2 text-right font-mono line-through text-slate-500 font-medium">
                            {formatCurrency(item.listPrice)}
                          </td>
                          <td className="border-r border-slate-300 py-1.5 px-1.5 text-center font-bold text-slate-700">
                            {item.discountPercent > 0 ? `%${item.discountPercent}` : "-"}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900 text-[11px]">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOPLAM ALANI (BRÜT, İNDİRİM, NET KAYIT BEDELİ) */}
                <div className="mt-2.5 flex justify-end">
                  <div className="w-64 border border-slate-400 bg-slate-50 p-2 space-y-1 text-[10px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Brüt Toplam:</span>
                      <span className="font-mono line-through">{formatCurrency(grossTotal)}</span>
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

                {/* 6. BANKA KREDİ KARTI TAKSİT VE KAMPANYA SEÇENEKLERİ */}
                <div className="mt-4 pt-2.5 border-t border-slate-300">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[9.5px] mb-1.5 flex items-center justify-between">
                    <span>ANLAŞMALI BANKA KREDİ KARTI VE TAKSİT SEÇENEKLERİ:</span>
                    <span className="text-[8.5px] text-slate-500 font-normal lowercase">
                      (vade farksız taksit imkanları)
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[8.5px]">
                    {bankCampaigns.map((b) => {
                      const monthly = getMonthlyAmount(b);
                      return (
                        <div
                          key={b.id}
                          className="border border-slate-300 p-1.5 bg-slate-50/70 rounded-none flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-slate-900">{b.bankName}</span>
                            <span className="font-bold font-mono text-slate-800 bg-white px-1 border border-slate-200 text-[8px]">
                              {b.installmentCount} Taksit
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between font-mono font-bold text-teal-900">
                            <span className="text-[7.5px] text-slate-500 font-sans font-normal">Aylık:</span>
                            <span>{formatCurrency(monthly)}</span>
                          </div>
                          <p className="text-[7.5px] text-slate-500 line-clamp-1 mt-0.5">{b.campaignText}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. BANKA VE IBAN BİLGİSİ */}
                {bankInfo && (
                  <div className="mt-2.5 p-1.5 bg-slate-100 border border-slate-300 text-[8.5px] font-mono text-slate-700">
                    <span className="font-bold">Havale / EFT:</span> {bankInfo}
                  </div>
                )}
              </div>

              {/* 8. ALTAKİ RESMİ İMZA VE MEB KAŞE/MÜHÜR BLOĞU */}
              <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-between">
                {/* Sol: Kurum & Teklif Veren */}
                <div className="space-y-1 text-left">
                  <p className="font-bold text-[10px] text-slate-800 uppercase">{schoolName}</p>
                  <p className="text-[9px] text-slate-500">Mali İşler & Erken Kayıt Koordinatörlüğü</p>
                  <div className="h-10"></div>
                  <p className="text-[8.5px] text-slate-400">İmza / Yetkili</p>
                </div>

                {/* Orta: Resmi MEB Mührü */}
                {includeStamp && (
                  <div className="relative border-2 border-red-700/80 rounded-full w-24 h-24 flex flex-col items-center justify-center p-1 text-center text-red-700/80 font-serif -rotate-6 select-none opacity-90">
                    <div className="text-[7px] font-bold tracking-tight">T.C. M.E.B.</div>
                    <div className="text-[6.5px] font-extrabold uppercase leading-tight px-1">
                      ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ
                    </div>
                    <div className="text-[6px] font-semibold tracking-wider mt-0.5">ANAOKULU</div>
                    <div className="text-[6px] font-mono mt-0.5">ONAYLANDI</div>
                  </div>
                )}

                {/* Sağ: Veli Onay Alanı */}
                <div className="space-y-1 text-right">
                  <p className="font-bold text-[10px] text-slate-800 uppercase">
                    TEKLİFİ ALAN VELİ
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{parentName}</p>
                  <div className="h-10"></div>
                  <p className="text-[8.5px] text-slate-400">Okudum, Anladım ve Kabul Ediyorum (İmza)</p>
                </div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10">
                  <FileText className="w-5 h-5 text-teal-200" />
                </span>
                <div>
                  <h3 className="font-black text-base tracking-wide">Yeni Fiyat Teklifi Ver</h3>
                  <p className="text-xs text-teal-100">
                    Veli bilgilerini girip standart fiyatlar ile teklifi hazırlayın.
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

            <form onSubmit={handleCreateQuoteFromInit} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
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

              {/* Dahil Edilecek Standart Hizmetler (Ön Tanımlı) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400">
                  Dahil Edilecek Hizmetler ({masterPrices.academicYear} Kayıtlı Fiyatları)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={initForm.includeEducation}
                      onChange={(e) => setInitForm({ ...initForm, includeEducation: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Eğitim ({formatCurrency(masterPrices.educationPrice)})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={initForm.includeDining}
                      onChange={(e) => setInitForm({ ...initForm, includeDining: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Yemek ({formatCurrency(masterPrices.diningPrice)})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={initForm.includeStationery}
                      onChange={(e) => setInitForm({ ...initForm, includeStationery: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Kırtasiye ({formatCurrency(masterPrices.stationeryPrice)})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={initForm.includeSummer}
                      onChange={(e) => setInitForm({ ...initForm, includeSummer: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Yaz Okulu ({formatCurrency(masterPrices.summerPrice)})</span>
                  </label>
                </div>
              </div>

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
      {/* 5. "2026-2027 STANDART FİYATLARI BELİRLE" MODALI (MASTER PRICING) */}
      {/* ========================================================================= */}
      {masterModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10">
                  <Settings className="w-5 h-5 text-teal-400" />
                </span>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">2026-2027 Standart Liste Fiyatları</h3>
                  <p className="text-[11px] text-slate-400">
                    Önceden kaydedilen bu fiyatlar her yeni teklif verildiğinde otomatik gelir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMasterModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterPrices} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eğitim-Öğretim Yılı
                </label>
                <input
                  type="text"
                  value={masterPrices.academicYear}
                  onChange={(e) => setMasterPrices({ ...masterPrices, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2026-2027 Eğitim Ücreti (Standart Liste Fiyatı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={masterPrices.educationPrice}
                    onChange={(e) =>
                      setMasterPrices({ ...masterPrices, educationPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Yemek Ücreti (Standart Liste Fiyatı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={masterPrices.diningPrice}
                    onChange={(e) =>
                      setMasterPrices({ ...masterPrices, diningPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kırtasiye Ücreti (Standart Liste Fiyatı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={masterPrices.stationeryPrice}
                    onChange={(e) =>
                      setMasterPrices({ ...masterPrices, stationeryPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Yaz Okulu Ücreti (Standart Liste Fiyatı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={masterPrices.summerPrice}
                    onChange={(e) =>
                      setMasterPrices({ ...masterPrices, summerPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">₺</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMasterModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={savingMaster}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
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

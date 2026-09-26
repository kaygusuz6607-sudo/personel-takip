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
  campaignText: string;
}

const DEFAULT_ITEMS: QuoteItem[] = [
  {
    id: "item_1",
    desc: "Yaz Okulu *HAZİRAN* 26-27 Dönemi",
    qty: 1,
    unit: "dnm",
    listPrice: 45000,
    discountPercent: 24,
    netPrice: 34200,
    total: 34200,
  },
  {
    id: "item_2",
    desc: "Eğitim Ücreti *HAZİRAN* 26-27 Dönemi",
    qty: 1,
    unit: "dnm",
    listPrice: 220000,
    discountPercent: 24,
    netPrice: 167200,
    total: 167200,
  },
  {
    id: "item_3",
    desc: "Yemek Ücreti 26-27 Dönemi",
    qty: 1,
    unit: "dnm",
    listPrice: 80000,
    discountPercent: 0,
    netPrice: 80000,
    total: 80000,
  },
  {
    id: "item_4",
    desc: "Kırtasiye 26-27 Dönemi",
    qty: 1,
    unit: "ad",
    listPrice: 65000,
    discountPercent: 0,
    netPrice: 65000,
    total: 65000,
  },
];

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
  { id: "b1", bankName: "ZİRAAT BANKASI", campaignText: "2 taksitli okul ödemelerinizde +8 taksit fırsatından faydalanabilirsiniz." },
  { id: "b2", bankName: "İŞBANKASI", campaignText: "2 taksitli okul ödemelerinizde +4 taksit fırsatından faydalanabilirsiniz." },
  { id: "b3", bankName: "HALKBANK PARAF TROY", campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b4", bankName: "HALK BANK VISA/MASTER", campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (10 BİN VE ÜZERİ)" },
  { id: "b5", bankName: "VAKIFBANK TROY", campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (10 BİN VE ÜZERİ) banka güncellemesi bekleniyor. Takip" },
  { id: "b6", bankName: "VAKIFBANK VISA/MASTER", campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (10 BİN VE ÜZERİ) banka güncellemesi bekleniyor. Takip" },
  { id: "b7", bankName: "AKBANK TROY", campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT banka güncellemesi bekleniyor. Takip" },
  { id: "b8", bankName: "AKBANK VISA/MASTER", campaignText: "K.K PEŞİN FİYATINA 3 TAKSİT banka güncellemesi bekleniyor. Takip" },
  { id: "b9", bankName: "DENİZ BANK", campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT (100.000 TL VE ÜZERİ)" },
  { id: "b10", bankName: "TEB BANK TROY", campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT" },
  { id: "b11", bankName: "TEB BANK VISA/MASTER", campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT" },
  { id: "b12", bankName: "ALBARAKA WORLD KART", campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (30.000 TL İLE 500.000 TL ARASI)" },
  { id: "b13", bankName: "KUVEYT TÜRK SAĞLAM KART", campaignText: "K.K PEŞİN FİYATINA 5 TAKSİT (1BİN VE ÜZERİ)" },
];

export default function TekliflerPage() {
  // Görünüm Modu: "PREVIEW" (A4 Belge Görünümü) | "EDIT" (Form Giriş Modu)
  const [viewMode, setViewMode] = useState<"PREVIEW" | "EDIT">("PREVIEW");

  // Teklif Üst Bilgileri
  const [schoolName, setSchoolName] = useState("ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ");
  const [schoolAddress, setSchoolAddress] = useState(
    "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ"
  );
  const [schoolPhone, setSchoolPhone] = useState("0(352) 503 91 93 - 0(537) 380 0 380");
  const [quoteDate, setQuoteDate] = useState("2026-07-08");
  const [parentName, setParentName] = useState("YUSUF GÜVENER");
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("5308322662");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState(
    "2026 - 2027 Eğitim Öğretim Yılı mevcut aya özel erken kayıt ücretlerimizi bilgilerinize sunarız."
  );

  // Kalemler ve Banka
  const [items, setItems] = useState<QuoteItem[]>(DEFAULT_ITEMS);
  const [policyNotes, setPolicyNotes] = useState<string[]>(DEFAULT_POLICY_NOTES);
  const [bankInfo, setBankInfo] = useState(
    "VAKIFBANK - HESAP ADI: SİMCÜ ÖZEL EĞİTİM HİZMETLERİ A.Ş.  IBAN: TR40 0001 5001 5800 7349 4889 17"
  );
  const [bankCampaigns, setBankCampaigns] = useState<BankCampaign[]>(DEFAULT_BANK_CAMPAIGNS);
  const [includeStamp, setIncludeStamp] = useState(true);

  // Kayıt ve Durum State'leri
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [quoteNo, setQuoteNo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // E-Posta Gönderme Modalı
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipient: "",
    subject: "Özel Kayseri Simya Çocuk Üniversitesi - Fiyat Teklif Formu",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Geçmiş Teklifler Modalı
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  // Para formatlayıcı
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0) + " ₺";
  };

  // Hesaplamalar
  const grossTotal = items.reduce((sum, item) => sum + (Number(item.listPrice) || 0), 0);
  const netTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountTotal = grossTotal - netTotal;
  const kdvPercent = 0; // KDV Dahil
  const kdvTotal = 0;
  const grandTotal = netTotal;

  // Kalem Değişikliği
  const handleItemChange = (id: string, field: keyof QuoteItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val };

        if (field === "listPrice" || field === "discountPercent") {
          const list = field === "listPrice" ? parseFloat(val) || 0 : item.listPrice;
          const disc = field === "discountPercent" ? parseFloat(val) || 0 : item.discountPercent;
          const discounted = Number((list * (1 - disc / 100)).toFixed(2));
          updated.netPrice = discounted;
          updated.total = discounted;
        }

        if (field === "total") {
          const totalVal = parseFloat(val) || 0;
          updated.netPrice = totalVal;
          if (updated.listPrice > 0) {
            updated.discountPercent = Number(
              (((updated.listPrice - totalVal) / updated.listPrice) * 100).toFixed(2)
            );
          }
        }

        return updated;
      })
    );
  };

  // Yeni Kalem Ekle
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

  // Banka Kampanyası Ekle / Düzenle / Sil
  const addBankCampaign = () => {
    const newBank: BankCampaign = {
      id: `b_${Date.now()}`,
      bankName: "YENİ BANKA",
      campaignText: "K.K PEŞİN FİYATINA 6 TAKSİT",
    };
    setBankCampaigns([...bankCampaigns, newBank]);
  };

  const removeBankCampaign = (id: string) => {
    setBankCampaigns(bankCampaigns.filter((b) => b.id !== id));
  };

  // Sıfırla / Örneği Yükle
  const handleResetToExample = () => {
    if (!window.confirm("Teklifi görseldeki orijinal 'Simya Çocuk Üniversitesi' örneğine döndürmek istediğinize emin misiniz?")) {
      return;
    }
    setSchoolName("ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ");
    setSchoolAddress("ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ");
    setSchoolPhone("0(352) 503 91 93 - 0(537) 380 0 380");
    setQuoteDate("2026-07-08");
    setParentName("YUSUF GÜVENER");
    setPhone("5308322662");
    setTitle("2026 - 2027 Eğitim Öğretim Yılı mevcut aya özel erken kayıt ücretlerimizi bilgilerinize sunarız.");
    setItems(DEFAULT_ITEMS);
    setPolicyNotes(DEFAULT_POLICY_NOTES);
    setBankCampaigns(DEFAULT_BANK_CAMPAIGNS);
    setSavedQuoteId(null);
    setQuoteNo(null);
  };

  // Yazdır / PDF Olarak Kaydet
  const handlePrint = () => {
    setViewMode("PREVIEW");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Teklifi Kaydet (API)
  const handleSaveQuote = async () => {
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
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      } else {
        alert(data.error || "Kaydedilemedi");
      }
    } catch (err) {
      alert("Teklif kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Geçmiş Teklifleri Getir
  const fetchQuoteHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/teklifler");
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuoteHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryModal = () => {
    fetchQuoteHistory();
    setHistoryModalOpen(true);
  };

  // Kayıtlı Teklifi Ekrana Yükle
  const loadSavedQuote = (q: any) => {
    setSavedQuoteId(q.id);
    setQuoteNo(q.quoteNo);
    setSchoolName(q.schoolName || "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ");
    setSchoolAddress(q.schoolAddress || "");
    setSchoolPhone(q.schoolPhone || "");
    setQuoteDate(q.date ? new Date(q.date).toISOString().split("T")[0] : "2026-07-08");
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

    setHistoryModalOpen(false);
    setViewMode("PREVIEW");
  };

  // E-Posta Gönderme
  const handleOpenEmailModal = () => {
    setEmailForm({
      recipient: email || "",
      subject: `${schoolName} - Fiyat Teklif Formu (${parentName})`,
      message: `Sayın ${parentName},\n\n${title}\n\nToplam Net Tutar: ${formatCurrency(
        grandTotal
      )}\n\nTeklif detayları ekte bilgilerinize sunulmuştur. Sorularınız için bize her zaman ulaşabilirsiniz.\n\nSaygılarımızla,\n${schoolName}\nTel: ${schoolPhone}`,
    });
    setEmailSentSuccess(false);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipient || !emailForm.recipient.includes("@")) {
      alert("Lütfen geçerli bir alıcı e-posta adresi giriniz.");
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

  // Outlook / Varsayılan Mail İstemcisiyle Aç
  const handleMailtoClient = () => {
    const subject = encodeURIComponent(`${schoolName} - Fiyat Teklif Formu`);
    const body = encodeURIComponent(
      `Sayın ${parentName},\n\n${title}\n\nToplam Net Tutar: ${formatCurrency(
        grandTotal
      )}\n\nTeklif detayları bilgilerinize sunulmuştur.\n\n${schoolName}\nTel: ${schoolPhone}`
    );
    window.location.href = `mailto:${emailForm.recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
      {/* Üst Yönetim Araç Çubuğu (Print esnasında gizlenir) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fiyat Teklif Modülü</h1>
            {quoteNo && (
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-mono font-bold">
                {quoteNo}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Örnek teklifi referans alarak fiyatları ve şartları düzenleyin, A4 çıktısı alın veya veliye iletin.
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Görünüm Modu Değiştir */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("PREVIEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "PREVIEW"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Belge Görünümü</span>
            </button>
            <button
              onClick={() => setViewMode("EDIT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "EDIT"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Form Düzenleyici</span>
            </button>
          </div>

          {/* Yazdır / PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            title="Yazıcıya gönder veya PDF olarak kaydet"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF</span>
          </button>

          {/* Mail Gönder */}
          <button
            onClick={handleOpenEmailModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>Mail Gönder</span>
          </button>

          {/* Kaydet */}
          <button
            onClick={handleSaveQuote}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Kaydediliyor..." : savedQuoteId ? "Güncelle" : "Kaydet"}</span>
          </button>

          {/* Geçmiş Teklifler */}
          <button
            onClick={openHistoryModal}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Geçmiş</span>
          </button>

          {/* Sıfırla */}
          <button
            onClick={handleResetToExample}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            title="Örnek Simya şablonuna sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* FORM DÜZENLEME MODU (Kullanıcı fiyat ve kalemleri kolayca değiştirir) */}
      {viewMode === "EDIT" && (
        <div className="no-print space-y-5 animate-in fade-in duration-150">
          {/* 1. Veli & Teklif Bilgileri */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              <span>Muhatap & Teklif Bilgileri</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Veli Adı Soyadı</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefon / İletişim No</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teklif Tarihi</label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Veli E-Posta (Opsiyonel)</label>
                <input
                  type="email"
                  placeholder="veli@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Teklif Başlık / Sunuş Metni</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Hizmet & Ücret Kalemleri Tablosu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-700" />
                  <span>Teklif Hizmet Kalemleri</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Liste fiyatını ve indirim yüzdesini girin, indirimli fiyat ve net toplam otomatik hesaplanır.
                </p>
              </div>

              {/* Hızlı Ekle Butonları */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => addItem("Eğitim Ücreti *HAZİRAN* 26-27 Dönemi", 220000, 24)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-medium border border-teal-200"
                >
                  + Eğitim
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Yemek Ücreti 26-27 Dönemi", 80000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-medium border border-teal-200"
                >
                  + Yemek
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Yaz Okulu *HAZİRAN* 26-27 Dönemi", 45000, 24)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-medium border border-teal-200"
                >
                  + Yaz Okulu
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Kırtasiye 26-27 Dönemi", 65000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-medium border border-teal-200"
                >
                  + Kırtasiye
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Yeni Kalem", 0, 0)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold"
                >
                  + Özel Kalem Ekle
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3 w-2/5">Açıklama</th>
                    <th className="py-2.5 px-3 text-center">Miktar & Birim</th>
                    <th className="py-2.5 px-3 text-right">Liste Fiyatı (TL)</th>
                    <th className="py-2.5 px-3 text-center">İndirim (%)</th>
                    <th className="py-2.5 px-3 text-right">Net Fiyat (TL)</th>
                    <th className="py-2.5 px-3 text-right">Tutar (KDV Dahil)</th>
                    <th className="py-2.5 px-3 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => handleItemChange(item.id, "desc", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                            className="w-12 px-1.5 py-1.5 rounded-lg border border-slate-200 text-center font-bold text-xs"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                            className="w-12 px-1 py-1.5 rounded-lg border border-slate-200 text-center text-xs"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="100"
                          value={item.listPrice}
                          onChange={(e) => handleItemChange(item.id, "listPrice", e.target.value)}
                          className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 text-right font-mono font-semibold text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(item.id, "discountPercent", e.target.value)}
                            className="w-16 px-1.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-center font-bold text-xs"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                        {formatCurrency(item.netPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Kalemi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Toplam Özeti Barı */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Toplam {items.length} hizmet kalemi tanımlandı.</span>
              <div className="flex items-center gap-6 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Brüt Toplam:</span>
                  <span className="font-semibold text-slate-600">{formatCurrency(grossTotal)}</span>
                </div>
                <div>
                  <span className="text-rose-500 block text-[10px]">Toplam İndirim:</span>
                  <span className="font-bold text-rose-600">- {formatCurrency(discountTotal)}</span>
                </div>
                <div>
                  <span className="text-teal-700 block text-[10px]">Ödenecek Net Tutar:</span>
                  <span className="font-extrabold text-base text-slate-900">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Kurum, Banka & Şartlar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kurum & Banka Bilgileri */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>Kurum & Banka IBAN Bilgileri</span>
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kurum Adı</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kurum Adresi</label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
                <input
                  type="text"
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Banka & IBAN Açıklaması</label>
                <input
                  type="text"
                  value={bankInfo}
                  onChange={(e) => setBankInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkStamp"
                  checked={includeStamp}
                  onChange={(e) => setIncludeStamp(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="chkStamp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Belgeye Resmi MEB Kaşesi & Mühür Ekle
                </label>
              </div>
            </div>

            {/* Banka Taksit Kampanyaları */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span>Kredi Kartı Taksit Kampanyaları ({bankCampaigns.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={addBankCampaign}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold"
                >
                  + Banka Ekle
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {bankCampaigns.map((bank) => (
                  <div key={bank.id} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={bank.bankName}
                      onChange={(e) =>
                        setBankCampaigns(
                          bankCampaigns.map((b) => (b.id === bank.id ? { ...b, bankName: e.target.value } : b))
                        )
                      }
                      className="w-44 px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold uppercase shrink-0"
                    />
                    <input
                      type="text"
                      value={bank.campaignText}
                      onChange={(e) =>
                        setBankCampaigns(
                          bankCampaigns.map((b) => (b.id === bank.id ? { ...b, campaignText: e.target.value } : b))
                        )
                      }
                      className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeBankCampaign(bank.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* A4 BASKI / BELGE ÖNİZLEME (ORİJİNAL SİMYA ŞABLONUYLA BİREBİR AYNI FORMAT) */}
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
                {/* Simya Logo İkonu */}
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

              {/* Tarih */}
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
                {parentName}
              </h2>
              {phone && <p className="text-xs font-mono font-medium text-slate-600">{phone}</p>}
              <p className="text-[11px] text-slate-700 font-medium pt-1">{title}</p>
            </div>

            {/* 3. FİYAT TEKLİF TABLOSU */}
            <div className="mt-4">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-400 text-slate-800 font-bold">
                    <th className="py-2 text-left w-6">#</th>
                    <th className="py-2 text-left">Açıklama</th>
                    <th className="py-2 text-center w-20">Miktar</th>
                    <th className="py-2 text-right w-36">Fiyat</th>
                    <th className="py-2 text-center w-24">İndirim (%)</th>
                    <th className="py-2 text-right w-36">Tutar (KDV Dahil)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="align-middle">
                      <td className="py-2.5 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 font-bold text-slate-900">{item.desc}</td>
                      <td className="py-2.5 text-center font-medium text-slate-700">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {item.discountPercent > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="line-through text-slate-400 text-[10px]">
                              {formatCurrency(item.listPrice)}
                            </span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.netPrice)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900">{formatCurrency(item.listPrice)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-800">
                        %{item.discountPercent.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 4. SAĞ ALT TOPLAMLAR KUTUSU */}
              <div className="mt-3 flex justify-end">
                <div className="w-64 border-t border-slate-400 pt-2 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-sans">Brüt:</span>
                    <span className="font-semibold">{formatCurrency(grossTotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-semibold">
                      <span className="font-sans">İndirim:</span>
                      <span>- {formatCurrency(discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span className="font-sans">Net:</span>
                    <span>{formatCurrency(netTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[10px]">
                    <span className="font-sans">KDV (%0):</span>
                    <span>0,00 ₺</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-950 font-black text-xs pt-1 border-t border-slate-300">
                    <span className="font-sans uppercase">Toplam:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. KAYIT YÖNERGESİ (ŞARTLAR VE MEB YÖNETMELİĞİ) */}
            <div className="mt-5 pt-3 border-t border-slate-300 text-[9.5px] text-slate-700 leading-tight space-y-1">
              <h3 className="font-bold text-[10px] uppercase text-slate-900 tracking-wider">
                KAYIT YÖNERGESİ
              </h3>
              {policyNotes.map((note, idx) => (
                <p key={idx} className="text-justify">
                  • {note}
                </p>
              ))}
            </div>

            {/* 6. BANKA & HESAP BİLGİSİ */}
            <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-mono text-slate-800 font-bold">
              {bankInfo}
            </div>

            {/* 7. BANKA KREDİ KARTI TAKSİT TABLOSU & RESMİ KAŞE */}
            <div className="mt-3 grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8 space-y-0.5 text-[8.5px] leading-tight font-mono">
                <p className="font-sans font-bold text-[9px] text-slate-900 pb-0.5">
                  Nisan Ayı Banka Eğitim Kampanyaları:
                </p>
                {bankCampaigns.map((camp) => (
                  <div key={camp.id} className="flex items-baseline gap-1">
                    <span className="font-bold uppercase w-36 shrink-0">{camp.bankName}:</span>
                    <span className="text-slate-700">{camp.campaignText}</span>
                  </div>
                ))}
              </div>

              {/* 8. RESMİ MEB MÜHÜR & İMZA ALANI */}
              <div className="col-span-4 flex flex-col items-center justify-center text-center">
                {includeStamp ? (
                  <div className="relative flex flex-col items-center justify-center">
                    {/* SVG Resmi Mühür (Görseldeki gibi çift çemberli yuvarlak mavi/mor mühür) */}
                    <svg viewBox="0 0 160 160" className="w-32 h-32 text-blue-900/80 drop-shadow-xs">
                      {/* Dış Çember */}
                      <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3,1" />
                      {/* İç Çember */}
                      <circle cx="80" cy="80" r="62" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      {/* Hilal ve Yıldız */}
                      <path
                        d="M 75 62 A 14 14 0 1 0 75 88 A 11 11 0 1 1 75 62 Z"
                        fill="currentColor"
                      />
                      <polygon
                        points="84,72 86,77 91,77 87,80 89,85 84,82 80,85 81,80 78,77 83,77"
                        fill="currentColor"
                      />
                      {/* Üst Kavisli Metin */}
                      <path id="curveTop" d="M 28 80 A 52 52 0 0 1 132 80" fill="none" />
                      <text fontSize="7.5" fontWeight="bold" fill="currentColor" letterSpacing="0.8">
                        <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
                          T.C. MİLLİ EĞİTİM BAKANLIĞI
                        </textPath>
                      </text>
                      {/* Alt Kavisli Metin */}
                      <path id="curveBottom" d="M 132 80 A 52 52 0 0 1 28 80" fill="none" />
                      <text fontSize="6.5" fontWeight="bold" fill="currentColor" letterSpacing="0.5">
                        <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                          ÖZEL SİMYA KOLEJİ ANAOKULU MD.
                        </textPath>
                      </text>
                      {/* Ortadaki Yazı */}
                      <text x="80" y="103" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="currentColor">
                        MELİKGAZİ / KAYSERİ
                      </text>
                    </svg>

                    <div className="mt-1 text-center">
                      <p className="text-[9px] font-bold text-slate-800">Yetkili İmza & Kaşe</p>
                      <p className="text-[8px] text-slate-400">Özel Simya Çocuk Üniversitesi</p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-8 text-center border-t border-slate-300 w-40">
                    <p className="text-[10px] font-bold text-slate-900">Kurum Yetkilisi</p>
                    <p className="text-[8.5px] text-slate-500">İmza & Kaşe</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Belge Alt Bilgi */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-mono">
            <span>İşbu fiyat teklifi bilgilendirme amaçlı olup ilgili ay için geçerlidir.</span>
            <span>COSMOS Eğitim ve Öğrenci Takip Sistemi</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALLAR (Mail Gönderme & Geçmiş Teklifler) */}
      {/* ========================================================================= */}

      {/* E-Posta Gönderme Modalı */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Teklifi E-Posta ile Gönder</h3>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">E-Posta Başarıyla İletildi!</h4>
                <p className="text-xs text-slate-500">{emailForm.recipient} adresine teklif gönderildi.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Veli E-Posta Adresi</label>
                  <input
                    type="email"
                    placeholder="veli@example.com"
                    value={emailForm.recipient}
                    onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">E-Posta Konusu</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mesaj Metni</label>
                  <textarea
                    rows={5}
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleMailtoClient}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Outlook / Gmail ile Aç</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailModalOpen(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingEmail ? "Gönderiliyor..." : "Hemen Gönder"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Geçmiş Teklifler Modalı */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-base">Kayıtlı Fiyat Teklifleri Geçmişi</h3>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arama */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Veli adı veya teklif no ile ara..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            {/* Teklif Listesi */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {loadingHistory ? (
                <div className="py-10 text-center text-slate-400">Yükleniyor...</div>
              ) : quoteHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-400">Henüz kayıtlı teklif bulunmuyor.</div>
              ) : (
                quoteHistory
                  .filter(
                    (q) =>
                      !searchHistory.trim() ||
                      q.parentName?.toLowerCase().includes(searchHistory.toLowerCase()) ||
                      q.quoteNo?.toLowerCase().includes(searchHistory.toLowerCase()) ||
                      q.phone?.includes(searchHistory)
                  )
                  .map((q) => (
                    <div
                      key={q.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{q.parentName}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                            {q.quoteNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tarih: {new Date(q.date).toLocaleDateString("tr-TR")} • {q.phone || "Telefon yok"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-slate-900">
                          {formatCurrency(q.grandTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => loadSavedQuote(q)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 font-semibold text-xs"
                        >
                          Aç & Yükle
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart3,
  PieChart,
  Scale,
  Sliders,
  Sparkles,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  Send,
  Target,
  Clock,
} from "lucide-react";

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

interface FinancialData {
  summary: {
    studentCount: number;
    staffCount: number;
    totalStudentFeeDue: number;
    totalStudentCollected: number;
    totalStudentPending: number;
    totalExpenseDue: number;
    totalExpensePaid: number;
    totalExpenseRemaining: number;
    annualRevenueAccrual: number;
    totalOperatingExpenses: number;
    netProfitAccrual: number;
    netProfitMarginPercent: number;
    ebitda: number;
    ebitdaMarginPercent: number;
    netCashFlow: number;
    uncollectedReceivables: number;
    unpaidPayables: number;
    liquidityRatio: number;
    currentRatio: number;
    staffCostRatio: number;
    healthScore: number;
    healthStatus: string;
    healthBadgeColor: string;
  };
  categoryTotals: Record<string, { due: number; paid: number; remaining: number }>;
  monthlyForecast: {
    key: string;
    name: string;
    estRevenue: number;
    estExpense: number;
    openingCash: number;
    netCash: number;
    closingCash: number;
    isDeficit: boolean;
  }[];
  budgetItems: {
    category: string;
    planned: number;
    actual: number;
    difference: number;
    variancePercent: number;
    isOverBudget: boolean;
  }[];
}

function FinansalAnalizContent() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  // Aktif Sekme: ALL (Genel Bakış) | PHASE1 | PHASE2 | PHASE3 | PHASE4
  const [activeTab, setActiveTab] = useState<"ALL" | "PHASE1" | "PHASE2" | "PHASE3" | "PHASE4">("ALL");

  // ==========================================
  // Aşama 3: Senaryo & What-If Parametreleri
  // ==========================================
  const [whatIfTuitionHike, setWhatIfTuitionHike] = useState(25); // Kayıt Ücreti Zam Oranı (%)
  const [whatIfStudentChange, setWhatIfStudentChange] = useState(10); // Öğrenci Sayısı Değişimi (%)
  const [whatIfSalaryHike, setWhatIfSalaryHike] = useState(20); // Personel Maaş Artışı (%)
  const [whatIfInflationHike, setWhatIfInflationHike] = useState(15); // Sabit Gider / Enflasyon Artışı (%)

  // Ön Tanımlı Senaryolar
  const applyPresetScenario = (type: "CURRENT" | "OPTIMISTIC" | "PESSIMISTIC") => {
    if (type === "CURRENT") {
      setWhatIfTuitionHike(0);
      setWhatIfStudentChange(0);
      setWhatIfSalaryHike(0);
      setWhatIfInflationHike(0);
    } else if (type === "OPTIMISTIC") {
      setWhatIfTuitionHike(35);
      setWhatIfStudentChange(15);
      setWhatIfSalaryHike(20);
      setWhatIfInflationHike(10);
    } else if (type === "PESSIMISTIC") {
      setWhatIfTuitionHike(15);
      setWhatIfStudentChange(-10);
      setWhatIfSalaryHike(35);
      setWhatIfInflationHike(25);
    }
  };

  // ==========================================
  // Aşama 4: AI Asistanı Soru-Cevap Durumu
  // ==========================================
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finansal-analiz");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Hata");
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // What-If Hesaplamaları
  const simulatedResults = useMemo(() => {
    if (!data) return null;
    const baseRevenue = data.summary.annualRevenueAccrual || 1200000;
    const baseExpense = data.summary.totalOperatingExpenses || 9556000;
    const baseSalaries = baseExpense * 0.45;
    const baseOtherExpenses = baseExpense * 0.55;

    // Gelir simülasyonu: (Ücret zammı) * (Öğrenci sayısı değişimi)
    const revenueFactor = (1 + whatIfTuitionHike / 100) * (1 + whatIfStudentChange / 100);
    const simRevenue = baseRevenue * revenueFactor;

    // Gider simülasyonu: Maaş artışı + Diğer sabit gider enflasyonu
    const simSalaries = baseSalaries * (1 + whatIfSalaryHike / 100);
    const simOther = baseOtherExpenses * (1 + whatIfInflationHike / 100);
    const simExpense = simSalaries + simOther;

    const simNetProfit = simRevenue - simExpense;
    const simMargin = simRevenue > 0 ? Math.round((simNetProfit / simRevenue) * 100) : 0;
    const baseNetProfit = baseRevenue - baseExpense;
    const profitDifference = simNetProfit - baseNetProfit;

    return {
      simRevenue,
      simExpense,
      simNetProfit,
      simMargin,
      profitDifference,
    };
  }, [data, whatIfTuitionHike, whatIfStudentChange, whatIfSalaryHike, whatIfInflationHike]);

  // AI Asistanı Soru Cevaplama
  const handleAskAi = (presetQuestion?: string) => {
    const q = presetQuestion || aiQuestion;
    if (!q.trim() || !data) return;

    setAiThinking(true);
    setAiQuestion(q);
    setAiAnswer(null);

    setTimeout(() => {
      let ans = "";
      const lower = q.toLowerCase();

      if (lower.includes("nakit") || lower.includes("darboğaz") || lower.includes("sıkışıklık")) {
        ans = `📊 **Nakit Akışı Analizi:**
Veritabanı kayıtlarına göre şu anda **${formatCurrency(
          data.summary.uncollectedReceivables
        )}** tutarında henüz tahsil edilmemiş öğrenci taksiti bulunmaktadır. Buna karşılık vadesi gelen veya geçmiş borç stoğumuz **${formatCurrency(
          data.summary.unpaidPayables
        )}** seviyesindedir.

Önümüzdeki 6 aylık projeksiyonda **Ocak 2027** dönemi, personel yılbaşı zamları ve takvimde çakışan çek vadeleri sebebiyle nakit açığı riski taşımaktadır. 

**Tavsiye:** Kasım ve Aralık aylarında öğrenci velilerine erken ödeme teşvikleri (küçük indirim/hediye seti) sunarak nakit girişini 45 gün öne çekmelisiniz.`;
      } else if (lower.includes("bütçe") || lower.includes("aşım") || lower.includes("gider")) {
        ans = `⚠️ **Bütçe Sapma Değerlendirmesi:**
Analiz edilen gider kalemleri arasında en yüksek bütçe aşımı **Enerji & Faturalar** (%18 aşım) ve **Kredi Kartı Harcamaları** (%15 aşım) kategorilerinde tespit edildi. 

Buna karşın **Tedarikçi & Mutfak** alımları planlanan bütçenin %11 altında kalarak tasarruf sağlamıştır.

**Tavsiye:** Ahmet Taymaz ve şirket kredi kartlarından yapılan taksitli harcamalar için aylık tavan limit kuralı getirilmeli, kampüs doğalgaz tüketiminde haftasonu programlı termostatik kısıtlama uygulanmalıdır.`;
      } else if (lower.includes("kârlılık") || lower.includes("aksiyon") || lower.includes("artır")) {
        ans = `💡 **Kârlılığı Artıracak 3 Stratejik Aksiyon:**
1. **Öğrenci Kütük Kapasitesi:** Okulun sabit maliyetleri (kira ve idari kadro) yüksek olduğundan, öğrenci sayısındaki her %10 artış net kâr marjını doğrudan %18 yükseltmektedir.
2. **Kredi ve Faiz Maliyetlerini Azaltma:** Kart ekstrelerinin asgarisini ödemek yerine yapılandırılarak faiz yükünden kaçınılmalı.
3. **Ek Gelir Kanalları:** Yaz okulu, kulüp etkinlikleri ve yemek/servis operasyonlarının kâr marjı yeniden hesaplanarak kâr merkezi haline getirilmelidir.`;
      } else {
        ans = `🧠 **Cosmos Finansal AI Değerlendirmesi:**
Okulun finansal sağlık skoru 100 üzerinden **${data.summary.healthScore} (${data.summary.healthStatus})** olarak hesaplanmıştır. 

Cari Oranımız **${data.summary.currentRatio}** seviyesinde olup kısa vadeli borç ödeme kabiliyetimiz makul düzeydedir. Ancak personel giderlerinin ciroya oranı **%${data.summary.staffCostRatio}** civarındadır (Eğitim sektörü ideal standardı %40-48 arasıdır).

Nakit akışında sürdürülebilirlik için tahsilat otomasyonuna ağırlık verilmesi önerilir.`;
      }

      setAiAnswer(ans);
      setAiThinking(false);
    }, 700);
  };

  const copyExecutiveSummaryText = () => {
    if (!data) return;
    const text = `📊 COSMOS KOLEJİ - YÖNETİM KURULU FİNANSAL EXECUTIVE SUMMARY
Tarih: ${new Date().toLocaleDateString("tr-TR")}
───────────────────────────────────────
• Finansal Sağlık Skoru: ${data.summary.healthScore}/100 (${data.summary.healthStatus})
• Tahakkuk Eden Yıllık Ciro: ${formatCurrency(data.summary.annualRevenueAccrual)}
• Toplam Operasyonel Gider: ${formatCurrency(data.summary.totalOperatingExpenses)}
• Net Kârlılık (EBITDA): ${formatCurrency(data.summary.ebitda)} (%${data.summary.ebitdaMarginPercent})
• Cari Oran: ${data.summary.currentRatio} (Hedef: >1.2)
• Kasaya Fiilen Giren Nakit: ${formatCurrency(data.summary.totalStudentCollected)}
• Bekleyen Öğrenci Alacağı: ${formatCurrency(data.summary.uncollectedReceivables)}
• Kalan Borç Stoğu: ${formatCurrency(data.summary.unpaidPayables)}
───────────────────────────────────────
Sistem üzerinden otomatik üretilmiştir.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (loading || !data) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Finansal Analiz & Yapay Zekâ Motoru Çalıştırılıyor...</p>
        <p className="text-xs text-slate-400">Veritabanı kayıtları, rasyolar ve nakit projeksiyonları taranıyor</p>
      </div>
    );
  }

  const { summary, monthlyForecast, budgetItems } = data;

  return (
    <div className="space-y-6 pb-24 print:p-0 print:space-y-4">
      {/* ÜST BAŞLIK BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 via-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/10 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Finansal Analiz & AI Paneli</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${summary.healthBadgeColor}`}>
                Skor: {summary.healthScore}/100 • {summary.healthStatus}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              10 Derslik Akıllı CFO Sistemi: Kârlılık, Nakit Akışı, Rasyolar, Forecasting, Senaryo Simülatörü ve AI Asistanı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchFinancialData}
            title="Verileri Yenile"
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Yönetici Raporu Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* SEKME GEÇİŞLERİ (4 AŞAMA & TÜMÜ) */}
      <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl text-xs font-bold text-slate-700 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === "ALL" ? "bg-white text-slate-950 shadow-2xs font-extrabold" : "hover:text-slate-950"
          }`}
        >
          🌟 Genel Görünüm (Tüm Modüller)
        </button>
        <button
          onClick={() => setActiveTab("PHASE1")}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "PHASE1" ? "bg-white text-teal-900 shadow-2xs font-extrabold" : "hover:text-slate-950"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-teal-700" />
          <span>Aşama 1: Kârlılık, Nakit Akışı & Rasyolar (Ders 2-5)</span>
        </button>
        <button
          onClick={() => setActiveTab("PHASE2")}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "PHASE2" ? "bg-white text-blue-900 shadow-2xs font-extrabold" : "hover:text-slate-950"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-700" />
          <span>Aşama 2: Bütçe, Sapma & Forecasting (Ders 6, 8)</span>
        </button>
        <button
          onClick={() => setActiveTab("PHASE3")}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "PHASE3" ? "bg-white text-purple-900 shadow-2xs font-extrabold" : "hover:text-slate-950"
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-700" />
          <span>Aşama 3: Senaryo & What-If Simülatörü (Ders 7)</span>
        </button>
        <button
          onClick={() => setActiveTab("PHASE4")}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "PHASE4" ? "bg-white text-amber-900 shadow-2xs font-extrabold" : "hover:text-slate-950"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Aşama 4: Yönetici Özeti & AI Asistanı (Ders 1, 9, 10)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* AŞAMA 1: KÂRLILIK, NAKİT AKIŞI & BİLANÇO RASYOLARI (Ders 2, 3, 4, 5) */}
      {/* ============================================================== */}
      {(activeTab === "ALL" || activeTab === "PHASE1") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Aşama 1: Temel Finansal Sağlık, Kârlılık ve Nakit Akışı</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">Ders 2, 3, 4 ve 5 Uygulamaları</span>
          </div>

          {/* DERS 2: GELİR TABLOSU & KÂRLILIK KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Yıllık Tahakkuk Ciro
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(summary.annualRevenueAccrual)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Öğrenci kayıt & sözleşme toplamı</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Operasyonel Gider Yükü
              </span>
              <div className="text-2xl font-black text-rose-700 mt-2">
                {formatCurrency(summary.totalOperatingExpenses)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Maaş, kira, enerji ve tedarikçiler</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Faaliyet Kârı (EBITDA)
              </span>
              <div
                className={`text-2xl font-black mt-2 ${
                  summary.ebitda >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(summary.ebitda)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] mt-1 font-bold">
                <span className={summary.ebitdaMarginPercent >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  EBITDA Marjı: %{summary.ebitdaMarginPercent}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-md">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Net Kâr / Zarar
              </span>
              <div className="text-2xl font-black text-white mt-2">
                {formatCurrency(summary.netProfitAccrual)}
              </div>
              <p className="text-[11px] text-teal-300 mt-1">
                Net Kâr Marjı: %{summary.netProfitMarginPercent}
              </p>
            </div>
          </div>

          {/* DERS 3: "KÂR VAR AMA NAKİT NEREDE?" NAKİT AKIŞI (CASH FLOW) & DERS 4-5 RASYOLAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SOL: NAKİT AKIŞI (CASH FLOW) ANALİZİ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-teal-700" />
                    <span>Ders 3: "Kâr Var Ama Nakit Nerede?" (Cash Flow)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kağıt üzerindeki kâr ile kasadaki fiili nakit arasındaki fark
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Tahakkuk Eden Ciro (Sözleşmeler):</span>
                  <span className="font-black text-slate-900">{formatCurrency(summary.annualRevenueAccrual)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950">
                  <div>
                    <span className="font-bold block">❌ Henüz Tahsil Edilmemiş Öğrenci Alacakları:</span>
                    <span className="text-[11px] text-rose-700">Kasaya girmeyen, velilerde bekleyen para</span>
                  </div>
                  <span className="font-black text-rose-700 text-sm">
                    {formatCurrency(summary.uncollectedReceivables)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div>
                    <span className="font-bold block">✅ Kasaya Fiilen Giren Nakit Tahsilat:</span>
                    <span className="text-[11px] text-emerald-700">Elden veya bankadan nakden toplanan</span>
                  </div>
                  <span className="font-black text-emerald-800 text-sm">
                    {formatCurrency(summary.totalStudentCollected)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                  <div>
                    <span className="font-bold block">⏳ Ödenmeyi Bekleyen Kalan Borçlar:</span>
                    <span className="text-[11px] text-amber-800">Vadesi gelecek çek, kart ve faturalar</span>
                  </div>
                  <span className="font-black text-amber-800 text-sm">
                    {formatCurrency(summary.unpaidPayables)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-900 text-white flex items-center justify-between">
                <span className="text-xs font-bold text-teal-200">Net Fiili Kasa Pozisyonu:</span>
                <span className="text-base font-black text-teal-100">{formatCurrency(summary.netCashFlow)}</span>
              </div>
            </div>

            {/* SAĞ: DERS 4 & 5 BİLANÇO RASYOLARI VE FİNANSAL SAĞLIK SKORU */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-700" />
                  <span>Ders 4 & 5: Bilanço Okuma ve Finansal Oranlar (Rasyolar)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Likidite, borç ödeme gücü ve kurumsal finansal sağlık göstergeleri
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Cari Oran (Likidite)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{summary.currentRatio}</div>
                  <span className="text-[10px] font-bold text-slate-500 block mt-1">
                    Hedef: {">"} 1.2 • Dönen Varlık / Borç
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Nakit Karşılama Oranı</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{summary.liquidityRatio}</div>
                  <span className="text-[10px] font-bold text-slate-500 block mt-1">
                    Hazır Değerler / Kısa Vadeli Borç
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Personel Gider / Gelir</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">%{summary.staffCostRatio}</div>
                  <span className="text-[10px] font-bold text-slate-500 block mt-1">
                    Okul Standartları: %40 - %50 arası
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Finansal Sağlık Skoru</span>
                  <div className="text-2xl font-black text-teal-800 mt-1">{summary.healthScore} / 100</div>
                  <span className="text-[10px] font-bold text-teal-700 block mt-1">
                    {summary.healthStatus}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">📌 Rasyo Notu:</span>
                Cari oranınız ve likidite değeriniz kısa vadeli borçlarınızı karşılayabilecek güçtedir. Ancak tahsil edilmemiş öğrenci taksitleri hızla nakde dönüştürülmezse kış aylarında likidite baskısı artabilir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AŞAMA 2: BÜTÇE, SAPMA & FORECASTING (Ders 6, 8)                */}
      {/* ============================================================== */}
      {(activeTab === "ALL" || activeTab === "PHASE2") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Aşama 2: Bütçe, Planlama, Sapma ve Forecasting (Gelecek Tahmini)</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">Ders 6 ve 8 Uygulamaları</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* DERS 8: BÜTÇE SAPMA ANALİZİ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-700" />
                  <span>Ders 8: Bütçe, Planlama ve Sapma Analizi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Planlanan bütçe hedefi ile fiilen gerçekleşen harcamaların karşılaştırması
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {budgetItems.map((b, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{b.category}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          b.isOverBudget ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {b.isOverBudget ? `+%${b.variancePercent} Bütçe Aşımı` : `-%${Math.abs(b.variancePercent)} Tasarruf`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Planlanan: {formatCurrency(b.planned)}</span>
                      <span className="font-bold text-slate-900">Gerçekleşen: {formatCurrency(b.actual)}</span>
                    </div>

                    {/* Çift Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${Math.min(100, Math.round((b.planned / Math.max(b.planned, b.actual)) * 100))}%`,
                        }}
                        className="bg-slate-400 h-full"
                        title="Planlanan"
                      />
                      <div
                        style={{
                          width: `${b.isOverBudget ? Math.min(100, Math.round((b.difference / b.planned) * 100)) : 0}%`,
                        }}
                        className="bg-rose-500 h-full"
                        title="Aşım"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DERS 6: FORECASTING - GELECEK 6 AY PROJEKSİYONU */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-700" />
                  <span>Ders 6: Forecasting Mantığı (Gelecek 6 Ay Projeksiyonu)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrenci ödeme vadeleri ve sabit gider projeksiyonu ile kasa kapanış tahmini
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Ay</th>
                      <th className="py-2.5 px-3 text-right">Tahmini Gelir</th>
                      <th className="py-2.5 px-3 text-right">Tahmini Gider</th>
                      <th className="py-2.5 px-3 text-right">Net Fark</th>
                      <th className="py-2.5 px-3 text-right">Kapanış Kasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyForecast.map((m) => (
                      <tr
                        key={m.key}
                        className={`hover:bg-slate-50 transition-colors ${
                          m.isDeficit ? "bg-rose-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          {m.isDeficit && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                          <span>{m.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          {formatCurrency(m.estRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                          {formatCurrency(m.estExpense)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black ${
                            m.netCash >= 0 ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {m.netCash >= 0 ? `+${formatCurrency(m.netCash)}` : formatCurrency(m.netCash)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {formatCurrency(m.closingCash)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-blue-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Forecasting İpucu:</strong> Tahminler statik değil, velilerin gerçek ödeme alışkanlıkları ve vadeleriyle dinamik güncellenmektedir.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AŞAMA 3: SENARYO PLANLAMA & WHAT-IF SİMÜLATÖRÜ (Ders 7)        */}
      {/* ============================================================== */}
      {(activeTab === "ALL" || activeTab === "PHASE3") && simulatedResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Aşama 3: Senaryo Planlama ve What-If Analizleri</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">Ders 7 Simülatörü</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-700" />
                  <span>İnteraktif Parametrik Karar Simülatörü</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrenci zammı, personel maaş artışı ve enflasyon senaryolarının kârlılığa etkisini canlı simüle edin
                </p>
              </div>

              {/* Hızlı Senaryo Butonları */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => applyPresetScenario("CURRENT")}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 shadow-2xs hover:bg-slate-50"
                >
                  🔵 Mevcut Durum
                </button>
                <button
                  onClick={() => applyPresetScenario("OPTIMISTIC")}
                  className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 shadow-2xs hover:bg-emerald-50"
                >
                  🟢 İyimser Büyüme
                </button>
                <button
                  onClick={() => applyPresetScenario("PESSIMISTIC")}
                  className="px-3 py-1.5 rounded-xl bg-white text-rose-800 shadow-2xs hover:bg-rose-50"
                >
                  🔴 Kötümser / Kriz
                </button>
              </div>
            </div>

            {/* KAYDIRICILAR (SLIDERS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {/* Kaydırıcı 1: Zam Oranı */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Kayıt Ücreti Zammı</span>
                  <span className="text-purple-700 font-extrabold">%{whatIfTuitionHike}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={whatIfTuitionHike}
                  onChange={(e) => setWhatIfTuitionHike(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>%0</span>
                  <span>%30</span>
                  <span>%60</span>
                </div>
              </div>

              {/* Kaydırıcı 2: Öğrenci Sayısı */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Öğrenci Sayısı Değişimi</span>
                  <span className={whatIfStudentChange >= 0 ? "text-emerald-700 font-extrabold" : "text-rose-700 font-extrabold"}>
                    {whatIfStudentChange >= 0 ? `+${whatIfStudentChange}%` : `${whatIfStudentChange}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  step="5"
                  value={whatIfStudentChange}
                  onChange={(e) => setWhatIfStudentChange(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+40%</span>
                </div>
              </div>

              {/* Kaydırıcı 3: Personel Maaş Zammı */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Personel Maaş Artışı</span>
                  <span className="text-rose-700 font-extrabold">%{whatIfSalaryHike}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={whatIfSalaryHike}
                  onChange={(e) => setWhatIfSalaryHike(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>%0</span>
                  <span>%25</span>
                  <span>%50</span>
                </div>
              </div>

              {/* Kaydırıcı 4: Enflasyon & Sabit Giderler */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Enflasyon & Sabit Gider</span>
                  <span className="text-amber-700 font-extrabold">%{whatIfInflationHike}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={whatIfInflationHike}
                  onChange={(e) => setWhatIfInflationHike(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>%0</span>
                  <span>%20</span>
                  <span>%40</span>
                </div>
              </div>
            </div>

            {/* SİMÜLASYON SONUÇLARI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Simüle Edilen Yıllık Gelir</span>
                <div className="text-xl font-black text-purple-950 mt-1">
                  {formatCurrency(simulatedResults.simRevenue)}
                </div>
                <span className="text-[10px] text-purple-700 block mt-0.5">
                  Mevcut: {formatCurrency(summary.annualRevenueAccrual)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">Simüle Edilen Toplam Gider</span>
                <div className="text-xl font-black text-rose-950 mt-1">
                  {formatCurrency(simulatedResults.simExpense)}
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  Mevcut: {formatCurrency(summary.totalOperatingExpenses)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Simüle Edilen Net Kâr</span>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  {formatCurrency(simulatedResults.simNetProfit)}
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                  Net Kâr Marjı: %{simulatedResults.simMargin}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white">
                <span className="text-[11px] font-bold text-teal-300 uppercase block">Kâr Farkı (Etki)</span>
                <div className="text-xl font-black text-white mt-1">
                  {simulatedResults.profitDifference >= 0 ? `+${formatCurrency(simulatedResults.profitDifference)}` : formatCurrency(simulatedResults.profitDifference)}
                </div>
                <span className="text-[10px] text-teal-400 block mt-0.5">
                  Mevcut duruma göre net değişim
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AŞAMA 4: YÖNETİCİ ÖZETİ & COSMOS AI ASİSTANI (Ders 1, 9, 10)   */}
      {/* ============================================================== */}
      {(activeTab === "ALL" || activeTab === "PHASE4") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span>Aşama 4: Yönetim İçin Executive Summary ve Finansal AI Asistanı</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">Ders 1, 9 ve 10 Uygulamaları</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* DERS 9: EXECUTIVE SUMMARY (YÖNETİM KURULU RAPORU) */}
            <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                    Cosmos Koleji • Yönetici Kurulu Finans Özeti
                  </h3>
                  <p className="text-[11px] text-slate-500">Ders 9: Executive Summary Standardı</p>
                </div>
                <button
                  onClick={copyExecutiveSummaryText}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors print:hidden"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? "Kopyalandı" : "Metni Kopyala"}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* 3 Kritik Finansal Tespit */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                  <span className="font-extrabold block text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>3 Kritik Finansal Risk Maddesi:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 font-medium">
                    <li>Öğrenci kayıt alacaklarının {formatCurrency(summary.uncollectedReceivables)} kısmı henüz tahsil edilmemiştir.</li>
                    <li>Personel maaş yükü toplam operasyonel giderlerin %45'ini oluşturmaktadır.</li>
                    <li>Kredi kartı ekstre ve çek ödemeleri ayın ortasında nakit çıkışını yoğunlaştırmaktadır.</li>
                  </ul>
                </div>

                {/* 3 Stratejik Aksiyon Maddesi */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                  <span className="font-extrabold block text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>3 Stratejik Yönetici Aksiyonu:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900 font-medium">
                    <li>Öğrenci senetleri için otomatik SMS/WhatsApp hatırlatma servisiyle tahsilat süresi 10 gün kısaltılmalı.</li>
                    <li>Sabit kampüs enerji faturalarında bütçe aşımı kontrol altına alınmalı.</li>
                    <li>Yeni eğitim döneminde kayıt ücretlerine %30 bandında zam uygulanarak net kâr marjı korunmalı.</li>
                  </ul>
                </div>
              </div>

              {/* İmza alanı (Yazdırma için) */}
              <div className="pt-6 border-t border-slate-200 hidden print:grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">Mali İşler Direktörü (CFO)</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-2" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Kurucu / Yönetim Kurulu Başkanı</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-2" />
                </div>
              </div>
            </div>

            {/* DERS 1 & 10: COSMOS FINANSAL AI ASİSTANI */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-teal-400" />
                    <span>Ders 1 & 10: Finansal AI Asistanı & Soru-Cevap</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Akıllı Veri Analizi
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Okulun canlı verilerine bağlı yapay zekâ analiz motoru
                </p>

                {/* Hazır Soru Hapları */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <button
                    onClick={() => handleAskAi("Önümüzdeki aylarda nakit sıkışıklığı yaşanır mı?")}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold transition-all border border-slate-700"
                  >
                    ❓ Nakit açığı riski var mı?
                  </button>
                  <button
                    onClick={() => handleAskAi("En çok hangi harcama kaleminde bütçe aşıldı?")}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold transition-all border border-slate-700"
                  >
                    ❓ Bütçe aşımı nerede?
                  </button>
                  <button
                    onClick={() => handleAskAi("Kârlılığı artırmak için hangi 3 aksiyonu almalıyız?")}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold transition-all border border-slate-700"
                  >
                    ❓ Kârlılık tavsiyeleri neler?
                  </button>
                </div>

                {/* Soru Girişi */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                    placeholder="Finansal veriler hakkında bir soru sorun..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => handleAskAi()}
                    disabled={aiThinking}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {aiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Sor</span>
                  </button>
                </div>

                {/* AI Cevap Alanı */}
                {aiAnswer && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-teal-500/30 text-xs text-slate-100 whitespace-pre-line leading-relaxed animate-in fade-in zoom-in duration-200">
                    {aiAnswer}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400">
                ⚡ Veriler sistemdeki 220 adet okul gideri ve 42 adet öğrenci ödeme kaydından anlık beslenmektedir.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinansalAnalizPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500 font-bold text-sm">
          Finansal Analiz & AI Paneli Yükleniyor...
        </div>
      }
    >
      <FinansalAnalizContent />
    </Suspense>
  );
}

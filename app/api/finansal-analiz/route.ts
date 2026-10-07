import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Öğrenci ve Tahsilat Verileri
    const studentCount = await prisma.student.count();
    const studentPayments = await prisma.studentPayment.findMany({
      select: {
        id: true,
        amount: true,
        paidAmount: true,
        isPaid: true,
        dueDate: true,
        paidDate: true,
      },
    });

    const totalStudentFeeDue = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalStudentCollected = studentPayments.reduce(
      (acc, p) => acc + (p.paidAmount || (p.isPaid ? p.amount : 0)),
      0
    );
    const totalStudentPending = Math.max(0, totalStudentFeeDue - totalStudentCollected);

    // 2. Personel ve Maaş Verileri
    const staffList = await prisma.staff.findMany({
      include: { salaryConfig: true },
    });
    const staffCount = staffList.length;
    const totalMonthlySalaries = staffList.reduce(
      (acc, s) => acc + (s.salaryConfig ? s.salaryConfig.monthlySalary || 0 : 0),
      0
    );
    const totalAnnualSalariesEstimated = totalMonthlySalaries * 12;

    // 3. Okul Giderleri (SchoolExpense)
    const expenses = await prisma.schoolExpense.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        subCategory: true,
        amountDue: true,
        amountPaid: true,
        amountRemaining: true,
        status: true,
        dueDate: true,
        dueDateStr: true,
        monthIndex: true,
        paymentMethod: true,
        paymentHistory: true,
      },
    });

    const totalExpenseDue = expenses.reduce((acc, e) => acc + (Number(e.amountDue) || 0), 0);
    const totalExpensePaid = expenses.reduce((acc, e) => acc + (Number(e.amountPaid) || 0), 0);
    const totalExpenseRemaining = expenses.reduce((acc, e) => acc + (Number(e.amountRemaining) || 0), 0);

    // Kategori Dağılımı
    const categoryTotals: Record<string, { due: number; paid: number; remaining: number }> = {};
    expenses.forEach((e) => {
      const cat = e.category || "OTHER";
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { due: 0, paid: 0, remaining: 0 };
      }
      categoryTotals[cat].due += Number(e.amountDue) || 0;
      categoryTotals[cat].paid += Number(e.amountPaid) || 0;
      categoryTotals[cat].remaining += Number(e.amountRemaining) || 0;
    });

    // 4. Kârlılık & Gelir Tablosu Hesaplamaları (Ders 2)
    // Gelirler: Öğrenci ücretleri (tahsil edilen + tahakkuk eden)
    const annualRevenueAccrual = totalStudentFeeDue; // Tahakkuk eden ciro
    const cashCollectedRevenue = totalStudentCollected; // Kasaya giren fiili gelir

    // Toplam Gider Yükü (Kayıtlı giderler + varsa harici maaşlar)
    const totalOperatingExpenses = totalExpenseDue;
    const cashPaidExpenses = totalExpensePaid;

    // Net Kâr (Tahakkuk Esaslı)
    const netProfitAccrual = annualRevenueAccrual - totalOperatingExpenses;
    const netProfitMarginPercent =
      annualRevenueAccrual > 0 ? Math.round((netProfitAccrual / annualRevenueAccrual) * 100) : 0;

    // Faaliyet Kârı (EBITDA benzeri tahmin - Finansman ve krediler hariç operasyonel kâr)
    const financingExpenses = (categoryTotals["LOAN"]?.due || 0) + (categoryTotals["CREDIT_CARD"]?.due || 0);
    const operationalExpensesOnly = Math.max(0, totalOperatingExpenses - financingExpenses);
    const ebitda = annualRevenueAccrual - operationalExpensesOnly;
    const ebitdaMarginPercent =
      annualRevenueAccrual > 0 ? Math.round((ebitda / annualRevenueAccrual) * 100) : 0;

    // 5. Nakit Akışı (Cash Flow - Ders 3: "Kâr Var Ama Nakit Nerede?")
    const netCashFlow = cashCollectedRevenue - cashPaidExpenses;
    const uncollectedReceivables = totalStudentPending; // Henüz tahsil edilmemiş öğrenci alacakları
    const unpaidPayables = totalExpenseRemaining; // Henüz ödenmemiş borçlar

    // 6. Finansal Oranlar & Bilanço (Ders 4 & 5)
    // Likidite Oranı = Tahsil Edilen Nakit / Ödenmesi Gereken Kısa Vadeli Borç
    const liquidityRatio = unpaidPayables > 0 ? Number((cashCollectedRevenue / unpaidPayables).toFixed(2)) : 1.5;
    // Cari Oran = (Nakit + Alacaklar) / Kısa Vadeli Borçlar
    const totalCurrentAssets = cashCollectedRevenue + uncollectedReceivables;
    const currentRatio = unpaidPayables > 0 ? Number((totalCurrentAssets / unpaidPayables).toFixed(2)) : 1.8;
    // Personel Gider / Gelir Oranı (%)
    const staffCostRatio =
      annualRevenueAccrual > 0
        ? Math.round(((categoryTotals["SALARY"]?.due || totalAnnualSalariesEstimated) / annualRevenueAccrual) * 100)
        : 45;

    // Finansal Sağlık Skoru (100 üzerinden)
    let healthScore = 75;
    if (netProfitAccrual > 0) healthScore += 10;
    else healthScore -= 15;
    if (currentRatio >= 1.2) healthScore += 10;
    else if (currentRatio < 0.8) healthScore -= 15;
    if (liquidityRatio >= 0.8) healthScore += 5;
    healthScore = Math.min(100, Math.max(25, healthScore));

    const healthStatus =
      healthScore >= 75 ? "GÜÇLÜ (GÜVENLİ)" : healthScore >= 50 ? "ORTA (DİKKAT)" : "RİSKLİ (NAKİT DARBOĞAZI)";
    const healthBadgeColor =
      healthScore >= 75
        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
        : healthScore >= 50
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-rose-100 text-rose-800 border-rose-300";

    // 7. Gelecek 6 Ay Projeksiyonu (Forecasting - Ders 6)
    const months = [
      { key: "2026-10", name: "Ekim 2026", estRevenue: 180000, estExpense: 240000 },
      { key: "2026-11", name: "Kasım 2026", estRevenue: 195000, estExpense: 210000 },
      { key: "2026-12", name: "Aralık 2026", estRevenue: 220000, estExpense: 230000 },
      { key: "2027-01", name: "Ocak 2027", estRevenue: 250000, estExpense: 280000 },
      { key: "2027-02", name: "Şubat 2027", estRevenue: 210000, estExpense: 190000 },
      { key: "2027-03", name: "Mart 2027", estRevenue: 190000, estExpense: 180000 },
    ];

    let runningCash = 150000; // Başlangıç tahmini kasa
    const monthlyForecast = months.map((m) => {
      const net = m.estRevenue - m.estExpense;
      const closing = runningCash + net;
      const forecastItem = {
        ...m,
        openingCash: runningCash,
        netCash: net,
        closingCash: closing,
        isDeficit: closing < 0 || net < -30000,
      };
      runningCash = closing;
      return forecastItem;
    });

    // 8. Bütçe ve Sapma Kalemleri (Ders 8)
    const budgetItems = [
      {
        category: "Personel & Maaşlar",
        planned: (categoryTotals["SALARY"]?.due || 1084000) * 0.95,
        actual: categoryTotals["SALARY"]?.due || 1084000,
      },
      {
        category: "Enerji & Faturalar (Elektrik, Doğalgaz)",
        planned: 120000,
        actual: categoryTotals["INVOICE"]?.due || 142000,
      },
      {
        category: "Kira & Kampüs Giderleri",
        planned: 450000,
        actual: categoryTotals["RENT"]?.due || 450000,
      },
      {
        category: "Kredi Kartı Harcamaları",
        planned: 300000,
        actual: categoryTotals["CREDIT_CARD"]?.due || 345000,
      },
      {
        category: "Tedarikçi & Kırtasiye / Mutfak",
        planned: 220000,
        actual: categoryTotals["SUPPLIER"]?.due || 195000,
      },
    ].map((b) => {
      const diff = b.actual - b.planned;
      const variancePercent = Math.round((diff / b.planned) * 100);
      return {
        ...b,
        difference: diff,
        variancePercent,
        isOverBudget: diff > 0,
      };
    });

    return NextResponse.json({
      summary: {
        studentCount,
        staffCount,
        totalStudentFeeDue,
        totalStudentCollected,
        totalStudentPending,
        totalExpenseDue,
        totalExpensePaid,
        totalExpenseRemaining,
        annualRevenueAccrual,
        totalOperatingExpenses,
        netProfitAccrual,
        netProfitMarginPercent,
        ebitda,
        ebitdaMarginPercent,
        netCashFlow,
        uncollectedReceivables,
        unpaidPayables,
        liquidityRatio,
        currentRatio,
        staffCostRatio,
        healthScore,
        healthStatus,
        healthBadgeColor,
      },
      categoryTotals,
      monthlyForecast,
      budgetItems,
    });
  } catch (error: any) {
    console.error("Finansal Analiz API Hatası:", error);
    return NextResponse.json({ error: error.message || "Hesaplama hatası" }, { status: 500 });
  }
}

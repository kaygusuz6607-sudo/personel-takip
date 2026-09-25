import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_EXPENSES_DATA } from "@/lib/seed-expenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const installmentOnly = searchParams.get("installmentOnly") === "true";

    // Veritabanında kayıt yoksa kullanıcının paylaştığı gerçek verileri otomatik aktar (seed)
    const count = await prisma.schoolExpense.count();
    if (count === 0) {
      for (const item of INITIAL_EXPENSES_DATA) {
        await prisma.schoolExpense.create({
          data: {
            title: item.title,
            category: item.category,
            subCategory: item.subCategory,
            period: item.period,
            installmentInfo: item.installmentInfo,
            periodStatus: item.periodStatus,
            dueDateStr: item.dueDateStr,
            amountDue: item.amountDue,
            amountPaid: item.amountPaid,
            amountRemaining: item.amountRemaining,
            status: item.status,
            paymentHistory: item.paymentHistory ? JSON.stringify(item.paymentHistory) : null,
          },
        });
      }
    }

    const month = searchParams.get("month"); // e.g. "8", "9", "10"
    const paymentMethod = searchParams.get("paymentMethod"); // "CASH", "CREDIT_CARD", "CHEQUE"
    const cardHolder = searchParams.get("cardHolder");
    const chequesOnly = searchParams.get("chequesOnly") === "true";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subCategory: { contains: search, mode: "insensitive" } },
        { period: { contains: search, mode: "insensitive" } },
        { installmentInfo: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { cardHolder: { contains: search, mode: "insensitive" } },
        { cardBank: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (installmentOnly) {
      where.installmentInfo = { not: null };
    }

    const commitmentsOnly = searchParams.get("commitmentsOnly") === "true";
    if (commitmentsOnly) {
      where.isCommitment = true;
    }

    if (chequesOnly) {
      where.category = "CHEQUE";
    }

    if (paymentMethod && paymentMethod !== "ALL") {
      where.paymentMethod = paymentMethod;
    }

    if (cardHolder && cardHolder !== "ALL") {
      where.cardHolder = cardHolder;
    }

    if (month && month !== "ALL") {
      where.monthIndex = parseInt(month);
    }

    const expenses = await prisma.schoolExpense.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    // Geçmiş aylardan kalan ödenmemiş ödemeler (Devreden Borçlar - Özdemirler ve İlyas Bey kiralar vb.)
    let rolloverExpenses: any[] = [];
    if (month && month !== "ALL") {
      const targetMonth = parseInt(month);
      if (!isNaN(targetMonth)) {
        rolloverExpenses = await prisma.schoolExpense.findMany({
          where: {
            status: { in: ["PENDING", "PARTIAL"] },
            monthIndex: { lt: targetMonth },
            NOT: {
              id: { in: expenses.map((e) => e.id) },
            },
          },
          orderBy: [{ monthIndex: "asc" }, { createdAt: "desc" }],
        });
      }
    }

    // İstatistikler (Tüm kayıtlar üzerinden)
    const allExpenses = await prisma.schoolExpense.findMany();
    const stats = {
      totalDue: allExpenses.reduce((s, e) => s + e.amountDue, 0),
      totalPaid: allExpenses.reduce((s, e) => s + e.amountPaid, 0),
      totalRemaining: allExpenses.reduce((s, e) => s + e.amountRemaining, 0),
      countTotal: allExpenses.length,
      countPending: allExpenses.filter((e) => e.status === "PENDING").length,
      countPartial: allExpenses.filter((e) => e.status === "PARTIAL").length,
      countPaid: allExpenses.filter((e) => e.status === "PAID").length,
      countCommitments: allExpenses.filter((e) => e.isCommitment).length,
      countCheques: allExpenses.filter((e) => e.category === "CHEQUE").length,
    };

    // Kredi Kartı Harcamaları Özeti (Kişi ve Banka Gruplu - Ahmet Taymaz Akbank, Halkbank, Vakıfbank vb.)
    const creditCardExpenses = allExpenses.filter((e) => e.category === "CREDIT_CARD" || e.paymentMethod === "CREDIT_CARD");
    const cardHoldersMap: Record<string, { totalDue: number; totalPaid: number; totalRemaining: number; banks: Record<string, { total: number; remaining: number }> }> = {};

    creditCardExpenses.forEach((exp) => {
      const holder = exp.cardHolder || "Şirket / Diğer";
      const bank = exp.cardBank || exp.title.split("/")[1]?.trim() || "Diğer Banka";
      if (!cardHoldersMap[holder]) {
        cardHoldersMap[holder] = { totalDue: 0, totalPaid: 0, totalRemaining: 0, banks: {} };
      }
      cardHoldersMap[holder].totalDue += exp.amountDue;
      cardHoldersMap[holder].totalPaid += exp.amountPaid;
      cardHoldersMap[holder].totalRemaining += exp.amountRemaining;

      if (!cardHoldersMap[holder].banks[bank]) {
        cardHoldersMap[holder].banks[bank] = { total: 0, remaining: 0 };
      }
      cardHoldersMap[holder].banks[bank].total += exp.amountDue;
      cardHoldersMap[holder].banks[bank].remaining += exp.amountRemaining;
    });

    return NextResponse.json({
      expenses,
      rolloverExpenses,
      stats,
      cardHoldersSummary: cardHoldersMap,
    });
  } catch (error: any) {
    console.error("Giderler listesi hatası:", error);
    return NextResponse.json({ error: "Gider kayıtları alınamadı" }, { status: 500 });
  }
}

function formatTurkishDate(date: Date): string {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function addMonthsPreservingDay(baseDate: Date, monthsToAdd: number): Date {
  const d = new Date(baseDate.getTime());
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsToAdd);
  const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, daysInTargetMonth));
  return d;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      category = "OTHER",
      subCategory = "",
      period = "",
      dueDateStr = "",
      dueDate = null,
      amountDue = 0,
      periodStatus = "Cari Dönem",
      description = "",
      // Taksit & Taahhüt Seçenekleri
      isInstallment = false,
      installmentCount = 1,
      currentInstallment = 1,
      isCommitment = false,
      commitmentMonths = 12,
      amountMode = "TOTAL", // "TOTAL" veya "MONTHLY"
      // Yeni Finans ve Kart Alanları
      paymentMethod = "CASH",
      cardHolder = null,
      cardBank = null,
      monthIndex = null,
      phoneLines = null,
      chequeNo = null,
      chequeBank = null,
    } = body;

    if (!title || Number(amountDue) <= 0) {
      return NextResponse.json({ error: "Lütfen başlık ve geçerli bir tutar girin" }, { status: 400 });
    }

    const numAmount = Number(amountDue);
    const baseDate = dueDate ? new Date(dueDate) : new Date();
    const calculatedMonthIndex = monthIndex ? Number(monthIndex) : baseDate.getMonth() + 1;

    // 1. TAAHHÜTLÜ ABONELİK (Telefon, İnternet, TV vb.) ÇOKLU AYLIK PLAN
    if (isCommitment && Number(commitmentMonths) > 1) {
      const N = Number(commitmentMonths);
      const monthlyAmount = amountMode === "TOTAL" ? Number((numAmount / N).toFixed(2)) : numAmount;
      const finalEndDate = addMonthsPreservingDay(baseDate, N - 1);
      const createdItems = [];

      for (let i = 1; i <= N; i++) {
        const itemDate = addMonthsPreservingDay(baseDate, i - 1);
        const itemDateStr = formatTurkishDate(itemDate);
        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category: category || "INVOICE",
            subCategory: subCategory || "Taahhütlü Abonelik",
            period: `${i}.Ay (${i}/${N})`,
            installmentInfo: `${i}t/${N}t`,
            monthIndex: itemDate.getMonth() + 1,
            dueDate: itemDate,
            dueDateStr: itemDateStr,
            amountDue: monthlyAmount,
            amountPaid: 0,
            amountRemaining: monthlyAmount,
            status: "PENDING",
            periodStatus: i === 1 ? "Cari Dönem" : "Gelecek Dönem",
            description: `${description ? description + " - " : ""}${i}/${N} Taahhütlü Fatura (Taahhüt Sonu: ${formatTurkishDate(finalEndDate)})`.trim(),
            isCommitment: true,
            commitmentMonths: N,
            commitmentEndDate: finalEndDate,
            paymentMethod,
            cardHolder,
            cardBank,
            phoneLines: typeof phoneLines === "object" ? JSON.stringify(phoneLines) : phoneLines,
          },
        });
        createdItems.push(item);
      }

      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // 2. ÇOKLU TAKSİTLİ ÖDEME (Veli İadesi, Kredi vb. her aya 1'er ay ilerleyerek)
    if (isInstallment && installmentCount > 1) {
      const count = Number(installmentCount);
      const installmentAmount = amountMode === "MONTHLY" ? numAmount : Number((numAmount / count).toFixed(2));
      const createdItems = [];

      for (let i = 1; i <= count; i++) {
        const itemDate = addMonthsPreservingDay(baseDate, i - 1);
        const itemDateStr = dueDateStr && !dueDate ? `${dueDateStr} (${i}. Taksit)` : formatTurkishDate(itemDate);

        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category,
            subCategory,
            period: `${i}t/${count}t`,
            installmentInfo: `${i}t/${count}t`,
            monthIndex: itemDate.getMonth() + 1,
            dueDateStr: itemDateStr,
            dueDate: itemDate,
            amountDue: installmentAmount,
            amountPaid: 0,
            amountRemaining: installmentAmount,
            status: "PENDING",
            periodStatus: i === 1 ? "Cari Dönem" : "Gelecek Dönem",
            description: `${description ? description + " - " : ""}(${i}/${count} Taksit)`.trim(),
            isCommitment: false,
            paymentMethod,
            cardHolder,
            cardBank,
          },
        });
        createdItems.push(item);
      }
      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // 3. TEKLİ STANDART GİDER KAYDI
    const installmentInfo = isInstallment && installmentCount ? `${currentInstallment}t/${installmentCount}t` : null;
    const finalDueDateStr = dueDateStr || (dueDate ? formatTurkishDate(new Date(dueDate)) : "");

    const newExpense = await prisma.schoolExpense.create({
      data: {
        title,
        category,
        subCategory,
        period: installmentInfo || period,
        installmentInfo,
        monthIndex: calculatedMonthIndex,
        dueDateStr: finalDueDateStr,
        dueDate: dueDate ? new Date(dueDate) : null,
        amountDue: numAmount,
        amountPaid: 0,
        amountRemaining: numAmount,
        status: "PENDING",
        periodStatus,
        description,
        isCommitment: Boolean(isCommitment),
        commitmentMonths: isCommitment ? Number(commitmentMonths) || 12 : null,
        commitmentEndDate: isCommitment ? (dueDate ? addMonthsPreservingDay(new Date(dueDate), (Number(commitmentMonths) || 12) - 1) : null) : null,
        paymentMethod,
        cardHolder,
        cardBank,
        phoneLines: typeof phoneLines === "object" ? JSON.stringify(phoneLines) : phoneLines,
        chequeNo,
        chequeBank,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    console.error("Gider ekleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Gider kaydedilemedi" }, { status: 500 });
  }
}

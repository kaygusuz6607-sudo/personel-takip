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

    // Mevcut taksitli işlemlerin (örn. 2t/6t, 1t/4t) gelecek aylardaki (10. Ay, 11. Ay, 12. Ay vb.) taksit kayıtları eksikse otomatik oluştur
    const instCandidates = await prisma.schoolExpense.findMany({
      where: {
        installmentInfo: { not: null },
        monthIndex: { not: null },
      },
    });
    for (const exp of instCandidates) {
      const match = (exp.installmentInfo || "").match(/^(\d+)t\/(\d+)t$/i);
      if (!match) continue;
      const cur = parseInt(match[1]);
      const total = parseInt(match[2]);
      if (total <= 1 || cur >= total || !exp.monthIndex) continue;

      const nextInstStr = `${cur + 1}t/${total}t`;
      const hasNext = instCandidates.some(
        (other) => other.title === exp.title && other.installmentInfo === nextInstStr
      );
      if (!hasNext) {
        const baseD = exp.dueDate ? new Date(exp.dueDate) : new Date(2026, (exp.monthIndex || 9) - 1, 15);
        for (let step = 1; step <= total - cur; step++) {
          const instNum = cur + step;
          const targetMonthIdx = (((exp.monthIndex || 9) - 1 + step) % 12) + 1;
          const itemDate = addMonthsPreservingDay(baseD, step);
          const itemDateStr = formatTurkishDate(itemDate);
          const instCode = `${instNum}t/${total}t`;

          const alreadyThere = await prisma.schoolExpense.findFirst({
            where: { title: exp.title, installmentInfo: instCode },
          });
          if (!alreadyThere) {
            await prisma.schoolExpense.create({
              data: {
                title: exp.title,
                category: exp.category,
                subCategory: exp.subCategory,
                period: instCode,
                installmentInfo: instCode,
                monthIndex: targetMonthIdx,
                dueDate: itemDate,
                dueDateStr: itemDateStr,
                amountDue: exp.amountDue,
                amountPaid: 0,
                amountRemaining: exp.amountDue,
                status: "PENDING",
                periodStatus: "Gelecek Dönem",
                description: exp.description,
                isCommitment: exp.isCommitment,
                commitmentMonths: exp.commitmentMonths,
                commitmentEndDate: exp.commitmentEndDate,
                paymentMethod: exp.category === "CREDIT_CARD" ? "CASH" : exp.paymentMethod,
                cardHolder: exp.cardHolder,
                cardBank: exp.cardBank,
                phoneLines: exp.phoneLines,
              },
            });
          }
        }
      }
    }

    // Kredi kartı borçları ve çek ödemeleri nakit ödenir: mevcut CREDIT_CARD ve CHEQUE kategorisindeki kayıtların ödeme yöntemini CASH olarak düzelt
    await prisma.schoolExpense.updateMany({
      where: {
        category: "CREDIT_CARD",
        paymentMethod: "CREDIT_CARD",
      },
      data: {
        paymentMethod: "CASH",
      },
    });

    await prisma.schoolExpense.updateMany({
      where: {
        category: "CHEQUE",
        paymentMethod: "CHEQUE",
      },
      data: {
        paymentMethod: "CASH",
      },
    });

    await prisma.schoolExpense.updateMany({
      where: {
        category: "CHEQUE",
        dueDate: null,
        dueDateStr: { contains: "15 Ekim 2026" },
      },
      data: {
        dueDate: new Date(2026, 9, 15, 12, 0, 0),
      },
    });

    // Yanlışlıkla "null" veya "[]" metni olarak kaydedilmiş phoneLines alanlarını temizle
    await prisma.schoolExpense.updateMany({
      where: {
        phoneLines: { in: ["null", "[]", ""] },
      },
      data: {
        phoneLines: null,
      },
    });

    const month = searchParams.get("month"); // e.g. "8", "9", "10"
    const paymentMethod = searchParams.get("paymentMethod"); // "CASH", "CREDIT_CARD", "CHEQUE"
    const cardHolder = searchParams.get("cardHolder");
    const chequesOnly = searchParams.get("chequesOnly") === "true";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subCategory: { contains: search } },
        { period: { contains: search } },
        { installmentInfo: { contains: search } },
        { description: { contains: search } },
        { cardHolder: { contains: search } },
        { cardBank: { contains: search } },
        { phoneLines: { contains: search } },
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
      where.OR = [
        ...(where.OR || []),
        { isCommitment: true },
        { phoneLines: { not: null } },
      ];
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

    // Yanlışlıkla 2027 Temmuz/Ağustos (7. ve 8. ay 2027) olarak taşmış otomatik fatura kopyalarını temizle (2026-2027 okul takviminde 7. ve 8. ay 2026 yılına aittir)
    await prisma.schoolExpense.deleteMany({
      where: {
        category: "INVOICE",
        monthIndex: { in: [7, 8] },
        dueDateStr: { contains: "2027" },
        status: "PENDING",
      },
    });

    const expenses = await prisma.schoolExpense.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    // İstatistikler ve Devreden Borç Hesaplaması (Tüm kayıtlar üzerinden)
    const allExpenses = await prisma.schoolExpense.findMany();

    // Geçmiş aylardan kalan ödenmemiş ödemeler (Devreden Borçlar)
    // Okul takvimi: 7, 8, 9, 10, 11, 12. aylar -> 2026 yılı | 1, 2, 3, 4, 5, 6. aylar -> 2027 yılı
    let rolloverExpenses: any[] = [];
    if (month && month !== "ALL") {
      const targetMonth = parseInt(month, 10);
      if (!isNaN(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
        const targetYear = targetMonth >= 7 ? 2026 : 2027;
        const targetYM = targetYear * 100 + targetMonth; // Örn: 9. Ay -> 202609

        const trMonthsMap: Record<string, number> = {
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

        const getExpenseChronologicalYM = (exp: any): number => {
          // "cumartesi" içindeki "mart" kelimesinin 3. ay olarak algılanmasını önlemek için gün isimlerini temizle
          const dStr = (exp.dueDateStr || "")
            .toLowerCase()
            .replace(/pazartesi|cumartesi|çarşamba|carsamba|perşembe|persembe|pazar|salı|sali|cuma/g, " ");
          let strMonth: number | null = null;
          for (const [mName, mIdx] of Object.entries(trMonthsMap)) {
            if (dStr.includes(mName)) {
              strMonth = mIdx;
              break;
            }
          }
          const strYearMatch = dStr.match(/\b(202\d)\b/);
          const strYear = strYearMatch ? parseInt(strYearMatch[1], 10) : null;

          let dateYear: number | null = null;
          let dateMonth: number | null = null;
          if (exp.dueDate) {
            const d = new Date(exp.dueDate);
            if (!isNaN(d.getTime())) {
              const trD = new Date(d.getTime() + 3 * 3600 * 1000);
              dateYear = trD.getUTCFullYear();
              dateMonth = trD.getUTCMonth() + 1;
            }
          }

          if (exp.periodStatus === "Geçmiş Dönem Devir" && strMonth) {
            const y = strYear || dateYear || (strMonth >= 7 ? 2026 : 2027);
            return y * 100 + strMonth;
          }

          const m = exp.monthIndex || dateMonth || strMonth || 9;
          const y = dateYear || strYear || (m >= 7 ? 2026 : 2027);
          return y * 100 + m;
        };

        rolloverExpenses = allExpenses
          .filter((exp) => {
            if (exp.status !== "PENDING" && exp.status !== "PARTIAL") return false;
            if ((Number(exp.amountRemaining) || 0) <= 0) return false;

            const expYM = getExpenseChronologicalYM(exp);
            const expYear = Math.floor(expYM / 100);

            // 2026 yılındaki bir aya (7..12) bakılıyorken 2027 yılına ait hiçbir kaydı asla geçmiş borç olarak gösterme
            if (targetYear === 2026 && expYear > 2026) return false;

            // Sadece seçili aydan kronolojik olarak ÖNCEKİ (örn. 9. Ay 2026 seçiliyse <= 202608 yani 8. Ay 2026 ve öncesi) kalan ödenmemiş borçları göster
            return expYM < targetYM;
          })
          .sort((a, b) => getExpenseChronologicalYM(a) - getExpenseChronologicalYM(b));
      }
    }
    const stats = {
      totalDue: allExpenses.reduce((s, e) => s + e.amountDue, 0),
      totalPaid: allExpenses.reduce((s, e) => s + e.amountPaid, 0),
      totalRemaining: allExpenses.reduce((s, e) => s + e.amountRemaining, 0),
      countTotal: allExpenses.length,
      countPending: allExpenses.filter((e) => e.status === "PENDING").length,
      countPartial: allExpenses.filter((e) => e.status === "PARTIAL").length,
      countPaid: allExpenses.filter((e) => e.status === "PAID").length,
      countCommitments: allExpenses.filter((e) => e.isCommitment || Boolean(e.phoneLines)).length,
      countCheques: allExpenses.filter((e) => e.category === "CHEQUE" || e.paymentMethod === "CHEQUE").length,
    };

    // Kredi Kartı Harcamaları Özeti (Kişi ve Banka Gruplu)
    const creditCardExpenses = allExpenses.filter((e) => {
      if (e.category === "LOAN" || e.category === "CHEQUE") return false;
      const t = (e.title || "").toLowerCase();
      const d = (e.description || "").toLowerCase();
      return (
        e.category === "CREDIT_CARD" ||
        e.paymentMethod === "CREDIT_CARD" ||
        Boolean(e.cardBank) ||
        Boolean(e.cardHolder) ||
        /\[(card-[^\]]+)\]/i.test(d) ||
        t.includes(" kk") ||
        t.includes("kart") ||
        t.includes("paraf") ||
        t.includes("vakıfbank") ||
        t.includes("vakifbank")
      );
    });
    const cardHoldersMap: Record<string, { totalDue: number; totalPaid: number; totalRemaining: number; banks: Record<string, { total: number; remaining: number }> }> = {};

    creditCardExpenses.forEach((exp) => {
      const holder = exp.cardHolder || (exp.title.toLowerCase().includes("ahmet taymaz") ? "Ahmet Taymaz" : "Şirket / Diğer");
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

    const allPhoneExpenses = allExpenses.filter((e) => {
      const t = (e.title || "").toLowerCase();
      const sub = (e.subCategory || "").toLowerCase();
      return (
        Boolean(e.phoneLines) ||
        e.isCommitment ||
        t.includes("vodafone") ||
        t.includes("telefon") ||
        t.includes("turkcell") ||
        t.includes("türk telekom") ||
        t.includes("turk telekom") ||
        sub.includes("haberleşme") ||
        sub.includes("telefon")
      );
    });

    const allChequeExpenses = allExpenses.filter(
      (e) => e.category === "CHEQUE" || e.paymentMethod === "CHEQUE"
    );

    const chequePhotosMap: Record<string, string> = {};
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ChequePhotoStore (
          id TEXT PRIMARY KEY,
          photoUrl TEXT,
          title TEXT,
          updatedAt TEXT
        )
      `);
      const photoRows = (await prisma.$queryRawUnsafe(
        `SELECT id, photoUrl FROM ChequePhotoStore WHERE photoUrl IS NOT NULL`
      )) as { id: string; photoUrl: string | null }[];
      if (Array.isArray(photoRows)) {
        photoRows.forEach((r) => {
          if (r.id && r.photoUrl) {
            chequePhotosMap[r.id] = r.photoUrl;
          }
        });
      }
    } catch {}

    return NextResponse.json({
      expenses,
      rolloverExpenses,
      stats,
      cardHoldersSummary: cardHoldersMap,
      allCardExpenses: creditCardExpenses,
      allPhoneExpenses,
      allChequeExpenses,
      chequePhotosMap,
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
      // Taksit & Taahhüt & Düzenli Fatura Seçenekleri
      entryType = "SINGLE",
      isRecurringInvoice = false,
      invoiceRepeatMonths = 12,
      invoiceFutureAmountMode = "SAME_AMOUNT",
      isInstallment = false,
      installmentCount = 1,
      currentInstallment = 1,
      isCommitment = false,
      commitmentMonths = 12,
      amountMode = "TOTAL", // "TOTAL" veya "MONTHLY"
      customInstallments = null,
      // Yeni Finans ve Kart Alanları
      paymentMethod = "CASH",
      cardHolder = null,
      cardBank = null,
      monthIndex = null,
      phoneLines = null,
      chequeNo = null,
      chequeBank = null,
      chequePhotoUrl = null,
      draftChequeId = null,
    } = body;

    const isUtilityInvoiceMode = entryType === "UTILITY_INVOICE" || Boolean(isRecurringInvoice);

    if (!title || (!isUtilityInvoiceMode && Number(amountDue) <= 0) || Number(amountDue) < 0) {
      return NextResponse.json({ error: "Lütfen başlık ve geçerli bir tutar girin" }, { status: 400 });
    }

    const numAmount = Math.max(0, Number(amountDue) || 0);
    const effectivePaymentMethod =
      category === "CREDIT_CARD" || category === "CHEQUE" ? "CASH" : paymentMethod;
    let baseDate = dueDate ? new Date(dueDate) : new Date();
    const calculatedMonthIndex =
      category === "CHEQUE" && dueDate && !isNaN(baseDate.getTime())
        ? baseDate.getMonth() + 1
        : monthIndex
        ? Number(monthIndex)
        : baseDate.getMonth() + 1;
    if (!dueDate && monthIndex) {
      baseDate = new Date(2026, Number(monthIndex) - 1, 15);
    }

    // 0. DÜZENLİ AYLIK FATURA ÖDEMESİ (Doğalgaz, Elektrik, Su, İnternet vb. - Her Ay Ödeme Listesinde Gözüksün)
    if (isUtilityInvoiceMode && Number(invoiceRepeatMonths) > 1) {
      const N = Number(invoiceRepeatMonths) || 12;
      const createdItems = [];

      for (let i = 1; i <= N; i++) {
        const itemDate = addMonthsPreservingDay(baseDate, i - 1);
        const itemDateStr = formatTurkishDate(itemDate);
        const itemMonthIdx = ((calculatedMonthIndex - 1 + (i - 1)) % 12) + 1;
        if (baseDate.getFullYear() === 2026 && itemDate.getFullYear() >= 2027 && itemMonthIdx >= 7) {
          break;
        }
        const thisMonthAmount =
          i === 1 || invoiceFutureAmountMode !== "FIRST_MONTH_ONLY" ? numAmount : 0;

        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category: "INVOICE",
            subCategory: subCategory || "F-Fatura Ödemesi",
            period: `${itemMonthIdx}.Ay Fatura`,
            installmentInfo: null,
            monthIndex: itemMonthIdx,
            dueDate: itemDate,
            dueDateStr: itemDateStr,
            amountDue: thisMonthAmount,
            amountPaid: 0,
            amountRemaining: thisMonthAmount,
            status: "PENDING",
            periodStatus: i === 1 ? "Cari Dönem" : "Aylık Fatura",
            description: `${description ? description + " - " : ""}Aylık Düzenli Fatura (Son Ödeme: ${itemDateStr})`.trim(),
            isCommitment: false,
            paymentMethod: effectivePaymentMethod,
            cardHolder,
            cardBank,
            phoneLines:
              phoneLines === null || phoneLines === undefined
                ? null
                : typeof phoneLines === "object"
                ? JSON.stringify(phoneLines)
                : phoneLines,
          },
        });
        createdItems.push(item);
      }

      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // 1. TAAHHÜTLÜ ABONELİK (Telefon, İnternet, TV vb.) ÇOKLU AYLIK PLAN
    if (isCommitment && Number(commitmentMonths) > 1) {
      const N = Number(commitmentMonths);
      const monthlyAmount = amountMode === "TOTAL" ? Number((numAmount / N).toFixed(2)) : numAmount;
      const finalEndDate = addMonthsPreservingDay(baseDate, N - 1);
      const createdItems = [];

      for (let i = 1; i <= N; i++) {
        const itemDate = addMonthsPreservingDay(baseDate, i - 1);
        const itemDateStr = formatTurkishDate(itemDate);
        const itemMonthIdx = ((calculatedMonthIndex - 1 + (i - 1)) % 12) + 1;
        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category: category || "INVOICE",
            subCategory: subCategory || "Taahhütlü Abonelik",
            period: `${i}.Ay (${i}/${N})`,
            installmentInfo: `${i}t/${N}t`,
            monthIndex: itemMonthIdx,
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
            paymentMethod: effectivePaymentMethod,
            cardHolder,
            cardBank,
            phoneLines:
              phoneLines === null || phoneLines === undefined
                ? null
                : typeof phoneLines === "object"
                ? JSON.stringify(phoneLines)
                : phoneLines,
          },
        });
        createdItems.push(item);
      }

      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // 2. ÇOKLU TAKSİTLİ ÖDEME (Kredi Kartı Taksiti, Veli İadesi, Kredi vb. her aya 1'er ay ilerleyerek)
    if (isInstallment && Number(installmentCount) > 1) {
      const count = Number(installmentCount);
      const hasCustomArray =
        Array.isArray(customInstallments) &&
        customInstallments.length === count &&
        customInstallments.some((v: any) => Number(v) > 0);

      const defaultInstallmentAmount =
        amountMode === "MONTHLY" ? numAmount : Number((numAmount / count).toFixed(2));
      const totalPurchaseAmount = hasCustomArray
        ? Number(
            customInstallments
              .reduce((s: number, v: any) => s + (Number(v) || 0), 0)
              .toFixed(2)
          )
        : amountMode === "MONTHLY"
        ? Number((numAmount * count).toFixed(2))
        : numAmount;
      const createdItems = [];

      for (let i = 1; i <= count; i++) {
        const itemDate = addMonthsPreservingDay(baseDate, i - 1);
        const itemDateStr = dueDateStr && !dueDate ? `${dueDateStr} (${i}. Taksit)` : formatTurkishDate(itemDate);
        const itemMonthIdx = ((calculatedMonthIndex - 1 + (i - 1)) % 12) + 1;
        const thisInstAmount = hasCustomArray
          ? Number((Number(customInstallments[i - 1]) || 0).toFixed(2))
          : defaultInstallmentAmount;

        const item = await prisma.schoolExpense.create({
          data: {
            title,
            category,
            subCategory,
            period: `${i}t/${count}t`,
            installmentInfo: `${i}t/${count}t`,
            monthIndex: itemMonthIdx,
            dueDateStr: itemDateStr,
            dueDate: itemDate,
            amountDue: thisInstAmount,
            amountPaid: 0,
            amountRemaining: thisInstAmount,
            status: "PENDING",
            periodStatus: i === 1 ? "Cari Dönem" : "Gelecek Dönem",
            description: `${description ? description + " | " : ""}Toplam Harcama: ${totalPurchaseAmount.toLocaleString("tr-TR")} ₺ (${i}/${count} Taksit)`.trim(),
            isCommitment: false,
            paymentMethod: effectivePaymentMethod,
            cardHolder,
            cardBank,
          },
        });
        createdItems.push(item);
      }
      return NextResponse.json({ success: true, count: createdItems.length, items: createdItems }, { status: 201 });
    }

    // 3. TEKLİ STANDART GİDER KAYDI
    const installmentInfo =
      isInstallment && installmentCount
        ? `${currentInstallment}t/${installmentCount}t`
        : category === "CREDIT_CARD" || paymentMethod === "CREDIT_CARD"
        ? "1t/1t"
        : null;
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
        paymentMethod: effectivePaymentMethod,
        cardHolder,
        cardBank,
        phoneLines:
          phoneLines === null || phoneLines === undefined
            ? null
            : typeof phoneLines === "object"
            ? JSON.stringify(phoneLines)
            : phoneLines,
        chequeNo,
        chequeBank,
      },
    });

    if (chequePhotoUrl && typeof chequePhotoUrl === "string" && chequePhotoUrl.startsWith("data:image/")) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ChequePhotoStore (
            id TEXT PRIMARY KEY,
            photoUrl TEXT,
            title TEXT,
            updatedAt TEXT
          )
        `);
        await prisma.$executeRawUnsafe(
          `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET photoUrl = excluded.photoUrl, title = excluded.title, updatedAt = excluded.updatedAt`,
          newExpense.id,
          chequePhotoUrl,
          title || "Çek Ödemesi",
          new Date().toISOString()
        );
        if (draftChequeId && draftChequeId !== newExpense.id) {
          await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, String(draftChequeId));
        }
      } catch (e) {
        console.error("Çek fotoğrafı kaydetme hatası:", e);
      }
    }

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    console.error("Gider ekleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Gider kaydedilemedi" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "SYNC_CARD_DUE_DATE") {
      const { dueDateISO, expenseIds = [] } = body;
      if (!dueDateISO || !Array.isArray(expenseIds) || expenseIds.length === 0) {
        return NextResponse.json({ updated: 0 });
      }

      const [yearStr, monthStr, dayStr] = String(dueDateISO).split("-");
      const baseYear = parseInt(yearStr) || 2026;
      const baseMonth = parseInt(monthStr) || 9; // 1..12
      const targetDay = parseInt(dayStr) || 15;

      const items = await prisma.schoolExpense.findMany({
        where: { id: { in: expenseIds } },
      });

      let updatedCount = 0;
      for (const exp of items) {
        const expMonth = exp.monthIndex || baseMonth;
        // Eğer gider farklı bir aydaysa (örn. 10. ay taksiti), o ayın aynı gününe (son ödeme gününe) çek
        const expYear = expMonth < 7 && baseMonth >= 7 ? baseYear + 1 : baseYear;
        const maxDaysInExpMonth = new Date(expYear, expMonth, 0).getDate();
        const safeDay = Math.min(targetDay, maxDaysInExpMonth);
        const targetDate = new Date(expYear, expMonth - 1, safeDay, 12, 0, 0);
        const formattedStr = formatTurkishDate(targetDate);

        await prisma.schoolExpense.update({
          where: { id: exp.id },
          data: {
            dueDate: targetDate,
            dueDateStr: formattedStr,
          },
        });
        updatedCount++;
      }

      return NextResponse.json({ updated: updatedCount });
    }

    if (body.action === "PAY_CARD_STATEMENT") {
      const { expenseIds = [], amount, date, note } = body;
      if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
        return NextResponse.json({ error: "Ödenecek kart harcaması bulunamadı" }, { status: 400 });
      }

      const items = await prisma.schoolExpense.findMany({
        where: {
          id: { in: expenseIds },
          status: { not: "PAID" },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      });

      const totalUnpaid = items.reduce((s, e) => s + e.amountRemaining, 0);
      const payBudget = amount !== undefined && amount !== null ? Number(amount) : totalUnpaid;
      if (payBudget <= 0) {
        return NextResponse.json({ error: "Geçerli bir ödeme tutarı girin" }, { status: 400 });
      }

      let remainingBudget = payBudget;
      const payAll = payBudget >= totalUnpaid - 0.05;
      const payDateStr = date || new Date().toISOString().split("T")[0];
      let paidCount = 0;

      for (const exp of items) {
        if (!payAll && remainingBudget <= 0.009) break;

        const applied = payAll ? exp.amountRemaining : Math.min(exp.amountRemaining, remainingBudget);
        remainingBudget = Number((remainingBudget - applied).toFixed(2));

        const newPaid = Number((exp.amountPaid + applied).toFixed(2));
        const newRemaining = Math.max(0, Number((exp.amountDue - newPaid).toFixed(2)));
        const newStatus = newRemaining <= 0.05 ? "PAID" : "PARTIAL";

        let history: any[] = [];
        try {
          if (exp.paymentHistory) {
            const parsed = JSON.parse(exp.paymentHistory);
            if (Array.isArray(parsed)) history = parsed;
          }
        } catch {}

        history.push({
          date: payDateStr,
          amount: applied,
          note: note || "Kart Borcu / Ekstre Ödemesi",
        });

        await prisma.schoolExpense.update({
          where: { id: exp.id },
          data: {
            amountPaid: newRemaining <= 0.05 ? exp.amountDue : newPaid,
            amountRemaining: newRemaining <= 0.05 ? 0 : newRemaining,
            status: newStatus,
            paymentHistory: JSON.stringify(history),
          },
        });
        paidCount++;
      }

      return NextResponse.json({ success: true, paidCount });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error: any) {
    console.error("Toplu kart işlemi hatası:", error);
    return NextResponse.json({ error: "İşlem tamamlanamadı" }, { status: 500 });
  }
}


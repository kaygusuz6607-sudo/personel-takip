import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureUtilityBillTables,
  UtilitySubscriptionRow,
  UtilityBillRow,
  UtilityCategory,
} from "@/lib/utility-bills";
import { getClientLoadedCreditCards, DEFAULT_DEFINED_CARDS } from "@/lib/defined-credit-cards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TR_MONTHS: Record<number, string> = {
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

export async function GET(request: Request) {
  try {
    await ensureUtilityBillTables();

    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get("month") || ""; // e.g. "2026-10" or "ALL"

    // 1. Abonelikleri getir
    const subscriptions = (await prisma.$queryRawUnsafe(
      `SELECT * FROM UtilitySubscription ORDER BY 
        CASE category
          WHEN 'ELECTRICITY' THEN 1
          WHEN 'WATER' THEN 2
          WHEN 'GAS' THEN 3
          WHEN 'INTERNET' THEN 4
          WHEN 'TELEPHONE' THEN 5
          ELSE 6
        END,
        name ASC`
    )) as UtilitySubscriptionRow[];

    // 2. Faturaları getir
    const allBills = (await prisma.$queryRawUnsafe(
      `SELECT * FROM UtilityBill ORDER BY year DESC, month DESC, dueDate ASC`
    )) as UtilityBillRow[];

    // 3. Mevcut dönemler
    const periodMap = new Map<string, { period: string; year: number; month: number; label: string; count: number; total: number; remaining: number }>();
    allBills.forEach((b) => {
      const p = b.period || `${b.year}-${String(b.month).padStart(2, "0")}`;
      const existing = periodMap.get(p) || {
        period: p,
        year: b.year,
        month: b.month,
        label: `${b.month}. Ay (${TR_MONTHS[b.month] || ""} ${b.year})`,
        count: 0,
        total: 0,
        remaining: 0,
      };
      existing.count++;
      existing.total += b.amount;
      existing.remaining += b.remainingAmount;
      periodMap.set(p, existing);
    });

    const availablePeriods = Array.from(periodMap.values()).sort(
      (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month)
    );

    // 4. Güncel ay belirleme (Varsayılan Ekim 2026 / 2026-10)
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetYM = selectedMonth && selectedMonth !== "ALL" ? selectedMonth : currentYM;

    // 5. Zenginleştirilmiş abonelik listesi
    const enrichedSubscriptions = subscriptions.map((sub) => {
      const subBills = allBills.filter((b) => b.subscriptionId === sub.id);
      const totalAnnual = subBills.reduce((s, b) => s + b.amount, 0);
      const totalPaid = subBills.reduce((s, b) => s + b.paidAmount, 0);
      const totalRemaining = subBills.reduce((s, b) => s + b.remainingAmount, 0);
      const currentBill = subBills.find((b) => b.period === targetYM);

      return {
        ...sub,
        totalAnnual: Number(totalAnnual.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
        billCount: subBills.length,
        unpaidCount: subBills.filter((b) => b.status !== "PAID").length,
        currentBill: currentBill || null,
      };
    });

    // 6. Zenginleştirilmiş faturalar (Abonelik bilgileri eklenmiş)
    const subMap = new Map<string, UtilitySubscriptionRow>();
    subscriptions.forEach((s) => subMap.set(s.id, s));

    const enrichedBills = allBills.map((b) => {
      const sub = subMap.get(b.subscriptionId);
      return {
        ...b,
        subscriptionName: sub?.name || "Bilinmeyen Abonelik",
        category: sub?.category || "OTHER",
        institution: sub?.institution || "-",
        subscriberNo: sub?.subscriberNo || "-",
        meterNo: sub?.meterNo || "-",
        defaultPaymentMethod: sub?.paymentMethod || "CASH",
        periodLabel: `${b.month}. Ay (${TR_MONTHS[b.month] || ""} ${b.year})`,
      };
    });

    // 7. Aylara Göre Karşılaştırma Matrisi (Matrix)
    // 2026-07 ile 2027-06 arası (Eğitim-Öğretim sezonu)
    const schoolMonths = [
      { year: 2026, month: 7, label: "Temmuz 26", period: "2026-07" },
      { year: 2026, month: 8, label: "Ağustos 26", period: "2026-08" },
      { year: 2026, month: 9, label: "Eylül 26", period: "2026-09" },
      { year: 2026, month: 10, label: "Ekim 26", period: "2026-10" },
      { year: 2026, month: 11, label: "Kasım 26", period: "2026-11" },
      { year: 2026, month: 12, label: "Aralık 26", period: "2026-12" },
      { year: 2027, month: 1, label: "Ocak 27", period: "2027-01" },
      { year: 2027, month: 2, label: "Şubat 27", period: "2027-02" },
      { year: 2027, month: 3, label: "Mart 27", period: "2027-03" },
      { year: 2027, month: 4, label: "Nisan 27", period: "2027-04" },
      { year: 2027, month: 5, label: "Mayıs 27", period: "2027-05" },
      { year: 2027, month: 6, label: "Haziran 27", period: "2027-06" },
    ];

    const matrixRows = subscriptions.map((sub) => {
      const subBills = allBills.filter((b) => b.subscriptionId === sub.id);
      const cells = schoolMonths.map((sm) => {
        const found = subBills.find((b) => b.year === sm.year && b.month === sm.month);
        return {
          period: sm.period,
          label: sm.label,
          year: sm.year,
          month: sm.month,
          hasBill: Boolean(found),
          billId: found?.id || null,
          amount: found ? Number(found.amount.toFixed(2)) : 0,
          paidAmount: found ? Number(found.paidAmount.toFixed(2)) : 0,
          remainingAmount: found ? Number(found.remainingAmount.toFixed(2)) : 0,
          status: found?.status || "NONE",
          paidDate: found?.paidDate || null,
          paidMethod: found?.paidMethod || null,
        };
      });

      const rowTotal = cells.reduce((s, c) => s + c.amount, 0);
      const rowPaid = cells.reduce((s, c) => s + c.paidAmount, 0);
      const rowRemaining = cells.reduce((s, c) => s + c.remainingAmount, 0);

      return {
        subscription: sub,
        cells,
        rowTotal: Number(rowTotal.toFixed(2)),
        rowPaid: Number(rowPaid.toFixed(2)),
        rowRemaining: Number(rowRemaining.toFixed(2)),
      };
    });

    // Sütun bazlı toplamlar
    const matrixTotals = schoolMonths.map((sm) => {
      const monthBills = allBills.filter((b) => b.year === sm.year && b.month === sm.month);
      const totalAmount = monthBills.reduce((s, b) => s + b.amount, 0);
      const totalPaid = monthBills.reduce((s, b) => s + b.paidAmount, 0);
      const totalRemaining = monthBills.reduce((s, b) => s + b.remainingAmount, 0);

      return {
        period: sm.period,
        label: sm.label,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
        count: monthBills.length,
      };
    });

    // 8. İstatistikler
    const totalBilled = allBills.reduce((s, b) => s + b.amount, 0);
    const totalPaid = allBills.reduce((s, b) => s + b.paidAmount, 0);
    const totalRemaining = allBills.reduce((s, b) => s + b.remainingAmount, 0);

    const targetBills = allBills.filter((b) => b.period === targetYM);
    const currentMonthTotal = targetBills.reduce((s, b) => s + b.amount, 0);
    const currentMonthPaid = targetBills.reduce((s, b) => s + b.paidAmount, 0);
    const currentMonthRemaining = targetBills.reduce((s, b) => s + b.remainingAmount, 0);

    const categoryBreakdown: Record<string, { total: number; paid: number; remaining: number }> = {
      ELECTRICITY: { total: 0, paid: 0, remaining: 0 },
      WATER: { total: 0, paid: 0, remaining: 0 },
      GAS: { total: 0, paid: 0, remaining: 0 },
      INTERNET: { total: 0, paid: 0, remaining: 0 },
      TELEPHONE: { total: 0, paid: 0, remaining: 0 },
      OTHER: { total: 0, paid: 0, remaining: 0 },
    };

    enrichedBills.forEach((b) => {
      const cat = b.category || "OTHER";
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, paid: 0, remaining: 0 };
      }
      categoryBreakdown[cat].total += b.amount;
      categoryBreakdown[cat].paid += b.paidAmount;
      categoryBreakdown[cat].remaining += b.remainingAmount;
    });

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      bills: enrichedBills,
      availablePeriods,
      matrix: {
        months: schoolMonths,
        rows: matrixRows,
        totals: matrixTotals,
      },
      stats: {
        totalBilled: Number(totalBilled.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
        currentMonthTotal: Number(currentMonthTotal.toFixed(2)),
        currentMonthPaid: Number(currentMonthPaid.toFixed(2)),
        currentMonthRemaining: Number(currentMonthRemaining.toFixed(2)),
        currentPeriod: targetYM,
        currentPeriodLabel: `${parseInt(targetYM.split("-")[1] || "10", 10)}. Ay (${TR_MONTHS[parseInt(targetYM.split("-")[1] || "10", 10)] || ""} ${targetYM.split("-")[0]})`,
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Faturalar yüklenirken hata:", error);
    return NextResponse.json({ error: "Faturalar yüklenemedi: " + (error?.message || "") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureUtilityBillTables();
    const body = await request.json();
    const { action } = body;
    const now = new Date().toISOString();

    // 1. YENİ ABONELİK TANIMI EKLE
    if (action === "ADD_SUBSCRIPTION") {
      const {
        name,
        category = "OTHER",
        institution = "",
        subscriberNo = "",
        meterNo = "",
        paymentDay = 15,
        paymentMethod = "CASH",
        cardHolder = "",
        cardBank = "",
        cardId = "",
        notes = "",
      } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Abonelik adı zorunludur." }, { status: 400 });
      }

      const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO UtilitySubscription (id, name, category, institution, subscriberNo, meterNo, paymentDay, paymentMethod, cardHolder, cardBank, cardId, notes, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        id,
        name.trim(),
        category,
        institution.trim() || name.trim(),
        subscriberNo.trim() || null,
        meterNo.trim() || null,
        Number(paymentDay) || 15,
        paymentMethod || "CASH",
        cardHolder || null,
        cardBank || null,
        cardId || null,
        notes || null,
        now,
        now
      );

      return NextResponse.json({ ok: true, id });
    }

    // 2. ABONELİK GÜNCELLE
    if (action === "UPDATE_SUBSCRIPTION") {
      const {
        id,
        name,
        category,
        institution,
        subscriberNo,
        meterNo,
        paymentDay,
        paymentMethod,
        cardHolder,
        cardBank,
        cardId,
        notes,
      } = body;

      if (!id) {
        return NextResponse.json({ error: "Abonelik ID eksik." }, { status: 400 });
      }

      await prisma.$executeRawUnsafe(
        `UPDATE UtilitySubscription SET 
          name = ?, category = ?, institution = ?, subscriberNo = ?, meterNo = ?, 
          paymentDay = ?, paymentMethod = ?, cardHolder = ?, cardBank = ?, cardId = ?, 
          notes = ?, updatedAt = ?
         WHERE id = ?`,
        name,
        category,
        institution,
        subscriberNo || null,
        meterNo || null,
        Number(paymentDay) || 15,
        paymentMethod,
        cardHolder || null,
        cardBank || null,
        cardId || null,
        notes || null,
        now,
        id
      );

      return NextResponse.json({ ok: true });
    }

    // 3. ABONELİK SİL
    if (action === "DELETE_SUBSCRIPTION") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID eksik." }, { status: 400 });

      // İlgili faturaları sil
      await prisma.$executeRawUnsafe(`DELETE FROM UtilityBill WHERE subscriptionId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM UtilitySubscription WHERE id = ?`, id);

      return NextResponse.json({ ok: true });
    }

    // 4. FATURA GİRİŞİ / EKLE
    if (action === "ADD_BILL") {
      const {
        subscriptionId,
        period, // "2026-10"
        dueDate,
        amount,
        consumption = 0,
        billNo = "",
        notes = "",
        syncToExpense = true,
      } = body;

      const numAmount = Number(amount) || 0;
      if (!subscriptionId || !dueDate || numAmount <= 0) {
        return NextResponse.json({ error: "Lütfen abonelik, vade tarihi ve geçerli fatura tutarı girin." }, { status: 400 });
      }

      const dueMatch = String(dueDate).match(/^(\d{4})-(\d{2})/);
      const year = dueMatch ? parseInt(dueMatch[1], 10) : new Date().getFullYear();
      const month = dueMatch ? parseInt(dueMatch[2], 10) : new Date().getMonth() + 1;
      const finalPeriod = period || `${year}-${String(month).padStart(2, "0")}`;

      const billId = `ubill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let schoolExpenseId: string | null = null;

      // Abonelik bilgisini çek
      const subRows = (await prisma.$queryRawUnsafe(
        `SELECT * FROM UtilitySubscription WHERE id = ?`,
        subscriptionId
      )) as UtilitySubscriptionRow[];
      const sub = subRows[0];

      // İsteğe bağlı SchoolExpense oluştur
      if (syncToExpense && sub) {
        try {
          const catMap: Record<string, string> = {
            ELECTRICITY: "F-Elektrik",
            WATER: "F-Su",
            GAS: "F-Doğalgaz",
            INTERNET: "F-İnternet",
            TELEPHONE: "F-Haberleşme & Telefon",
            OTHER: "Fatura",
          };
          const trMonthName = TR_MONTHS[month] || "";
          const expTitle = `${sub.name} (${month}. Ay Faturası)`;

          const newExp = await prisma.schoolExpense.create({
            data: {
              title: expTitle,
              category: "INVOICE",
              subCategory: catMap[sub.category] || "Fatura",
              period: `${month}. Ay (${year})`,
              monthIndex: month,
              dueDate: new Date(dueDate),
              dueDateStr: dueDate,
              amountDue: numAmount,
              amountPaid: 0,
              amountRemaining: numAmount,
              status: "PENDING",
              periodStatus: "Aylık Fatura",
              description: `Aylık Kurum Faturası: ${sub.name} [UTILITY_BILL:${billId}] ${notes}`.trim(),
              paymentMethod: sub.paymentMethod || "CASH",
              cardHolder: sub.cardHolder || null,
              cardBank: sub.cardBank || null,
            },
          });
          schoolExpenseId = newExp.id;
        } catch (e) {
          console.error("Fatura giderlere eklenirken hata:", e);
        }
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO UtilityBill (id, subscriptionId, period, year, month, billDate, dueDate, amount, paidAmount, remainingAmount, status, consumption, billNo, paidDate, paidMethod, cardHolder, cardBank, cardId, schoolExpenseId, notes, paymentHistory, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'PENDING', ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, NULL, ?, ?)`,
        billId,
        subscriptionId,
        finalPeriod,
        year,
        month,
        dueDate,
        dueDate,
        numAmount,
        numAmount,
        Number(consumption) || 0,
        billNo || null,
        schoolExpenseId,
        notes || null,
        now,
        now
      );

      return NextResponse.json({ ok: true, id: billId });
    }

    // 5. FATURA GÜNCELLE
    if (action === "UPDATE_BILL") {
      const { id, amount, dueDate, consumption, billNo, notes } = body;
      if (!id) return NextResponse.json({ error: "Fatura ID eksik." }, { status: 400 });

      const billRows = (await prisma.$queryRawUnsafe(
        `SELECT * FROM UtilityBill WHERE id = ?`,
        id
      )) as UtilityBillRow[];
      if (!billRows[0]) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });

      const cur = billRows[0];
      const newAmount = Number(amount) !== undefined ? Number(amount) : cur.amount;
      const newPaid = Math.min(newAmount, cur.paidAmount);
      const newRem = Math.max(0, Number((newAmount - newPaid).toFixed(2)));
      const newStatus = newRem <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";

      await prisma.$executeRawUnsafe(
        `UPDATE UtilityBill SET 
          amount = ?, paidAmount = ?, remainingAmount = ?, status = ?, 
          dueDate = ?, consumption = ?, billNo = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        newAmount,
        newPaid,
        newRem,
        newStatus,
        dueDate || cur.dueDate,
        consumption !== undefined ? Number(consumption) : cur.consumption,
        billNo || cur.billNo,
        notes || cur.notes,
        now,
        id
      );

      // SchoolExpense senkronize et
      if (cur.schoolExpenseId) {
        try {
          await prisma.schoolExpense.update({
            where: { id: cur.schoolExpenseId },
            data: {
              amountDue: newAmount,
              amountPaid: newPaid,
              amountRemaining: newRem,
              status: newStatus,
              dueDate: dueDate ? new Date(dueDate) : undefined,
              dueDateStr: dueDate || undefined,
            },
          });
        } catch {}
      }

      return NextResponse.json({ ok: true });
    }

    // 6. FATURA ÖDE (PAY_BILL)
    if (action === "PAY_BILL") {
      const {
        id,
        payAmount,
        paidDate = new Date().toISOString().slice(0, 10),
        paidMethod = "CASH",
        cardHolder = "",
        cardBank = "",
        cardId = "",
        note = "Fatura Ödemesi",
      } = body;

      if (!id) return NextResponse.json({ error: "Fatura ID eksik." }, { status: 400 });

      const billRows = (await prisma.$queryRawUnsafe(
        `SELECT * FROM UtilityBill WHERE id = ?`,
        id
      )) as UtilityBillRow[];
      if (!billRows[0]) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });

      const cur = billRows[0];
      const paymentToApply =
        payAmount !== undefined && Number(payAmount) > 0
          ? Number(payAmount)
          : cur.remainingAmount > 0
          ? cur.remainingAmount
          : cur.amount;

      const newPaid = Number(Math.min(cur.amount, cur.paidAmount + paymentToApply).toFixed(2));
      const newRem = Math.max(0, Number((cur.amount - newPaid).toFixed(2)));
      const newStatus = newRem <= 0 ? "PAID" : "PARTIAL";

      let history: any[] = [];
      try {
        if (cur.paymentHistory) history = JSON.parse(cur.paymentHistory);
      } catch {}
      history.push({
        date: paidDate,
        amount: paymentToApply,
        method: paidMethod,
        cardHolder: cardHolder || null,
        cardBank: cardBank || null,
        cardId: cardId || null,
        note,
      });

      await prisma.$executeRawUnsafe(
        `UPDATE UtilityBill SET 
          paidAmount = ?, remainingAmount = ?, status = ?, paidDate = ?, 
          paidMethod = ?, cardHolder = ?, cardBank = ?, cardId = ?, 
          paymentHistory = ?, updatedAt = ?
         WHERE id = ?`,
        newPaid,
        newRem,
        newStatus,
        paidDate,
        paidMethod,
        cardHolder || null,
        cardBank || null,
        cardId || null,
        JSON.stringify(history),
        now,
        id
      );

      // SchoolExpense güncelle
      if (cur.schoolExpenseId) {
        try {
          await prisma.schoolExpense.update({
            where: { id: cur.schoolExpenseId },
            data: {
              amountPaid: newPaid,
              amountRemaining: newRem,
              status: newStatus,
              periodStatus: newStatus === "PAID" ? "Ödendi" : "Kısmi",
              paymentMethod: paidMethod,
              cardHolder: cardHolder || undefined,
              cardBank: cardBank || undefined,
              paymentHistory: JSON.stringify(history),
            },
          });
        } catch {}
      }

      return NextResponse.json({ ok: true });
    }

    // 7. ÖDEMEYİ SIFIRLA / İPTAL ET (RESET_BILL_PAYMENT)
    if (action === "RESET_BILL_PAYMENT") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID eksik." }, { status: 400 });

      const billRows = (await prisma.$queryRawUnsafe(
        `SELECT * FROM UtilityBill WHERE id = ?`,
        id
      )) as UtilityBillRow[];
      if (!billRows[0]) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });

      const cur = billRows[0];
      await prisma.$executeRawUnsafe(
        `UPDATE UtilityBill SET 
          paidAmount = 0, remainingAmount = ?, status = 'PENDING', 
          paidDate = NULL, paidMethod = NULL, cardHolder = NULL, 
          cardBank = NULL, cardId = NULL, paymentHistory = NULL, updatedAt = ?
         WHERE id = ?`,
        cur.amount,
        now,
        id
      );

      if (cur.schoolExpenseId) {
        try {
          await prisma.schoolExpense.update({
            where: { id: cur.schoolExpenseId },
            data: {
              amountPaid: 0,
              amountRemaining: cur.amount,
              status: "PENDING",
              periodStatus: "Aylık Fatura",
              paymentHistory: null,
            },
          });
        } catch {}
      }

      return NextResponse.json({ ok: true });
    }

    // 8. FATURA SİL (DELETE_BILL)
    if (action === "DELETE_BILL") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID eksik." }, { status: 400 });

      const billRows = (await prisma.$queryRawUnsafe(
        `SELECT schoolExpenseId FROM UtilityBill WHERE id = ?`,
        id
      )) as { schoolExpenseId: string | null }[];

      if (billRows[0]?.schoolExpenseId) {
        try {
          await prisma.schoolExpense.delete({ where: { id: billRows[0].schoolExpenseId } });
        } catch {}
      }

      await prisma.$executeRawUnsafe(`DELETE FROM UtilityBill WHERE id = ?`, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error: any) {
    console.error("Fatura işlem hatası:", error);
    return NextResponse.json({ error: "İşlem yapılamadı: " + (error?.message || "") }, { status: 500 });
  }
}

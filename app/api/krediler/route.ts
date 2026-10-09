import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function detectBankName(title: string, cardBank?: string | null): string {
  if (cardBank && cardBank.trim()) return cardBank.trim();
  const t = (title || "").toLowerCase();
  if (t.includes("akbank") || t.includes("axess")) return "Akbank";
  if (t.includes("halk") || t.includes("paraf")) return "Halkbank";
  if (t.includes("vakıf") || t.includes("vakif")) return "VakıfBank";
  if (t.includes("ziraat")) return "Ziraat Bankası";
  if (t.includes("garanti") || t.includes("bonus")) return "Garanti BBVA";
  if (t.includes("iş bank") || t.includes("is bank") || t.includes("maximum")) return "İş Bankası";
  if (t.includes("yapı kredi") || t.includes("yapi kredi") || t.includes("world")) return "Yapı Kredi";
  if (t.includes("deniz")) return "Denizbank";
  if (t.includes("qnb") || t.includes("finans")) return "QNB Finansbank";
  if (t.includes("teb")) return "TEB";
  return "Banka";
}

function detectBorrowerType(title: string, cardHolder?: string | null, desc?: string | null): "OKUL" | "SAHIS" {
  const d = (desc || "").toUpperCase();
  if (d.includes("BORROWER_TYPE:OKUL")) return "OKUL";
  if (d.includes("BORROWER_TYPE:SAHIS")) return "SAHIS";
  const h = (cardHolder || "").toLowerCase();
  const t = (title || "").toLowerCase();
  if (h.includes("ahmet taymaz") || h.includes("duygu") || h.includes("muhammed") || h.includes("emre") || h.includes("şahıs") || h.includes("sahis")) {
    return "SAHIS";
  }
  if (t.includes("ahmet taymaz") || t.includes("bireysel") || t.includes("şahıs") || t.includes("sahis")) {
    return "SAHIS";
  }
  if (t.includes("okul") || t.includes("simya") || t.includes("kampüs") || t.includes("kurumsal") || t.includes("şirket") || t.includes("sirket")) {
    return "OKUL";
  }
  return cardHolder && cardHolder.trim() ? "SAHIS" : "OKUL";
}

export async function GET(request: Request) {
  try {
    const expenses = await prisma.schoolExpense.findMany({
      where: { category: "LOAN" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    const groupsMap = new Map<string, any>();

    for (const exp of expenses) {
      const desc = exp.description || "";
      const loanIdMatch = desc.match(/\[LOAN_ID:([^:\]]+)\]/);
      const borrowerTypeMatch = desc.match(/\[BORROWER_TYPE:([^:\]]+)\]/);
      const borrowerMatch = desc.match(/\[BORROWER:([^:\]]+)\]/);
      const loanTitleMatch = desc.match(/\[LOAN_TITLE:([^:\]]+)\]/);

      let groupKey = "";
      let loanId = "";
      if (loanIdMatch) {
        loanId = loanIdMatch[1];
        groupKey = `LOAN_${loanId}`;
      } else {
        const cleanTitle = (exp.title || "").trim().toLowerCase();
        const cleanHolder = (exp.cardHolder || "").trim().toLowerCase();
        groupKey = `LEGACY_${cleanTitle}___${cleanHolder}`;
        loanId = groupKey;
      }

      const borrowerType = borrowerTypeMatch
        ? (borrowerTypeMatch[1] as "OKUL" | "SAHIS")
        : detectBorrowerType(exp.title, exp.cardHolder, desc);

      const borrowerName = borrowerMatch
        ? borrowerMatch[1]
        : exp.cardHolder || (borrowerType === "OKUL" ? "Simya Çocuk Üniversitesi (Okul)" : "Şahıs");

      const bankName = detectBankName(exp.title, exp.cardBank);
      const title = loanTitleMatch ? loanTitleMatch[1] : exp.title;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: loanId,
          groupKey,
          title,
          borrowerType,
          borrowerName,
          bankName,
          subCategory: exp.subCategory || "Banka Kredisi",
          notes: desc.replace(/\[LOAN_ID:[^\]]+\]/g, "").replace(/\[BORROWER_TYPE:[^\]]+\]/g, "").replace(/\[BORROWER:[^\]]+\]/g, "").replace(/\[LOAN_TITLE:[^\]]+\]/g, "").trim(),
          installments: [],
          totalAmount: 0,
          totalPaid: 0,
          remainingDebt: 0,
          installmentCount: 0,
          paidInstallmentCount: 0,
          pendingInstallmentCount: 0,
          monthlyInstallmentAmount: exp.amountDue || 0,
          firstDueDate: exp.dueDate ? exp.dueDate.toISOString() : null,
          isCompleted: false,
        });
      }

      const group = groupsMap.get(groupKey);
      group.installments.push({
        id: exp.id,
        title: exp.title,
        installmentInfo: exp.installmentInfo,
        period: exp.period,
        monthIndex: exp.monthIndex,
        dueDate: exp.dueDate,
        dueDateStr: exp.dueDateStr,
        amountDue: exp.amountDue,
        amountPaid: exp.amountPaid,
        amountRemaining: exp.amountRemaining,
        status: exp.status,
        paymentMethod: exp.paymentMethod,
        cardHolder: exp.cardHolder,
        cardBank: exp.cardBank,
        description: exp.description,
        paymentHistory: exp.paymentHistory,
      });

      group.totalAmount = Number((group.totalAmount + exp.amountDue).toFixed(2));
      group.totalPaid = Number((group.totalPaid + exp.amountPaid).toFixed(2));
      group.remainingDebt = Number((group.remainingDebt + exp.amountRemaining).toFixed(2));
      group.installmentCount += 1;
      if (exp.status === "PAID") {
        group.paidInstallmentCount += 1;
      } else {
        group.pendingInstallmentCount += 1;
      }
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let totalDebt = 0;
    let totalPaid = 0;
    let monthlyDueThisMonth = 0;
    let activeLoanCount = 0;
    let completedLoanCount = 0;

    const loans = Array.from(groupsMap.values()).map((group) => {
      group.isCompleted = group.remainingDebt <= 0.05 && group.pendingInstallmentCount === 0;
      if (group.isCompleted) {
        completedLoanCount++;
      } else {
        activeLoanCount++;
      }

      totalDebt = Number((totalDebt + group.remainingDebt).toFixed(2));
      totalPaid = Number((totalPaid + group.totalPaid).toFixed(2));

      // Sıralama
      group.installments.sort((a: any, b: any) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
      });

      // İlk bekleyen taksit
      const nextPending = group.installments.find((inst: any) => inst.status !== "PAID");
      group.nextDueInstallment = nextPending || null;

      // Bu ayki ödemeleri topla
      for (const inst of group.installments) {
        if (inst.status !== "PAID") {
          let instMonth = inst.monthIndex;
          let instYear = currentYear;
          if (inst.dueDate) {
            const d = new Date(inst.dueDate);
            if (!isNaN(d.getTime())) {
              instMonth = d.getMonth() + 1;
              instYear = d.getFullYear();
            }
          }
          if (instMonth === currentMonth && instYear === currentYear) {
            monthlyDueThisMonth = Number((monthlyDueThisMonth + inst.amountRemaining).toFixed(2));
          }
        }
      }

      return group;
    });

    return NextResponse.json({
      success: true,
      loans,
      summary: {
        totalDebt,
        totalPaid,
        monthlyDueThisMonth,
        activeLoanCount,
        completedLoanCount,
        totalLoanCount: loans.length,
      },
    });
  } catch (error: any) {
    console.error("Krediler getirme hatası:", error);
    return NextResponse.json({ error: error?.message || "Krediler alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. YENİ KREDİ TANIMLA VE TÜM AYLIK TAKSİTLERİNİ OKUL GİDERLERİNE OLUŞTUR
    if (action === "CREATE_LOAN") {
      const {
        title,
        borrowerType = "OKUL", // "OKUL" veya "SAHIS"
        borrowerName,
        bankName,
        subCategory = "Banka Kredisi",
        totalAmount,
        monthlyAmount,
        installmentCount,
        firstDueDate,
        notes = "",
        customInstallments,
      } = body;

      if (!title || !bankName || Number(installmentCount) <= 0) {
        return NextResponse.json(
          { error: "Lütfen kredi başlığı, banka ve geçerli taksit sayısı girin" },
          { status: 400 }
        );
      }

      const count = Math.max(1, Math.min(120, Number(installmentCount) || 12));
      const totalNum = Number(totalAmount) || 0;
      const defaultMonthly =
        Number(monthlyAmount) > 0
          ? Number(monthlyAmount)
          : Number((totalNum / count).toFixed(2));

      const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const safeBorrowerName = (borrowerName || "").trim() || (borrowerType === "OKUL" ? "Simya Çocuk Üniversitesi" : "Şahıs");
      const safeBankName = (bankName || "").trim();

      // Tarih hazırlığı
      let baseDate = new Date();
      if (firstDueDate) {
        const parts = String(firstDueDate).split("-").map(Number);
        if (parts.length === 3) {
          baseDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        }
      }

      const createdItems = [];

      for (let i = 1; i <= count; i++) {
        let itemDate: Date;
        let itemAmount = defaultMonthly;

        if (Array.isArray(customInstallments) && customInstallments[i - 1]) {
          const c = customInstallments[i - 1];
          if (c.dueDate) {
            const cp = String(c.dueDate).split("-").map(Number);
            itemDate = new Date(cp[0], cp[1] - 1, cp[2], 12, 0, 0);
          } else {
            itemDate = addMonthsPreservingDay(baseDate, i - 1);
          }
          if (Number(c.amount) > 0) {
            itemAmount = Number(c.amount);
          }
        } else {
          itemDate = addMonthsPreservingDay(baseDate, i - 1);
        }

        const itemMonthIdx = itemDate.getMonth() + 1;
        const itemDateStr = formatTurkishDate(itemDate);
        const periodStr = `${itemMonthIdx}.Ay`;
        const installmentInfo = `${i}t/${count}t`;

        const tagMetadata = `[LOAN_ID:${loanId}] [BORROWER_TYPE:${borrowerType}] [BORROWER:${safeBorrowerName}] [LOAN_TITLE:${title.trim()}]`;
        const finalDescription = `${tagMetadata} ${notes ? notes.trim() + " | " : ""}Kredi Taksiti (${i}/${count})`;

        const expense = await prisma.schoolExpense.create({
          data: {
            title: title.trim(),
            category: "LOAN",
            subCategory: subCategory || "Banka Kredisi",
            period: periodStr,
            installmentInfo,
            monthIndex: itemMonthIdx,
            dueDate: itemDate,
            dueDateStr: itemDateStr,
            amountDue: itemAmount,
            amountPaid: 0,
            amountRemaining: itemAmount,
            status: "PENDING",
            periodStatus: i === 1 ? "Cari Dönem" : "Gelecek Dönem",
            description: finalDescription,
            paymentMethod: "CASH",
            cardHolder: safeBorrowerName,
            cardBank: safeBankName,
          },
        });
        createdItems.push(expense);
      }

      return NextResponse.json({
        success: true,
        loanId,
        count: createdItems.length,
        items: createdItems,
      }, { status: 201 });
    }

    // 2. KREDİYİ DÜZENLE (Başlık, Banka, Borçlu, Alt Kategori, Notlar, Bekleyen Taksit Tutarları)
    if (action === "UPDATE_LOAN") {
      const {
        loanId,
        title,
        borrowerType = "OKUL",
        borrowerName,
        bankName,
        subCategory,
        notes = "",
        updatePendingAmount = false,
        newMonthlyAmount,
      } = body;

      if (!loanId && !title) {
        return NextResponse.json({ error: "Düzenlenecek kredi belirtilmedi" }, { status: 400 });
      }

      const where: any = { category: "LOAN" };
      if (loanId && !String(loanId).startsWith("LEGACY_")) {
        where.description = { contains: `[LOAN_ID:${loanId}]` };
      } else {
        where.title = title;
      }

      const existingExpenses = await prisma.schoolExpense.findMany({ where });
      if (existingExpenses.length === 0) {
        return NextResponse.json({ error: "Güncellenecek kredi kaydı bulunamadı" }, { status: 404 });
      }

      const safeBorrowerName = (borrowerName || "").trim();
      const safeBankName = (bankName || "").trim();
      const safeTitle = (title || "").trim();
      const safeSubCategory = (subCategory || "Banka Kredisi").trim();

      for (const exp of existingExpenses) {
        let updatedDesc = exp.description || "";
        if (loanId && !String(loanId).startsWith("LEGACY_")) {
          const tagMetadata = `[LOAN_ID:${loanId}] [BORROWER_TYPE:${borrowerType}] [BORROWER:${safeBorrowerName}] [LOAN_TITLE:${safeTitle}]`;
          updatedDesc = `${tagMetadata} ${notes ? notes.trim() + " | " : ""}${exp.installmentInfo || "Kredi Taksiti"}`;
        }

        const updateData: any = {
          title: safeTitle || exp.title,
          subCategory: safeSubCategory,
          cardHolder: safeBorrowerName || exp.cardHolder,
          cardBank: safeBankName || exp.cardBank,
          description: updatedDesc,
        };

        if (updatePendingAmount && Number(newMonthlyAmount) > 0 && exp.status !== "PAID") {
          const newAmt = Number(newMonthlyAmount);
          updateData.amountDue = newAmt;
          updateData.amountRemaining = Math.max(0, Number((newAmt - exp.amountPaid).toFixed(2)));
          updateData.status = updateData.amountRemaining <= 0.05 ? "PAID" : exp.amountPaid > 0 ? "PARTIAL" : "PENDING";
        }

        await prisma.schoolExpense.update({
          where: { id: exp.id },
          data: updateData,
        });
      }

      return NextResponse.json({ success: true, updatedCount: existingExpenses.length });
    }

    // 2.1 TEKİL TAKSİTİ DÜZENLE (Vade Tarihi veya Tutar)
    if (action === "UPDATE_INSTALLMENT") {
      const { installmentId, dueDate, amountDue, installmentInfo, notes } = body;
      if (!installmentId) {
        return NextResponse.json({ error: "Taksit ID gereklidir" }, { status: 400 });
      }

      const existing = await prisma.schoolExpense.findUnique({ where: { id: installmentId } });
      if (!existing) {
        return NextResponse.json({ error: "Taksit bulunamadı" }, { status: 404 });
      }

      const updateData: any = {};
      if (dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) {
          updateData.dueDate = d;
          updateData.dueDateStr = formatTurkishDate(d);
          updateData.monthIndex = d.getMonth() + 1;
          updateData.period = `${updateData.monthIndex}.Ay`;
        }
      }

      if (Number(amountDue) > 0) {
        const newAmt = Number(amountDue);
        updateData.amountDue = newAmt;
        updateData.amountRemaining = Math.max(0, Number((newAmt - existing.amountPaid).toFixed(2)));
        updateData.status = updateData.amountRemaining <= 0.05 ? "PAID" : existing.amountPaid > 0 ? "PARTIAL" : "PENDING";
      }

      if (installmentInfo) {
        updateData.installmentInfo = installmentInfo;
      }

      if (notes !== undefined) {
        updateData.description = notes;
      }

      const updated = await prisma.schoolExpense.update({
        where: { id: installmentId },
        data: updateData,
      });

      return NextResponse.json({ success: true, updated });
    }

    // 3. KREDİYİ VE TÜM TAKSİTLERİNİ SİL
    if (action === "DELETE_LOAN") {
      const { loanId, title, borrowerName, deletePaid = false } = body;

      if (!loanId && !title) {
        return NextResponse.json({ error: "Silinecek kredi belirtilmedi" }, { status: 400 });
      }

      const where: any = { category: "LOAN" };
      if (!deletePaid) {
        where.status = { not: "PAID" };
      }

      if (loanId && !String(loanId).startsWith("LEGACY_")) {
        where.description = { contains: `[LOAN_ID:${loanId}]` };
      } else {
        where.title = title;
        if (borrowerName) {
          where.cardHolder = borrowerName;
        }
      }

      const deleteRes = await prisma.schoolExpense.deleteMany({ where });

      return NextResponse.json({
        success: true,
        deletedCount: deleteRes.count,
      });
    }

    // 3. TAKSİT ÖDEMESİ YAP (Tek Tıkla veya Parçalı)
    if (action === "PAY_INSTALLMENT") {
      const { installmentId, amount, paymentMethod = "CASH", paymentDate, note } = body;

      if (!installmentId) {
        return NextResponse.json({ error: "Taksit ID gereklidir" }, { status: 400 });
      }

      const existing = await prisma.schoolExpense.findUnique({
        where: { id: installmentId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Taksit kaydı bulunamadı" }, { status: 404 });
      }

      const payAmount = Number(amount) > 0 ? Number(amount) : existing.amountRemaining;
      const newAmountPaid = Number((existing.amountPaid + payAmount).toFixed(2));
      const newAmountRemaining = Math.max(0, Number((existing.amountDue - newAmountPaid).toFixed(2)));
      const newStatus = newAmountRemaining <= 0.05 ? "PAID" : "PARTIAL";

      let history: any[] = [];
      try {
        if (existing.paymentHistory) {
          const parsed = JSON.parse(existing.paymentHistory);
          if (Array.isArray(parsed)) history = parsed;
        }
      } catch {}

      const payDateStr = paymentDate || new Date().toISOString().split("T")[0];
      history.push({
        date: payDateStr,
        amount: payAmount,
        paymentMethod,
        note: note || "Kredi Taksit Ödemesi",
      });

      const updated = await prisma.schoolExpense.update({
        where: { id: installmentId },
        data: {
          amountPaid: newAmountRemaining <= 0.05 ? existing.amountDue : newAmountPaid,
          amountRemaining: newAmountRemaining <= 0.05 ? 0 : newAmountRemaining,
          status: newStatus,
          periodStatus: newStatus === "PAID" ? "Ödendi" : "Kısmi Ödeme",
          paymentHistory: JSON.stringify(history),
        },
      });

      return NextResponse.json({ success: true, updated });
    }

    // 4. TAKSİT ÖDEMESİNİ GERİ AL (Hatalı Giriş)
    if (action === "REVERT_INSTALLMENT") {
      const { installmentId } = body;

      if (!installmentId) {
        return NextResponse.json({ error: "Taksit ID gereklidir" }, { status: 400 });
      }

      const existing = await prisma.schoolExpense.findUnique({
        where: { id: installmentId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Taksit kaydı bulunamadı" }, { status: 404 });
      }

      const updated = await prisma.schoolExpense.update({
        where: { id: installmentId },
        data: {
          amountPaid: 0,
          amountRemaining: existing.amountDue,
          status: "PENDING",
          periodStatus: "Cari Dönem",
          paymentHistory: null,
        },
      });

      return NextResponse.json({ success: true, updated });
    }

    // 5. KREDİYİ SİL (Tüm taksitleriyle veya verilen ID'lerle)
    if (action === "DELETE_LOAN") {
      const { loanId, installmentIds } = body;

      if (installmentIds && Array.isArray(installmentIds) && installmentIds.length > 0) {
        await prisma.schoolExpense.deleteMany({
          where: { id: { in: installmentIds } },
        });
        return NextResponse.json({ success: true, count: installmentIds.length });
      }

      if (!loanId) {
        return NextResponse.json({ error: "loanId veya installmentIds zorunludur" }, { status: 400 });
      }

      if (loanId.startsWith("LEGACY_")) {
        const parts = loanId.replace("LEGACY_", "").split("___");
        const cleanTitle = (parts[0] || "").trim().toLowerCase();
        const allLoanExpenses = await prisma.schoolExpense.findMany({
          where: { category: "LOAN" },
        });
        const toDeleteIds = allLoanExpenses
          .filter((exp) => {
            const expTitle = (exp.title || "").trim().toLowerCase();
            return expTitle === cleanTitle || expTitle.includes(cleanTitle);
          })
          .map((exp) => exp.id);

        if (toDeleteIds.length > 0) {
          await prisma.schoolExpense.deleteMany({
            where: { id: { in: toDeleteIds } },
          });
        }
        return NextResponse.json({ success: true, count: toDeleteIds.length });
      } else {
        const deleted = await prisma.schoolExpense.deleteMany({
          where: {
            category: "LOAN",
            description: { contains: `[LOAN_ID:${loanId}]` },
          },
        });
        return NextResponse.json({ success: true, count: deleted.count });
      }
    }

    // 6. TEKİL TAKSİTİ SİL
    if (action === "DELETE_INSTALLMENT") {
      const { installmentId } = body;
      if (!installmentId) {
        return NextResponse.json({ error: "installmentId zorunludur" }, { status: 400 });
      }
      await prisma.schoolExpense.delete({
        where: { id: installmentId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz işlem (action)" }, { status: 400 });
  } catch (error: any) {
    console.error("Kredi işlemi hatası:", error);
    return NextResponse.json({ error: error?.message || "İşlem başarısız" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get("loanId");
    const installmentId = searchParams.get("installmentId");

    if (installmentId) {
      await prisma.schoolExpense.delete({ where: { id: installmentId } });
      return NextResponse.json({ success: true, deleted: "installment" });
    }

    if (loanId) {
      if (loanId.startsWith("LEGACY_")) {
        const parts = loanId.replace("LEGACY_", "").split("___");
        const cleanTitle = (parts[0] || "").trim().toLowerCase();
        const allLoanExpenses = await prisma.schoolExpense.findMany({
          where: { category: "LOAN" },
        });
        const toDeleteIds = allLoanExpenses
          .filter((exp) => {
            const expTitle = (exp.title || "").trim().toLowerCase();
            return expTitle === cleanTitle || expTitle.includes(cleanTitle);
          })
          .map((exp) => exp.id);

        if (toDeleteIds.length > 0) {
          await prisma.schoolExpense.deleteMany({
            where: { id: { in: toDeleteIds } },
          });
        }
        return NextResponse.json({ success: true, deleted: "loan", count: toDeleteIds.length });
      } else {
        const deleted = await prisma.schoolExpense.deleteMany({
          where: {
            category: "LOAN",
            description: { contains: `[LOAN_ID:${loanId}]` },
          },
        });
        return NextResponse.json({ success: true, deleted: "loan", count: deleted.count });
      }
    }

    return NextResponse.json({ error: "loanId veya installmentId parametresi zorunludur" }, { status: 400 });
  } catch (error: any) {
    console.error("Kredi silme hatası:", error);
    return NextResponse.json({ error: error?.message || "Silinemedi" }, { status: 500 });
  }
}

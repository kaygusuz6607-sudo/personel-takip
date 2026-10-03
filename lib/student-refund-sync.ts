import { prisma } from "@/lib/prisma";

const TR_MONTHS = [
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

function formatDateStr(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${d} ${TR_MONTHS[m] || m} ${y}`;
}

/**
 * Önceden manuel girilmiş veya ilk tohumlamadan kalmış olan etiketsiz mükerrer kayıt silme giderlerini temizler.
 * Mülk kirası (Özdemirler A.Ş.) korunur.
 */
export async function cleanUntaggedLegacyRefundExpenses() {
  try {
    const allExpenses = await prisma.schoolExpense.findMany();
    const toDeleteIds: string[] = [];

    for (const exp of allExpenses) {
      // Kesinlikle Mülk Kirası olan Özdemirler kaydına dokunma!
      if (exp.id === "b5550957-3718-426c-89dc-bd8883b897f0") continue;
      const desc = exp.description || "";
      // Zaten etiketli ve senkronize olanları atla
      if (desc.includes("[STUDENT_REFUND:")) continue;

      const title = (exp.title || "").toLowerCase();
      const sub = (exp.subCategory || "").toLowerCase();
      const fullText = `${title} ${sub} ${desc.toLowerCase()}`;

      const isLegacyRefund =
        fullText.includes("kayıt silme") ||
        fullText.includes("kayit silme") ||
        fullText.includes("karaman") ||
        fullText.includes("tutum") ||
        fullText.includes("hakkomaz") ||
        fullText.includes("avan") ||
        fullText.includes("ayar") ||
        fullText.includes("cevat") ||
        fullText.includes("koçer") ||
        fullText.includes("kocer") ||
        fullText.includes("miray lina");

      if (isLegacyRefund) {
        toDeleteIds.push(exp.id);
      }
    }

    if (toDeleteIds.length > 0) {
      await prisma.schoolExpense.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
      console.log(`[student-refund-sync] ${toDeleteIds.length} adet mükerrer eski/etiketsiz kayıt silme gideri temizlendi.`);
    }
  } catch (error) {
    console.error("cleanUntaggedLegacyRefundExpenses hatası:", error);
  }
}

/**
 * Belirli bir kayıt silme iade dosyasının (StudentRefund) taksitlerini SchoolExpense tablosuyla senkronize eder.
 * Her taksit, Okul Gider & Borç Takibi ekranında ilgili ayda bir borç/ödeme kalemi olarak görünür.
 */
export async function syncRefundToSchoolExpenses(refundId: string) {
  try {
    const refund = await prisma.studentRefund.findUnique({
      where: { id: refundId },
      include: {
        installments: {
          orderBy: { installmentNo: "asc" },
        },
      },
    });

    const tagPrefix = `[STUDENT_REFUND:${refundId}:`;

    // Dosya yoksa veya iptal edilmişse (CANCELLED) okul giderlerindeki kayıtları temizle
    if (!refund || refund.status === "CANCELLED") {
      const oldExpenses = await prisma.schoolExpense.findMany({
        where: { description: { contains: tagPrefix } },
      });
      for (const oe of oldExpenses) {
        await prisma.schoolExpense.delete({ where: { id: oe.id } });
      }
      return;
    }

    // Bu öğrenciye ait eski etiketsiz mükerrer kayıtları temizle
    const sNameParts = refund.studentName.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
    const existingUntagged = await prisma.schoolExpense.findMany({
      where: {
        NOT: { description: { contains: "[STUDENT_REFUND:" } },
        id: { not: "b5550957-3718-426c-89dc-bd8883b897f0" },
      },
    });
    for (const eu of existingUntagged) {
      const euText = `${eu.title || ""} ${eu.subCategory || ""} ${eu.description || ""}`.toLowerCase();
      if (
        (euText.includes("kayıt silme") || euText.includes("kayit silme")) &&
        sNameParts.some((p) => euText.includes(p))
      ) {
        await prisma.schoolExpense.delete({ where: { id: eu.id } });
      }
    }

    // Mevcut senkronize edilmiş gider kayıtlarını bul
    const existingExpenses = await prisma.schoolExpense.findMany({
      where: { description: { contains: tagPrefix } },
    });

    const validInstallmentIds = new Set(refund.installments.map((i) => i.id));

    // Taksit silinmişse veya artık geçerli değilse ilgili SchoolExpense kaydını sil
    for (const exp of existingExpenses) {
      const match = (exp.description || "").match(
        /\[STUDENT_REFUND:([^:\]]+):([^:\]]+)\]/
      );
      if (match) {
        const instId = match[2];
        if (!validInstallmentIds.has(instId)) {
          await prisma.schoolExpense.delete({ where: { id: exp.id } });
        }
      }
    }

    // Her taksit için SchoolExpense oluştur veya güncelle
    for (const inst of refund.installments) {
      const exactTag = `[STUDENT_REFUND:${refund.id}:${inst.id}]`;
      const d = new Date(inst.dueDate);
      const monthIdx = d.getMonth() + 1;
      const dueStr = inst.dueDateStr || formatDateStr(d);
      const instCode = `${inst.installmentNo}t/${refund.installmentCount}t`;

      const title = `Kayıt Silme İadesi - ${refund.studentName}`;
      const descParts = [
        exactTag,
        `Veli: ${refund.parentName || "-"}`,
        `Tel: ${refund.phone || "-"}`,
        `IBAN: ${refund.iban || "-"}`,
      ];
      if (inst.notes) descParts.push(`Not: ${inst.notes}`);
      if (refund.notes) descParts.push(`Dosya Notu: ${refund.notes}`);
      const fullDesc = descParts.join(" | ");

      const isPaid = inst.status === "PAID" || inst.remainingAmount === 0;
      const isPartial = !isPaid && inst.paidAmount > 0;
      const finalStatus = isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING";
      const finalPeriodStatus = isPaid ? "Ödendi" : isPartial ? "Kısmi" : "Cari Dönem";

      let paymentHistoryStr: string | null = null;
      if (inst.paidAmount > 0) {
        const pDate = inst.paymentDate
          ? new Date(inst.paymentDate).toISOString().split("T")[0]
          : d.toISOString().split("T")[0];
        paymentHistoryStr = JSON.stringify([
          {
            date: pDate,
            amount: inst.paidAmount,
            note: isPaid ? "Kayıt Silme İadesi Ödendi" : "Kısmi İade Ödemesi",
          },
        ]);
      }

      const expData = {
        title,
        category: "STUDENT_REFUND",
        subCategory: refund.reason || "Kayıt Silme İadesi",
        period: instCode,
        installmentInfo: instCode,
        monthIndex: monthIdx,
        dueDate: d,
        dueDateStr: dueStr,
        amountDue: inst.amount,
        amountPaid: inst.paidAmount,
        amountRemaining: inst.remainingAmount,
        status: finalStatus as "PENDING" | "PARTIAL" | "PAID",
        periodStatus: finalPeriodStatus,
        description: fullDesc,
        paymentMethod: inst.paymentMethod === "CASH" ? "CASH" : "BANK_TRANSFER",
        paymentHistory: paymentHistoryStr,
      };

      const existingExp = existingExpenses.find((e) =>
        (e.description || "").includes(exactTag)
      );

      if (existingExp) {
        await prisma.schoolExpense.update({
          where: { id: existingExp.id },
          data: expData,
        });
      } else {
        await prisma.schoolExpense.create({
          data: expData,
        });
      }
    }
  } catch (error) {
    console.error(`syncRefundToSchoolExpenses hatası (${refundId}):`, error);
  }
}

/**
 * Sistemdeki tüm kayıt silme iade dosyalarını ve taksitlerini SchoolExpense tablosuna senkronize eder.
 * Ayrıca eski mükerrer etiketsiz kayıtları otomatik temizler.
 */
export async function syncAllRefundsToSchoolExpenses() {
  try {
    await cleanUntaggedLegacyRefundExpenses();
    const refunds = await prisma.studentRefund.findMany({
      select: { id: true },
    });
    for (const r of refunds) {
      await syncRefundToSchoolExpenses(r.id);
    }
  } catch (error) {
    console.error("syncAllRefundsToSchoolExpenses hatası:", error);
  }
}

/**
 * Okul Gider & Borç Takibi ekranından yapılan bir ödeme, durum değişikliği veya silme işlemini
 * anında ilgili Kayıt Silme İadesi (RefundInstallment & StudentRefund) tablosuna yansıtır.
 */
export async function syncSchoolExpenseToRefund(
  expenseId: string,
  actionType: "MARK_PAID" | "ADD_PAYMENT" | "RESET_PAYMENT" | "GENERAL_UPDATE" | "DELETE",
  payload?: any
) {
  try {
    const expense = await prisma.schoolExpense.findUnique({
      where: { id: expenseId },
    });
    if (!expense) return;

    let refundId: string | null = null;
    let installmentId: string | null = null;

    const match = (expense.description || "").match(
      /\[STUDENT_REFUND:([^:\]]+):([^:\]]+)\]/
    );
    if (match) {
      refundId = match[1];
      installmentId = match[2];
    } else {
      // Etiketsiz ise öğrenci ismi ve ay bazında eşleştirme bul
      const title = expense.title || "";
      const allRefunds = await prisma.studentRefund.findMany({
        include: { installments: true },
      });
      for (const r of allRefunds) {
        const parts = r.studentName.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
        if (parts.some((p) => title.toLowerCase().includes(p))) {
          // İlgili ayı bul
          const inst = r.installments.find((i) => {
            const d = new Date(i.dueDate);
            return d.getMonth() + 1 === expense.monthIndex;
          });
          if (inst) {
            refundId = r.id;
            installmentId = inst.id;
            break;
          }
        }
      }
    }

    if (!refundId || !installmentId) return;

    if (actionType === "MARK_PAID") {
      const now = payload?.date ? new Date(payload.date) : new Date();
      await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: expense.amountDue,
          remainingAmount: 0,
          status: "PAID",
          paymentDate: now,
          paymentMethod: expense.paymentMethod || "BANK_TRANSFER",
        },
      });

      const allInst = await prisma.refundInstallment.findMany({
        where: { refundId },
      });
      const allDone = allInst.every((i) => (i.id === installmentId ? true : i.remainingAmount === 0));
      await prisma.studentRefund.update({
        where: { id: refundId },
        data: { status: allDone ? "COMPLETED" : "ACTIVE" },
      });
    } else if (actionType === "ADD_PAYMENT") {
      const newPaid = Number(payload.newAmountPaid) || 0;
      const newRem = Math.max(0, Number(payload.newAmountRemaining) || 0);
      const newSt = payload.newStatus || (newRem === 0 ? "PAID" : "PARTIAL");
      const payDate = payload?.date ? new Date(payload.date) : new Date();

      await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRem,
          status: newSt,
          paymentDate: payDate,
        },
      });

      const allInst = await prisma.refundInstallment.findMany({
        where: { refundId },
      });
      const allDone = allInst.every((i) => (i.id === installmentId ? newRem === 0 : i.remainingAmount === 0));
      await prisma.studentRefund.update({
        where: { id: refundId },
        data: { status: allDone ? "COMPLETED" : "ACTIVE" },
      });
    } else if (actionType === "RESET_PAYMENT") {
      await prisma.refundInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: 0,
          remainingAmount: expense.amountDue,
          status: "PENDING",
          paymentDate: null,
        },
      });

      await prisma.studentRefund.update({
        where: { id: refundId },
        data: { status: "ACTIVE" },
      });
    } else if (actionType === "GENERAL_UPDATE" && payload) {
      const updateData: any = {};
      if (payload.dueDate) {
        const d = new Date(payload.dueDate);
        updateData.dueDate = d;
        updateData.dueDateStr = formatDateStr(d);
      }
      if (payload.amountDue !== undefined) {
        const amt = Number(payload.amountDue);
        updateData.amount = amt;
        const currentInst = await prisma.refundInstallment.findUnique({ where: { id: installmentId } });
        const curPaid = currentInst ? currentInst.paidAmount : 0;
        const rem = Math.max(0, Number((amt - curPaid).toFixed(2)));
        updateData.remainingAmount = rem;
        updateData.status = curPaid === 0 ? "PENDING" : rem === 0 ? "PAID" : "PARTIAL";
      }
      if (payload.status) {
        updateData.status = payload.status;
      }
      if (payload.paymentMethod) {
        updateData.paymentMethod = payload.paymentMethod;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.refundInstallment.update({
          where: { id: installmentId },
          data: updateData,
        });

        const allInst = await prisma.refundInstallment.findMany({ where: { refundId } });
        const newTotal = allInst.reduce((sum, item) => sum + item.amount, 0);
        const allDone = allInst.every((i) => i.remainingAmount === 0);
        await prisma.studentRefund.update({
          where: { id: refundId },
          data: {
            totalAmount: Number(newTotal.toFixed(2)),
            status: allDone ? "COMPLETED" : "ACTIVE",
          },
        });
      }
    } else if (actionType === "DELETE") {
      await prisma.refundInstallment.delete({ where: { id: installmentId } });
      const remainingInsts = await prisma.refundInstallment.findMany({
        where: { refundId },
        orderBy: { installmentNo: "asc" },
      });
      for (let i = 0; i < remainingInsts.length; i++) {
        if (remainingInsts[i].installmentNo !== i + 1) {
          await prisma.refundInstallment.update({
            where: { id: remainingInsts[i].id },
            data: { installmentNo: i + 1 },
          });
        }
      }
      const newTotal = remainingInsts.reduce((sum, item) => sum + item.amount, 0);
      const allDone = remainingInsts.length > 0 && remainingInsts.every((i) => i.remainingAmount === 0);
      await prisma.studentRefund.update({
        where: { id: refundId },
        data: {
          totalAmount: Number(newTotal.toFixed(2)),
          installmentCount: remainingInsts.length,
          status: remainingInsts.length === 0 ? "COMPLETED" : allDone ? "COMPLETED" : "ACTIVE",
        },
      });
    }
  } catch (error) {
    console.error("syncSchoolExpenseToRefund hatası:", error);
  }
}

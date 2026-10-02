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
        status: inst.status as "PENDING" | "PARTIAL" | "PAID",
        periodStatus: inst.status === "PAID" ? "Ödendi" : "Cari Dönem",
        description: fullDesc,
        paymentMethod: inst.paymentMethod === "CASH" ? "CASH" : "BANK_TRANSFER",
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
 */
export async function syncAllRefundsToSchoolExpenses() {
  try {
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

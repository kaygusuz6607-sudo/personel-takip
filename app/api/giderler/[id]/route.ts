import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSupplierCariTables } from "@/lib/supplier-cari-sync";
import { syncSchoolExpenseToRefund } from "@/lib/student-refund-sync";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.schoolExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Gider kaydı bulunamadı" }, { status: 404 });
    }

    const supMatch = (existing.description || "").match(
      /\[SUPPLIER_CARI:([^:\]]+):(\d{4}-\d{1,2})\]/
    );
    const refundMatch = (existing.description || "").match(
      /\[STUDENT_REFUND:([^:\]]+):([^:\]]+)\]/
    );

    // Parçalı ödeme ekleme isteği gelmişse
    if (body.action === "ADD_PAYMENT") {
      const payAmount = Number(body.amount) || 0;
      if (payAmount <= 0) {
        return NextResponse.json({ error: "Geçerli bir ödeme tutarı girin" }, { status: 400 });
      }

      const newAmountPaid = Number((existing.amountPaid + payAmount).toFixed(2));
      const newAmountRemaining = Math.max(0, Number((existing.amountDue - newAmountPaid).toFixed(2)));
      const newStatus = newAmountRemaining <= 0 ? "PAID" : "PARTIAL";

      let history: any[] = [];
      try {
        if (existing.paymentHistory) {
          history = JSON.parse(existing.paymentHistory);
        }
      } catch (e) {}

      const payDateStr = body.date || new Date().toISOString().split("T")[0];
      history.push({
        date: payDateStr,
        amount: payAmount,
        note: body.note || "Parçalı Ödeme",
      });

      let newDescription = existing.description;
      if (newAmountRemaining <= 0) {
        if (newDescription && newDescription.toLowerCase().includes("kaldı")) {
          newDescription = `${history.length} taksit ödendi - Borç tamamen kapandı`;
        }
      } else if (newDescription && newDescription.toLowerCase().includes("kaldı")) {
        newDescription = newDescription.replace(
          /([0-9.,]+)\s*(TL)?\s*kaldı/i,
          `${newAmountRemaining.toLocaleString("tr-TR")} TL kaldı`
        );
      }

      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          amountRemaining: newAmountRemaining,
          status: newStatus,
          periodStatus: newStatus === "PAID" ? "Ödendi" : "Kısmi",
          paymentHistory: JSON.stringify(history),
          ...(newDescription !== existing.description ? { description: newDescription } : {}),
        },
      });

      if (supMatch) {
        try {
          await ensureSupplierCariTables();
          const supplierId = supMatch[1];
          const ym = supMatch[2];
          const [y, m] = ym.split("-");
          const dueISO = `${y}-${String(m).padStart(2, "0")}-15`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO SupplierCariTransaction (id, supplierId, txType, date, dueDate, itemTitle, quantity, unitPrice, amount, paymentMethod, notes, createdAt)
             VALUES (?, ?, 'PAYMENT', ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            `stx-pay-${Date.now()}`,
            supplierId,
            payDateStr,
            dueISO,
            body.note || `${ym} Dönemi Ödemesi`,
            payAmount,
            payAmount,
            existing.paymentMethod || "CASH",
            body.note || "Giderler listesinden ödendi",
            new Date().toISOString()
          );
        } catch {}
      }

      await syncSchoolExpenseToRefund(id, "ADD_PAYMENT", {
        newAmountPaid,
        newAmountRemaining,
        newStatus,
        date: payDateStr,
      });

      return NextResponse.json(updated);
    }

    // Tamamını ödendi olarak işaretleme
    if (body.action === "MARK_PAID") {
      const remainingToPay = Math.max(0, Number((existing.amountDue - existing.amountPaid).toFixed(2)));
      let newDescription = existing.description;
      if (newDescription && newDescription.toLowerCase().includes("kaldı")) {
        newDescription = "Tüm taksitler ödendi - Borç tamamen kapandı";
      }

      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          amountPaid: existing.amountDue,
          amountRemaining: 0,
          status: "PAID",
          periodStatus: "Ödendi",
          ...(newDescription !== existing.description ? { description: newDescription } : {}),
        },
      });

      if (supMatch && remainingToPay > 0) {
        try {
          await ensureSupplierCariTables();
          const supplierId = supMatch[1];
          const ym = supMatch[2];
          const [y, m] = ym.split("-");
          const dueISO = `${y}-${String(m).padStart(2, "0")}-15`;
          const todayISO = new Date().toISOString().split("T")[0];
          await prisma.$executeRawUnsafe(
            `INSERT INTO SupplierCariTransaction (id, supplierId, txType, date, dueDate, itemTitle, quantity, unitPrice, amount, paymentMethod, notes, createdAt)
             VALUES (?, ?, 'PAYMENT', ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            `stx-pay-${Date.now()}`,
            supplierId,
            todayISO,
            dueISO,
            `${ym} Dönemi Tam Ödeme`,
            remainingToPay,
            remainingToPay,
            existing.paymentMethod || "CASH",
            "Giderler listesinden ödendi olarak işaretlendi",
            new Date().toISOString()
          );
        } catch {}
      }

      await syncSchoolExpenseToRefund(id, "MARK_PAID", {
        date: new Date().toISOString().split("T")[0],
      });

      return NextResponse.json(updated);
    }

    // Bekliyor durumuna geri alma / Sıfırlama
    if (body.action === "RESET_PAYMENT") {
      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          amountPaid: 0,
          amountRemaining: existing.amountDue,
          status: "PENDING",
          periodStatus: "Cari Dönem",
          paymentHistory: null,
        },
      });

      await syncSchoolExpenseToRefund(id, "RESET_PAYMENT");

      return NextResponse.json(updated);
    }

    // Fatura içi çoklu telefon hatlarını (5 numara, kullanan kişi, ücret, taahhüt bitiş tarihi) güncelleme
    if (body.action === "UPDATE_PHONE_LINES") {
      const serializedLines =
        body.phoneLines === null
          ? null
          : typeof body.phoneLines === "object"
          ? JSON.stringify(body.phoneLines)
          : body.phoneLines;

      const updateAmount = Boolean(body.syncAmountToTotal) && Number(body.linesTotalAmount) > 0;
      const nextDue = updateAmount ? Number(body.linesTotalAmount) : existing.amountDue;
      const nextRemaining = Math.max(0, Number((nextDue - existing.amountPaid).toFixed(2)));
      const nextStatus =
        existing.amountPaid >= nextDue ? "PAID" : existing.amountPaid > 0 ? "PARTIAL" : "PENDING";

      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          phoneLines: serializedLines,
          isCommitment: serializedLines ? true : existing.isCommitment,
          ...(updateAmount
            ? {
                amountDue: nextDue,
                amountRemaining: nextRemaining,
                status: nextStatus,
              }
            : {}),
        },
      });

      // Aynı fatura başlığına sahip diğer ay/dönem kayıtlarında da telefon numaralarını ve taahhüt tarihlerini eşitle
      await prisma.schoolExpense.updateMany({
        where: {
          title: existing.title,
          id: { not: id },
        },
        data: {
          phoneLines: serializedLines,
          isCommitment: serializedLines ? true : existing.isCommitment,
        },
      });

      return NextResponse.json(updated);
    }

    // Genel güncelleme
    const {
      title,
      category,
      subCategory,
      period,
      installmentInfo,
      dueDateStr,
      dueDate,
      amountDue,
      periodStatus,
      description,
      isCommitment,
      commitmentEndDate,
      commitmentMonths,
      paymentMethod,
      cardHolder,
      cardBank,
      monthIndex,
      phoneLines,
      chequeNo,
      chequeBank,
      chequePhotoUrl,
    } = body;

    const numAmountDue = amountDue !== undefined ? Number(amountDue) : existing.amountDue;
    const numAmountPaid = existing.amountPaid;
    const numAmountRemaining = Math.max(0, Number((numAmountDue - numAmountPaid).toFixed(2)));
    const status = numAmountPaid >= numAmountDue ? "PAID" : numAmountPaid > 0 ? "PARTIAL" : "PENDING";

    let computedDueDateStr = dueDateStr ?? existing.dueDateStr;
    let computedMonthIndex: number | null =
      monthIndex !== undefined ? (monthIndex ? Number(monthIndex) : null) : existing.monthIndex;
    let computedPeriod = period ?? existing.period;
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        const months = [
          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        computedDueDateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        computedMonthIndex = d.getMonth() + 1;
        if (!period && (!existing.period || /^\d{1,2}\.\s*Ay/i.test(existing.period))) {
          computedPeriod = `${computedMonthIndex}. Ay (${d.getFullYear()})`;
        }
      }
    }

    const serializedPhoneLines =
      phoneLines !== undefined
        ? phoneLines === null
          ? null
          : typeof phoneLines === "object"
          ? JSON.stringify(phoneLines)
          : phoneLines
        : existing.phoneLines;

    const updated = await prisma.schoolExpense.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        category: category ?? existing.category,
        subCategory: subCategory ?? existing.subCategory,
        period: computedPeriod,
        installmentInfo: installmentInfo !== undefined ? installmentInfo : existing.installmentInfo,
        dueDateStr: computedDueDateStr,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        amountDue: numAmountDue,
        amountRemaining: numAmountRemaining,
        status,
        periodStatus: periodStatus ?? existing.periodStatus,
        description: description ?? existing.description,
        isCommitment: isCommitment !== undefined ? Boolean(isCommitment) : existing.isCommitment,
        commitmentEndDate: commitmentEndDate ? new Date(commitmentEndDate) : existing.commitmentEndDate,
        commitmentMonths: commitmentMonths !== undefined ? Number(commitmentMonths) : existing.commitmentMonths,
        paymentMethod: (category ?? existing.category) === "CREDIT_CARD" ? "CASH" : (paymentMethod ?? existing.paymentMethod),
        cardHolder: cardHolder !== undefined ? cardHolder : existing.cardHolder,
        cardBank: cardBank !== undefined ? cardBank : existing.cardBank,
        monthIndex: computedMonthIndex,
        phoneLines: serializedPhoneLines,
        chequeNo: chequeNo !== undefined ? chequeNo : existing.chequeNo,
        chequeBank: chequeBank !== undefined ? chequeBank : existing.chequeBank,
      },
    });

    if (chequePhotoUrl !== undefined) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ChequePhotoStore (
            id TEXT PRIMARY KEY,
            photoUrl TEXT,
            title TEXT,
            updatedAt TEXT
          )
        `);
        if (chequePhotoUrl && typeof chequePhotoUrl === "string" && chequePhotoUrl.startsWith("data:image/")) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET photoUrl = excluded.photoUrl, title = excluded.title, updatedAt = excluded.updatedAt`,
            id,
            chequePhotoUrl,
            updated.title || "Çek Ödemesi",
            new Date().toISOString()
          );
        } else if (chequePhotoUrl === null || chequePhotoUrl === "") {
          await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, id);
        }
      } catch (e) {
        console.error("Çek fotoğrafı güncelleme hatası:", e);
      }
    }

    if (phoneLines !== undefined) {
      await prisma.schoolExpense.updateMany({
        where: {
          title: updated.title,
          id: { not: id },
        },
        data: {
          phoneLines: serializedPhoneLines,
        },
      });
    }

    await syncSchoolExpenseToRefund(id, "GENERAL_UPDATE", {
      amountDue: updated.amountDue,
      dueDate: updated.dueDate,
      status: updated.status,
      paymentMethod: updated.paymentMethod,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Gider güncelleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAllSeries = searchParams.get("deleteAllSeries") === "true";

    const existing = await prisma.schoolExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: true, message: "Kayıt zaten mevcut değil" });
    }

    const refundMatch = (existing.description || "").match(
      /\[STUDENT_REFUND:([^:\]]+):([^:\]]+)\]/
    );

    // Eğer tüm seriyi silme isteği gelmişse
    if (deleteAllSeries) {
      if (refundMatch) {
        const refId = refundMatch[1];
        try {
          await prisma.studentRefund.delete({ where: { id: refId } });
        } catch {}
        await prisma.schoolExpense.deleteMany({
          where: { description: { contains: `[STUDENT_REFUND:${refId}:` } },
        });
      } else {
        await prisma.schoolExpense.deleteMany({
          where: {
            title: existing.title,
            category: existing.category,
          },
        });
      }
      return NextResponse.json({ success: true, deletedAll: true });
    }

    // Tek bir kaydı silme işlemi
    await syncSchoolExpenseToRefund(id, "DELETE");

    if (existing.category === "GOLD_DAY") {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE GoldDayRound SET expenseId = NULL, isPaid = 0, paidAmount = 0 WHERE expenseId = ?`,
          id
        );
      } catch {}
    }

    await prisma.schoolExpense.delete({
      where: { id },
    });

    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, id);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gider silme hatası:", error);
    return NextResponse.json({ error: error?.message || "Silinemedi" }, { status: 500 });
  }
}

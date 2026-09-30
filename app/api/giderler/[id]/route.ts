import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

      history.push({
        date: new Date().toISOString().split("T")[0],
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
          paymentHistory: JSON.stringify(history),
          ...(newDescription !== existing.description ? { description: newDescription } : {}),
        },
      });

      return NextResponse.json(updated);
    }

    // Tamamını ödendi olarak işaretleme
    if (body.action === "MARK_PAID") {
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
          ...(newDescription !== existing.description ? { description: newDescription } : {}),
        },
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
          paymentHistory: null,
        },
      });
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
    } = body;

    const numAmountDue = amountDue !== undefined ? Number(amountDue) : existing.amountDue;
    const numAmountPaid = existing.amountPaid;
    const numAmountRemaining = Math.max(0, Number((numAmountDue - numAmountPaid).toFixed(2)));
    const status = numAmountPaid >= numAmountDue ? "PAID" : numAmountPaid > 0 ? "PARTIAL" : "PENDING";

    let computedDueDateStr = dueDateStr ?? existing.dueDateStr;
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        const months = [
          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        computedDueDateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
        period: period ?? existing.period,
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
        monthIndex: monthIndex !== undefined ? (monthIndex ? Number(monthIndex) : null) : existing.monthIndex,
        phoneLines: serializedPhoneLines,
        chequeNo: chequeNo !== undefined ? chequeNo : existing.chequeNo,
        chequeBank: chequeBank !== undefined ? chequeBank : existing.chequeBank,
      },
    });

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
    await prisma.schoolExpense.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gider silme hatası:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}

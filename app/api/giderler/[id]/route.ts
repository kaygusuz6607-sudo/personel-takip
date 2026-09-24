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

      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          amountRemaining: newAmountRemaining,
          status: newStatus,
          paymentHistory: JSON.stringify(history),
        },
      });

      return NextResponse.json(updated);
    }

    // Tamamını ödendi olarak işaretleme
    if (body.action === "MARK_PAID") {
      const updated = await prisma.schoolExpense.update({
        where: { id },
        data: {
          amountPaid: existing.amountDue,
          amountRemaining: 0,
          status: "PAID",
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
    } = body;

    const numAmountDue = amountDue !== undefined ? Number(amountDue) : existing.amountDue;
    const numAmountPaid = existing.amountPaid;
    const numAmountRemaining = Math.max(0, Number((numAmountDue - numAmountPaid).toFixed(2)));
    const status = numAmountPaid >= numAmountDue ? "PAID" : numAmountPaid > 0 ? "PARTIAL" : "PENDING";

    const updated = await prisma.schoolExpense.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        category: category ?? existing.category,
        subCategory: subCategory ?? existing.subCategory,
        period: period ?? existing.period,
        installmentInfo: installmentInfo !== undefined ? installmentInfo : existing.installmentInfo,
        dueDateStr: dueDateStr ?? existing.dueDateStr,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        amountDue: numAmountDue,
        amountRemaining: numAmountRemaining,
        status,
        periodStatus: periodStatus ?? existing.periodStatus,
        description: description ?? existing.description,
        isCommitment: isCommitment !== undefined ? Boolean(isCommitment) : existing.isCommitment,
        commitmentEndDate: commitmentEndDate ? new Date(commitmentEndDate) : existing.commitmentEndDate,
        commitmentMonths: commitmentMonths !== undefined ? Number(commitmentMonths) : existing.commitmentMonths,
      },
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
    await prisma.schoolExpense.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gider silme hatası:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const payments = await prisma.studentPayment.findMany({
      where: { studentId: id },
      orderBy: { installmentNo: "asc" },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("GET /api/ogrenciler/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Taksitler yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { paymentId, paidAmount, isPaid, paidDate, paymentMethod, receiptNo, notes } = body;

    // Eğer belirli bir taksiti ödendi yapıyorsak
    if (paymentId) {
      const updated = await prisma.studentPayment.update({
        where: { id: paymentId },
        data: {
          paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
          isPaid: isPaid !== undefined ? isPaid : undefined,
          paidDate: paidDate ? new Date(paidDate) : (isPaid ? new Date() : null),
          paymentMethod: paymentMethod || null,
          receiptNo: receiptNo?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      return NextResponse.json(updated);
    }

    // Yeni manuel taksit / ek ödeme kalemi ekleme
    const { installmentNo, title, dueDate, amount } = body;
    if (!amount || !dueDate) {
      return NextResponse.json(
        { error: "Tutar ve Vade Tarihi zorunludur." },
        { status: 400 }
      );
    }

    const newPayment = await prisma.studentPayment.create({
      data: {
        studentId: id,
        installmentNo: installmentNo ? parseInt(installmentNo) : 99,
        title: title || "Ek Taksit / Ödeme",
        dueDate: new Date(dueDate),
        amount: parseFloat(amount),
        paidAmount: 0,
        isPaid: false,
      },
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ogrenciler/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Ödeme işlemi kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      contractAmount,
      discountAmount,
      contractDiscountType,
      netAmount,
      installmentCount,
      contractItems,
      installments,
      notes,
    } = body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (contractAmount !== undefined) updateData.contractAmount = parseFloat(contractAmount);
      if (discountAmount !== undefined) updateData.discountAmount = parseFloat(discountAmount);
      if (contractDiscountType !== undefined) updateData.contractDiscountType = contractDiscountType;
      if (netAmount !== undefined) updateData.netAmount = parseFloat(netAmount);
      if (installmentCount !== undefined) updateData.installmentCount = parseInt(installmentCount);

      if (contractItems !== undefined) {
        let userNote = "";
        try {
          if (student.notes && student.notes.startsWith("{")) {
            const parsed = JSON.parse(student.notes);
            userNote = parsed.userNote || "";
          } else {
            userNote = student.notes || "";
          }
        } catch {}
        if (notes !== undefined) userNote = typeof notes === "string" ? notes : userNote;

        updateData.notes = JSON.stringify({
          contractItems: Array.isArray(contractItems) ? contractItems : [],
          userNote,
        });

        if (Array.isArray(contractItems)) {
          updateData.serviceUsed = contractItems.some((i: any) => i.type === "SERVICE");
          updateData.mealUsed = contractItems.some((i: any) => i.type === "MEAL");
        }
      }

      // Taksitleri senkronize et
      if (Array.isArray(installments)) {
        const incomingIds = new Set(installments.map((i: any) => i.id).filter(Boolean));

        // Daha önce kayıtlı olup silinmesi istenen ve ÖDENMEMİŞ olanları sil
        for (const existingPayment of student.payments) {
          if (!incomingIds.has(existingPayment.id)) {
            if (!existingPayment.isPaid && (!existingPayment.paidAmount || existingPayment.paidAmount === 0)) {
              await tx.studentPayment.delete({
                where: { id: existingPayment.id },
              });
            }
          }
        }

        // Güncellenecek veya yeni oluşturulacak taksitler
        for (let idx = 0; idx < installments.length; idx++) {
          const item = installments[idx];
          const instNo = item.installmentNo || (idx + 1);
          const parsedDueDate = new Date(item.dueDate);
          const parsedAmount = parseFloat(item.amount) || 0;

          if (item.id && student.payments.some((p) => p.id === item.id)) {
            // Mevcut taksit güncellemesi
            await tx.studentPayment.update({
              where: { id: item.id },
              data: {
                installmentNo: instNo,
                title: item.title || `${instNo}. Taksit`,
                dueDate: parsedDueDate,
                amount: parsedAmount,
                notes: item.notes !== undefined ? item.notes : undefined,
              },
            });
          } else {
            // Yeni taksit ekle
            await tx.studentPayment.create({
              data: {
                studentId: id,
                installmentNo: instNo,
                title: item.title || `${instNo}. Taksit`,
                dueDate: parsedDueDate,
                amount: parsedAmount,
                paidAmount: Number(item.paidAmount) || 0,
                isPaid: Boolean(item.isPaid),
                paidDate: item.paidDate ? new Date(item.paidDate) : null,
                paymentMethod: item.paymentMethod || null,
                receiptNo: item.receiptNo || null,
                notes: item.notes || null,
              },
            });
          }
        }

        updateData.installmentCount = installments.length;
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: updateData,
        include: {
          payments: {
            orderBy: { installmentNo: "asc" },
          },
          classroom: true,
        },
      });

      return updatedStudent;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/ogrenciler/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Sözleşme ve taksit planı güncellenirken hata oluştu: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId parametresi zorunludur" }, { status: 400 });
    }

    const payment = await prisma.studentPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.studentId !== id) {
      return NextResponse.json({ error: "Taksit bulunamadı" }, { status: 404 });
    }

    if (payment.isPaid || (payment.paidAmount && payment.paidAmount > 0)) {
      return NextResponse.json(
        { error: "Tahsilatı yapılmış bir taksit silinemez." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.studentPayment.delete({ where: { id: paymentId } });
      const remainingCount = await tx.studentPayment.count({ where: { studentId: id } });
      await tx.student.update({
        where: { id },
        data: { installmentCount: remainingCount },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/ogrenciler/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Taksit silinirken hata oluştu." },
      { status: 500 }
    );
  }
}


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

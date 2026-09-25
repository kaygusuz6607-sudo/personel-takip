import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await prisma.thirdPartyAccount.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Hesap bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, phone, tcNo, iban, notes } = body;

    const updated = await prisma.thirdPartyAccount.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        tcNo: tcNo !== undefined ? (tcNo ? tcNo.trim() : null) : undefined,
        iban: iban !== undefined ? (iban ? iban.trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.thirdPartyAccount.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

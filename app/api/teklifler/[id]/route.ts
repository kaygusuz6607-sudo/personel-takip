import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const quote = await prisma.priceQuote.findUnique({
      where: { id: params.id },
    });

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Teklif getirilemedi" }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();

    const {
      parentName,
      studentName,
      phone,
      email,
      title,
      schoolName,
      schoolAddress,
      schoolPhone,
      date,
      items,
      grossTotal,
      discountTotal,
      netTotal,
      kdvPercent,
      kdvTotal,
      grandTotal,
      policyNotes,
      bankInfo,
      bankCampaigns,
      includeStamp,
      status,
      notes,
    } = body;

    const updated = await prisma.priceQuote.update({
      where: { id: params.id },
      data: {
        ...(parentName ? { parentName } : {}),
        ...(studentName !== undefined ? { studentName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(schoolName !== undefined ? { schoolName } : {}),
        ...(schoolAddress !== undefined ? { schoolAddress } : {}),
        ...(schoolPhone !== undefined ? { schoolPhone } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(items !== undefined ? { items: typeof items === "string" ? items : JSON.stringify(items) } : {}),
        ...(grossTotal !== undefined ? { grossTotal: Number(grossTotal) } : {}),
        ...(discountTotal !== undefined ? { discountTotal: Number(discountTotal) } : {}),
        ...(netTotal !== undefined ? { netTotal: Number(netTotal) } : {}),
        ...(kdvPercent !== undefined ? { kdvPercent: Number(kdvPercent) } : {}),
        ...(kdvTotal !== undefined ? { kdvTotal: Number(kdvTotal) } : {}),
        ...(grandTotal !== undefined ? { grandTotal: Number(grandTotal) } : {}),
        ...(policyNotes !== undefined ? { policyNotes } : {}),
        ...(bankInfo !== undefined ? { bankInfo } : {}),
        ...(bankCampaigns !== undefined ? { bankCampaigns: typeof bankCampaigns === "string" ? bankCampaigns : JSON.stringify(bankCampaigns) } : {}),
        ...(includeStamp !== undefined ? { includeStamp: Boolean(includeStamp) } : {}),
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Teklif güncelleme hatası:", error);
    return NextResponse.json({ error: "Teklif güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await prisma.priceQuote.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Teklif silinemedi" }, { status: 500 });
  }
}

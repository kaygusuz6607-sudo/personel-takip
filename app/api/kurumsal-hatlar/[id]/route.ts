import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCorporatePhoneLinesTable, CorporatePhoneLineRow } from "@/lib/corporate-lines";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCorporatePhoneLinesTable();
    const { id } = await params;
    const body = await request.json();

    const existing = (await prisma.$queryRawUnsafe(
      `SELECT * FROM CorporatePhoneLine WHERE id = ? LIMIT 1`,
      id
    )) as CorporatePhoneLineRow[];

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Hat bulunamadı." }, { status: 404 });
    }

    const current = existing[0];
    const nowISO = new Date().toISOString();

    const {
      phoneNumber = current.phoneNumber,
      userName = current.userName,
      operator = current.operator,
      packageName = current.packageName,
      monthlyFee = current.monthlyFee,
      startDate = current.startDate,
      endDate = current.endDate,
      commitmentMonths = current.commitmentMonths,
      status = current.status,
      simCardNo = current.simCardNo,
      notes = current.notes,
    } = body;

    await prisma.$executeRawUnsafe(
      `UPDATE CorporatePhoneLine SET
         phoneNumber = ?,
         userName = ?,
         operator = ?,
         packageName = ?,
         monthlyFee = ?,
         startDate = ?,
         endDate = ?,
         commitmentMonths = ?,
         status = ?,
         simCardNo = ?,
         notes = ?,
         updatedAt = ?
       WHERE id = ?`,
      phoneNumber ? phoneNumber.trim() : current.phoneNumber,
      userName ? userName.trim() : current.userName,
      operator ? operator.trim() : current.operator,
      packageName !== undefined ? packageName : current.packageName,
      Number(monthlyFee) || 0,
      startDate !== undefined ? startDate : current.startDate,
      endDate !== undefined ? endDate : current.endDate,
      Number(commitmentMonths) || 12,
      status || current.status,
      simCardNo !== undefined ? simCardNo : current.simCardNo,
      notes !== undefined ? notes : current.notes,
      nowISO,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hat güncellenirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCorporatePhoneLinesTable();
    const { id } = await params;

    await prisma.$executeRawUnsafe(
      `DELETE FROM CorporatePhoneLine WHERE id = ?`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hat silinirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "ALL";

    const where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }

    if (q.trim()) {
      where.OR = [
        { parentName: { contains: q, mode: "insensitive" } },
        { studentName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { quoteNo: { contains: q, mode: "insensitive" } },
      ];
    }

    const quotes = await prisma.priceQuote.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Teklif listesi hatası:", error);
    return NextResponse.json({ error: "Teklifler alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      parentName,
      studentName = "",
      phone = "",
      email = "",
      title = "2026 - 2027 Eğitim Öğretim Yılı mevcut aya özel erken kayıt ücretlerimizi bilgilerinize sunarız.",
      schoolName = "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ",
      schoolAddress = "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ",
      schoolPhone = "0(352) 503 91 93 - 0(537) 380 0 380",
      date,
      items = [],
      grossTotal = 0,
      discountTotal = 0,
      netTotal = 0,
      kdvPercent = 0,
      kdvTotal = 0,
      grandTotal = 0,
      policyNotes = "",
      bankInfo = "",
      bankCampaigns = [],
      includeStamp = true,
      status = "DRAFT",
      notes = "",
      leadId,
      studentId,
    } = body;

    if (!parentName || !parentName.trim()) {
      return NextResponse.json({ error: "Veli adı soyadı zorunludur" }, { status: 400 });
    }

    // Teklif No Üret (Örn: TKL-2026-0001)
    const currentYear = new Date().getFullYear();
    const count = await prisma.priceQuote.count();
    const quoteNo = `TKL-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    const newQuote = await prisma.priceQuote.create({
      data: {
        quoteNo,
        date: date ? new Date(date) : new Date(),
        schoolName,
        schoolAddress,
        schoolPhone,
        parentName,
        studentName,
        phone,
        email,
        title,
        items: typeof items === "string" ? items : JSON.stringify(items),
        grossTotal: Number(grossTotal) || 0,
        discountTotal: Number(discountTotal) || 0,
        netTotal: Number(netTotal) || 0,
        kdvPercent: Number(kdvPercent) || 0,
        kdvTotal: Number(kdvTotal) || 0,
        grandTotal: Number(grandTotal) || 0,
        policyNotes: policyNotes || "",
        bankInfo: bankInfo || "",
        bankCampaigns: typeof bankCampaigns === "string" ? bankCampaigns : JSON.stringify(bankCampaigns),
        includeStamp: includeStamp !== undefined ? Boolean(includeStamp) : true,
        status,
        notes: notes || "",
        leadId: leadId || null,
        studentId: studentId || null,
      },
    });

    return NextResponse.json(newQuote, { status: 201 });
  } catch (error) {
    console.error("Teklif oluşturma hatası:", error);
    return NextResponse.json({ error: "Teklif kaydedilemedi" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.assetTracking.findMany({
      orderBy: [{ inspectionDate: "asc" }, { kaskoDate: "asc" }, { createdAt: "desc" }],
    });

    const now = new Date();
    // 10 gün kala veya geçmiş olan uyarıları hesapla
    const calculateUrgency = (date: Date | null) => {
      if (!date) return null;
      const target = new Date(date);
      const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const assetsWithAlerts = assets.map((a) => {
      const inspDays = calculateUrgency(a.inspectionDate);
      const insDays = calculateUrgency(a.insuranceDate);
      const kaskoDays = calculateUrgency(a.kaskoDate);
      const houseDays = calculateUrgency(a.housingDate);

      const hasWarning =
        (inspDays !== null && inspDays <= 10) ||
        (insDays !== null && insDays <= 10) ||
        (kaskoDays !== null && kaskoDays <= 10) ||
        (houseDays !== null && houseDays <= 10);

      return {
        ...a,
        inspDays,
        insDays,
        kaskoDays,
        houseDays,
        hasWarning,
      };
    });

    const warningCount = assetsWithAlerts.filter((a) => a.hasWarning).length;

    return NextResponse.json({ assets: assetsWithAlerts, warningCount });
  } catch (error: any) {
    console.error("Varlık listesi hatası:", error);
    return NextResponse.json({ error: "Kayıtlar alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      assetType = "VEHICLE",
      owner = "",
      inspectionDate,
      insuranceDate,
      kaskoDate,
      housingDate,
      notes = "",
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Plaka veya varlık adı zorunludur" }, { status: 400 });
    }

    const newAsset = await prisma.assetTracking.create({
      data: {
        title,
        assetType,
        owner,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
        insuranceDate: insuranceDate ? new Date(insuranceDate) : null,
        kaskoDate: kaskoDate ? new Date(kaskoDate) : null,
        housingDate: housingDate ? new Date(housingDate) : null,
        notes,
      },
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error("Varlık ekleme hatası:", error);
    return NextResponse.json({ error: error?.message || "Kayıt oluşturulamadı" }, { status: 500 });
  }
}

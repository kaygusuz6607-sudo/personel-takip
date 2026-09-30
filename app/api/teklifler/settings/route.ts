import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.quoteSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.quoteSetting.create({
        data: {
          id: "default",
          academicYear: "2026-2027",
          educationPrice: 176000,
          diningPrice: 80000,
          stationeryPrice: 65000,
          summerPrice: 45000,
          schoolName: "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ",
          schoolAddress: "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ",
          schoolPhone: "0(352) 503 91 93 - 0(537) 380 0 380",
        },
      });
    }

    const scheduleRecord = await prisma.quoteSetting.findUnique({
      where: { id: "monthly_schedule" },
    });

    let monthlyScheduleData = null;
    if (scheduleRecord?.policyNotes) {
      try {
        monthlyScheduleData = JSON.parse(scheduleRecord.policyNotes);
      } catch {}
    }

    return NextResponse.json({
      ...setting,
      monthlyScheduleData,
    });
  } catch (error) {
    console.error("Fiyat ayarları alma hatası:", error);
    return NextResponse.json(
      {
        id: "default",
        academicYear: "2026-2027",
        educationPrice: 176000,
        diningPrice: 80000,
        stationeryPrice: 65000,
        summerPrice: 45000,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      academicYear = "2026-2027",
      educationPrice = 176000,
      diningPrice = 80000,
      stationeryPrice = 65000,
      summerPrice = 45000,
      schoolName,
      schoolAddress,
      schoolPhone,
      bankCampaigns,
      policyNotes,
      monthlyScheduleData,
    } = body;

    const setting = await prisma.quoteSetting.upsert({
      where: { id: "default" },
      update: {
        academicYear,
        educationPrice: Number(educationPrice) || 0,
        diningPrice: Number(diningPrice) || 0,
        stationeryPrice: Number(stationeryPrice) || 0,
        summerPrice: Number(summerPrice) || 0,
        ...(schoolName && { schoolName }),
        ...(schoolAddress && { schoolAddress }),
        ...(schoolPhone && { schoolPhone }),
        ...(bankCampaigns && {
          bankCampaigns: typeof bankCampaigns === "string" ? bankCampaigns : JSON.stringify(bankCampaigns),
        }),
        ...(policyNotes && {
          policyNotes: typeof policyNotes === "string" ? policyNotes : JSON.stringify(policyNotes),
        }),
      },
      create: {
        id: "default",
        academicYear,
        educationPrice: Number(educationPrice) || 0,
        diningPrice: Number(diningPrice) || 0,
        stationeryPrice: Number(stationeryPrice) || 0,
        summerPrice: Number(summerPrice) || 0,
        schoolName: schoolName || "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ",
        schoolAddress: schoolAddress || "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ",
        schoolPhone: schoolPhone || "0(352) 503 91 93 - 0(537) 380 0 380",
        bankCampaigns: bankCampaigns
          ? typeof bankCampaigns === "string"
            ? bankCampaigns
            : JSON.stringify(bankCampaigns)
          : null,
        policyNotes: policyNotes
          ? typeof policyNotes === "string"
            ? policyNotes
            : JSON.stringify(policyNotes)
          : null,
      },
    });

    if (monthlyScheduleData) {
      const jsonStr =
        typeof monthlyScheduleData === "string" ? monthlyScheduleData : JSON.stringify(monthlyScheduleData);
      await prisma.quoteSetting.upsert({
        where: { id: "monthly_schedule" },
        update: {
          academicYear,
          policyNotes: jsonStr,
        },
        create: {
          id: "monthly_schedule",
          academicYear,
          educationPrice: Number(educationPrice) || 176000,
          diningPrice: Number(diningPrice) || 80000,
          stationeryPrice: Number(stationeryPrice) || 65000,
          summerPrice: Number(summerPrice) || 45000,
          policyNotes: jsonStr,
        },
      });
    }

    return NextResponse.json({
      ...setting,
      monthlyScheduleData,
    });
  } catch (error) {
    console.error("Fiyat ayarları kaydetme hatası:", error);
    return NextResponse.json({ error: "Fiyat ayarları kaydedilemedi" }, { status: 500 });
  }
}

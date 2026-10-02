import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_MONTHLY_SCHEDULE_DATA = {
  masterPrices: {
    academicYear: "2026-2027",
    educationPrice: 220000,
    diningPrice: 80000,
    stationeryPrice: 65000,
    stationeryProportionalPrice: 40000,
    publicationFixedPrice: 25000,
    totalServiceDays: 183.5,
    summerPrice: 45000,
  },
  monthlyPrices: [
    { id: "m1", year: "2026", monthName: "Eylül", month: "Eylül 2026", remainingDays: 183.5, education: 220000, dining: 80000, stationeryTotal: 65000, stationeryProportional: 40000, publicationFixed: 25000, totalPrice: 365000, roundedPrice: 365000 },
    { id: "m2", year: "2026", monthName: "Ekim", month: "Ekim 2026", remainingDays: 165.5, education: 200000, dining: 72000, stationeryTotal: 60000, stationeryProportional: 35000, publicationFixed: 25000, totalPrice: 332000, roundedPrice: 332000 },
    { id: "m3", year: "2026", monthName: "Kasım", month: "Kasım 2026", remainingDays: 145, education: 175000, dining: 64000, stationeryTotal: 55000, stationeryProportional: 30000, publicationFixed: 25000, totalPrice: 294000, roundedPrice: 294000 },
    { id: "m4", year: "2026", monthName: "Aralık", month: "Aralık 2026", remainingDays: 129, education: 156250, dining: 58000, stationeryTotal: 50000, stationeryProportional: 25000, publicationFixed: 25000, totalPrice: 264250, roundedPrice: 264000 },
    { id: "m5", year: "2027", monthName: "Ocak", month: "Ocak 2027", remainingDays: 106, education: 127500, dining: 49000, stationeryTotal: 45000, stationeryProportional: 20000, publicationFixed: 25000, totalPrice: 221500, roundedPrice: 222000 },
    { id: "m6", year: "2027", monthName: "Şubat", month: "Şubat 2027", remainingDays: 91, education: 112500, dining: 42000, stationeryTotal: 40000, stationeryProportional: 15000, publicationFixed: 25000, totalPrice: 194500, roundedPrice: 195000 },
    { id: "m7", year: "2027", monthName: "Mart", month: "Mart 2027", remainingDays: 76, education: 93750, dining: 38000, stationeryTotal: 35000, stationeryProportional: 10000, publicationFixed: 25000, totalPrice: 166750, roundedPrice: 167000 },
    { id: "m8", year: "2027", monthName: "Nisan", month: "Nisan 2027", remainingDays: 58, education: 72500, dining: 32000, stationeryTotal: 30000, stationeryProportional: 5000, publicationFixed: 25000, totalPrice: 134500, roundedPrice: 135000 },
    { id: "m9", year: "2027", monthName: "Mayıs", month: "Mayıs 2027", remainingDays: 37, education: 47500, dining: 25000, stationeryTotal: 25000, stationeryProportional: 0, publicationFixed: 25000, totalPrice: 97500, roundedPrice: 98000 },
    { id: "m10", year: "2027", monthName: "Haziran", month: "Haziran 2027", remainingDays: 19, education: 22500, dining: 10000, stationeryTotal: 15000, stationeryProportional: 2500, publicationFixed: 12500, totalPrice: 47500, roundedPrice: 48000 }
  ]
};

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
          educationPrice: 220000,
          diningPrice: 80000,
          stationeryPrice: 65000,
          summerPrice: 45000,
          schoolName: "ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ",
          schoolAddress: "ESENYURT MAH. YAVUZ CAD. PRESTİJ SİT. B BLOK NO:17/A MELİKGAZİ / KAYSERİ",
          schoolPhone: "0(352) 503 91 93 - 0(537) 380 0 380",
        },
      });
    }

    let scheduleRecord = await prisma.quoteSetting.findUnique({
      where: { id: "monthly_schedule" },
    });

    let monthlyScheduleData = null;
    if (scheduleRecord?.policyNotes) {
      try {
        monthlyScheduleData = JSON.parse(scheduleRecord.policyNotes);
      } catch {}
    }

    if (!monthlyScheduleData) {
      monthlyScheduleData = DEFAULT_MONTHLY_SCHEDULE_DATA;
      try {
        await prisma.quoteSetting.upsert({
          where: { id: "monthly_schedule" },
          update: {
            academicYear: "2026-2027",
            educationPrice: 220000,
            diningPrice: 80000,
            stationeryPrice: 65000,
            summerPrice: 45000,
            policyNotes: JSON.stringify(DEFAULT_MONTHLY_SCHEDULE_DATA),
          },
          create: {
            id: "monthly_schedule",
            academicYear: "2026-2027",
            educationPrice: 220000,
            diningPrice: 80000,
            stationeryPrice: 65000,
            summerPrice: 45000,
            policyNotes: JSON.stringify(DEFAULT_MONTHLY_SCHEDULE_DATA),
          },
        });
      } catch (err) {
        console.warn("Failed to auto-create monthly_schedule record:", err);
      }
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
        educationPrice: 220000,
        diningPrice: 80000,
        stationeryPrice: 65000,
        summerPrice: 45000,
        monthlyScheduleData: DEFAULT_MONTHLY_SCHEDULE_DATA,
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
      educationPrice = 220000,
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
          educationPrice: Number(educationPrice) || 220000,
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

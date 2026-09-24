import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDuration } from "@/lib/date-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    const where: any = {};
    if (staffId) where.staffId = staffId;

    const leaves = await prisma.leaveRecord.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            tcNo: true,
            title: true,
            hireDate: true,
            departments: { include: { department: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Her personelin tatil telafi izni, yıllık izin hak edişi ve tüm geçmiş izin kayıtları
    const staffs = await prisma.staff.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        tcNo: true,
        title: true,
        hireDate: true,
        departments: { include: { department: true } },
        leaves: {
          orderBy: { startDate: "desc" },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const staffSummaries = staffs.map((s) => {
      // 1. Resmi Tatil 1'e 1 Telafi İzni Toplamı
      const holidayEarned = s.leaves
        .filter((l) => l.leaveType === "HOLIDAY_COMPENSATION" && l.status === "APPROVED")
        .reduce((sum, l) => sum + l.daysCount, 0);

      // 2. Kullanılan Yıllık İzin
      const annualUsed = s.leaves
        .filter((l) => l.leaveType === "ANNUAL" && l.status === "APPROVED")
        .reduce((sum, l) => sum + l.daysCount, 0);

      // 3. Sağlık / Rapor İzni
      const sickUsed = s.leaves
        .filter((l) => l.leaveType === "SICK" && l.status === "APPROVED")
        .reduce((sum, l) => sum + l.daysCount, 0);

      // 4. Mazeret İzni
      const excuseUsed = s.leaves
        .filter((l) => l.leaveType === "EXCUSE" && l.status === "APPROVED")
        .reduce((sum, l) => sum + l.daysCount, 0);

      // 5. Ücretsiz İzin
      const unpaidUsed = s.leaves
        .filter((l) => l.leaveType === "UNPAID" && l.status === "APPROVED")
        .reduce((sum, l) => sum + l.daysCount, 0);

      // 6. Hak Edilen Yıllık İzin (Kıdeme göre: 1-5 yıl: 14 gün, 5-15 yıl: 20 gün, 15+ yıl: 26 gün)
      let annualRate = 14;
      if (s.hireDate) {
        const yearsWorked =
          (new Date().getTime() - new Date(s.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (yearsWorked < 1) {
          annualRate = 14;
        } else if (yearsWorked <= 5) {
          annualRate = 14;
        } else if (yearsWorked <= 15) {
          annualRate = 20;
        } else {
          annualRate = 26;
        }
      }

      const annualEntitled = annualRate;
      const annualRemaining = Math.max(0, annualEntitled - annualUsed);
      const totalAvailableDays = annualRemaining + holidayEarned;
      const seniorityText = calculateDuration(s.hireDate, null);

      return {
        staffId: s.id,
        fullName: s.fullName,
        tcNo: s.tcNo,
        title: s.title || "Öğretmen / Personel",
        hireDate: s.hireDate,
        departments: s.departments.map((d) => d.department.name),
        seniorityText,
        annualRate,
        annualEntitled,
        annualUsed,
        annualRemaining,
        holidayCompensationDays: holidayEarned,
        totalAvailableDays,
        sickUsed,
        excuseUsed,
        unpaidUsed,
        totalUsedAllLeaves: annualUsed + sickUsed + excuseUsed + unpaidUsed,
        leaves: s.leaves,
      };
    });

    return NextResponse.json({ leaves, staffSummaries });
  } catch (error) {
    console.error("İzin listesi hatası:", error);
    return NextResponse.json({ error: "İzinler alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      leaveType, // ANNUAL, SICK, HOLIDAY_COMPENSATION, EXCUSE, UNPAID
      startDate,
      endDate,
      daysCount,
      description,
      status = "APPROVED",
    } = body;

    if (!staffId || !startDate || !endDate || !daysCount) {
      return NextResponse.json({ error: "Lütfen zorunlu alanları doldurunuz" }, { status: 400 });
    }

    const created = await prisma.leaveRecord.create({
      data: {
        staffId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: Number(daysCount),
        description,
        status,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("İzin kaydı hatası:", error);
    return NextResponse.json({ error: error?.message || "İzin kaydedilemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    await prisma.leaveRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "İzin silinemedi" }, { status: 500 });
  }
}

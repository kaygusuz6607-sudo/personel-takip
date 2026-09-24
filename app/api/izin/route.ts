import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDuration, calculateAnnualLeaveEntitlement } from "@/lib/date-utils";
import { calculatePayroll } from "@/lib/payroll-calculator";

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

      // 6. Hak Edilen Yıllık İzin (Kıdeme göre: tamamlanan her yıl toplanır, örn: 2 yıl için 14+14 = 28 gün)
      const { completedYears, annualRate, annualEntitled } = calculateAnnualLeaveEntitlement(s.hireDate);
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
        completedYears,
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

async function syncLeaveWithPayroll(staffId: string, date: Date) {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const leaves = await prisma.leaveRecord.findMany({
      where: {
        staffId,
        status: "APPROVED",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
    });

    const reportDays = leaves
      .filter((l) => l.leaveType === "SICK")
      .reduce((sum, l) => sum + l.daysCount, 0);

    const unpaidLeaveDays = leaves
      .filter((l) => l.leaveType === "UNPAID")
      .reduce((sum, l) => sum + l.daysCount, 0);

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { salaryConfig: true },
    });

    if (!staff || !staff.salaryConfig) return;

    const existing = await prisma.payroll.findUnique({
      where: {
        staffId_year_month: { staffId, year, month },
      },
    });

    const config = staff.salaryConfig;
    const calc = calculatePayroll({
      salaryType: config.salaryType,
      monthlySalary: config.monthlySalary,
      hourlyRate: config.hourlyRate,
      dailyRate: config.dailyRate,
      officialSalaryPart: config.officialSalaryPart,
      year,
      month,
      hireDate: staff.hireDate,
      mebAssignmentDate: staff.mebAssignmentDate,
      sgkStartDate: staff.sgkStartDate,
      workDays: existing?.workDays || 30,
      reportDays,
      unpaidLeaveDays,
      lessonHours: existing?.lessonHours || 0,
      dailyWorkDays: existing?.dailyWorkDays || 0,
      holidayWorkDays: existing?.holidayWorkDays || 0,
      holidayChoice: existing?.holidayChoice || "LEAVE_1_TO_1",
      bonusAmount: existing?.bonusAmount || 0,
      bonusDescription: existing?.bonusDescription || "",
      deductionAmount: existing?.deductionAmount || 0,
      deductionDescription: existing?.deductionDescription || "",
    });

    await prisma.payroll.upsert({
      where: {
        staffId_year_month: { staffId, year, month },
      },
      update: {
        reportDays,
        unpaidLeaveDays,
        baseEarned: calc.baseEarned,
        grossTotal: calc.grossTotal,
        totalDeductions: calc.totalDeductions,
        netTotal: calc.netTotal,
        officialAmount: calc.officialAmount,
        unofficialAmount: calc.unofficialAmount,
      },
      create: {
        staffId,
        year,
        month,
        workDays: 30,
        reportDays,
        unpaidLeaveDays,
        lessonHours: 0,
        dailyWorkDays: 0,
        holidayWorkDays: 0,
        holidayChoice: "LEAVE_1_TO_1",
        baseEarned: calc.baseEarned,
        hourlyEarned: calc.hourlyEarned,
        dailyEarned: calc.dailyEarned,
        holidayEarned: calc.holidayEarned,
        bonusAmount: 0,
        deductionAmount: 0,
        grossTotal: calc.grossTotal,
        totalDeductions: calc.totalDeductions,
        netTotal: calc.netTotal,
        officialAmount: calc.officialAmount,
        unofficialAmount: calc.unofficialAmount,
        isPaid: false,
      },
    });
  } catch (err) {
    console.error("syncLeaveWithPayroll error:", err);
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

    // Otomatik Bordro & Ödeme Senkronizasyonu
    await syncLeaveWithPayroll(staffId, new Date(startDate));

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

    const existingLeave = await prisma.leaveRecord.findUnique({ where: { id } });
    if (!existingLeave) return NextResponse.json({ error: "İzin bulunamadı" }, { status: 404 });

    await prisma.leaveRecord.delete({ where: { id } });

    // Otomatik Bordro & Ödeme Senkronizasyonu
    await syncLeaveWithPayroll(existingLeave.staffId, existingLeave.startDate);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "İzin silinemedi" }, { status: 500 });
  }
}

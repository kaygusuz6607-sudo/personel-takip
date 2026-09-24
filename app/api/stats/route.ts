import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalStaff = await prisma.staff.count();
    const activeStaff = await prisma.staff.count({ where: { status: "ACTIVE" } });
    const passiveStaff = await prisma.staff.count({ where: { status: "PASSIVE" } });
    const onLeaveStaff = await prisma.staff.count({ where: { status: "ON_LEAVE" } });

    // Departman dağılımı
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { staffs: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Son eklenen personeller
    const recentStaff = await prisma.staff.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        departments: {
          include: { department: true },
        },
        salaryConfig: true,
      },
    });

    // Güncel ayın bordro özeti (Örn: en son bordro ayı)
    const latestPayroll = await prisma.payroll.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    let currentMonthStats = {
      grossTotal: 0,
      totalDeductions: 0,
      netTotal: 0,
      paidCount: 0,
      pendingCount: 0,
      month: latestPayroll?.month || 8,
      year: latestPayroll?.year || 2024,
    };

    if (latestPayroll) {
      const payrolls = await prisma.payroll.findMany({
        where: {
          year: latestPayroll.year,
          month: latestPayroll.month,
        },
      });

      currentMonthStats.grossTotal = payrolls.reduce((acc, p) => acc + p.grossTotal, 0);
      currentMonthStats.totalDeductions = payrolls.reduce((acc, p) => acc + (p.deductionAmount || 0), 0);
      currentMonthStats.netTotal = payrolls.reduce((acc, p) => acc + p.netTotal, 0);
      currentMonthStats.paidCount = payrolls.filter((p) => p.isPaid).length;
      currentMonthStats.pendingCount = payrolls.filter((p) => !p.isPaid).length;
    }

    return NextResponse.json({
      totalStaff,
      activeStaff,
      passiveStaff,
      onLeaveStaff,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        count: d._count.staffs,
      })),
      recentStaff,
      currentMonthStats,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "İstatistikler alınamadı" }, { status: 500 });
  }
}

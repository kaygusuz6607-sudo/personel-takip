import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateOfficialSplit } from "@/lib/payroll-calculator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const year = parseInt(searchParams.get("year") || String(currentYear));
    const month = parseInt(searchParams.get("month") || String(currentMonth));
    const status = searchParams.get("status") || "ALL"; // ALL, PAID, PENDING

    const where: any = { year, month };
    if (status === "PAID") where.isPaid = true;
    if (status === "PENDING") where.isPaid = false;

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        staff: {
          include: {
            departments: { include: { department: true } },
            salaryConfig: true,
          },
        },
      },
      orderBy: { staff: { fullName: "asc" } },
    });

    // Her personelin atama tarihine göre elden ve resmi banka tutarını dinamik hesapla
    const updatedPayrolls = payrolls.map((p) => {
      const split = calculateOfficialSplit({
        netTotal: p.netTotal,
        monthlySalary: p.staff.salaryConfig?.monthlySalary || 0,
        year: p.year,
        month: p.month,
        hireDate: p.staff.hireDate,
        mebAssignmentDate: p.staff.mebAssignmentDate,
        sgkStartDate: p.staff.sgkStartDate,
        officialSalaryPart: p.staff.salaryConfig?.officialSalaryPart || 0,
        reportDays: p.reportDays,
      });

      return {
        ...p,
        officialAmount: split.officialAmount,
        unofficialAmount: split.unofficialAmount,
      };
    });

    // Toplamlar (Edutime alt çubuğu)
    const brütToplam = updatedPayrolls.reduce((sum, p) => sum + p.grossTotal, 0);
    const toplamKesinti = updatedPayrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
    const netOdeme = updatedPayrolls.reduce((sum, p) => sum + p.netTotal, 0);
    const resmiToplam = updatedPayrolls.reduce((sum, p) => sum + p.officialAmount, 0);
    const eldenToplam = updatedPayrolls.reduce((sum, p) => sum + p.unofficialAmount, 0);
    const odenenTutar = updatedPayrolls
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.netTotal, 0);
    const bekleyenTutar = netOdeme - odenenTutar;

    return NextResponse.json({
      payrolls: updatedPayrolls,
      totals: {
        brütToplam,
        toplamKesinti,
        netOdeme,
        resmiToplam,
        eldenToplam,
        odenenTutar,
        bekleyenTutar,
        toplamPersonel: updatedPayrolls.length,
        odenenPersonel: updatedPayrolls.filter((p) => p.isPaid).length,
      },
    });
  } catch (error) {
    console.error("Ödeme listesi hatası:", error);
    return NextResponse.json({ error: "Ödeme verileri alınamadı" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isPaid } = await request.json();
    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        isPaid: Boolean(isPaid),
        paidDate: isPaid ? new Date() : null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ödeme güncelleme hatası:", error);
    return NextResponse.json({ error: "Ödeme durumu güncellenemedi" }, { status: 500 });
  }
}

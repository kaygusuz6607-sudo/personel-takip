import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "2024");
    const month = parseInt(searchParams.get("month") || "8");
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

    // Toplamlar (Edutime alt çubuğu)
    const allMonthPayrolls = await prisma.payroll.findMany({
      where: { year, month },
    });

    const brütToplam = allMonthPayrolls.reduce((sum, p) => sum + p.grossTotal, 0);
    const toplamKesinti = allMonthPayrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
    const netOdeme = allMonthPayrolls.reduce((sum, p) => sum + p.netTotal, 0);
    const odenenTutar = allMonthPayrolls
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.netTotal, 0);
    const bekleyenTutar = netOdeme - odenenTutar;

    return NextResponse.json({
      payrolls,
      totals: {
        brütToplam,
        toplamKesinti,
        netOdeme,
        odenenTutar,
        bekleyenTutar,
        toplamPersonel: allMonthPayrolls.length,
        odenenPersonel: allMonthPayrolls.filter((p) => p.isPaid).length,
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

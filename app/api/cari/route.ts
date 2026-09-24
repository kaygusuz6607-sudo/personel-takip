import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateOfficialSplit } from "@/lib/payroll-calculator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    // 1. Tüm personellerin temel listesi ve cari özetleri (Sol/Üst seçim listesi için)
    const allStaff = await prisma.staff.findMany({
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
        payrolls: {
          select: {
            id: true,
            year: true,
            month: true,
            netTotal: true,
            grossTotal: true,
            officialAmount: true,
            unofficialAmount: true,
            bonusAmount: true,
            deductionAmount: true,
            isPaid: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const staffSummaries = allStaff.map((s) => {
      const totalNet = s.payrolls.reduce((sum, p) => sum + p.netTotal, 0);
      const totalPaid = s.payrolls.filter((p) => p.isPaid).reduce((sum, p) => sum + p.netTotal, 0);
      const totalPending = s.payrolls.filter((p) => !p.isPaid).reduce((sum, p) => sum + p.netTotal, 0);
      const totalBank = s.payrolls.reduce((sum, p) => sum + p.officialAmount, 0);
      const totalCash = s.payrolls.reduce((sum, p) => sum + p.unofficialAmount, 0);

      return {
        id: s.id,
        fullName: s.fullName,
        tcNo: s.tcNo,
        title: s.title || s.departments[0]?.department?.name || "Personel",
        status: s.status,
        hireDate: s.hireDate,
        totalNet,
        totalPaid,
        totalPending,
        totalBank,
        totalCash,
        payrollCount: s.payrolls.length,
      };
    });

    // Eğer staffId belirtilmemişse ilk personeli seç veya sadece özet listeyi dön
    const targetStaffId = staffId || (staffSummaries.length > 0 ? staffSummaries[0].id : null);

    if (!targetStaffId) {
      return NextResponse.json({
        staffSummaries: [],
        selectedStaff: null,
        payrolls: [],
        allTimeTotals: null,
      });
    }

    // 2. Seçilen personelin işe başladığı günden bugüne TÜM detaylı bordro ve cari hareketleri
    const staff = await prisma.staff.findUnique({
      where: { id: targetStaffId },
      include: {
        departments: { include: { department: true } },
        salaryConfig: true,
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    // Her dönemin banka (resmî) ve elden (nakit) ayrımını atama tarihine göre kesin hesapla
    const detailedPayrolls = staff.payrolls.map((p) => {
      const split = calculateOfficialSplit({
        netTotal: p.netTotal,
        monthlySalary: staff.salaryConfig?.monthlySalary || 0,
        year: p.year,
        month: p.month,
        hireDate: staff.hireDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        sgkStartDate: staff.sgkStartDate,
        officialSalaryPart: staff.salaryConfig?.officialSalaryPart || 0,
        reportDays: p.reportDays,
      });

      return {
        ...p,
        officialAmount: split.officialAmount,
        unofficialAmount: split.unofficialAmount,
      };
    });

    // Tüm zamanlar kümülatif toplamları
    const allTimeTotals = {
      totalGross: detailedPayrolls.reduce((sum, p) => sum + p.grossTotal, 0),
      totalNet: detailedPayrolls.reduce((sum, p) => sum + p.netTotal, 0),
      totalBank: detailedPayrolls.reduce((sum, p) => sum + p.officialAmount, 0),
      totalCash: detailedPayrolls.reduce((sum, p) => sum + p.unofficialAmount, 0),
      totalBonus: detailedPayrolls.reduce((sum, p) => sum + p.bonusAmount, 0),
      totalDeduction: detailedPayrolls.reduce((sum, p) => sum + p.deductionAmount, 0),
      totalPaid: detailedPayrolls.filter((p) => p.isPaid).reduce((sum, p) => sum + p.netTotal, 0),
      totalPending: detailedPayrolls.filter((p) => !p.isPaid).reduce((sum, p) => sum + p.netTotal, 0),
      payrollCount: detailedPayrolls.length,
      paidCount: detailedPayrolls.filter((p) => p.isPaid).length,
      pendingCount: detailedPayrolls.filter((p) => !p.isPaid).length,
    };

    return NextResponse.json({
      staffSummaries,
      selectedStaff: {
        id: staff.id,
        fullName: staff.fullName,
        tcNo: staff.tcNo,
        phone: staff.phone,
        email: staff.email,
        iban: staff.iban,
        accountNumber: staff.accountNumber,
        title: staff.title,
        status: staff.status,
        hireDate: staff.hireDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        sgkStartDate: staff.sgkStartDate,
        unofficialWorkPeriod: staff.unofficialWorkPeriod,
        departments: staff.departments.map((d) => d.department.name),
        salaryConfig: staff.salaryConfig,
      },
      payrolls: detailedPayrolls,
      allTimeTotals,
    });
  } catch (error: any) {
    console.error("Cari verisi alınırken hata:", error);
    return NextResponse.json(
      { error: "Cari verisi alınamadı: " + error.message },
      { status: 500 }
    );
  }
}

// Cari tablosundan ödeme durumunu anında güncelleme
export async function PUT(request: Request) {
  try {
    const { payrollId, isPaid } = await request.json();
    if (!payrollId) {
      return NextResponse.json({ error: "Bordro ID zorunludur" }, { status: 400 });
    }

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        isPaid: Boolean(isPaid),
        paidDate: isPaid ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

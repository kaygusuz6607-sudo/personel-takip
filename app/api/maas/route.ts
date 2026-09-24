import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayroll } from "@/lib/payroll-calculator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const year = parseInt(searchParams.get("year") || String(currentYear));
    const month = parseInt(searchParams.get("month") || String(currentMonth));

    const staffs = await prisma.staff.findMany({
      where: { status: { in: ["ACTIVE", "ON_LEAVE"] } },
      include: {
        salaryConfig: true,
        departments: { include: { department: true } },
        payrolls: {
          where: { year, month },
        },
        leaves: {
          where: {
            status: "APPROVED",
            startDate: { lte: new Date(year, month, 0, 23, 59, 59) },
            endDate: { gte: new Date(year, month - 1, 1) },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const result = staffs.map((staff) => {
      const existingPayroll = staff.payrolls[0];
      const config = staff.salaryConfig;

      // İzin kayıtlarından otomatik gelen rapor ve ücretsiz izin günleri
      const autoReportDays = staff.leaves
        .filter((l) => l.leaveType === "SICK")
        .reduce((sum, l) => sum + l.daysCount, 0);

      const autoUnpaidDays = staff.leaves
        .filter((l) => l.leaveType === "UNPAID")
        .reduce((sum, l) => sum + l.daysCount, 0);

      if (existingPayroll) {
        return {
          staffId: staff.id,
          fullName: staff.fullName,
          tcNo: staff.tcNo,
          title: staff.title,
          departments: staff.departments.map((d) => d.department.name),
          salaryType: config?.salaryType || "MONTHLY",
          monthlySalary: config?.monthlySalary || 0,
          hourlyRate: config?.hourlyRate || 0,
          dailyRate: config?.dailyRate || 0,
          hireDate: staff.hireDate,
          mebAssignmentDate: staff.mebAssignmentDate,
          sgkStartDate: staff.sgkStartDate,
          isSaved: true,
          payroll: {
            ...existingPayroll,
            reportDays: existingPayroll.reportDays > 0 ? existingPayroll.reportDays : autoReportDays,
            unpaidLeaveDays: existingPayroll.unpaidLeaveDays > 0 ? existingPayroll.unpaidLeaveDays : autoUnpaidDays,
          },
        };
      }

      // Varsayılan hesap
      const calc = calculatePayroll({
        salaryType: config?.salaryType || "MONTHLY",
        monthlySalary: config?.monthlySalary || 0,
        hourlyRate: config?.hourlyRate || 0,
        dailyRate: config?.dailyRate || 0,
        workDays: 30,
        reportDays: autoReportDays,
        unpaidLeaveDays: autoUnpaidDays,
        lessonHours: 0,
        dailyWorkDays: 0,
        holidayWorkDays: 0,
        holidayChoice: "LEAVE_1_TO_1",
        year,
        month,
        hireDate: staff.hireDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        sgkStartDate: staff.sgkStartDate,
        bonusAmount: 0,
        bonusDescription: "",
        deductionAmount: 0,
        deductionDescription: "",
        officialSalaryPart: config?.officialSalaryPart || 0,
      });

      return {
        staffId: staff.id,
        fullName: staff.fullName,
        tcNo: staff.tcNo,
        title: staff.title,
        departments: staff.departments.map((d) => d.department.name),
        salaryType: config?.salaryType || "MONTHLY",
        monthlySalary: config?.monthlySalary || 0,
        hourlyRate: config?.hourlyRate || 0,
        dailyRate: config?.dailyRate || 0,
        hireDate: staff.hireDate,
        mebAssignmentDate: staff.mebAssignmentDate,
        sgkStartDate: staff.sgkStartDate,
        isSaved: false,
        payroll: {
          year,
          month,
          workDays: 30,
          reportDays: 0,
          unpaidLeaveDays: 0,
          lessonHours: 0,
          dailyWorkDays: 0,
          holidayWorkDays: 0,
          holidayChoice: "LEAVE_1_TO_1",
          ...calc,
          isPaid: false,
          isManualTax: false,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Maaş listesi hatası:", error);
    return NextResponse.json({ error: "Bordro verileri alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      year,
      month,
      workDays = 30,
      reportDays = 0,
      unpaidLeaveDays = 0,
      lessonHours = 0,
      dailyWorkDays = 0,
      holidayWorkDays = 0,
      holidayChoice = "LEAVE_1_TO_1",
      bonusAmount = 0,
      bonusDescription = "",
      bonusItems = null,
      deductionAmount = 0,
      deductionDescription = "",
      deductionItems = null,
      isManualTax = false,
      manualSgkEmployee = 0,
      manualUnemployment = 0,
      manualIncomeTax = 0,
      manualStampTax = 0,
      isPaid = false,
      paidDate = null,
      notes = "",
      unofficialAmount: customUnofficialAmount,
    } = body;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { salaryConfig: true },
    });

    if (!staff || !staff.salaryConfig) {
      return NextResponse.json({ error: "Personel veya ücret kaydı bulunamadı" }, { status: 404 });
    }

    const config = staff.salaryConfig;

    const calc = calculatePayroll({
      salaryType: config.salaryType,
      monthlySalary: config.monthlySalary,
      hourlyRate: config.hourlyRate,
      dailyRate: config.dailyRate,
      officialSalaryPart: config.officialSalaryPart,
      year: Number(year),
      month: Number(month),
      hireDate: staff.hireDate,
      mebAssignmentDate: staff.mebAssignmentDate,
      sgkStartDate: staff.sgkStartDate,
      manualUnofficialAmount: customUnofficialAmount !== undefined && customUnofficialAmount !== null ? Number(customUnofficialAmount) : null,
      workDays: Number(workDays) || 30,
      reportDays: Number(reportDays) || 0,
      unpaidLeaveDays: Number(unpaidLeaveDays) || 0,
      lessonHours: Number(lessonHours) || 0,
      dailyWorkDays: Number(dailyWorkDays) || 0,
      holidayWorkDays: Number(holidayWorkDays) || 0,
      holidayChoice,
      bonusAmount: Number(bonusAmount) || 0,
      bonusDescription,
      deductionAmount: Number(deductionAmount) || 0,
      deductionDescription,
      isManualTax,
      manualSgkEmployee: Number(manualSgkEmployee) || 0,
      manualUnemployment: Number(manualUnemployment) || 0,
      manualIncomeTax: Number(manualIncomeTax) || 0,
      manualStampTax: Number(manualStampTax) || 0,
    });

    const bonusItemsStr = typeof bonusItems === "string" ? bonusItems : bonusItems ? JSON.stringify(bonusItems) : null;
    const deductionItemsStr = typeof deductionItems === "string" ? deductionItems : deductionItems ? JSON.stringify(deductionItems) : null;

    const payroll = await prisma.payroll.upsert({
      where: {
        staffId_year_month: {
          staffId,
          year: Number(year),
          month: Number(month),
        },
      },
      update: {
        workDays: Number(workDays),
        reportDays: Number(reportDays),
        unpaidLeaveDays: Number(unpaidLeaveDays),
        lessonHours: Number(lessonHours),
        dailyWorkDays: Number(dailyWorkDays),
        holidayWorkDays: Number(holidayWorkDays),
        holidayChoice,
        bonusAmount: calc.bonusAmount,
        bonusDescription: calc.bonusDescription,
        bonusItems: bonusItemsStr,
        deductionAmount: calc.deductionAmount,
        deductionDescription: calc.deductionDescription,
        deductionItems: deductionItemsStr,
        baseEarned: calc.baseEarned,
        hourlyEarned: calc.hourlyEarned,
        dailyEarned: calc.dailyEarned,
        holidayEarned: calc.holidayEarned,
        grossTotal: calc.grossTotal,
        sgkEmployee: calc.sgkEmployee,
        unemploymentEmployee: calc.unemploymentEmployee,
        incomeTax: calc.incomeTax,
        stampTax: calc.stampTax,
        isManualTax,
        totalDeductions: calc.totalDeductions,
        netTotal: calc.netTotal,
        officialAmount: calc.officialAmount,
        unofficialAmount: calc.unofficialAmount,
        isPaid,
        paidDate: isPaid ? (paidDate ? new Date(paidDate) : new Date()) : null,
        notes,
      },
      create: {
        staffId,
        year: Number(year),
        month: Number(month),
        workDays: Number(workDays),
        reportDays: Number(reportDays),
        unpaidLeaveDays: Number(unpaidLeaveDays),
        lessonHours: Number(lessonHours),
        dailyWorkDays: Number(dailyWorkDays),
        holidayWorkDays: Number(holidayWorkDays),
        holidayChoice,
        bonusAmount: calc.bonusAmount,
        bonusDescription: calc.bonusDescription,
        bonusItems: bonusItemsStr,
        deductionAmount: calc.deductionAmount,
        deductionDescription: calc.deductionDescription,
        deductionItems: deductionItemsStr,
        baseEarned: calc.baseEarned,
        hourlyEarned: calc.hourlyEarned,
        dailyEarned: calc.dailyEarned,
        holidayEarned: calc.holidayEarned,
        grossTotal: calc.grossTotal,
        sgkEmployee: calc.sgkEmployee,
        unemploymentEmployee: calc.unemploymentEmployee,
        incomeTax: calc.incomeTax,
        stampTax: calc.stampTax,
        isManualTax,
        totalDeductions: calc.totalDeductions,
        netTotal: calc.netTotal,
        officialAmount: calc.officialAmount,
        unofficialAmount: calc.unofficialAmount,
        isPaid,
        paidDate: isPaid ? (paidDate ? new Date(paidDate) : new Date()) : null,
        notes,
      },
    });

    // 1'e 1 İzin kontrolü
    if (holidayWorkDays > 0 && holidayChoice === "LEAVE_1_TO_1") {
      const desc = `${year}/${month} dönemi ${holidayWorkDays} gün resmi tatil çalışması karşılığı hak edilen 1'e 1 telafi izni`;
      const existingLeave = await prisma.leaveRecord.findFirst({
        where: {
          staffId,
          leaveType: "HOLIDAY_COMPENSATION",
          description: desc,
        },
      });

      if (!existingLeave) {
        await prisma.leaveRecord.create({
          data: {
            staffId,
            leaveType: "HOLIDAY_COMPENSATION",
            startDate: new Date(),
            endDate: new Date(),
            daysCount: Number(holidayWorkDays),
            description: desc,
            status: "APPROVED",
          },
        });
      }
    }

    return NextResponse.json(payroll);
  } catch (error: any) {
    console.error("Maaş kaydetme hatası:", error);
    return NextResponse.json({ error: error?.message || "Bordro kaydedilemedi" }, { status: 500 });
  }
}

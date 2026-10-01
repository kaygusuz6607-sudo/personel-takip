import { prisma } from "@/lib/prisma";
import { calculatePayroll, calculateOfficialSplit } from "@/lib/payroll-calculator";
import { getMaxWorkDaysForPeriod } from "@/lib/date-utils";

interface SyncOptions {
  createCurrentIfMissing?: boolean;
  targetYear?: number;
  targetMonth?: number;
}

/**
 * Personel maaş, unvan veya tarih güncellemelerini açık/ödenmemiş (isPaid: false)
 * bordro ve cari hareket kayıtlarıyla otomatik olarak eşleştiren ve senkronize eden servis.
 *
 * Kurallar:
 * 1. Geçmişte ödenmiş (isPaid: true) kesinleşmiş kayıtlar ASLA değiştirilmez (mali arşiv bütünlüğü).
 * 2. Ödenmemiş (isPaid: false) tüm kayıtlar personelin güncel maaş yapılandırmasına (SalaryConfig)
 *    göre anında yeniden hesaplanır.
 * 3. Personelin önceden girilmiş ek ücret (bonus), kesinti (deduction), rapor ve izin günleri korunur.
 * 4. Aktif personelin cari dönem bordrosu yoksa otomatik oluşturularak cari ekstrede görünmesi sağlanır.
 */
export async function syncStaffPayrolls(staffId?: string, options: SyncOptions = {}) {
  try {
    const now = new Date();
    // Sistemde aktif olarak işlenen en güncel dönem (varsayılan: cari ay veya DB'deki son dönem)
    const currentYear = options.targetYear || now.getFullYear();
    const currentMonth = options.targetMonth || now.getMonth() + 1;

    // Hedef personelleri getir
    const staffWhere: any = {};
    if (staffId) {
      staffWhere.id = staffId;
    }

    const staffs = await prisma.staff.findMany({
      where: staffWhere,
      include: {
        salaryConfig: true,
        departments: { include: { department: true } },
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        leaves: {
          where: {
            status: "APPROVED",
          },
        },
      },
    });

    for (const staff of staffs) {
      if (!staff.salaryConfig) continue;
      const config = staff.salaryConfig;

      // 1. ÖDENMEMİŞ MEVCUT BORDROLARI YENİDEN HESAPLA VE EŞLEŞTİR
      const unpaidPayrolls = staff.payrolls.filter((p) => !p.isPaid);

      for (const payroll of unpaidPayrolls) {
        const isManualElden = Boolean(payroll.notes && payroll.notes.includes("[MANUEL_ELDEN]"));

        const calc = calculatePayroll({
          salaryType: config.salaryType,
          monthlySalary: config.monthlySalary,
          hourlyRate: config.hourlyRate,
          dailyRate: config.dailyRate,
          officialSalaryPart: config.officialSalaryPart,
          title: staff.title,
          year: payroll.year,
          month: payroll.month,
          hireDate: staff.hireDate,
          mebAssignmentDate: staff.mebAssignmentDate,
          sgkStartDate: staff.sgkStartDate,
          manualUnofficialAmount: isManualElden ? payroll.unofficialAmount : null,
          workDays: payroll.workDays,
          reportDays: payroll.reportDays,
          unpaidLeaveDays: payroll.unpaidLeaveDays,
          lessonHours: payroll.lessonHours,
          dailyWorkDays: payroll.dailyWorkDays,
          holidayWorkDays: payroll.holidayWorkDays,
          holidayChoice: payroll.holidayChoice,
          bonusAmount: payroll.bonusAmount,
          bonusDescription: payroll.bonusDescription || "",
          deductionAmount: payroll.deductionAmount,
          deductionDescription: payroll.deductionDescription || "",
          isManualTax: payroll.isManualTax,
          manualSgkEmployee: payroll.sgkEmployee,
          manualUnemployment: payroll.unemploymentEmployee,
          manualIncomeTax: payroll.incomeTax,
          manualStampTax: payroll.stampTax,
        });

        // Değişiklik var mı kontrol et (Gereksiz DB yazımını önle)
        const hasDiff =
          Math.abs(payroll.baseEarned - calc.baseEarned) > 0.01 ||
          Math.abs(payroll.grossTotal - calc.grossTotal) > 0.01 ||
          Math.abs(payroll.netTotal - calc.netTotal) > 0.01 ||
          Math.abs(payroll.officialAmount - calc.officialAmount) > 0.01 ||
          Math.abs(payroll.unofficialAmount - calc.unofficialAmount) > 0.01 ||
          Math.abs(payroll.totalDeductions - calc.totalDeductions) > 0.01;

        if (hasDiff) {
          await prisma.payroll.update({
            where: { id: payroll.id },
            data: {
              baseEarned: calc.baseEarned,
              hourlyEarned: calc.hourlyEarned,
              dailyEarned: calc.dailyEarned,
              holidayEarned: calc.holidayEarned,
              grossTotal: calc.grossTotal,
              sgkEmployee: calc.sgkEmployee,
              unemploymentEmployee: calc.unemploymentEmployee,
              incomeTax: calc.incomeTax,
              stampTax: calc.stampTax,
              totalDeductions: calc.totalDeductions,
              netTotal: calc.netTotal,
              officialAmount: calc.officialAmount,
              unofficialAmount: calc.unofficialAmount,
            },
          });
        }
      }

      // 2. AKTİF PERSONELİN CARİ AY İÇİN BORDROSU YOKSA OLUŞTUR
      // (Özellikle 2026/9 gibi aktif tahakkuk dönemlerinde cari ekstrede personelin maaşının görünmesi için)
      if (options.createCurrentIfMissing !== false && staff.status === "ACTIVE") {
        // En güncel aktif dönem kontrolü: Eğer 2026/9 döneminde henüz hiç kaydı yoksa
        const activeYear = currentYear;
        const activeMonth = currentMonth === 10 ? 9 : currentMonth; // Eylül 2026 aktif dönemse

        const hasPeriodPayroll = staff.payrolls.some(
          (p) => p.year === activeYear && p.month === activeMonth
        );

        if (!hasPeriodPayroll) {
          const periodLimit = getMaxWorkDaysForPeriod(
            activeYear,
            activeMonth,
            staff.hireDate,
            staff.terminationDate
          );

          if (periodLimit.maxDays > 0) {
            // İzinlerden rapor ve ücretsiz günleri al
            const monthStart = new Date(activeYear, activeMonth - 1, 1);
            const monthEnd = new Date(activeYear, activeMonth, 0, 23, 59, 59);

            const autoReportDays = staff.leaves
              .filter(
                (l) =>
                  l.leaveType === "SICK" &&
                  new Date(l.startDate) <= monthEnd &&
                  new Date(l.endDate) >= monthStart
              )
              .reduce((sum, l) => sum + l.daysCount, 0);

            const autoUnpaidDays = staff.leaves
              .filter(
                (l) =>
                  l.leaveType === "UNPAID" &&
                  new Date(l.startDate) <= monthEnd &&
                  new Date(l.endDate) >= monthStart
              )
              .reduce((sum, l) => sum + l.daysCount, 0);

            const defaultWorkDays = Math.min(30, periodLimit.maxDays);

            const calc = calculatePayroll({
              salaryType: config.salaryType,
              monthlySalary: config.monthlySalary,
              hourlyRate: config.hourlyRate,
              dailyRate: config.dailyRate,
              officialSalaryPart: config.officialSalaryPart,
              title: staff.title,
              year: activeYear,
              month: activeMonth,
              hireDate: staff.hireDate,
              mebAssignmentDate: staff.mebAssignmentDate,
              sgkStartDate: staff.sgkStartDate,
              workDays: defaultWorkDays,
              reportDays: autoReportDays,
              unpaidLeaveDays: autoUnpaidDays,
              lessonHours: 0,
              dailyWorkDays: 0,
              holidayWorkDays: 0,
              holidayChoice: "LEAVE_1_TO_1",
              bonusAmount: 0,
              bonusDescription: "",
              deductionAmount: 0,
              deductionDescription: "",
            });

            await prisma.payroll.create({
              data: {
                staffId: staff.id,
                year: activeYear,
                month: activeMonth,
                workDays: defaultWorkDays,
                reportDays: autoReportDays,
                unpaidLeaveDays: autoUnpaidDays,
                lessonHours: 0,
                dailyWorkDays: 0,
                holidayWorkDays: 0,
                holidayChoice: "LEAVE_1_TO_1",
                bonusAmount: 0,
                bonusDescription: "",
                deductionAmount: 0,
                deductionDescription: "",
                baseEarned: calc.baseEarned,
                hourlyEarned: calc.hourlyEarned,
                dailyEarned: calc.dailyEarned,
                holidayEarned: calc.holidayEarned,
                grossTotal: calc.grossTotal,
                sgkEmployee: calc.sgkEmployee,
                unemploymentEmployee: calc.unemploymentEmployee,
                incomeTax: calc.incomeTax,
                stampTax: calc.stampTax,
                totalDeductions: calc.totalDeductions,
                netTotal: calc.netTotal,
                officialAmount: calc.officialAmount,
                unofficialAmount: calc.unofficialAmount,
                isPaid: false,
                notes: "",
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Personel bordro senkronizasyon hatası:", error);
  }
}

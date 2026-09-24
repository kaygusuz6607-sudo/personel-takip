import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, system } = body;

    if (!data || !system || !system.includes("COSMOS")) {
      return NextResponse.json(
        { error: "Geçersiz yedekleme dosyası formatı. Sadece COSMOS yedek dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    const { departments = [], staff = [], salaryConfigs = [], payrolls = [], leaves = [], users = [] } = data;

    // Atomik işlemle geri yükleme / senkronizasyon
    await prisma.$transaction(async (tx) => {
      // 1. Departmanlar
      for (const d of departments) {
        await tx.department.upsert({
          where: { id: d.id },
          update: {
            name: d.name,
            description: d.description,
          },
          create: {
            id: d.id,
            name: d.name,
            description: d.description,
            createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
          },
        });
      }

      // 2. Personeller
      for (const s of staff) {
        await tx.staff.upsert({
          where: { id: s.id },
          update: {
            tcNo: s.tcNo,
            fullName: s.fullName,
            birthDate: s.birthDate ? new Date(s.birthDate) : null,
            phone: s.phone,
            email: s.email,
            iban: s.iban,
            accountNumber: s.accountNumber,
            title: s.title,
            hireDate: s.hireDate ? new Date(s.hireDate) : null,
            terminationDate: s.terminationDate ? new Date(s.terminationDate) : null,
            mebAssignmentDate: s.mebAssignmentDate ? new Date(s.mebAssignmentDate) : null,
            unofficialWorkPeriod: s.unofficialWorkPeriod,
            sgkStartDate: s.sgkStartDate ? new Date(s.sgkStartDate) : null,
            notes: s.notes,
            status: s.status,
            isSgkNotified: Boolean(s.isSgkNotified),
          },
          create: {
            id: s.id,
            tcNo: s.tcNo,
            fullName: s.fullName,
            birthDate: s.birthDate ? new Date(s.birthDate) : null,
            phone: s.phone,
            email: s.email,
            iban: s.iban,
            accountNumber: s.accountNumber,
            title: s.title,
            hireDate: s.hireDate ? new Date(s.hireDate) : null,
            terminationDate: s.terminationDate ? new Date(s.terminationDate) : null,
            mebAssignmentDate: s.mebAssignmentDate ? new Date(s.mebAssignmentDate) : null,
            unofficialWorkPeriod: s.unofficialWorkPeriod,
            sgkStartDate: s.sgkStartDate ? new Date(s.sgkStartDate) : null,
            notes: s.notes,
            status: s.status || "ACTIVE",
            isSgkNotified: Boolean(s.isSgkNotified),
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          },
        });

        // Departman ilişkileri
        if (Array.isArray(s.departments)) {
          for (const rel of s.departments) {
            await tx.staffDepartment.upsert({
              where: {
                staffId_departmentId: {
                  staffId: rel.staffId,
                  departmentId: rel.departmentId,
                },
              },
              update: {},
              create: {
                staffId: rel.staffId,
                departmentId: rel.departmentId,
              },
            });
          }
        }
      }

      // 3. Maaş Yapılandırmaları
      for (const sc of salaryConfigs) {
        await tx.salaryConfig.upsert({
          where: { staffId: sc.staffId },
          update: {
            salaryType: sc.salaryType,
            monthlySalary: sc.monthlySalary,
            hourlyRate: sc.hourlyRate,
            dailyRate: sc.dailyRate,
            officialSalaryPart: sc.officialSalaryPart,
          },
          create: {
            id: sc.id,
            staffId: sc.staffId,
            salaryType: sc.salaryType,
            monthlySalary: sc.monthlySalary,
            hourlyRate: sc.hourlyRate,
            dailyRate: sc.dailyRate,
            officialSalaryPart: sc.officialSalaryPart,
          },
        });
      }

      // 4. Bordrolar
      for (const p of payrolls) {
        await tx.payroll.upsert({
          where: { id: p.id },
          update: {
            year: p.year,
            month: p.month,
            workDays: p.workDays,
            reportDays: p.reportDays,
            unpaidLeaveDays: p.unpaidLeaveDays,
            lessonHours: p.lessonHours,
            dailyWorkDays: p.dailyWorkDays,
            holidayWorkDays: p.holidayWorkDays,
            holidayChoice: p.holidayChoice,
            baseEarned: p.baseEarned,
            hourlyEarned: p.hourlyEarned,
            dailyEarned: p.dailyEarned,
            holidayEarned: p.holidayEarned,
            bonusAmount: p.bonusAmount,
            bonusDescription: p.bonusDescription,
            deductionAmount: p.deductionAmount,
            deductionDescription: p.deductionDescription,
            grossTotal: p.grossTotal,
            totalDeductions: p.totalDeductions,
            netTotal: p.netTotal,
            officialAmount: p.officialAmount ?? p.bankAmount ?? 0,
            unofficialAmount: p.unofficialAmount ?? p.cashAmount ?? 0,
            isPaid: Boolean(p.isPaid),
            paidDate: p.paidDate ? new Date(p.paidDate) : null,
            notes: p.notes,
          },
          create: {
            id: p.id,
            staffId: p.staffId,
            year: p.year,
            month: p.month,
            workDays: p.workDays,
            reportDays: p.reportDays,
            unpaidLeaveDays: p.unpaidLeaveDays,
            lessonHours: p.lessonHours,
            dailyWorkDays: p.dailyWorkDays,
            holidayWorkDays: p.holidayWorkDays,
            holidayChoice: p.holidayChoice,
            baseEarned: p.baseEarned,
            hourlyEarned: p.hourlyEarned,
            dailyEarned: p.dailyEarned,
            holidayEarned: p.holidayEarned,
            bonusAmount: p.bonusAmount,
            bonusDescription: p.bonusDescription,
            deductionAmount: p.deductionAmount,
            deductionDescription: p.deductionDescription,
            grossTotal: p.grossTotal,
            totalDeductions: p.totalDeductions,
            netTotal: p.netTotal,
            officialAmount: p.officialAmount ?? p.bankAmount ?? 0,
            unofficialAmount: p.unofficialAmount ?? p.cashAmount ?? 0,
            isPaid: Boolean(p.isPaid),
            paidDate: p.paidDate ? new Date(p.paidDate) : null,
            notes: p.notes,
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          },
        });
      }

      // 5. İzinler
      for (const l of leaves) {
        await tx.leaveRecord.upsert({
          where: { id: l.id },
          update: {
            leaveType: l.leaveType,
            startDate: new Date(l.startDate),
            endDate: new Date(l.endDate),
            daysCount: l.daysCount,
            description: l.description ?? l.reason ?? null,
            status: l.status || "APPROVED",
          },
          create: {
            id: l.id,
            staffId: l.staffId,
            leaveType: l.leaveType,
            startDate: new Date(l.startDate),
            endDate: new Date(l.endDate),
            daysCount: l.daysCount,
            description: l.description ?? l.reason ?? null,
            status: l.status || "APPROVED",
            createdAt: l.createdAt ? new Date(l.createdAt) : undefined,
          },
        });
      }

      // 6. Yetkili Kullanıcılar
      for (const u of users) {
        await tx.user.upsert({
          where: { id: u.id },
          update: {
            username: u.username,
            name: u.name,
            role: u.role,
            email: u.email,
          },
          create: {
            id: u.id,
            username: u.username,
            password: u.password,
            name: u.name,
            role: u.role || "ADMIN",
            email: u.email,
            createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Veriler başarıyla senkronize edildi ve sisteme geri yüklendi.",
      restoredCounts: {
        departments: departments.length,
        staff: staff.length,
        payrolls: payrolls.length,
        leaves: leaves.length,
        users: users.length,
      },
    });
  } catch (error) {
    console.error("Yedek içe aktarma hatası:", error);
    return NextResponse.json(
      { error: "Veri aktarımı sırasında bir hata oluştu: " + String(error) },
      { status: 500 }
    );
  }
}

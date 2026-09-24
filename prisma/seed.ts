import { PrismaClient } from "@prisma/client";
import { calculateOfficialSplit } from "../lib/payroll-calculator";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding updated data...");

  // 1. Yetkili Kullanıcılar (2-3 kişilik ekip için)
  const defaultUsers = [
    {
      username: "admin",
      email: "admin@cosmos.local",
      password: "admin", // aynı zamanda "admin" veya "admin123" ile de giriş yapabilecek
      name: "Süper Yönetici",
      role: "SUPER_ADMIN",
    },
    {
      username: "muhasebe",
      email: "muhasebe@cosmos.local",
      password: "muhasebe123",
      name: "Muhasebe Sorumlusu",
      role: "ACCOUNTANT",
    },
    {
      username: "mudur",
      email: "mudur@cosmos.local",
      password: "mudur123",
      name: "Kurum Müdürü",
      role: "ADMIN",
    },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: u.username }, { email: u.email }],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: u.username,
          name: u.name,
          role: u.role,
        },
      });
    } else {
      await prisma.user.create({
        data: u,
      });
    }
  }

  // 2. Departmanlar
  const depts = [
    { name: "Fen Bilimleri", description: "Fizik, Kimya, Biyoloji ve Fen Bilgisi" },
    { name: "Matematik", description: "Matematik ve Geometri" },
    { name: "Muhasebe", description: "Finans ve Muhasebe Yönetimi" },
    { name: "Türkçe", description: "Türkçe ve Edebiyat" },
    { name: "İdari Personel", description: "Okul ve Dershane İdari Yönetimi" },
    { name: "İngilizce", description: "Yabancı Diller" },
  ];

  const createdDepts: Record<string, string> = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    createdDepts[d.name] = dept.id;
  }

  // 3. Örnek Personeller
  const staffData = [
    {
      tcNo: "12345678901",
      fullName: "Akif Sancak",
      title: "Matematik Öğretmeni",
      phone: "0532 100 20 30",
      email: "akif.sancak@okul.com",
      iban: "TR120006200000012345678901",
      accountNumber: "6200-1234567",
      dept: "Matematik",
      salaryType: "MONTHLY",
      monthlySalary: 28075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 20002.5,
      hireDate: new Date("2023-09-01"),
      sgkStartDate: new Date("2026-09-24"), // Gayriresmi süre: 3 yıl 23 gün
      mebAssignmentDate: new Date("2026-09-24"), // 1 gün öncesi kuralı: BUGÜN BİLDİRİM UYARISI VERİR!
      isSgkNotified: false,
      reportDays: 0,
    },
    {
      tcNo: "23456789012",
      fullName: "Ayşen Yalavuz",
      title: "Türkçe Öğretmeni",
      phone: "0533 200 30 40",
      email: "aysen.yalavuz@okul.com",
      iban: "TR340006200000012345678902",
      accountNumber: "6200-2345678",
      dept: "Türkçe",
      salaryType: "MONTHLY",
      monthlySalary: 28075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 20002.5,
      hireDate: new Date("2024-01-15"),
      sgkStartDate: new Date("2024-05-20"),
      mebAssignmentDate: null,
      isSgkNotified: true,
      reportDays: 0,
    },
    {
      tcNo: "34567890123",
      fullName: "Betül Tokatlıoğlu",
      title: "Fen Bilgisi Öğretmeni",
      phone: "0535 300 40 50",
      email: "betul.tokatli@okul.com",
      iban: "TR560006200000012345678903",
      accountNumber: "6200-3456789",
      dept: "Fen Bilimleri",
      salaryType: "MONTHLY",
      monthlySalary: 32075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 25000.0,
      hireDate: new Date("2023-11-01"),
      sgkStartDate: new Date("2024-02-01"),
      mebAssignmentDate: null,
      isSgkNotified: true,
      reportDays: 0,
    },
    {
      tcNo: "45678901234",
      fullName: "Beyhan Erzurum",
      title: "Fen Bilimleri Öğretmeni (Saat Ücretli)",
      phone: "0542 400 50 60",
      email: "beyhan.erzurum@okul.com",
      iban: "TR780006200000012345678904",
      accountNumber: "6200-4567890",
      dept: "Fen Bilimleri",
      salaryType: "HOURLY",
      monthlySalary: 0,
      hourlyRate: 450,
      dailyRate: 0,
      officialSalaryPart: 0,
      hireDate: new Date("2024-02-01"),
      sgkStartDate: null,
      mebAssignmentDate: null,
      isSgkNotified: false,
      reportDays: 0,
    },
    {
      tcNo: "56789012345",
      fullName: "Duygu Köse",
      title: "Müdür / İdari Personel",
      phone: "0555 500 60 70",
      email: "duygu.kose@okul.com",
      iban: "TR900006200000012345678905",
      accountNumber: "6200-5678901",
      dept: "İdari Personel",
      salaryType: "HYBRID",
      monthlySalary: 65000,
      hourlyRate: 500,
      dailyRate: 0,
      officialSalaryPart: 40000,
      hireDate: new Date("2022-08-01"),
      sgkStartDate: new Date("2022-09-01"),
      mebAssignmentDate: null,
      isSgkNotified: true,
      reportDays: 0,
    },
    {
      tcNo: "67890123456",
      fullName: "Gamze - Satranç Yılmaz",
      title: "Satranç Eğitmeni",
      phone: "0544 600 70 80",
      email: "gamze.yilmaz@okul.com",
      iban: "TR110006200000012345678906",
      accountNumber: "6200-6789012",
      dept: "İdari Personel",
      salaryType: "HOURLY",
      monthlySalary: 0,
      hourlyRate: 400,
      dailyRate: 0,
      officialSalaryPart: 0,
      hireDate: new Date("2024-03-01"),
      sgkStartDate: null,
      mebAssignmentDate: null,
      isSgkNotified: false,
      reportDays: 0,
    },
  ];

  for (const s of staffData) {
    const staff = await prisma.staff.upsert({
      where: { tcNo: s.tcNo },
      update: {
        iban: s.iban,
        accountNumber: s.accountNumber,
        hireDate: s.hireDate,
        sgkStartDate: s.sgkStartDate,
        mebAssignmentDate: s.mebAssignmentDate,
        isSgkNotified: s.isSgkNotified,
        salaryConfig: {
          upsert: {
            create: {
              salaryType: s.salaryType,
              monthlySalary: s.monthlySalary,
              hourlyRate: s.hourlyRate,
              dailyRate: s.dailyRate,
              officialSalaryPart: s.officialSalaryPart,
            },
            update: {
              salaryType: s.salaryType,
              monthlySalary: s.monthlySalary,
              hourlyRate: s.hourlyRate,
              dailyRate: s.dailyRate,
              officialSalaryPart: s.officialSalaryPart,
            },
          },
        },
      },
      create: {
        tcNo: s.tcNo,
        fullName: s.fullName,
        title: s.title,
        phone: s.phone,
        email: s.email,
        iban: s.iban,
        accountNumber: s.accountNumber,
        status: "ACTIVE",
        hireDate: s.hireDate,
        sgkStartDate: s.sgkStartDate,
        mebAssignmentDate: s.mebAssignmentDate,
        isSgkNotified: s.isSgkNotified,
        salaryConfig: {
          create: {
            salaryType: s.salaryType,
            monthlySalary: s.monthlySalary,
            hourlyRate: s.hourlyRate,
            dailyRate: s.dailyRate,
            officialSalaryPart: s.officialSalaryPart,
          },
        },
        departments: {
          create: {
            departmentId: createdDepts[s.dept],
          },
        },
      },
    });

    // Örnek Geçmiş İzin Kayıtları
    await prisma.leaveRecord.deleteMany({ where: { staffId: staff.id } });
    if (s.fullName === "Akif Sancak") {
      const akifLeaves = [
        {
          leaveType: "ANNUAL",
          startDate: new Date("2026-07-13"),
          endDate: new Date("2026-07-17"),
          daysCount: 5,
          description: "Yaz dönemi yıllık izin kullanımı",
          status: "APPROVED",
        },
        {
          leaveType: "SICK",
          startDate: new Date("2026-05-11"),
          endDate: new Date("2026-05-12"),
          daysCount: 2,
          description: "Mevsimsel grip hekim istirahat raporu",
          status: "APPROVED",
        },
        {
          leaveType: "HOLIDAY_COMPENSATION",
          startDate: new Date("2026-04-23"),
          endDate: new Date("2026-04-23"),
          daysCount: 1,
          description: "23 Nisan nöbet çalışması karşılığı 1'e 1 telafi izni hakkı",
          status: "APPROVED",
        },
        {
          leaveType: "EXCUSE",
          startDate: new Date("2026-02-18"),
          endDate: new Date("2026-02-18"),
          daysCount: 1,
          description: "Resmi kurum mazeret izni",
          status: "APPROVED",
        },
      ];
      for (const l of akifLeaves) {
        await prisma.leaveRecord.create({ data: { staffId: staff.id, ...l } });
      }
    } else if (s.fullName === "Ayşen Yalavuz") {
      const aysenLeaves = [
        {
          leaveType: "ANNUAL",
          startDate: new Date("2026-08-03"),
          endDate: new Date("2026-08-09"),
          daysCount: 7,
          description: "Ağustos dönemi yıllık izin",
          status: "APPROVED",
        },
        {
          leaveType: "HOLIDAY_COMPENSATION",
          startDate: new Date("2026-05-19"),
          endDate: new Date("2026-05-19"),
          daysCount: 1,
          description: "19 Mayıs resmi tatil nöbeti 1'e 1 telafi hakkı",
          status: "APPROVED",
        },
      ];
      for (const l of aysenLeaves) {
        await prisma.leaveRecord.create({ data: { staffId: staff.id, ...l } });
      }
    } else if (s.fullName === "Betül Tokatlıoğlu") {
      const betulLeaves = [
        {
          leaveType: "ANNUAL",
          startDate: new Date("2026-06-15"),
          endDate: new Date("2026-06-18"),
          daysCount: 4,
          description: "Yıllık izin dinlenme",
          status: "APPROVED",
        },
        {
          leaveType: "SICK",
          startDate: new Date("2026-03-02"),
          endDate: new Date("2026-03-03"),
          daysCount: 2,
          description: "Sağlık ocağı istirahat raporu",
          status: "APPROVED",
        },
      ];
      for (const l of betulLeaves) {
        await prisma.leaveRecord.create({ data: { staffId: staff.id, ...l } });
      }
    } else if (s.fullName === "Duygu Köse") {
      const duyguLeaves = [
        {
          leaveType: "ANNUAL",
          startDate: new Date("2026-07-20"),
          endDate: new Date("2026-07-29"),
          daysCount: 10,
          description: "Yaz yıllık izni",
          status: "APPROVED",
        },
        {
          leaveType: "HOLIDAY_COMPENSATION",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-01-01"),
          daysCount: 1,
          description: "1 Ocak Yılbaşı nöbet çalışması karşılığı telafi izni",
          status: "APPROVED",
        },
      ];
      for (const l of duyguLeaves) {
        await prisma.leaveRecord.create({ data: { staffId: staff.id, ...l } });
      }
    }

    // Bordro hesabı
    const reportDays = s.reportDays || 0;
    const workDays = 30;
    let baseEarned = 0;
    if (s.monthlySalary > 0) {
      baseEarned = Number(((s.monthlySalary / 30) * (workDays - reportDays)).toFixed(2));
    }

    let lessonHours = 0;
    let hourlyEarned = 0;
    if (s.salaryType === "HOURLY") {
      lessonHours = s.fullName.includes("Beyhan") ? 15 : 10;
      hourlyEarned = lessonHours * s.hourlyRate;
    } else if (s.salaryType === "HYBRID") {
      lessonHours = 20;
      hourlyEarned = lessonHours * s.hourlyRate;
    }

    const gross = Number((baseEarned + hourlyEarned).toFixed(2));
    const deductions = 0; // Manuel sistemde varsayılan 0 kesinti
    const net = gross;
    const split2024 = calculateOfficialSplit({
      netTotal: net,
      monthlySalary: s.monthlySalary,
      year: 2024,
      month: 8,
      hireDate: s.hireDate,
      mebAssignmentDate: s.mebAssignmentDate,
      sgkStartDate: s.sgkStartDate,
      officialSalaryPart: s.officialSalaryPart,
      reportDays,
    });

    await prisma.payroll.upsert({
      where: {
        staffId_year_month: {
          staffId: staff.id,
          year: 2024,
          month: 8,
        },
      },
      update: {
        workDays: 30,
        reportDays,
        lessonHours,
        baseEarned,
        hourlyEarned,
        grossTotal: gross,
        totalDeductions: deductions,
        netTotal: net,
        officialAmount: split2024.officialAmount,
        unofficialAmount: split2024.unofficialAmount,
      },
      create: {
        staffId: staff.id,
        year: 2024,
        month: 8,
        workDays: 30,
        reportDays,
        lessonHours,
        holidayWorkDays: s.fullName === "Ayşen Yalavuz" ? 1 : 0,
        holidayChoice: "LEAVE_1_TO_1",
        baseEarned,
        hourlyEarned,
        grossTotal: gross,
        totalDeductions: deductions,
        netTotal: net,
        officialAmount: split2024.officialAmount,
        unofficialAmount: split2024.unofficialAmount,
        isPaid: s.fullName !== "Akif Sancak",
        paidDate: s.fullName !== "Akif Sancak" ? new Date("2024-09-05") : null,
      },
    });

    // 2026/9 (Geçiş Ayı: Atamaya kadar Elden, sonraya Banka)
    const split2026 = calculateOfficialSplit({
      netTotal: net,
      monthlySalary: s.monthlySalary,
      year: 2026,
      month: 9,
      hireDate: s.hireDate,
      mebAssignmentDate: s.mebAssignmentDate,
      sgkStartDate: s.sgkStartDate,
      officialSalaryPart: s.officialSalaryPart,
      reportDays,
    });

    await prisma.payroll.upsert({
      where: {
        staffId_year_month: {
          staffId: staff.id,
          year: 2026,
          month: 9,
        },
      },
      update: {
        workDays: 30,
        reportDays,
        lessonHours,
        baseEarned,
        hourlyEarned,
        grossTotal: gross,
        totalDeductions: deductions,
        netTotal: net,
        officialAmount: split2026.officialAmount,
        unofficialAmount: split2026.unofficialAmount,
      },
      create: {
        staffId: staff.id,
        year: 2026,
        month: 9,
        workDays: 30,
        reportDays,
        lessonHours,
        baseEarned,
        hourlyEarned,
        grossTotal: gross,
        totalDeductions: deductions,
        netTotal: net,
        officialAmount: split2026.officialAmount,
        unofficialAmount: split2026.unofficialAmount,
        isPaid: false,
      },
    });
  }

  console.log("Updated seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

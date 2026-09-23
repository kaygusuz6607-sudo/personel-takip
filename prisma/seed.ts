import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  // 1. Admin Kullanıcısı
  await prisma.user.upsert({
    where: { email: "admin@okul.com" },
    update: {},
    create: {
      email: "admin@okul.com",
      password: "admin", // Demo kolaylığı
      name: "Süper Admin",
      role: "SUPER_ADMIN",
    },
  });

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

  // 3. Örnek Personeller (Kullanıcının paylaştığı ekran görüntülerindeki isimler ve ücretler)
  const staffData = [
    {
      tcNo: "12345678901",
      fullName: "Akif Sancak",
      title: "Matematik Öğretmeni",
      phone: "0532 100 20 30",
      email: "akif.sancak@okul.com",
      iban: "TR120006200000012345678901",
      dept: "Matematik",
      salaryType: "MONTHLY",
      monthlySalary: 28075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 20002.5,
    },
    {
      tcNo: "23456789012",
      fullName: "Ayşen Yalavuz",
      title: "Türkçe Öğretmeni",
      phone: "0533 200 30 40",
      email: "aysen.yalavuz@okul.com",
      iban: "TR340006200000012345678902",
      dept: "Türkçe",
      salaryType: "MONTHLY",
      monthlySalary: 28075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 20002.5,
    },
    {
      tcNo: "34567890123",
      fullName: "Betül Tokatlıoğlu",
      title: "Fen Bilgisi Öğretmeni",
      phone: "0535 300 40 50",
      email: "betul.tokatli@okul.com",
      iban: "TR560006200000012345678903",
      dept: "Fen Bilimleri",
      salaryType: "MONTHLY",
      monthlySalary: 32075.5,
      hourlyRate: 0,
      dailyRate: 0,
      officialSalaryPart: 25000.0,
    },
    {
      tcNo: "45678901234",
      fullName: "Beyhan Erzurum",
      title: "Fen Bilimleri Öğretmeni (Saat Ücretli)",
      phone: "0542 400 50 60",
      email: "beyhan.erzurum@okul.com",
      iban: "TR780006200000012345678904",
      dept: "Fen Bilimleri",
      salaryType: "HOURLY",
      monthlySalary: 0,
      hourlyRate: 450,
      dailyRate: 0,
      officialSalaryPart: 0,
    },
    {
      tcNo: "56789012345",
      fullName: "Duygu Köse",
      title: "Müdür / İdari Personel",
      phone: "0555 500 60 70",
      email: "duygu.kose@okul.com",
      iban: "TR900006200000012345678905",
      dept: "İdari Personel",
      salaryType: "HYBRID",
      monthlySalary: 65000,
      hourlyRate: 500,
      dailyRate: 0,
      officialSalaryPart: 40000,
    },
    {
      tcNo: "67890123456",
      fullName: "Gamze - Satranç Yılmaz",
      title: "Satranç Eğitmeni",
      phone: "0544 600 70 80",
      email: "gamze.yilmaz@okul.com",
      iban: "TR110006200000012345678906",
      dept: "İdari Personel",
      salaryType: "HOURLY",
      monthlySalary: 0,
      hourlyRate: 400,
      dailyRate: 0,
      officialSalaryPart: 0,
    },
  ];

  for (const s of staffData) {
    const existing = await prisma.staff.findUnique({ where: { tcNo: s.tcNo } });
    if (!existing) {
      const staff = await prisma.staff.create({
        data: {
          tcNo: s.tcNo,
          fullName: s.fullName,
          title: s.title,
          phone: s.phone,
          email: s.email,
          iban: s.iban,
          status: "ACTIVE",
          hireDate: new Date("2023-09-01"),
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

      // Örnek Bordro Oluştur (8. Ay - Ağustos 2024 / Güncel Ay)
      const isPaid = s.fullName !== "Akif Sancak"; // Akif bekliyor olsun
      let lessonHours = 0;
      let gross = s.monthlySalary;
      if (s.salaryType === "HOURLY") {
        lessonHours = s.fullName.includes("Beyhan") ? 15 : 10;
        gross = lessonHours * s.hourlyRate;
      } else if (s.salaryType === "HYBRID") {
        lessonHours = 20;
        gross = s.monthlySalary + lessonHours * s.hourlyRate;
      }

      const deductions = Number((gross * 0.15).toFixed(2));
      const net = Number((gross - deductions).toFixed(2));

      await prisma.payroll.create({
        data: {
          staffId: staff.id,
          year: 2024,
          month: 8,
          workDays: 30,
          reportDays: s.fullName === "Akif Sancak" ? 1 : 0, // Akif Bey için örnek 1 gün rapor!
          lessonHours: lessonHours,
          holidayWorkDays: s.fullName === "Ayşen Yalavuz" ? 1 : 0,
          holidayChoice: "LEAVE_1_TO_1",
          baseEarned: s.monthlySalary > 0 ? Number(((s.monthlySalary / 30) * (30 - (s.fullName === "Akif Sancak" ? 1 : 0))).toFixed(2)) : 0,
          hourlyEarned: lessonHours * s.hourlyRate,
          grossTotal: gross,
          totalDeductions: deductions,
          netTotal: net,
          officialAmount: Math.min(net, s.officialSalaryPart || net),
          unofficialAmount: Math.max(0, net - (s.officialSalaryPart || net)),
          isPaid: isPaid,
          paidDate: isPaid ? new Date("2024-09-05") : null,
        },
      });

      // Ayşen Yalavuz için resmi tatil çalışması karşılığı 1'e 1 izin ekle
      if (s.fullName === "Ayşen Yalavuz") {
        await prisma.leaveRecord.create({
          data: {
            staffId: staff.id,
            leaveType: "HOLIDAY_COMPENSATION",
            startDate: new Date("2024-08-30"),
            endDate: new Date("2024-08-30"),
            daysCount: 1,
            description: "30 Ağustos Zafer Bayramı resmi tatil çalışması karşılığı hak edilen 1'e 1 izin",
            status: "APPROVED",
          },
        });
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

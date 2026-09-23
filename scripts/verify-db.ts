import { prisma } from "../lib/prisma";
import { calculateOfficialSplit } from "../lib/payroll-calculator";

async function verify() {
  const payrolls = await prisma.payroll.findMany({
    where: { year: 2026, month: 9 },
    include: { staff: { include: { salaryConfig: true } } },
    orderBy: { staff: { fullName: "asc" } },
  });

  console.log("=== 2026/9 VERİTABANI KONTROLÜ ===");
  for (const p of payrolls) {
    const split = calculateOfficialSplit({
      netTotal: p.netTotal,
      monthlySalary: p.staff.salaryConfig?.monthlySalary || 0,
      year: 2026,
      month: 9,
      hireDate: p.staff.hireDate,
      mebAssignmentDate: p.staff.mebAssignmentDate,
      sgkStartDate: p.staff.sgkStartDate,
    });
    console.log(`Personel: ${p.staff.fullName}`);
    console.log(`  İşe Giriş: ${p.staff.hireDate?.toISOString().slice(0, 10)}`);
    console.log(`  Atama: ${p.staff.mebAssignmentDate ? p.staff.mebAssignmentDate.toISOString().slice(0, 10) : 'YOK'}`);
    console.log(`  Net: ${p.netTotal} TL`);
    console.log(`  💵 Elden (Gayriresmî/Atama Öncesi): ${split.unofficialAmount} TL`);
    console.log(`  🏛️ Banka (Resmî/Atama Sonrası): ${split.officialAmount} TL`);
    console.log("------------------------------------------");
  }
}

verify().finally(() => prisma.$disconnect());

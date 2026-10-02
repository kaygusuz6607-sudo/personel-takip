const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const counts = {
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
    staffDepartments: await prisma.staffDepartment.count(),
    staff: await prisma.staff.count(),
    salaryConfigs: await prisma.salaryConfig.count(),
    payrolls: await prisma.payroll.count(),
    leaves: await prisma.leaveRecord.count(),
    schoolExpenses: await prisma.schoolExpense.count(),
    assets: await prisma.assetTracking.count(),
    cariAccounts: await prisma.thirdPartyAccount.count(),
    cariTransactions: await prisma.thirdPartyTransaction.count(),
    leads: await prisma.lead.count(),
    leadInteractions: await prisma.leadInteraction.count(),
    classrooms: await prisma.classroom.count(),
    students: await prisma.student.count(),
    studentPayments: await prisma.studentPayment.count(),
    studentAttendances: await prisma.studentAttendance.count(),
    quotes: await prisma.priceQuote.count(),
    quoteSettings: await prisma.quoteSetting.count(),
    goldDayGroups: await prisma.goldDayGroup.count(),
    goldDayRounds: await prisma.goldDayRound.count(),
    chequePhotoStores: await prisma.chequePhotoStore.count(),
    supplierCariAccounts: await prisma.supplierCariAccount.count(),
    supplierCariTransactions: await prisma.supplierCariTransaction.count()
  };
  console.log(JSON.stringify(counts, null, 2));
}

main().finally(() => prisma.$disconnect());

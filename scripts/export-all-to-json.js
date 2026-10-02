const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function exportAll() {
  const prisma = new PrismaClient();
  try {
    const data = {
      exportDate: new Date().toISOString(),
      version: '2.0.0-authoritative',
      system: 'COSMOS Personel & Okul Takip Sistemi',
      domain: 'sancak.site',
      serverIp: '193.122.58.27',
      counts: {
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
        supplierCariTransactions: await prisma.supplierCariTransaction.count(),
        studentRefunds: await prisma.studentRefund.count(),
        refundInstallments: await prisma.refundInstallment.count()
      },
      tables: {
        user: await prisma.user.findMany(),
        department: await prisma.department.findMany(),
        staffDepartment: await prisma.staffDepartment.findMany(),
        staff: await prisma.staff.findMany(),
        salaryConfig: await prisma.salaryConfig.findMany(),
        payroll: await prisma.payroll.findMany(),
        leaveRecord: await prisma.leaveRecord.findMany(),
        schoolExpense: await prisma.schoolExpense.findMany(),
        assetTracking: await prisma.assetTracking.findMany(),
        thirdPartyAccount: await prisma.thirdPartyAccount.findMany(),
        thirdPartyTransaction: await prisma.thirdPartyTransaction.findMany(),
        lead: await prisma.lead.findMany(),
        leadInteraction: await prisma.leadInteraction.findMany(),
        classroom: await prisma.classroom.findMany(),
        student: await prisma.student.findMany(),
        studentPayment: await prisma.studentPayment.findMany(),
        studentAttendance: await prisma.studentAttendance.findMany(),
        priceQuote: await prisma.priceQuote.findMany(),
        quoteSetting: await prisma.quoteSetting.findMany(),
        goldDayGroup: await prisma.goldDayGroup.findMany(),
        goldDayRound: await prisma.goldDayRound.findMany(),
        chequePhotoStore: await prisma.chequePhotoStore.findMany(),
        supplierCariAccount: await prisma.supplierCariAccount.findMany(),
        supplierCariTransaction: await prisma.supplierCariTransaction.findMany(),
        studentRefund: await prisma.studentRefund.findMany(),
        refundInstallment: await prisma.refundInstallment.findMany()
      }
    };

    const targetPath = path.join(__dirname, '..', 'cosmos_tum_veriler.json');
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully exported full data to:', targetPath);
    console.log('Total file size:', fs.statSync(targetPath).size, 'bytes');
    console.log('Table counts:');
    console.table(data.counts);
  } finally {
    await prisma.$disconnect();
  }
}

exportAll().catch(err => {
  console.error(err);
  process.exit(1);
});

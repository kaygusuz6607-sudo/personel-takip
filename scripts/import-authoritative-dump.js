const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

async function runImport() {
  const dumpPath = path.join(__dirname, 'authoritative_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error('Dump file not found: ' + dumpPath);
  }
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8')).data;
  const prisma = new PrismaClient();

  console.log('--- Starting Import of Authoritative Dataset ---');

  try {
    // 1. Clear existing data in foreign-key safe reverse order
    console.log('Clearing existing tables in reverse dependency order...');
    await prisma.studentAttendance.deleteMany({});
    await prisma.studentPayment.deleteMany({});
    await prisma.priceQuote.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.classroom.deleteMany({});
    await prisma.leadInteraction.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.thirdPartyTransaction.deleteMany({});
    await prisma.thirdPartyAccount.deleteMany({});
    await prisma.assetTracking.deleteMany({});
    await prisma.schoolExpense.deleteMany({});
    await prisma.leaveRecord.deleteMany({});
    await prisma.payroll.deleteMany({});
    await prisma.salaryConfig.deleteMany({});
    await prisma.staffDepartment.deleteMany({});
    await prisma.staff.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.quoteSetting.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Existing tables cleared successfully.');

    // 2. Insert in forward dependency order
    
    // Users (5)
    console.log(`Inserting ${dump.users.length} Users...`);
    for (const u of dump.users) {
      await prisma.user.create({
        data: {
          id: u.id,
          username: u.username,
          email: u.email,
          password: u.password,
          name: u.name,
          role: u.role,
          createdAt: toDate(u.createdAt) || new Date(),
          updatedAt: toDate(u.updatedAt) || new Date(),
        }
      });
    }

    // Departments (4)
    console.log(`Inserting ${dump.departments.length} Departments...`);
    for (const d of dump.departments) {
      await prisma.department.create({
        data: {
          id: d.id,
          name: d.name,
          description: d.description,
          category: d.category,
          createdAt: toDate(d.createdAt) || new Date(),
        }
      });
    }

    // Staff (29)
    console.log(`Inserting ${dump.staff.length} Staff...`);
    for (const s of dump.staff) {
      await prisma.staff.create({
        data: {
          id: s.id,
          tcNo: s.tcNo,
          fullName: s.fullName,
          birthDate: toDate(s.birthDate),
          phone: s.phone,
          phone2: s.phone2,
          email: s.email,
          iban: s.iban,
          accountNumber: s.accountNumber,
          title: s.title,
          hireDate: toDate(s.hireDate),
          terminationDate: toDate(s.terminationDate),
          mebAssignmentDate: toDate(s.mebAssignmentDate),
          mebAssignmentEndDate: toDate(s.mebAssignmentEndDate),
          isMebPermanent: s.isMebPermanent ?? true,
          isMebEndNotified: s.isMebEndNotified ?? false,
          unofficialWorkPeriod: s.unofficialWorkPeriod,
          sgkStartDate: toDate(s.sgkStartDate),
          notes: s.notes,
          status: s.status || 'ACTIVE',
          isSgkNotified: s.isSgkNotified ?? false,
          photoUrl: s.photoUrl,
          createdAt: toDate(s.createdAt) || new Date(),
          updatedAt: toDate(s.updatedAt) || new Date(),
        }
      });
    }

    // StaffDepartments (29)
    console.log(`Inserting ${dump.staffDepartments.length} StaffDepartments...`);
    for (const sd of dump.staffDepartments) {
      await prisma.staffDepartment.create({
        data: {
          staffId: sd.staffId,
          departmentId: sd.departmentId,
        }
      });
    }

    // SalaryConfigs (29)
    console.log(`Inserting ${dump.salaryConfigs.length} SalaryConfigs...`);
    for (const sc of dump.salaryConfigs) {
      await prisma.salaryConfig.create({
        data: {
          id: sc.id,
          staffId: sc.staffId,
          salaryType: sc.salaryType || 'MONTHLY',
          monthlySalary: Number(sc.monthlySalary) || 0,
          hourlyRate: Number(sc.hourlyRate) || 0,
          dailyRate: Number(sc.dailyRate) || 0,
          officialSalaryPart: Number(sc.officialSalaryPart) || 0,
          updatedAt: toDate(sc.updatedAt) || new Date(),
        }
      });
    }

    // Payrolls (51)
    console.log(`Inserting ${dump.payrolls.length} Payrolls...`);
    for (const p of dump.payrolls) {
      await prisma.payroll.create({
        data: {
          id: p.id,
          staffId: p.staffId,
          year: Number(p.year),
          month: Number(p.month),
          workDays: Number(p.workDays) ?? 30,
          reportDays: Number(p.reportDays) || 0,
          unpaidLeaveDays: Number(p.unpaidLeaveDays) || 0,
          lessonHours: Number(p.lessonHours) || 0,
          dailyWorkDays: Number(p.dailyWorkDays) || 0,
          holidayWorkDays: Number(p.holidayWorkDays) || 0,
          holidayChoice: p.holidayChoice || 'LEAVE_1_TO_1',
          baseEarned: Number(p.baseEarned) || 0,
          hourlyEarned: Number(p.hourlyEarned) || 0,
          dailyEarned: Number(p.dailyEarned) || 0,
          holidayEarned: Number(p.holidayEarned) || 0,
          bonusAmount: Number(p.bonusAmount) || 0,
          bonusDescription: p.bonusDescription,
          bonusItems: p.bonusItems,
          deductionAmount: Number(p.deductionAmount) || 0,
          deductionDescription: p.deductionDescription,
          deductionItems: p.deductionItems,
          grossTotal: Number(p.grossTotal) || 0,
          sgkEmployee: Number(p.sgkEmployee) || 0,
          unemploymentEmployee: Number(p.unemploymentEmployee) || 0,
          incomeTax: Number(p.incomeTax) || 0,
          stampTax: Number(p.stampTax) || 0,
          isManualTax: p.isManualTax ?? false,
          totalDeductions: Number(p.totalDeductions) || 0,
          netTotal: Number(p.netTotal) || 0,
          officialAmount: Number(p.officialAmount) || 0,
          unofficialAmount: Number(p.unofficialAmount) || 0,
          isPaid: p.isPaid ?? false,
          paidDate: toDate(p.paidDate),
          notes: p.notes,
          createdAt: toDate(p.createdAt) || new Date(),
          updatedAt: toDate(p.updatedAt) || new Date(),
        }
      });
    }

    // LeaveRecords (46)
    console.log(`Inserting ${dump.leaves.length} LeaveRecords...`);
    for (const l of dump.leaves) {
      await prisma.leaveRecord.create({
        data: {
          id: l.id,
          staffId: l.staffId,
          leaveType: l.leaveType,
          startDate: toDate(l.startDate) || new Date(),
          endDate: toDate(l.endDate) || new Date(),
          daysCount: Number(l.daysCount) || 0,
          description: l.description,
          status: l.status || 'APPROVED',
          createdAt: toDate(l.createdAt) || new Date(),
        }
      });
    }

    // SchoolExpenses (80)
    console.log(`Inserting ${dump.schoolExpenses.length} SchoolExpenses...`);
    for (const se of dump.schoolExpenses) {
      await prisma.schoolExpense.create({
        data: {
          id: se.id,
          title: se.title,
          category: se.category,
          subCategory: se.subCategory,
          period: se.period,
          installmentInfo: se.installmentInfo,
          dueDate: toDate(se.dueDate),
          dueDateStr: se.dueDateStr,
          amountDue: Number(se.amountDue) || 0,
          amountPaid: Number(se.amountPaid) || 0,
          amountRemaining: Number(se.amountRemaining) || 0,
          status: se.status || 'PENDING',
          periodStatus: se.periodStatus,
          description: se.description,
          paymentHistory: se.paymentHistory,
          isCommitment: se.isCommitment ?? false,
          commitmentEndDate: toDate(se.commitmentEndDate),
          commitmentMonths: se.commitmentMonths != null ? Number(se.commitmentMonths) : null,
          paymentMethod: se.paymentMethod || 'CASH',
          cardHolder: se.cardHolder,
          cardBank: se.cardBank,
          monthIndex: se.monthIndex != null ? Number(se.monthIndex) : null,
          phoneLines: se.phoneLines,
          chequeNo: se.chequeNo,
          chequeBank: se.chequeBank,
          createdAt: toDate(se.createdAt) || new Date(),
          updatedAt: toDate(se.updatedAt) || new Date(),
        }
      });
    }

    // AssetTrackings (4)
    console.log(`Inserting ${dump.assets.length} AssetTrackings...`);
    for (const a of dump.assets) {
      await prisma.assetTracking.create({
        data: {
          id: a.id,
          title: a.title,
          assetType: a.assetType || 'VEHICLE',
          owner: a.owner,
          inspectionDate: toDate(a.inspectionDate),
          insuranceDate: toDate(a.insuranceDate),
          kaskoDate: toDate(a.kaskoDate),
          housingDate: toDate(a.housingDate),
          notes: a.notes,
          createdAt: toDate(a.createdAt) || new Date(),
          updatedAt: toDate(a.updatedAt) || new Date(),
        }
      });
    }

    // ThirdPartyAccounts (4)
    console.log(`Inserting ${dump.cariAccounts.length} ThirdPartyAccounts...`);
    for (const ca of dump.cariAccounts) {
      await prisma.thirdPartyAccount.create({
        data: {
          id: ca.id,
          name: ca.name,
          type: ca.type || 'PERSON',
          phone: ca.phone,
          tcNo: ca.tcNo,
          iban: ca.iban,
          notes: ca.notes,
          balance: Number(ca.balance) || 0,
          createdAt: toDate(ca.createdAt) || new Date(),
          updatedAt: toDate(ca.updatedAt) || new Date(),
        }
      });
    }

    // ThirdPartyTransactions (12)
    console.log(`Inserting ${dump.cariTransactions.length} ThirdPartyTransactions...`);
    for (const ct of dump.cariTransactions) {
      await prisma.thirdPartyTransaction.create({
        data: {
          id: ct.id,
          accountId: ct.accountId,
          date: toDate(ct.date) || new Date(),
          type: ct.type,
          amount: Number(ct.amount) || 0,
          direction: ct.direction || 'OUTFLOW',
          balanceAfter: Number(ct.balanceAfter) || 0,
          paymentMethod: ct.paymentMethod || 'BANK',
          category: ct.category,
          description: ct.description,
          createdAt: toDate(ct.createdAt) || new Date(),
        }
      });
    }

    // Leads (3)
    console.log(`Inserting ${dump.leads.length} Leads...`);
    for (const l of dump.leads) {
      await prisma.lead.create({
        data: {
          id: l.id,
          studentName: l.studentName,
          birthDate: toDate(l.birthDate),
          gender: l.gender,
          currentSchool: l.currentSchool,
          section: l.section || 'ANAOKULU',
          targetGrade: l.targetGrade,
          educationType: l.educationType || 'TAM_GUN',
          programInterest: l.programInterest,
          source: l.source || 'OTHER',
          sourceDetail: l.sourceDetail,
          campaignType: l.campaignType,
          status: l.status || 'NEW',
          lostReason: l.lostReason,
          priority: l.priority || 'MEDIUM',
          parentName: l.parentName,
          parentRelation: l.parentRelation || 'MOTHER',
          parentPhone: l.parentPhone,
          parentPhone2: l.parentPhone2,
          parentEmail: l.parentEmail,
          parentJob: l.parentJob,
          cityDistrict: l.cityDistrict,
          address: l.address,
          assignedStaffId: l.assignedStaffId,
          offeredPrice: Number(l.offeredPrice) || 0,
          discountNote: l.discountNote,
          notes: l.notes,
          createdAt: toDate(l.createdAt) || new Date(),
          updatedAt: toDate(l.updatedAt) || new Date(),
        }
      });
    }

    // LeadInteractions (5)
    console.log(`Inserting ${dump.leadInteractions.length} LeadInteractions...`);
    for (const li of dump.leadInteractions) {
      await prisma.leadInteraction.create({
        data: {
          id: li.id,
          leadId: li.leadId,
          staffId: li.staffId,
          type: li.type || 'PHONE_CALL',
          result: li.result || 'NO_ANSWER',
          notes: li.notes,
          followUpDate: toDate(li.followUpDate),
          followUpTime: li.followUpTime,
          isCompleted: li.isCompleted ?? true,
          createdAt: toDate(li.createdAt) || new Date(),
        }
      });
    }

    // Classrooms (2)
    console.log(`Inserting ${dump.classrooms.length} Classrooms...`);
    for (const c of dump.classrooms) {
      await prisma.classroom.create({
        data: {
          id: c.id,
          name: c.name,
          section: c.section || 'ANAOKULU',
          gradeLevel: c.gradeLevel,
          branch: c.branch,
          capacity: Number(c.capacity) || 16,
          academicYear: c.academicYear || '2025-2026',
          roomNumber: c.roomNumber,
          teacherStaffId: c.teacherStaffId,
          createdAt: toDate(c.createdAt) || new Date(),
          updatedAt: toDate(c.updatedAt) || new Date(),
        }
      });
    }

    // Students (3)
    console.log(`Inserting ${dump.students.length} Students...`);
    for (const s of dump.students) {
      await prisma.student.create({
        data: {
          id: s.id,
          studentNo: s.studentNo,
          tcNo: s.tcNo,
          fullName: s.fullName,
          birthDate: toDate(s.birthDate),
          gender: s.gender || 'UNSPECIFIED',
          bloodGroup: s.bloodGroup,
          healthNotes: s.healthNotes,
          dietNotes: s.dietNotes,
          toiletTrained: s.toiletTrained ?? true,
          napTime: s.napTime ?? false,
          photoUrl: s.photoUrl,
          status: s.status || 'ACTIVE',
          fatherName: s.fatherName,
          fatherPhone: s.fatherPhone,
          fatherJob: s.fatherJob,
          motherName: s.motherName,
          motherPhone: s.motherPhone,
          motherJob: s.motherJob,
          guardianRelation: s.guardianRelation || 'FATHER',
          primaryPhone: s.primaryPhone,
          primaryEmail: s.primaryEmail,
          homeAddress: s.homeAddress,
          cityDistrict: s.cityDistrict,
          authorizedPickups: s.authorizedPickups,
          emergencyContact: s.emergencyContact,
          section: s.section || 'ANAOKULU',
          educationType: s.educationType || 'TAM_GUN',
          classroomId: s.classroomId,
          academicYear: s.academicYear || '2025-2026',
          enrollmentDate: toDate(s.enrollmentDate) || new Date(),
          graduationDate: toDate(s.graduationDate),
          previousSchool: s.previousSchool,
          serviceUsed: s.serviceUsed ?? false,
          mealUsed: s.mealUsed ?? true,
          contractAmount: Number(s.contractAmount) || 0,
          discountAmount: Number(s.discountAmount) || 0,
          netAmount: Number(s.netAmount) || 0,
          paymentMethod: s.paymentMethod || 'INSTALLMENT',
          installmentCount: Number(s.installmentCount) || 1,
          contractDiscountType: s.contractDiscountType,
          portalUsername: s.portalUsername,
          portalPassword: s.portalPassword,
          kvkkConsent: s.kvkkConsent ?? true,
          photoConsent: s.photoConsent ?? true,
          tags: s.tags,
          notes: s.notes,
          leadId: s.leadId,
          createdAt: toDate(s.createdAt) || new Date(),
          updatedAt: toDate(s.updatedAt) || new Date(),
        }
      });
    }

    // StudentPayments (32)
    console.log(`Inserting ${dump.studentPayments.length} StudentPayments...`);
    for (const sp of dump.studentPayments) {
      await prisma.studentPayment.create({
        data: {
          id: sp.id,
          studentId: sp.studentId,
          installmentNo: Number(sp.installmentNo),
          title: sp.title,
          dueDate: toDate(sp.dueDate) || new Date(),
          amount: Number(sp.amount) || 0,
          paidAmount: Number(sp.paidAmount) || 0,
          isPaid: sp.isPaid ?? false,
          paidDate: toDate(sp.paidDate),
          paymentMethod: sp.paymentMethod,
          receiptNo: sp.receiptNo,
          notes: sp.notes,
          createdAt: toDate(sp.createdAt) || new Date(),
          updatedAt: toDate(sp.updatedAt) || new Date(),
        }
      });
    }

    // StudentAttendances (0)
    if (dump.studentAttendances && dump.studentAttendances.length > 0) {
      console.log(`Inserting ${dump.studentAttendances.length} StudentAttendances...`);
      for (const sa of dump.studentAttendances) {
        await prisma.studentAttendance.create({
          data: {
            id: sa.id,
            studentId: sa.studentId,
            date: toDate(sa.date) || new Date(),
            lessonHour: sa.lessonHour,
            status: sa.status || 'PRESENT',
            notes: sa.notes,
            isNotified: sa.isNotified ?? false,
            createdAt: toDate(sa.createdAt) || new Date(),
          }
        });
      }
    }

    // Quotes (2)
    console.log(`Inserting ${dump.quotes.length} Quotes...`);
    for (const q of dump.quotes) {
      await prisma.priceQuote.create({
        data: {
          id: q.id,
          quoteNo: q.quoteNo,
          date: toDate(q.date) || new Date(),
          schoolName: q.schoolName || 'ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ',
          schoolAddress: q.schoolAddress,
          schoolPhone: q.schoolPhone,
          parentName: q.parentName,
          studentName: q.studentName,
          phone: q.phone,
          email: q.email,
          title: q.title || '2026 - 2027 Eğitim Öğretim Yılı mevcut aya özel erken kayıt ücretlerimizi bilgilerinize sunarız.',
          items: q.items || '[]',
          grossTotal: Number(q.grossTotal) || 0,
          discountTotal: Number(q.discountTotal) || 0,
          netTotal: Number(q.netTotal) || 0,
          kdvPercent: Number(q.kdvPercent) || 0,
          kdvTotal: Number(q.kdvTotal) || 0,
          grandTotal: Number(q.grandTotal) || 0,
          policyNotes: q.policyNotes,
          bankInfo: q.bankInfo,
          bankCampaigns: q.bankCampaigns,
          includeStamp: q.includeStamp ?? true,
          status: q.status || 'DRAFT',
          notes: q.notes,
          leadId: q.leadId,
          studentId: q.studentId,
          createdAt: toDate(q.createdAt) || new Date(),
          updatedAt: toDate(q.updatedAt) || new Date(),
        }
      });
    }

    // QuoteSettings (1)
    console.log(`Inserting ${dump.quoteSettings.length} QuoteSettings...`);
    for (const qs of dump.quoteSettings) {
      await prisma.quoteSetting.create({
        data: {
          id: qs.id || 'default',
          academicYear: qs.academicYear || '2026-2027',
          educationPrice: Number(qs.educationPrice) || 220000,
          diningPrice: Number(qs.diningPrice) || 80000,
          stationeryPrice: Number(qs.stationeryPrice) || 65000,
          summerPrice: Number(qs.summerPrice) || 45000,
          schoolName: qs.schoolName || 'ÖZEL KAYSERİ SİMYA ÇOCUK ÜNİVERSİTESİ',
          schoolAddress: qs.schoolAddress,
          schoolPhone: qs.schoolPhone,
          bankCampaigns: qs.bankCampaigns,
          policyNotes: qs.policyNotes,
          updatedAt: toDate(qs.updatedAt) || new Date(),
        }
      });
    }

    console.log('\n--- VERIFICATION OF INSERTED COUNTS ---');
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
      supplierCariAccounts: await prisma.supplierCariAccount.count(),
      supplierCariTransactions: await prisma.supplierCariTransaction.count(),
    };

    console.table(counts);
    console.log('--- ALL TABLES IMPORTED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

runImport().catch(() => process.exit(1));

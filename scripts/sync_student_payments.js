const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseTurkishDate(dateStr) {
  if (!dateStr) return new Date();
  const clean = dateStr.trim().split(' ')[0];
  const parts = clean.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 9, 0, 0));
  }
  return new Date();
}

async function run() {
  console.log("Starting Student Payments & Balances Synchronization...");

  const csvPath = path.join(__dirname, 'raw_students.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error("raw_students.csv file not found at " + csvPath);
  }

  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const lines = rawCsv.split('\n').filter(l => l.trim().length > 0);

  const studentsMap = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 15) continue;

    const studentShortCode = parts[2].trim();
    const contractNo = parts[3].trim();
    const fullName = parts[4].trim();
    const tcNo = parts[5].trim();
    const birthDate = parts[6].trim();
    const regDate = parts[7].trim();
    const saleType = parts[10].trim();
    const saleName = parts[11].trim();
    const className = parts[14].trim();
    const ciro = parseFloat(parts[16].trim()) || 0;
    const paid = parseFloat(parts[17].trim()) || 0;
    const discount = parseFloat(parts[19].trim()) || 0;
    const remaining = parseFloat(parts[21].trim()) || 0;
    const regDateOnly = parts[31]?.trim() || regDate;

    if (!studentsMap[tcNo]) {
      studentsMap[tcNo] = {
        fullName,
        tcNo,
        studentShortCode,
        contractNo,
        birthDate,
        regDate: regDateOnly,
        className,
        items: [],
        totalCiro: 0,
        totalDiscount: 0,
        totalNet: 0,
        totalPaid: 0,
        totalRemaining: 0,
      };
    }

    const s = studentsMap[tcNo];
    s.items.push({ saleType, saleName, ciro, discount, paid, remaining, contractNo });
    s.totalCiro += ciro;
    s.totalDiscount += discount;
    s.totalNet += (ciro - discount);
    s.totalPaid += paid;
    s.totalRemaining += remaining;
  }

  const studentList = Object.values(studentsMap);
  console.log(`Parsed ${studentList.length} unique students from CSV.`);

  let updatedCount = 0;
  let notFoundCount = 0;
  let totalPaymentsCreated = 0;

  for (const s of studentList) {
    const existing = await prisma.student.findUnique({
      where: { tcNo: s.tcNo }
    });

    if (!existing) {
      console.warn(`WARNING: Student not found in DB with TC: ${s.tcNo} (${s.fullName})`);
      notFoundCount++;
      continue;
    }

    // Build contractItems with paid and remaining amounts
    const contractItems = s.items.map((it, idx) => {
      let type = "OTHER";
      let title = it.saleName || "Ek Hizmet";
      if (it.saleType === "Eğitim") {
        type = "EDUCATION";
        title = "Eğitim Öğretim Hizmeti";
      } else if (it.saleType === "Yemek") {
        type = "MEAL";
        title = "Yıllık Yemek Hizmeti";
      } else if (it.saleType === "Yayın-Kırtasiye") {
        type = "STATIONERY";
        title = "Yayın & Kırtasiye Hizmeti";
      }

      return {
        id: `item-${type.toLowerCase()}-${idx + 1}`,
        type,
        title,
        amount: it.ciro,
        discountAmount: it.discount,
        paidAmount: it.paid,
        remainingAmount: it.remaining,
      };
    });

    const notesObj = {
      contractItems,
      userNote: `Sözleşme No: ${s.contractNo} | Kayıt: ${s.regDate}`
    };

    const installmentCount = (s.totalPaid > 0 && s.totalRemaining > 0) ? 2 : 1;
    const paymentMethod = s.totalRemaining > 0 ? "VINOV" : "BANK_TRANSFER";

    // Update Student record
    await prisma.student.update({
      where: { id: existing.id },
      data: {
        contractAmount: s.totalCiro,
        discountAmount: s.totalDiscount,
        netAmount: s.totalNet,
        installmentCount,
        paymentMethod,
        notes: JSON.stringify(notesObj)
      }
    });

    // Clear existing payments for this student
    await prisma.studentPayment.deleteMany({
      where: { studentId: existing.id }
    });

    const regDateObj = parseTurkishDate(s.regDate);
    let installmentNo = 1;

    // 1. Tahsil Edilen Tutar (Paid)
    if (s.totalPaid > 0) {
      await prisma.studentPayment.create({
        data: {
          studentId: existing.id,
          installmentNo: installmentNo++,
          title: "Tahsil Edilen Tutar",
          dueDate: regDateObj,
          paidDate: regDateObj,
          amount: s.totalPaid,
          paidAmount: s.totalPaid,
          isPaid: true,
          paymentMethod: "BANK_TRANSFER",
          receiptNo: `MAK-${s.contractNo || '2026'}-1`,
          notes: "Listeden aktarılan tahsilat tutarı"
        }
      });
      totalPaymentsCreated++;
    }

    // 2. Kalan Bakiye (Pending)
    if (s.totalRemaining > 0) {
      await prisma.studentPayment.create({
        data: {
          studentId: existing.id,
          installmentNo: installmentNo++,
          title: "Kalan Bakiye (Taksit / Vinov Planı)",
          dueDate: new Date(Date.UTC(2026, 9, 15, 9, 0, 0)), // 15 Ekim 2026
          amount: s.totalRemaining,
          paidAmount: 0,
          isPaid: false,
          paymentMethod: "VINOV",
          receiptNo: null,
          notes: "Düzenlenecek taksit / Vinov ödeme planı"
        }
      });
      totalPaymentsCreated++;
    }

    updatedCount++;
  }

  console.log("\nSynchronization Complete!");
  console.log(`- Updated Students: ${updatedCount}`);
  console.log(`- Not Found Students: ${notFoundCount}`);
  console.log(`- StudentPayment Records Created: ${totalPaymentsCreated}`);

  // Summary Verification
  const allStudents = await prisma.student.findMany({
    where: { academicYear: "2026-2027" },
    include: { payments: true }
  });

  let sumContract = 0;
  let sumPaid = 0;
  let sumRemaining = 0;

  allStudents.forEach(st => {
    sumContract += st.netAmount || 0;
    st.payments.forEach(p => {
      sumPaid += p.paidAmount || (p.isPaid ? p.amount : 0);
      if (!p.isPaid) {
        sumRemaining += Math.max(0, p.amount - (p.paidAmount || 0));
      }
    });
  });

  console.log("\n=== DATABASE VERIFICATION (2026-2027) ===");
  console.log(`Total Students:  ${allStudents.length}`);
  console.log(`Total Net Ciro:  ${sumContract.toLocaleString("tr-TR")} ₺`);
  console.log(`Total Paid:      ${sumPaid.toLocaleString("tr-TR")} ₺`);
  console.log(`Total Remaining: ${sumRemaining.toLocaleString("tr-TR")} ₺`);
}

run()
  .catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

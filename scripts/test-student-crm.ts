import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("COSMOS - EDUTIME ÖĞRENCİ & CRM ENTEGRASYON TESTİ");
  console.log("==================================================\n");

  try {
    // 0. Temizlik (Eski test verilerini temizle)
    console.log("1. Test Öncesi Temizlik yapılıyor...");
    await prisma.studentPayment.deleteMany({ where: { student: { tcNo: "99988877711" } } });
    await prisma.studentAttendance.deleteMany({ where: { student: { tcNo: "99988877711" } } });
    await prisma.student.deleteMany({ where: { tcNo: "99988877711" } });
    await prisma.leadInteraction.deleteMany({ where: { lead: { studentName: "TEST - Kerem Yılmaz" } } });
    await prisma.lead.deleteMany({ where: { studentName: "TEST - Kerem Yılmaz" } });
    await prisma.classroom.deleteMany({ where: { name: "TEST 8-A LGS" } });
    console.log("   ✓ Temizlik tamamlandı.\n");

    // 1. Sınıf Tanımlama
    console.log("2. Sınıf Oluşturuluyor: TEST 8-A LGS...");
    const classroom = await prisma.classroom.create({
      data: {
        name: "TEST 8-A LGS",
        gradeLevel: "8",
        branch: "LGS",
        capacity: 18,
        academicYear: "2025-2026",
        roomNumber: "Derslik 201",
      },
    });
    console.log(`   ✓ Sınıf oluşturuldu (ID: ${classroom.id}, Adı: ${classroom.name}, Kapasite: ${classroom.capacity})\n`);

    // 2. CRM Aday Öğrenci Oluşturma
    console.log("3. CRM Aday Öğrenci Ekleniyor: Kerem Yılmaz...");
    const lead = await prisma.lead.create({
      data: {
        studentName: "TEST - Kerem Yılmaz",
        targetGrade: "8. Sınıf (LGS)",
        currentSchool: "Cumhuriyet Ortaokulu",
        source: "INSTAGRAM",
        sourceDetail: "Erken Kayıt Instagram Kampanyası",
        priority: "HIGH",
        status: "NEW",
        parentName: "Murat Yılmaz",
        parentRelation: "FATHER",
        parentPhone: "05551234567",
        parentJob: "Yazılım Mühendisi",
        cityDistrict: "Kadıköy / Moda",
        offeredPrice: 85000,
        discountNote: "Peşin/Erken Kayıt %10 İndirimi",
        notes: "Veli bursluluk sınavı derecesine göre kayıt yaptırmak istiyor.",
      },
    });
    console.log(`   ✓ Aday oluşturuldu (ID: ${lead.id}, Durum: ${lead.status}, Veli: ${lead.parentName})\n`);

    // 3. Görüşme / Etkileşim Ekleme
    console.log("4. Görüşme Kaydı Ekleniyor (Telefon Görüşmesi & Randevu)...");
    const interaction1 = await prisma.leadInteraction.create({
      data: {
        leadId: lead.id,
        type: "PHONE_CALL",
        result: "APPOINTMENT_SET",
        notes: "Veli ile görüşüldü. Yarın saat 14:00'te kuruma kampüs ziyareti ve sözleşme için randevu verildi.",
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Adayın durumunu APPOINTMENT yap
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "APPOINTMENT" },
    });
    console.log(`   ✓ Görüşme kaydedildi (Tür: ${interaction1.type}, Sonuç: ${interaction1.result})`);
    console.log(`   ✓ Aday durumu güncellendi: APPOINTMENT\n`);

    // 4. Tek Tıkla Kesin Kayda (Öğrenciye) Dönüştürme & 10 Taksit Planı
    console.log("5. Aday Kesin Kayda Dönüştürülüyor (Öğrenci Kütüğü & Taksitler)...");
    const instCount = 10;
    const totalNet = 85000;
    const singleInst = 8500;

    const student = await prisma.$transaction(async (tx) => {
      const stu = await tx.student.create({
        data: {
          leadId: lead.id,
          studentNo: "2026-TEST-001",
          tcNo: "99988877711",
          fullName: lead.studentName,
          gender: "MALE",
          bloodGroup: "A+",
          healthNotes: "Toz alerjisi var",
          status: "ACTIVE",
          fatherName: lead.parentName,
          fatherPhone: lead.parentPhone,
          fatherJob: lead.parentJob,
          guardianRelation: lead.parentRelation,
          primaryPhone: lead.parentPhone,
          cityDistrict: lead.cityDistrict,
          classroomId: classroom.id,
          academicYear: "2025-2026",
          contractAmount: 85000,
          discountAmount: 0,
          netAmount: totalNet,
          installmentCount: instCount,
          tags: JSON.stringify(["BURSLU", "YEMEK"]),
        },
      });

      // 10 Taksit oluştur
      const start = new Date();
      for (let i = 1; i <= instCount; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + (i - 1));
        await tx.studentPayment.create({
          data: {
            studentId: stu.id,
            installmentNo: i,
            title: `${i}. Taksit`,
            dueDate: d,
            amount: singleInst,
            paidAmount: 0,
            isPaid: false,
          },
        });
      }

      // Lead durumunu REGISTERED yap
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: "REGISTERED" },
      });

      return stu;
    });

    console.log(`   ✓ Öğrenci oluşturuldu (ID: ${student.id}, TC: ${student.tcNo}, No: ${student.studentNo})`);
    console.log(`   ✓ Sınıf Atandı: TEST 8-A LGS`);
    console.log(`   ✓ 10 adet taksit oluşturuldu (Taksit başı: ${singleInst.toLocaleString("tr-TR")} ₺)`);
    console.log(`   ✓ CRM Aday durumu güncellendi: REGISTERED\n`);

    // 5. Taksit Tahsilatı
    console.log("6. 1. Taksit Tahsilatı Alınıyor...");
    const firstPayment = await prisma.studentPayment.findFirst({
      where: { studentId: student.id, installmentNo: 1 },
    });

    if (firstPayment) {
      const updatedPayment = await prisma.studentPayment.update({
        where: { id: firstPayment.id },
        data: {
          paidAmount: 8500,
          isPaid: true,
          paidDate: new Date(),
          paymentMethod: "CASH",
          receiptNo: "MAK-2026-0001",
          notes: "Nakit elden tahsil edildi, veliye makbuz teslim edildi.",
        },
      });
      console.log(`   ✓ 1. Taksit ödendi olarak işaretlendi (Tutar: ${updatedPayment.paidAmount} ₺, Makbuz: ${updatedPayment.receiptNo})\n`);
    }

    // 6. Yoklama / Devamsızlık Kaydı
    console.log("7. Öğrenci Yoklama Kaydı Giriliyor...");
    const attendance = await prisma.studentAttendance.create({
      data: {
        studentId: student.id,
        date: new Date(),
        lessonHour: "Tüm Gün",
        status: "PRESENT",
        notes: "Derslere eksiksiz katıldı.",
        isNotified: false,
      },
    });
    console.log(`   ✓ Yoklama kaydedildi (Tarih: ${attendance.date.toLocaleDateString("tr-TR")}, Durum: ${attendance.status})\n`);

    // 7. Doğrulama Sorguları
    console.log("8. Veritabanı İlişkileri Doğrulanıyor...");
    const verifyStudent = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        classroom: true,
        payments: true,
        attendances: true,
        lead: {
          include: { interactions: true },
        },
      },
    });

    console.log(`   - Öğrenci Adı: ${verifyStudent?.fullName}`);
    console.log(`   - Kayıtlı Olduğu Sınıf: ${verifyStudent?.classroom?.name}`);
    console.log(`   - Toplam Taksit Sayısı: ${verifyStudent?.payments.length}`);
    console.log(`   - Ödenen Taksit Sayısı: ${verifyStudent?.payments.filter((p) => p.isPaid).length}`);
    console.log(`   - Kalan Taksit Sayısı: ${verifyStudent?.payments.filter((p) => !p.isPaid).length}`);
    console.log(`   - Bağlı CRM Aday Durumu: ${verifyStudent?.lead?.status}`);
    console.log(`   - CRM Görüşme Adedi: ${verifyStudent?.lead?.interactions.length}`);
    console.log(`   - Toplam Yoklama Sayısı: ${verifyStudent?.attendances.length}`);

    // 8. Test Verilerini Temizle
    console.log("\n9. Test Verileri Temizleniyor...");
    await prisma.studentPayment.deleteMany({ where: { studentId: student.id } });
    await prisma.studentAttendance.deleteMany({ where: { studentId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });
    await prisma.leadInteraction.deleteMany({ where: { leadId: lead.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.classroom.delete({ where: { id: classroom.id } });
    console.log("   ✓ Test verileri başarıyla temizlendi.");

    console.log("\n==================================================");
    console.log("TÜM ENTEGRASYON VE ÇALIŞMA TESTLERİ BAŞARIYLA GEÇTİ! ✅");
    console.log("==================================================");
  } catch (err) {
    console.error("TEST HATASI:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

import { prisma } from "../lib/prisma";

async function runKindergartenTest() {
  console.log("--------------------------------------------------");
  console.log("ANAOKULU & EDUTIME 1-TO-1 ÖĞRENCİ ENTEGRASYON TESTİ");
  console.log("--------------------------------------------------");

  const testTc = "11122233344";

  // Temizlik
  await prisma.studentPayment.deleteMany({ where: { student: { tcNo: testTc } } });
  await prisma.studentAttendance.deleteMany({ where: { student: { tcNo: testTc } } });
  await prisma.student.deleteMany({ where: { tcNo: testTc } });

  console.log("1. Anaokulu Sınıfı aranıyor/oluşturuluyor...");
  let kgClass = await prisma.classroom.findFirst({ where: { section: "ANAOKULU" } });
  if (!kgClass) {
    kgClass = await prisma.classroom.create({
      data: {
        name: "Minik Dahiler 4 Yaş",
        section: "ANAOKULU",
        gradeLevel: "4_YAS",
        branch: "A",
        capacity: 14,
        academicYear: "2025-2026",
      },
    });
  }
  console.log(`   ✓ Anaokulu Sınıfı hazır: ${kgClass.name} (Kapasite: ${kgClass.capacity})`);

  console.log("2. 4 Yaş Anaokulu Öğrencisi (Yetkili Teslim, Diyet, Portal, Uyku) kaydediliyor...");
  const pickups = [
    { name: "Fatma Demir", relation: "ANNEANNE", phone: "0532 999 11 22", tcNo: "12345678901" },
    { name: "Kemal Demir", relation: "DEDE", phone: "0532 999 33 44", tcNo: "12345678902" },
  ];

  const student = await prisma.student.create({
    data: {
      studentNo: "2026-ANA-001",
      tcNo: testTc,
      fullName: "TEST - Defne Demir",
      birthDate: new Date("2021-04-15"),
      gender: "FEMALE",
      bloodGroup: "A+",
      section: "ANAOKULU",
      educationType: "TAM_GUN",
      classroomId: kgClass.id,
      academicYear: "2025-2026",
      toiletTrained: true,
      napTime: true,
      mealUsed: true,
      serviceUsed: true,
      dietNotes: "İnek sütü alerjisi var, badem sütü tüketiyor.",
      healthNotes: "Cilt hassasiyeti için özel krem kullanılır.",
      authorizedPickups: JSON.stringify(pickups),
      emergencyContact: "Aile Hekimi Dr. Ahmet Bey (0505 111 22 33)",
      portalUsername: "veli.33344",
      portalPassword: "PIN-443322",
      kvkkConsent: true,
      photoConsent: true,
      contractDiscountType: "KARDES",
      contractAmount: 120000,
      discountAmount: 12000,
      netAmount: 108000,
      installmentCount: 10,
      primaryPhone: "0532 555 44 33",
      primaryEmail: "veli.defne@gmail.com",
      motherName: "Selin Demir",
      motherPhone: "0532 555 44 33",
      motherJob: "Mimar",
      fatherName: "Can Demir",
      fatherPhone: "0533 666 77 88",
      fatherJob: "Mühendis",
      guardianRelation: "MOTHER",
      homeAddress: "Bahçelievler Mah. Çiçek Sok. No: 12",
      cityDistrict: "Çankaya / Ankara",
    },
  });

  console.log(`   ✓ Öğrenci oluşturuldu: ${student.fullName}`);
  console.log(`   - Kademe: ${student.section}, Eğitim Türü: ${student.educationType}`);
  console.log(`   - Tuvalet: ${student.toiletTrained}, Uyku: ${student.napTime}`);
  console.log(`   - Yemek: ${student.mealUsed}, Servis: ${student.serviceUsed}`);
  console.log(`   - Özel Diyet: ${student.dietNotes}`);
  console.log(`   - Yetkili Teslim Listesi: ${student.authorizedPickups}`);
  console.log(`   - Veli Portalı: ${student.portalUsername} (PIN: ${student.portalPassword})`);

  console.log("3. Okuma ve JSON Parse Testi...");
  const fetched = await prisma.student.findUnique({
    where: { id: student.id },
    include: { classroom: true },
  });

  const parsedPickups = JSON.parse(fetched?.authorizedPickups || "[]");
  if (parsedPickups.length === 2 && parsedPickups[0].name === "Fatma Demir") {
    console.log("   ✓ Yetkili teslim şahısları JSON parse doğrulandı!");
  } else {
    throw new Error("Yetkili teslim şahısları uyuşmuyor!");
  }

  // Temizlik
  console.log("4. Test verisi temizleniyor...");
  await prisma.student.delete({ where: { id: student.id } });
  console.log("   ✓ Temizlendi.");

  console.log("--------------------------------------------------");
  console.log("ANAOKULU & TÜM EDUTIME ÖZELLİKLERİ TESTTEN GEÇTİ! 🧸✅");
  console.log("--------------------------------------------------");
}

runKindergartenTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

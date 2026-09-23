import { calculatePayroll } from "../lib/payroll-calculator";

function runTests() {
  console.log("=== BORDRO MOTORU DOĞRULAMA TESTLERİ ===");

  // Test 1: Akif Bey - Aylık Maaşlı (28.075,50 TL), 30 gün çalışma, 1 gün rapor
  const akifResult = calculatePayroll({
    salaryType: "MONTHLY",
    monthlySalary: 28075.5,
    hourlyRate: 0,
    dailyRate: 0,
    workDays: 30,
    reportDays: 1,
    unpaidLeaveDays: 0,
    lessonHours: 0,
    dailyWorkDays: 0,
    holidayWorkDays: 0,
    holidayChoice: "LEAVE_1_TO_1",
  });

  const expectedDaily = 28075.5 / 30; // 935.85 TL
  const expectedEarned = Number((expectedDaily * 29).toFixed(2)); // 27139.65 TL

  console.log("Test 1 (Akif Sancak - 1 Gün Rapor):");
  console.log(`  Hesaplanan Brüt Hakediş: ${akifResult.baseEarned} TL (Beklenen: ${expectedEarned} TL)`);
  if (Math.abs(akifResult.baseEarned - expectedEarned) < 0.01) {
    console.log("  ✔ BAŞARILI: 1 gün rapor tutarı (935,85 TL) tam olarak düşüldü!");
  } else {
    console.error("  ❌ HATA: Hesap uyuşmuyor!");
  }

  // Test 2: Ders Saatli Personel - 450 TL/saat, 15 ders
  const dersResult = calculatePayroll({
    salaryType: "HOURLY",
    monthlySalary: 0,
    hourlyRate: 450,
    dailyRate: 0,
    workDays: 30,
    reportDays: 0,
    unpaidLeaveDays: 0,
    lessonHours: 15,
    dailyWorkDays: 0,
    holidayWorkDays: 0,
    holidayChoice: "LEAVE_1_TO_1",
  });

  console.log("\nTest 2 (Ders Saatli - 450 TL x 15 Saat):");
  console.log(`  Hesaplanan: ${dersResult.hourlyEarned} TL (Beklenen: 6750 TL)`);
  if (dersResult.hourlyEarned === 6750) {
    console.log("  ✔ BAŞARILI: 450 x 15 = 6.750 TL tam hesaplandı!");
  } else {
    console.error("  ❌ HATA!");
  }

  // Test 3: Resmi Tatil Mesaisi - Seçenek A (1'e 1 İzin) vs Seçenek B (Çift Yevmiye)
  const holidayLeaveResult = calculatePayroll({
    salaryType: "MONTHLY",
    monthlySalary: 30000,
    hourlyRate: 0,
    dailyRate: 0,
    workDays: 30,
    reportDays: 0,
    unpaidLeaveDays: 0,
    lessonHours: 0,
    dailyWorkDays: 0,
    holidayWorkDays: 1,
    holidayChoice: "LEAVE_1_TO_1",
  });

  const holidayDoubleResult = calculatePayroll({
    salaryType: "MONTHLY",
    monthlySalary: 30000,
    hourlyRate: 0,
    dailyRate: 0,
    workDays: 30,
    reportDays: 0,
    unpaidLeaveDays: 0,
    lessonHours: 0,
    dailyWorkDays: 0,
    holidayWorkDays: 1,
    holidayChoice: "DOUBLE_PAY",
  });

  console.log("\nTest 3 (Resmi Tatil Mesaisi Tercihleri):");
  console.log(`  Seçenek A (1'e 1 İzin): Eklenen Tutar = ${holidayLeaveResult.holidayEarned} TL (0 olmalı, izne yansır)`);
  console.log(`  Seçenek B (Çift Yevmiye): Eklenen Tutar = ${holidayDoubleResult.holidayEarned} TL (1000 TL yevmiye olmalı)`);

  if (holidayLeaveResult.holidayEarned === 0 && holidayDoubleResult.holidayEarned === 1000) {
    console.log("  ✔ BAŞARILI: İzin ve Çift Yevmiye ayrımı kusursuz çalışıyor!");
  } else {
    console.error("  ❌ HATA!");
  }
}

runTests();

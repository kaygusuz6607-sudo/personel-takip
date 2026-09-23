import { calculatePayroll, calculateOfficialSplit } from "../lib/payroll-calculator";

function runTests() {
  console.log("=== BORDRO VE ATAMA TARİHİ GEÇİŞ TESTLERİ ===");

  // Test: Akif Sancak - İşe Giriş 01.09.2026, Atama 24.09.2026 (23 gün elden, 7 gün banka)
  const split = calculateOfficialSplit({
    netTotal: 28075.5,
    monthlySalary: 28075.5,
    year: 2026,
    month: 9,
    hireDate: "2026-09-01",
    mebAssignmentDate: "2026-09-24",
    sgkStartDate: "2026-09-24",
  });

  const daily = 28075.5 / 30; // 935.85
  const expectedElden = Number((daily * 23).toFixed(2)); // 21524.55
  const expectedBanka = Number((28075.5 - expectedElden).toFixed(2)); // 6550.95

  console.log(`Akif Sancak Atama Geçiş Testi (24 Eylül Ataması):`);
  console.log(`  Elden (Atama Öncesi 23 Gün): ${split.unofficialAmount} TL (Beklenen: ${expectedElden} TL)`);
  console.log(`  Banka (Atama Sonrası 7 Gün): ${split.officialAmount} TL (Beklenen: ${expectedBanka} TL)`);

  if (
    Math.abs(split.unofficialAmount - expectedElden) < 0.05 &&
    Math.abs(split.officialAmount - expectedBanka) < 0.05
  ) {
    console.log("  ✔ BAŞARILI: Atama öncesi elden, atama sonrası banka tam olarak hesaplandı!");
  } else {
    console.error("  ❌ HATA: Hesap uyuşmuyor!");
  }
}

runTests();

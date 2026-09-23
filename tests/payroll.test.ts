import { calculateOfficialSplit } from "../lib/payroll-calculator";

function runTests() {
  console.log("=== TÜM SENARYOLAR İÇİN ELDEN VE BANKA TESTLERİ ===");

  // Senaryo 1: Akif Sancak - Eylül 2026 (Atama Ayı: 24 Eylül'de atandı)
  // İşe giriş 01.09.2026 -> 23 gün ELDEN, 7 gün BANKA
  const s1 = calculateOfficialSplit({
    netTotal: 28075.5,
    monthlySalary: 28075.5,
    year: 2026,
    month: 9,
    hireDate: "2026-09-01",
    mebAssignmentDate: "2026-09-24",
    sgkStartDate: "2026-09-24",
  });
  console.log("Senaryo 1 (Geçiş Ayı - Eylül 2026):");
  console.log(`  Elden (23 gün): ${s1.unofficialAmount} TL (Beklenen: 21524.55 TL)`);
  console.log(`  Banka (7 gün): ${s1.officialAmount} TL (Beklenen: 6550.95 TL)`);
  if (s1.unofficialAmount === 21524.55 && s1.officialAmount === 6550.95) {
    console.log("  ✔ BAŞARILI!");
  } else {
    console.error("  ❌ HATA!");
  }

  // Senaryo 2: Akif Sancak - Ekim 2026 (Atama Sonrası Ay: Ataması tamamlandı)
  // Artık resmi SGK'lı -> %100 BANKA, 0 ELDEN
  const s2 = calculateOfficialSplit({
    netTotal: 28075.5,
    monthlySalary: 28075.5,
    year: 2026,
    month: 10,
    hireDate: "2026-09-01",
    mebAssignmentDate: "2026-09-24",
    sgkStartDate: "2026-09-24",
  });
  console.log("\nSenaryo 2 (Atama Sonrası - Ekim 2026):");
  console.log(`  Banka: ${s2.officialAmount} TL (Beklenen: 28075.50 TL)`);
  console.log(`  Elden: ${s2.unofficialAmount} TL (Beklenen: 0 TL)`);
  if (s2.officialAmount === 28075.5 && s2.unofficialAmount === 0) {
    console.log("  ✔ BAŞARILI!");
  } else {
    console.error("  ❌ HATA!");
  }

  // Senaryo 3: Akif Sancak - Ağustos 2026 (Atama Öncesi Ay: Henüz atanmadı)
  // Tamamen gayriresmi -> %100 ELDEN, 0 BANKA
  const s3 = calculateOfficialSplit({
    netTotal: 28075.5,
    monthlySalary: 28075.5,
    year: 2026,
    month: 8,
    hireDate: "2026-08-01",
    mebAssignmentDate: "2026-09-24",
    sgkStartDate: "2026-09-24",
  });
  console.log("\nSenaryo 3 (Atama Öncesi - Ağustos 2026):");
  console.log(`  Elden: ${s3.unofficialAmount} TL (Beklenen: 28075.50 TL)`);
  console.log(`  Banka: ${s3.officialAmount} TL (Beklenen: 0 TL)`);
  if (s3.unofficialAmount === 28075.5 && s3.officialAmount === 0) {
    console.log("  ✔ BAŞARILI!");
  } else {
    console.error("  ❌ HATA!");
  }
}

runTests();

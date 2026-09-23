export interface SalaryCalculationInput {
  salaryType: "MONTHLY" | "HOURLY" | "DAILY" | "HYBRID" | string;
  monthlySalary: number;
  hourlyRate: number;
  dailyRate: number;
  officialSalaryPart?: number; // Kayıtlı resmi maaş kısmı

  // Ay parametreleri
  year?: number;
  month?: number;
  workDays: number; // Varsayılan 30 (SGK Standardı)
  reportDays: number;
  unpaidLeaveDays: number;
  lessonHours: number;
  dailyWorkDays: number;
  holidayWorkDays: number;
  holidayChoice: "LEAVE_1_TO_1" | "DOUBLE_PAY" | string;

  // Tarih bilgileri (Elden vs Banka ayrımı için)
  hireDate?: string | Date | null;
  mebAssignmentDate?: string | Date | null;
  sgkStartDate?: string | Date | null;

  // Esnek Ek Ücret (+) ve Manuel Kesinti (-)
  bonusAmount?: number;
  bonusDescription?: string;
  deductionAmount?: number;
  deductionDescription?: string;

  // SGK/Vergi kesintisi istenirse
  isManualTax?: boolean;
  manualSgkEmployee?: number;
  manualUnemployment?: number;
  manualIncomeTax?: number;
  manualStampTax?: number;
}

export interface SalaryCalculationResult {
  baseEarned: number;
  hourlyEarned: number;
  dailyEarned: number;
  holidayEarned: number;
  bonusAmount: number;
  bonusDescription: string;
  deductionAmount: number;
  deductionDescription: string;
  grossTotal: number;

  sgkEmployee: number;
  unemploymentEmployee: number;
  incomeTax: number;
  stampTax: number;
  totalDeductions: number;

  netTotal: number;
  officialAmount: number;
  unofficialAmount: number;
}

export function parseSafeDate(d: string | Date | null | undefined): { year: number; month: number; day: number } | null {
  if (!d) return null;
  const str = d instanceof Date ? d.toISOString() : String(d);
  const datePart = str.split("T")[0];
  const parts = datePart.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return null;
}

/**
 * İşe girişinden ataması yapıldığı güne kadar olan süreyi ELDEN;
 * Atamasından ay sonuna kadar olan süreyi RESMÎ BANKA olarak hesaplar.
 */
export function calculateOfficialSplit(params: {
  netTotal: number;
  monthlySalary: number;
  year?: number;
  month?: number;
  hireDate?: string | Date | null;
  mebAssignmentDate?: string | Date | null;
  sgkStartDate?: string | Date | null;
  officialSalaryPart?: number;
  reportDays?: number;
}): { officialAmount: number; unofficialAmount: number } {
  const {
    netTotal,
    monthlySalary = 0,
    year = 2024,
    month = 8,
    hireDate,
    mebAssignmentDate,
    sgkStartDate,
    officialSalaryPart = 0,
    reportDays = 0,
  } = params;

  if (netTotal <= 0) {
    return { officialAmount: 0, unofficialAmount: 0 };
  }

  // Atama / resmi SGK başlangıç tarihi
  const assignParsed = parseSafeDate(mebAssignmentDate || sgkStartDate);

  // 1. Hiç atama tarihi yoksa -> Personel henüz resmi kayıtsız, TAMAMI ELDEN
  if (!assignParsed) {
    return { officialAmount: 0, unofficialAmount: netTotal };
  }

  const { year: assignYear, month: assignMonth, day: assignDay } = assignParsed;

  // 2. Gelecek bir tarihte atanacaksa -> Bu ay boyunca TAMAMI ELDEN
  if (assignYear > year || (assignYear === year && assignMonth > month)) {
    return { officialAmount: 0, unofficialAmount: netTotal };
  }

  // 3. Geçmiş bir ayda zaten atanmışsa -> Normal resmi dönem
  if (assignYear < year || (assignYear === year && assignMonth < month)) {
    if (officialSalaryPart > 0) {
      const off = Math.min(netTotal, Number(officialSalaryPart.toFixed(2)));
      return { officialAmount: off, unofficialAmount: Number((netTotal - off).toFixed(2)) };
    }
    return { officialAmount: netTotal, unofficialAmount: 0 };
  }

  // 4. ATAMA BU AYIN İÇİNDE YAPILMIŞ (Geçiş Ayı: İşe girişten atamaya kadar ELDEN, atamadan sonraya BANKA!)
  let startDay = 1;
  const hireParsed = parseSafeDate(hireDate);
  if (hireParsed && hireParsed.year === year && hireParsed.month === month) {
    startDay = hireParsed.day;
  }

  // Atamaya kadar geçen gün sayısı (Elden günleri: örn. 1'inden 24'üne -> 23 gün)
  const unofficialDays = Math.max(0, assignDay - startDay);

  const dailyBase = monthlySalary > 0 ? monthlySalary / 30 : netTotal / 30;

  let unofficialAmount = Number((dailyBase * unofficialDays).toFixed(2));
  unofficialAmount = Math.min(netTotal, unofficialAmount);
  const officialAmount = Number((netTotal - unofficialAmount).toFixed(2));

  return { officialAmount, unofficialAmount };
}

export function calculatePayroll(input: SalaryCalculationInput): SalaryCalculationResult {
  const {
    salaryType,
    monthlySalary = 0,
    hourlyRate = 0,
    dailyRate = 0,
    year = 2024,
    month = 8,
    workDays = 30,
    reportDays = 0,
    unpaidLeaveDays = 0,
    lessonHours = 0,
    dailyWorkDays = 0,
    holidayWorkDays = 0,
    holidayChoice = "LEAVE_1_TO_1",
    bonusAmount = 0,
    bonusDescription = "",
    deductionAmount = 0,
    deductionDescription = "",
    hireDate = null,
    mebAssignmentDate = null,
    sgkStartDate = null,
    officialSalaryPart = 0,
    isManualTax = false,
    manualSgkEmployee = 0,
    manualUnemployment = 0,
    manualIncomeTax = 0,
    manualStampTax = 0,
  } = input;

  let baseEarned = 0;
  let hourlyEarned = 0;
  let dailyEarned = 0;
  let holidayEarned = 0;

  // 1. Standart Günlük Yevmiye Hesabı (Maaş / 30)
  const dailyBase = monthlySalary > 0 ? monthlySalary / 30 : 0;

  // 2. Ücret Tipine Göre Hakediş Hesaplama
  if (salaryType === "MONTHLY" || salaryType === "HYBRID") {
    const effectivePaidDays = Math.max(0, workDays - reportDays - unpaidLeaveDays);
    baseEarned = Number((dailyBase * effectivePaidDays).toFixed(2));
  }

  if (salaryType === "HOURLY" || salaryType === "HYBRID") {
    hourlyEarned = Number((lessonHours * hourlyRate).toFixed(2));
  }

  if (salaryType === "DAILY") {
    dailyEarned = Number((dailyWorkDays * dailyRate).toFixed(2));
  }

  // 3. Resmi Tatil Mesaisi
  if (holidayWorkDays > 0) {
    if (holidayChoice === "DOUBLE_PAY") {
      const holidayDaily = dailyBase > 0 ? dailyBase : dailyRate;
      holidayEarned = Number((holidayDaily * holidayWorkDays).toFixed(2));
    } else {
      holidayEarned = 0;
    }
  }

  // 4. Brüt Toplam = Maaş + Ders Saati + Ek Ücretler
  const grossTotal = Number(
    (baseEarned + hourlyEarned + dailyEarned + holidayEarned + (Number(bonusAmount) || 0)).toFixed(2)
  );

  // 5. Kesintiler
  let taxDeductions = 0;
  let sgkEmployee = 0;
  let unemploymentEmployee = 0;
  let incomeTax = 0;
  let stampTax = 0;

  if (isManualTax) {
    sgkEmployee = Number(manualSgkEmployee.toFixed(2));
    unemploymentEmployee = Number(manualUnemployment.toFixed(2));
    incomeTax = Number(manualIncomeTax.toFixed(2));
    stampTax = Number(manualStampTax.toFixed(2));
    taxDeductions = sgkEmployee + unemploymentEmployee + incomeTax + stampTax;
  }

  const directDeductions = Number(deductionAmount) || 0;
  const totalDeductions = Number((directDeductions + taxDeductions).toFixed(2));

  // 6. Net Ödeme
  const netTotal = Math.max(0, Number((grossTotal - totalDeductions).toFixed(2)));

  // 7. Akif Bey'in Kuralı: İşe girişten atamaya kadar ELDEN, atamadan sonraya RESMİ BANKA
  const { officialAmount, unofficialAmount } = calculateOfficialSplit({
    netTotal,
    monthlySalary,
    year,
    month,
    hireDate,
    mebAssignmentDate,
    sgkStartDate,
    officialSalaryPart,
    reportDays,
  });

  return {
    baseEarned,
    hourlyEarned,
    dailyEarned,
    holidayEarned,
    bonusAmount: Number(bonusAmount) || 0,
    bonusDescription: bonusDescription || "",
    deductionAmount: directDeductions,
    deductionDescription: deductionDescription || "",
    grossTotal,
    sgkEmployee,
    unemploymentEmployee,
    incomeTax,
    stampTax,
    totalDeductions,
    netTotal,
    officialAmount,
    unofficialAmount,
  };
}

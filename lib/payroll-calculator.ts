export interface SalaryCalculationInput {
  salaryType: "MONTHLY" | "HOURLY" | "DAILY" | "HYBRID" | string;
  monthlySalary: number;
  hourlyRate: number;
  dailyRate: number;
  officialSalaryPart?: number; // Kayıtlı resmi maaş kısmı

  // Ay parametreleri
  workDays: number; // Varsayılan 30 (SGK Standardı)
  reportDays: number;
  unpaidLeaveDays: number;
  lessonHours: number;
  dailyWorkDays: number;
  holidayWorkDays: number;
  holidayChoice: "LEAVE_1_TO_1" | "DOUBLE_PAY" | string;

  // Esnek Ek Ücret (+) ve Manuel Kesinti (-) (Kullanıcı Talebi)
  bonusAmount?: number; // Prim, Yol, İkramiye vb. (+)
  bonusDescription?: string;
  deductionAmount?: number; // Avans, Ceza, Eksik Gün Kesintisi vb. (-)
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

export function calculatePayroll(input: SalaryCalculationInput): SalaryCalculationResult {
  const {
    salaryType,
    monthlySalary = 0,
    hourlyRate = 0,
    dailyRate = 0,
    workDays = 30, // Standart 30 gün
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
    isManualTax = false,
    manualSgkEmployee = 0,
    manualUnemployment = 0,
    manualIncomeTax = 0,
    manualStampTax = 0,
    officialSalaryPart = 0,
  } = input;

  let baseEarned = 0;
  let hourlyEarned = 0;
  let dailyEarned = 0;
  let holidayEarned = 0;

  // 1. Standart Günlük Yevmiye Hesabı (Maaş / 30)
  const dailyBase = monthlySalary > 0 ? monthlySalary / 30 : 0;

  // 2. Ücret Tipine Göre Hakediş Hesaplama
  if (salaryType === "MONTHLY" || salaryType === "HYBRID") {
    // 30 günden rapor ve ücretsiz izin düşülür
    const effectivePaidDays = Math.max(0, workDays - reportDays - unpaidLeaveDays);
    baseEarned = Number((dailyBase * effectivePaidDays).toFixed(2));
  }

  if (salaryType === "HOURLY" || salaryType === "HYBRID") {
    hourlyEarned = Number((lessonHours * hourlyRate).toFixed(2));
  }

  if (salaryType === "DAILY") {
    dailyEarned = Number((dailyWorkDays * dailyRate).toFixed(2));
  }

  // 3. Resmi Tatil Mesaisi Hesabı
  if (holidayWorkDays > 0) {
    if (holidayChoice === "DOUBLE_PAY") {
      const holidayDaily = dailyBase > 0 ? dailyBase : dailyRate;
      holidayEarned = Number((holidayDaily * holidayWorkDays).toFixed(2));
    } else {
      holidayEarned = 0; // LEAVE_1_TO_1 izin havuzuna eklenir
    }
  }

  // 4. Brüt Toplam = Maaş/Ders Hakedişi + Resmi Tatil + Ek Ücretler (Bonuslar)
  const grossTotal = Number(
    (baseEarned + hourlyEarned + dailyEarned + holidayEarned + (Number(bonusAmount) || 0)).toFixed(2)
  );

  // 5. Kesintiler: Kullanıcının girdiği doğrudan Kesinti Tutarı (-) + Varsa yasal kesintiler
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

  // 6. Net Ödeme = Brüt Toplam - Toplam Kesintiler
  const netTotal = Math.max(0, Number((grossTotal - totalDeductions).toFixed(2)));

  // 7. Resmi vs Gayriresmi (Elden) Ödeme Ayrımı
  let officialAmount = 0;
  let unofficialAmount = 0;

  if (officialSalaryPart && officialSalaryPart > 0) {
    officialAmount = Math.min(netTotal, Number(officialSalaryPart.toFixed(2)));
    unofficialAmount = Math.max(0, Number((netTotal - officialAmount).toFixed(2)));
  } else {
    // Resmi kısım belirtilmemişse veya gayriresmi dönemdeyse tamamı elden
    officialAmount = netTotal;
    unofficialAmount = 0;
  }

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

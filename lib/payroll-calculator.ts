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

  // Manuel kesinti müdahalesi varsa
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
    workDays = 30, // SGK 30 gün standardı
    reportDays = 0,
    unpaidLeaveDays = 0,
    lessonHours = 0,
    dailyWorkDays = 0,
    holidayWorkDays = 0,
    holidayChoice = "LEAVE_1_TO_1",
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
      // Çift yevmiye: Aylık maaşlı ise günlükBase, günlük ücretli ise dailyRate baz alınır
      const holidayDaily = dailyBase > 0 ? dailyBase : dailyRate;
      holidayEarned = Number((holidayDaily * holidayWorkDays).toFixed(2));
    } else {
      // LEAVE_1_TO_1: Bordroya para eklenmez, izin havuzuna 1'e 1 gün eklenir
      holidayEarned = 0;
    }
  }

  // 4. Brüt Toplam
  const grossTotal = Number((baseEarned + hourlyEarned + dailyEarned + holidayEarned).toFixed(2));

  // 5. Kesinti Hesaplama (SGK %14, İşsizlik %1, Gelir Vergisi %15, Damga %0.759)
  let sgkEmployee = 0;
  let unemploymentEmployee = 0;
  let incomeTax = 0;
  let stampTax = 0;

  if (isManualTax) {
    sgkEmployee = Number(manualSgkEmployee.toFixed(2));
    unemploymentEmployee = Number(manualUnemployment.toFixed(2));
    incomeTax = Number(manualIncomeTax.toFixed(2));
    stampTax = Number(manualStampTax.toFixed(2));
  } else {
    // Otomatik hesap
    sgkEmployee = Number((grossTotal * 0.14).toFixed(2));
    unemploymentEmployee = Number((grossTotal * 0.01).toFixed(2));
    incomeTax = Number((grossTotal * 0.15).toFixed(2));
    stampTax = Number((grossTotal * 0.00759).toFixed(2));
  }

  const totalDeductions = Number(
    (sgkEmployee + unemploymentEmployee + incomeTax + stampTax).toFixed(2)
  );

  // 6. Net Ödeme
  const netTotal = Math.max(0, Number((grossTotal - totalDeductions).toFixed(2)));

  // 7. Resmi vs Gayriresmi Ödeme Ayrımı
  let officialAmount = 0;
  let unofficialAmount = 0;

  if (officialSalaryPart && officialSalaryPart > 0) {
    officialAmount = Math.min(netTotal, Number(officialSalaryPart.toFixed(2)));
    unofficialAmount = Math.max(0, Number((netTotal - officialAmount).toFixed(2)));
  } else {
    officialAmount = netTotal;
    unofficialAmount = 0;
  }

  return {
    baseEarned,
    hourlyEarned,
    dailyEarned,
    holidayEarned,
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

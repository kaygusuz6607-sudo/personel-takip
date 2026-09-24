export function parseSafeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const str = d instanceof Date ? d.toISOString() : String(d);
  const parts = str.split("T")[0].split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

/**
 * İki tarih arasındaki süreyi "X yıl Y ay Z gün" formatında Türkçe olarak hesaplar
 */
export function calculateDuration(
  startDateStr: string | Date | null,
  endDateStr: string | Date | null
): string {
  if (!startDateStr) return "—";

  const start = parseSafeDate(startDateStr);
  const end = endDateStr ? parseSafeDate(endDateStr) : new Date();

  if (!start || !end) return "—";
  if (start > end) return "0 gün";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yıl`);
  if (months > 0) parts.push(`${months} ay`);
  if (days > 0 || parts.length === 0) parts.push(`${days} gün`);

  return parts.join(" ");
}

export interface AnnualLeaveEntitlementResult {
  completedYears: number;
  annualRate: number; // cari yıllık hakediş baremi (14, 20 veya 26 gün)
  annualEntitled: number; // kıdem süresince tamamlanan her yıl için hak edilen kümülatif toplam gün
}

/**
 * 4857 Sayılı İş Kanunu Madde 53'e göre kümülatif yıllık ücretli izin hesabı:
 * - 1 yıldan 5 yıla kadar (5 yıl dahil): Her yıl için 14 gün
 * - 5 yıldan fazla 15 yıldan az: Her yıl için 20 gün
 * - 15 yıl ve daha fazla: Her yıl için 26 gün
 *
 * Tamamlanan her tam yıl için hak edilen izin günleri kümülatif toplanır:
 * Örn: 2 tam yıl çalışmış bir personel için 14 + 14 = 28 gün hak ediş üretilir.
 * Henüz 1 tam yılı doldurmamış personele en az 1 yıllık hakediş (14 gün) avans/tanımlı olarak verilir.
 */
export function calculateAnnualLeaveEntitlement(
  hireDateStr: string | Date | null | undefined
): AnnualLeaveEntitlementResult {
  if (!hireDateStr) {
    return { completedYears: 0, annualRate: 14, annualEntitled: 0 };
  }

  const hire = parseSafeDate(hireDateStr);
  if (!hire) {
    return { completedYears: 0, annualRate: 14, annualEntitled: 0 };
  }

  const today = new Date();
  let completedYears = today.getFullYear() - hire.getFullYear();
  const mDiff = today.getMonth() - hire.getMonth();
  const dDiff = today.getDate() - hire.getDate();

  if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) {
    completedYears -= 1;
  }

  completedYears = Math.max(0, completedYears);

  // 4857 s.k. m. 53: 1 tam yılı doldurmayan personelin yıllık izin hak edişi 0 gündür
  if (completedYears === 0) {
    return {
      completedYears: 0,
      annualRate: 14,
      annualEntitled: 0,
    };
  }

  let totalEntitled = 0;
  let currentRate = 14;

  for (let year = 1; year <= completedYears; year++) {
    if (year <= 5) {
      totalEntitled += 14;
      currentRate = 14;
    } else if (year <= 15) {
      totalEntitled += 20;
      currentRate = 20;
    } else {
      totalEntitled += 26;
      currentRate = 26;
    }
  }

  return {
    completedYears,
    annualRate: currentRate,
    annualEntitled: totalEntitled,
  };
}

export interface SgkNotificationResult {
  needsNotification: boolean;
  isMonday: boolean;
  message: string;
  urgency: "HIGH" | "MEDIUM" | "NONE";
}

/**
 * MEB Atama Tarihine göre SGK işe giriş bildirim hatırlatmasını hesaplar
 * Kural:
 * - Normal günlerde: MEB Atama Tarihinden 1 GÜN ÖNCE bildirim verilir.
 * - Eğer MEB Atama Tarihi PAZARTESİ gününe denk geliyorsa: Bildirim AYNI GÜN (Pazartesi) sabahtan verilir.
 */
export function checkMebSgkNotification(
  mebAssignmentDateStr: string | Date | null,
  isSgkNotified: boolean
): SgkNotificationResult {
  if (!mebAssignmentDateStr || isSgkNotified) {
    return { needsNotification: false, isMonday: false, message: "", urgency: "NONE" };
  }

  const mebDate = parseSafeDate(mebAssignmentDateStr);
  if (!mebDate) {
    return { needsNotification: false, isMonday: false, message: "", urgency: "NONE" };
  }

  const today = new Date();
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dMeb = new Date(mebDate.getFullYear(), mebDate.getMonth(), mebDate.getDate());

  const dayOfWeek = dMeb.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
  const isMonday = dayOfWeek === 1;

  const diffTime = dMeb.getTime() - dToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dateFormatted = dMeb.toLocaleDateString("tr-TR");

  if (isMonday) {
    // Pazartesi günü için: AYNI GÜN SABAH bildirim verilir
    if (diffDays === 0) {
      return {
        needsNotification: true,
        isMonday: true,
        urgency: "HIGH",
        message: `BUGÜN PAZARTESİ! MEB ataması bugün (${dateFormatted}) yapılacak. SGK işe giriş bildirgesini sabah ivedilikle veriniz!`,
      };
    } else if (diffDays < 0) {
      return {
        needsNotification: true,
        isMonday: true,
        urgency: "HIGH",
        message: `DİKKAT! MEB atama tarihi (${dateFormatted}) geçmiş, SGK bildirimi henüz tamamlanmamış görünüyor!`,
      };
    }
  } else {
    // Diğer günler için: 1 GÜN ÖNCESİNDEN bildirim verilir
    if (diffDays === 1) {
      return {
        needsNotification: true,
        isMonday: false,
        urgency: "HIGH",
        message: `YARIN MEB ATAMASI VAR! Atama tarihi: ${dateFormatted}. SGK işe giriş bildirgesini en geç bugün veriniz!`,
      };
    } else if (diffDays === 0) {
      return {
        needsNotification: true,
        isMonday: false,
        urgency: "HIGH",
        message: `BUGÜN MEB ATAMASI GÜNÜ (${dateFormatted})! SGK bildirimi kontrol edilmelidir.`,
      };
    } else if (diffDays < 0) {
      return {
        needsNotification: true,
        isMonday: false,
        urgency: "HIGH",
        message: `DİKKAT! MEB atama tarihi (${dateFormatted}) geçmiş, SGK bildirimi yapılmadı olarak kayıtlı!`,
      };
    }
  }

  return { needsNotification: false, isMonday, message: "", urgency: "NONE" };
}

export interface MebEndNotificationResult {
  needsNotification: boolean;
  daysRemaining: number;
  isExpired: boolean;
  message: string;
  urgency: "HIGH" | "MEDIUM" | "NONE";
}

/**
 * MEB Atama Bitiş Tarihine göre hatırlatma kontrolü:
 * - Süresiz atama ise (isMebPermanent = true) -> Bildirim gerekmez
 * - Belirli süreli ise ve bitiş tarihine 7 gün (1 hafta) veya daha az kaldıysa (veya geçmişse) -> Bildirim üretilir
 * - Bildirim onaylanmış/kapatılmış ise (isMebEndNotified = true) -> Bildirim gerekmez
 */
export function checkMebEndNotification(
  mebAssignmentEndDateStr: string | Date | null | undefined,
  isMebPermanent: boolean = true,
  isMebEndNotified: boolean = false
): MebEndNotificationResult {
  if (isMebPermanent || isMebEndNotified || !mebAssignmentEndDateStr) {
    return { needsNotification: false, daysRemaining: 0, isExpired: false, message: "", urgency: "NONE" };
  }

  const endDate = parseSafeDate(mebAssignmentEndDateStr);
  if (!endDate) {
    return { needsNotification: false, daysRemaining: 0, isExpired: false, message: "", urgency: "NONE" };
  }

  const today = new Date();
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const diffTime = dEnd.getTime() - dToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const dateFormatted = dEnd.toLocaleDateString("tr-TR");

  // 1 hafta (7 gün) veya daha az kaldıysa veya süre dolmuşsa
  if (diffDays <= 7) {
    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays);
      return {
        needsNotification: true,
        daysRemaining: diffDays,
        isExpired: true,
        urgency: "HIGH",
        message: `DİKKAT! MEB atama süresi ${pastDays} gün önce DOLDU! (Bitiş: ${dateFormatted}). Lütfen atamayı yenileyiniz veya süresiz yapınız.`,
      };
    } else if (diffDays === 0) {
      return {
        needsNotification: true,
        daysRemaining: 0,
        isExpired: false,
        urgency: "HIGH",
        message: `DİKKAT! MEB atama süresi BUGÜN DOLUYOR! (Bitiş: ${dateFormatted}). Atama yenileme işlemlerini tamamlayınız.`,
      };
    } else if (diffDays === 1) {
      return {
        needsNotification: true,
        daysRemaining: 1,
        isExpired: false,
        urgency: "HIGH",
        message: `DİKKAT! MEB atama süresi YARIN DOLUYOR! (Bitiş: ${dateFormatted}). 1 gün kaldı.`,
      };
    } else {
      return {
        needsNotification: true,
        daysRemaining: diffDays,
        isExpired: false,
        urgency: "HIGH",
        message: `HATIRLATMA: MEB atama süresinin dolmasına ${diffDays} gün kaldı! (Bitiş: ${dateFormatted}).`,
      };
    }
  }

  return { needsNotification: false, daysRemaining: diffDays, isExpired: false, message: "", urgency: "NONE" };
}


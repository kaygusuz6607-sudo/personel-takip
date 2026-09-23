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

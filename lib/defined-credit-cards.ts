export interface DefinedCreditCard {
  id: string;
  slotNumber: number;
  holder: string;
  bankName: string;
  cardLabel: string;
  last4: string;
  cutoffDay?: string;
  statementDateISO?: string;
  dueDateISO?: string;
  cardLimit: number;
  minPaymentAmount?: number;
  minPaymentRate?: number;
  monthlyMinPayments?: Record<string, number>;
}

export const DEFAULT_DEFINED_CARDS: DefinedCreditCard[] = [
  // Ahmet Taymaz Kartları
  {
    id: "card-1",
    slotNumber: 1,
    holder: "Ahmet Taymaz",
    bankName: "Vakıfbank",
    cardLabel: "Vakıfbank World KK",
    last4: "4821",
    cutoffDay: "15.09.2026",
    statementDateISO: "2026-09-15",
    dueDateISO: "2026-09-25",
    cardLimit: 750000,
  },
  {
    id: "card-2",
    slotNumber: 2,
    holder: "Ahmet Taymaz",
    bankName: "Akbank",
    cardLabel: "Akbank Business KK",
    last4: "9034",
    cutoffDay: "20.09.2026",
    statementDateISO: "2026-09-20",
    dueDateISO: "2026-09-30",
    cardLimit: 750000,
  },
  {
    id: "card-3",
    slotNumber: 3,
    holder: "Ahmet Taymaz",
    bankName: "Halkbank",
    cardLabel: "Halkbank Paraf KK",
    last4: "5512",
    cutoffDay: "20.09.2026",
    statementDateISO: "2026-09-20",
    dueDateISO: "2026-09-30",
    cardLimit: 750000,
  },
  {
    id: "card-4",
    slotNumber: 4,
    holder: "Ahmet Taymaz",
    bankName: "Ziraat Bankası",
    cardLabel: "Ziraat Bankkart KK",
    last4: "7189",
    cutoffDay: "28.08.2026",
    statementDateISO: "2026-08-28",
    dueDateISO: "2026-09-07",
    cardLimit: 750000,
  },
  {
    id: "card-5",
    slotNumber: 5,
    holder: "Ahmet Taymaz",
    bankName: "QNB Finansbank",
    cardLabel: "QNB CardFinans KK",
    last4: "6305",
    cutoffDay: "14.09.2026",
    statementDateISO: "2026-09-14",
    dueDateISO: "2026-09-24",
    cardLimit: 750000,
  },
  // Muhammed Ali Çağır (MAC) Kartları
  {
    id: "card-mac-1",
    slotNumber: 6,
    holder: "Muhammed Ali Çağır",
    bankName: "QNB Finansbank",
    cardLabel: "Mac QNB Kredi Kartı",
    last4: "3102",
    cutoffDay: "23.09.2026",
    statementDateISO: "2026-09-23",
    dueDateISO: "2026-09-29",
    cardLimit: 500000,
  },
  {
    id: "card-mac-2",
    slotNumber: 7,
    holder: "Muhammed Ali Çağır",
    bankName: "Denizbank",
    cardLabel: "Mac Denizbank KK",
    last4: "8410",
    cutoffDay: "24.08.2026",
    statementDateISO: "2026-08-24",
    dueDateISO: "2026-09-04",
    cardLimit: 500000,
  },
  {
    id: "card-mac-3",
    slotNumber: 8,
    holder: "Muhammed Ali Çağır",
    bankName: "Ziraat Bankası",
    cardLabel: "Mac Ziraat KK",
    last4: "1945",
    cutoffDay: "04.09.2026",
    statementDateISO: "2026-09-04",
    dueDateISO: "2026-09-14",
    cardLimit: 500000,
  },
  // Şirket Kartları (SIMCU)
  {
    id: "card-simcu-1",
    slotNumber: 9,
    holder: "Şirket Kartları (SIMCU)",
    bankName: "Ziraat Bankası",
    cardLabel: "SIMCU - Ziraat Kart",
    last4: "5001",
    cutoffDay: "04.09.2026",
    statementDateISO: "2026-09-04",
    dueDateISO: "2026-09-14",
    cardLimit: 750000,
  },
  {
    id: "card-simcu-2",
    slotNumber: 10,
    holder: "Şirket Kartları (SIMCU)",
    bankName: "Halkbank",
    cardLabel: "SIMCU - Paraf Esnaf",
    last4: "5002",
    cutoffDay: "02.09.2026",
    statementDateISO: "2026-09-02",
    dueDateISO: "2026-09-07",
    cardLimit: 750000,
  },
  {
    id: "card-simcu-3",
    slotNumber: 11,
    holder: "Şirket Kartları (SIMCU)",
    bankName: "Halkbank",
    cardLabel: "SIMCU - Paraf Business",
    last4: "5003",
    cutoffDay: "02.09.2026",
    statementDateISO: "2026-09-02",
    dueDateISO: "2026-09-07",
    cardLimit: 750000,
  },
  // Diğer Kartlar (Duygu Köse & Emre Helvacı)
  {
    id: "card-dk-1",
    slotNumber: 12,
    holder: "Duygu Köse",
    bankName: "Halkbank",
    cardLabel: "Halkbank Master/Troy KK",
    last4: "2210",
    cutoffDay: "20.09.2026",
    statementDateISO: "2026-09-20",
    dueDateISO: "2026-09-30",
    cardLimit: 300000,
  },
  {
    id: "card-dk-2",
    slotNumber: 13,
    holder: "Duygu Köse",
    bankName: "Kuveyt Türk",
    cardLabel: "Kuveyt Türk KK",
    last4: "2215",
    cutoffDay: "10.09.2026",
    statementDateISO: "2026-09-10",
    dueDateISO: "2026-09-20",
    cardLimit: 300000,
  },
  {
    id: "card-eh-1",
    slotNumber: 14,
    holder: "Emre Helvacı",
    bankName: "Kuveyt Türk",
    cardLabel: "Kuveyt Türk KK",
    last4: "3310",
    cutoffDay: "01.09.2026",
    statementDateISO: "2026-09-01",
    dueDateISO: "2026-09-10",
    cardLimit: 300000,
  },
  {
    id: "card-eh-2",
    slotNumber: 15,
    holder: "Emre Helvacı",
    bankName: "Türkiye Finans",
    cardLabel: "Türkiye Finans KK",
    last4: "3315",
    cutoffDay: "25.08.2026",
    statementDateISO: "2026-08-25",
    dueDateISO: "2026-09-04",
    cardLimit: 300000,
  },
];

export function getClientLoadedCreditCards(): DefinedCreditCard[] {
  if (typeof window === "undefined") return DEFAULT_DEFINED_CARDS;
  try {
    const savedV2 = localStorage.getItem("cosmos_all_credit_cards_v2");
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_DEFINED_CARDS;
}

export function saveClientCreditCards(cards: DefinedCreditCard[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cosmos_all_credit_cards_v2", JSON.stringify(cards));
  } catch {}
}

export interface CardStatementCalculation {
  statementDateISO: string;
  dueDateISO: string;
  dueDateStr: string;
  periodMonth: number;
  periodYear: number;
  statementPeriodKey: string;
  periodLabel: string;
  statementDay: number;
  dueDay: number;
}

export function calculateCardStatementAndDueDate(
  card: DefinedCreditCard,
  txDateStr: string
): CardStatementCalculation {
  const [yStr, mStr, dStr] = (txDateStr || "").split("-");
  const y = parseInt(yStr, 10) || new Date().getFullYear();
  const m = parseInt(mStr, 10) || new Date().getMonth() + 1;
  const d = parseInt(dStr, 10) || new Date().getDate();

  let statementDay = 15;
  let dueDay = 25;

  if (card.statementDateISO) {
    const sParts = card.statementDateISO.split("-");
    statementDay = parseInt(sParts[2], 10) || statementDay;
  } else if ((card as any).cutoffDay) {
    const cStr = String((card as any).cutoffDay);
    const cMatch = cStr.match(/^(\d{1,2})/);
    if (cMatch) {
      statementDay = parseInt(cMatch[1], 10) || statementDay;
    }
  }

  if (card.dueDateISO) {
    const dParts = card.dueDateISO.split("-");
    dueDay = parseInt(dParts[2], 10) || dueDay;
  }

  const trMonths = [
    "",
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  if (dueDay >= statementDay) {
    let cycleYear = y;
    let cycleMonth = m;

    if (d > statementDay) {
      cycleMonth += 1;
      if (cycleMonth > 12) {
        cycleMonth = 1;
        cycleYear += 1;
      }
    }

    const maxDays = new Date(cycleYear, cycleMonth, 0).getDate();
    const safeDueDay = Math.min(dueDay, maxDays);
    const dueDateISO = `${cycleYear}-${String(cycleMonth).padStart(2, "0")}-${String(safeDueDay).padStart(2, "0")}`;
    const safeStatementDay = Math.min(statementDay, maxDays);
    const statementDateISO = `${cycleYear}-${String(cycleMonth).padStart(2, "0")}-${String(safeStatementDay).padStart(2, "0")}`;

    return {
      statementDateISO,
      dueDateISO,
      dueDateStr: `${safeDueDay} ${trMonths[cycleMonth]} ${cycleYear}`,
      periodMonth: cycleMonth,
      periodYear: cycleYear,
      statementPeriodKey: `${card.id}:${cycleYear}-${String(cycleMonth).padStart(2, "0")}`,
      periodLabel: `${trMonths[cycleMonth]} ${cycleYear}`,
      statementDay: safeStatementDay,
      dueDay: safeDueDay,
    };
  } else {
    let cycleYear = y;
    let cycleMonth = m;

    if (d > statementDay) {
      cycleMonth += 1;
      if (cycleMonth > 12) {
        cycleMonth = 1;
        cycleYear += 1;
      }
    }

    let dueYear = cycleYear;
    let dueMonth = cycleMonth + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }

    const maxDaysDue = new Date(dueYear, dueMonth, 0).getDate();
    const safeDueDay = Math.min(dueDay, maxDaysDue);
    const dueDateISO = `${dueYear}-${String(dueMonth).padStart(2, "0")}-${String(safeDueDay).padStart(2, "0")}`;

    const maxDaysStmt = new Date(cycleYear, cycleMonth, 0).getDate();
    const safeStatementDay = Math.min(statementDay, maxDaysStmt);
    const statementDateISO = `${cycleYear}-${String(cycleMonth).padStart(2, "0")}-${String(safeStatementDay).padStart(2, "0")}`;

    return {
      statementDateISO,
      dueDateISO,
      dueDateStr: `${safeDueDay} ${trMonths[dueMonth]} ${dueYear}`,
      periodMonth: dueMonth,
      periodYear: dueYear,
      statementPeriodKey: `${card.id}:${dueYear}-${String(dueMonth).padStart(2, "0")}`,
      periodLabel: `${trMonths[dueMonth]} ${dueYear}`,
      statementDay: safeStatementDay,
      dueDay: safeDueDay,
    };
  }
}



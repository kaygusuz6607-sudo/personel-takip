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
    cutoffDay: "25.09.2026",
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
    cutoffDay: "30.09.2026",
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
    cutoffDay: "30.09.2026",
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
    cutoffDay: "07.09.2026",
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
    cutoffDay: "24.09.2026",
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
    cutoffDay: "29.09.2026",
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
    cutoffDay: "04.09.2026",
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
    cutoffDay: "14.09.2026",
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
    cutoffDay: "14.09.2026",
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
    cutoffDay: "07.09.2026",
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
    cutoffDay: "07.09.2026",
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
    cutoffDay: "30.09.2026",
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
    cutoffDay: "20.09.2026",
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
    cutoffDay: "10.09.2026",
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
    cutoffDay: "04.09.2026",
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

import { prisma } from "@/lib/prisma";

export type UtilityCategory =
  | "ELECTRICITY"
  | "WATER"
  | "GAS"
  | "INTERNET"
  | "TELEPHONE"
  | "OTHER";

export interface UtilitySubscriptionRow {
  id: string;
  name: string;
  category: UtilityCategory;
  institution: string;
  subscriberNo: string | null;
  meterNo: string | null;
  paymentDay: number;
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  cardId: string | null;
  notes: string | null;
  status: "ACTIVE" | "PASSIVE";
  createdAt: string;
  updatedAt: string;
}

export interface UtilityBillRow {
  id: string;
  subscriptionId: string;
  period: string; // "2026-10"
  year: number;
  month: number;
  billDate: string | null;
  dueDate: string; // "YYYY-MM-DD"
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  consumption: number;
  billNo: string | null;
  paidDate: string | null;
  paidMethod: string | null;
  cardHolder: string | null;
  cardBank: string | null;
  cardId: string | null;
  schoolExpenseId: string | null;
  notes: string | null;
  paymentHistory: string | null;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_SUBSCRIPTIONS = [
  {
    id: "sub-kcetas-elektrik",
    name: "KCETAŞ Kayseri Elektrik",
    category: "ELECTRICITY" as UtilityCategory,
    institution: "KCETAŞ",
    subscriberNo: "1048291",
    meterNo: "Ana Okul Binası Trafo / Sayaç",
    paymentDay: 12,
    paymentMethod: "CREDIT_CARD",
    cardHolder: "Şirket Kartları (SIMCU)",
    cardBank: "Ziraat Bankası",
    cardId: "card-simcu-1",
    notes: "Okul binası elektrik tüketimi faturası",
  },
  {
    id: "sub-kaski-su-1",
    name: "KASKİ Su - 1 (SIR YAPI)",
    category: "WATER" as UtilityCategory,
    institution: "KASKİ",
    subscriberNo: "351872",
    meterNo: "Okul Ana Şebeke Su Sayacı",
    paymentDay: 4,
    paymentMethod: "CASH",
    cardHolder: null,
    cardBank: null,
    cardId: null,
    notes: "Okul ana kullanım suyu faturası (351872 nolu abone)",
  },
  {
    id: "sub-kaski-su-2",
    name: "KASKİ Su - 2 (İLYAS YILMAZ)",
    category: "WATER" as UtilityCategory,
    institution: "KASKİ",
    subscriberNo: "345406",
    meterNo: "Mülk / Bahçe Su Sayacı",
    paymentDay: 4,
    paymentMethod: "CASH",
    cardHolder: null,
    cardBank: null,
    cardId: null,
    notes: "Mülk / bahçe su sayacı (345406 nolu abone)",
  },
  {
    id: "sub-kayserigaz",
    name: "Kayserigaz Doğalgaz",
    category: "GAS" as UtilityCategory,
    institution: "Kayserigaz",
    subscriberNo: "40019283",
    meterNo: "Kazan Dairesi Doğalgaz Sayacı",
    paymentDay: 15,
    paymentMethod: "BANK",
    cardHolder: null,
    cardBank: null,
    cardId: null,
    notes: "Okul kış dönemi ısınma ve mutfak doğalgaz faturası",
  },
  {
    id: "sub-millenicom-internet",
    name: "Millenicom Fiber İnternet",
    category: "INTERNET" as UtilityCategory,
    institution: "Millenicom",
    subscriberNo: "882190412",
    meterNo: "Okul İdari & Derslik Fiber Hat",
    paymentDay: 7,
    paymentMethod: "CREDIT_CARD",
    cardHolder: "Muhammed Ali Çağır",
    cardBank: "Ziraat Bankası",
    cardId: "card-mac-3",
    notes: "12 Aylık taahhütlü fiber internet paketi",
  },
  {
    id: "sub-turk-telekom",
    name: "Türk Telekom Sabit Hat & Kurumsal",
    category: "TELEPHONE" as UtilityCategory,
    institution: "Türk Telekom",
    subscriberNo: "352 222 10 58",
    meterNo: "Santral & Sabit Hat",
    paymentDay: 20,
    paymentMethod: "BANK",
    cardHolder: null,
    cardBank: null,
    cardId: null,
    notes: "Kurumsal telefon santrali ve sabit hat aboneliği",
  },
];

export async function ensureUtilityBillTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS UtilitySubscription (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      institution TEXT NOT NULL,
      subscriberNo TEXT,
      meterNo TEXT,
      paymentDay INTEGER NOT NULL DEFAULT 15,
      paymentMethod TEXT NOT NULL DEFAULT 'CASH',
      cardHolder TEXT,
      cardBank TEXT,
      cardId TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS UtilityBill (
      id TEXT PRIMARY KEY,
      subscriptionId TEXT NOT NULL,
      period TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      billDate TEXT,
      dueDate TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      paidAmount REAL NOT NULL DEFAULT 0,
      remainingAmount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      consumption REAL NOT NULL DEFAULT 0,
      billNo TEXT,
      paidDate TEXT,
      paidMethod TEXT,
      cardHolder TEXT,
      cardBank TEXT,
      cardId TEXT,
      schoolExpenseId TEXT,
      notes TEXT,
      paymentHistory TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (subscriptionId) REFERENCES UtilitySubscription(id) ON DELETE CASCADE
    );
  `);

  // İlk başlangıç aboneliklerini oluştur (eğer tablo boşsa)
  const existingSubCount = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as cnt FROM UtilitySubscription`
  )) as { cnt: number }[];

  const now = new Date().toISOString();
  if (existingSubCount && Number(existingSubCount[0]?.cnt) === 0) {
    for (const sub of INITIAL_SUBSCRIPTIONS) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO UtilitySubscription (id, name, category, institution, subscriberNo, meterNo, paymentDay, paymentMethod, cardHolder, cardBank, cardId, notes, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sub.id,
        sub.name,
        sub.category,
        sub.institution,
        sub.subscriberNo,
        sub.meterNo,
        sub.paymentDay,
        sub.paymentMethod,
        sub.cardHolder,
        sub.cardBank,
        sub.cardId,
        sub.notes,
        "ACTIVE",
        now,
        now
      );
    }
  }

  // SchoolExpense tablosundaki mevcut faturaları otomatik olarak içeri aktar (eğer UtilityBill boşsa veya eksikse)
  await importExistingExpensesToBills();
}

export async function importExistingExpensesToBills() {
  try {
    const rawExpenses = await prisma.schoolExpense.findMany({
      where: {
        OR: [
          { category: "INVOICE" },
          { subCategory: { contains: "F-" } },
          { subCategory: { contains: "Fatura" } },
          { title: { contains: "Elektrik" } },
          { title: { contains: "KASKİ" } },
          { title: { contains: "Kaski" } },
          { title: { contains: "Su Faturası" } },
          { title: { contains: "Millenicom" } },
          { title: { contains: "İnternet" } },
          { title: { contains: "Doğalgaz" } },
          { title: { contains: "Gaz" } },
          { title: { contains: "Türk Telekom" } },
          { title: { contains: "Telekom" } },
        ],
      },
      orderBy: { dueDate: "asc" },
    });

    const existingBillRows = (await prisma.$queryRawUnsafe(
      `SELECT schoolExpenseId, id FROM UtilityBill WHERE schoolExpenseId IS NOT NULL`
    )) as { schoolExpenseId: string; id: string }[];
    const importedExpenseIds = new Set(existingBillRows.map((b) => b.schoolExpenseId));

    const now = new Date().toISOString();

    for (const exp of rawExpenses) {
      if (importedExpenseIds.has(exp.id)) continue;

      const titleLower = (exp.title || "").toLowerCase();
      const descLower = (exp.description || "").toLowerCase();
      const subLower = (exp.subCategory || "").toLowerCase();

      // İlgili aboneliği tespit et
      let targetSubId: string | null = null;
      let targetCategory: UtilityCategory = "OTHER";

      if (titleLower.includes("elektrik") || titleLower.includes("kcetaş") || subLower.includes("elektrik")) {
        targetSubId = "sub-kcetas-elektrik";
        targetCategory = "ELECTRICITY";
      } else if (titleLower.includes("351872") || (titleLower.includes("kaski") && titleLower.includes("1"))) {
        targetSubId = "sub-kaski-su-1";
        targetCategory = "WATER";
      } else if (titleLower.includes("345406") || (titleLower.includes("kaski") && titleLower.includes("2"))) {
        targetSubId = "sub-kaski-su-2";
        targetCategory = "WATER";
      } else if (titleLower.includes("su ") || titleLower.includes("kaski") || subLower.includes("su")) {
        targetSubId = "sub-kaski-su-1";
        targetCategory = "WATER";
      } else if (titleLower.includes("doğalgaz") || titleLower.includes("dogalgaz") || titleLower.includes("gaz") || subLower.includes("gaz")) {
        targetSubId = "sub-kayserigaz";
        targetCategory = "GAS";
      } else if (titleLower.includes("millenicom") || titleLower.includes("internet") || titleLower.includes("fiber") || subLower.includes("internet")) {
        targetSubId = "sub-millenicom-internet";
        targetCategory = "INTERNET";
      } else if (titleLower.includes("telekom") || titleLower.includes("telefon") || subLower.includes("haberleşme")) {
        targetSubId = "sub-turk-telekom";
        targetCategory = "TELEPHONE";
      }

      if (!targetSubId) continue;

      // Dönem ve tarih belirleme
      let year = 2026;
      let month = 10;
      let dueDateStr = new Date().toISOString().slice(0, 10);

      if (exp.dueDate) {
        const d = new Date(exp.dueDate);
        if (!isNaN(d.getTime())) {
          year = d.getFullYear();
          month = d.getMonth() + 1;
          dueDateStr = d.toISOString().slice(0, 10);
        }
      } else if (exp.dueDateStr) {
        const mMatch = exp.dueDateStr.match(/\b(20\d{2})\b/);
        if (mMatch) year = parseInt(mMatch[1], 10);
      }

      const period = `${year}-${String(month).padStart(2, "0")}`;
      const amount = Number(exp.amountDue) || 0;
      const paid = Number(exp.amountPaid) || 0;
      const rem = Math.max(0, Number(exp.amountRemaining) || Number((amount - paid).toFixed(2)));
      const status = rem <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";

      const billId = `ubill-exp-${exp.id}`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO UtilityBill (id, subscriptionId, period, year, month, billDate, dueDate, amount, paidAmount, remainingAmount, status, consumption, billNo, paidDate, paidMethod, cardHolder, cardBank, cardId, schoolExpenseId, notes, paymentHistory, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        billId,
        targetSubId,
        period,
        year,
        month,
        dueDateStr,
        dueDateStr,
        amount,
        paid,
        rem,
        status,
        0,
        exp.id.slice(0, 8),
        status === "PAID" ? (exp.updatedAt ? new Date(exp.updatedAt).toISOString().slice(0, 10) : dueDateStr) : null,
        exp.paymentMethod || "CASH",
        exp.cardHolder || null,
        exp.cardBank || null,
        null,
        exp.id,
        exp.description || exp.title,
        exp.paymentHistory || null,
        now,
        now
      );
    }
  } catch (err) {
    console.error("Mevcut faturalar içeri aktarılırken hata:", err);
  }
}

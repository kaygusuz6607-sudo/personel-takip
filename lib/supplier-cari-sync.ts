import { prisma } from "@/lib/prisma";

export interface SupplierAccountRow {
  id: string;
  name: string;
  productSummary: string;
  category: string;
  unitLabel: string;
  defaultUnitPrice: number;
  paymentDay: number;
  nextPaymentDate: string | null;
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  phone: string | null;
  iban: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTransactionRow {
  id: string;
  supplierId: string;
  txType: "PURCHASE" | "PAYMENT";
  date: string;
  dueDate: string | null;
  itemTitle: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentMethod: string;
  cardHolder: string | null;
  cardBank: string | null;
  notes: string | null;
  createdAt: string;
}

export const INITIAL_SUPPLIER_CARILER = [
  {
    id: "sup-fsm-ilaclama",
    name: "FSM İlaçlama Şirketi",
    productSummary: "İlaçlama başı ücret",
    category: "İlaçlama Hizmeti",
    unitLabel: "İlaçlama",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Okul periyodik ilaçlama hizmeti (İlaçlama başı ücretlendirme)",
  },
  {
    id: "sup-sacit-yogurt",
    name: "Sacit Yoğurt",
    productSummary: "Aylık kova yoğurt alımı",
    category: "Gıda / Süt & Yoğurt",
    unitLabel: "Kova",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Yemekhane için düzenli aylık kova yoğurt alımı",
  },
  {
    id: "sup-tanfer-cicekci",
    name: "Tanfer Çiçekçi",
    productSummary: "Çiçek alımı",
    category: "Çiçek & Organizasyon",
    unitLabel: "Adet",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Kurumsal çiçek ve özel gün gönderimleri",
  },
  {
    id: "sup-tellioglu-ekmek",
    name: "Tellioğlu Ekmek",
    productSummary: "Ekmek alımı",
    category: "Gıda / Fırın & Ekmek",
    unitLabel: "Adet",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Günlük / aylık yemekhane ekmek alımı",
  },
  {
    id: "sup-buyuksumutci-et",
    name: "Büyüksümütçi Et",
    productSummary: "Et alımı",
    category: "Gıda / Kasap & Et",
    unitLabel: "Kg",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Yemekhane kırmızı et ve kıyma alımı",
  },
  {
    id: "sup-hamet-tavuk",
    name: "Hamet Tavuk",
    productSummary: "Tavuk alımı",
    category: "Gıda / Tavuk & Beyaz Et",
    unitLabel: "Kg",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Yemekhane tavuk ve beyaz et ürünleri alımı",
  },
  {
    id: "sup-altindede-pide",
    name: "Altın Dede Pide Fırını",
    productSummary: "Pide yaptırma",
    category: "Gıda / Pide Fırını",
    unitLabel: "Adet",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Etkinlik ve yemekhane pide yaptırma",
  },
  {
    id: "sup-sinan-geldi",
    name: "Sinan Geldi",
    productSummary: "Yazıcı toner ve tamir",
    category: "Teknik Servis & Toner",
    unitLabel: "İşlem",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Okul yazıcıları toner dolumu, kartuş ve tamir bakım işlemleri",
  },
  {
    id: "sup-ahmet-taymaz-kirtasiye",
    name: "Ahmet Taymaz Kırtasiye",
    productSummary: "Kırtasiye ürünleri alımı",
    category: "Kırtasiye Malzemeleri",
    unitLabel: "Paket",
    defaultUnitPrice: 0,
    paymentDay: 15,
    notes: "Okul ve sınıf kırtasiye ürünleri alımı",
  },
];

const TR_MONTHS = [
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

export function formatTurkishDateISO(dateISO: string): string {
  const m = String(dateISO || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateISO || "";
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  return `${day} ${TR_MONTHS[month] || ""} ${year}`;
}

export async function ensureSupplierCariTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS SupplierCariAccount (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      productSummary TEXT NOT NULL,
      category TEXT DEFAULT 'Tedarikçi',
      unitLabel TEXT DEFAULT 'Adet',
      defaultUnitPrice REAL DEFAULT 0,
      paymentDay INTEGER DEFAULT 15,
      nextPaymentDate TEXT,
      paymentMethod TEXT DEFAULT 'CASH',
      cardHolder TEXT,
      cardBank TEXT,
      phone TEXT,
      iban TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS SupplierCariTransaction (
      id TEXT PRIMARY KEY,
      supplierId TEXT NOT NULL,
      txType TEXT NOT NULL,
      date TEXT NOT NULL,
      dueDate TEXT,
      itemTitle TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unitPrice REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      paymentMethod TEXT DEFAULT 'CASH',
      cardHolder TEXT,
      cardBank TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  const existing = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as cnt FROM SupplierCariAccount`
  )) as { cnt: number | bigint }[];
  const count = Number(existing?.[0]?.cnt || 0);

  if (count === 0) {
    const now = new Date().toISOString();
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;

    for (const item of INITIAL_SUPPLIER_CARILER) {
      const defDue = `${curYear}-${String(curMonth).padStart(2, "0")}-${String(item.paymentDay).padStart(2, "0")}`;
      await prisma.$executeRawUnsafe(
        `INSERT OR IGNORE INTO SupplierCariAccount (id, name, productSummary, category, unitLabel, defaultUnitPrice, paymentDay, nextPaymentDate, paymentMethod, phone, iban, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CASH', '', '', ?, ?, ?)`,
        item.id,
        item.name,
        item.productSummary,
        item.category,
        item.unitLabel,
        item.defaultUnitPrice,
        item.paymentDay,
        defDue,
        item.notes,
        now,
        now
      );
    }
  }
}

/**
 * Tedarikçinin alım ve ödeme hareketlerini aylık dönemlere (YYYY-M) göre gruplar
 * ve SchoolExpense tablosundaki ilgili aylık gider kayıtlarıyla senkronize eder.
 */
export async function syncSupplierToSchoolExpenses(supplierId: string) {
  await ensureSupplierCariTables();

  const accounts = (await prisma.$queryRawUnsafe(
    `SELECT * FROM SupplierCariAccount WHERE id = ?`,
    supplierId
  )) as SupplierAccountRow[];
  const supplier = accounts[0];

  const tagPrefix = `[SUPPLIER_CARI:${supplierId}:`;

  // Eğer cari silindiyse, ona ait SchoolExpense kayıtlarını da kaldır
  if (!supplier) {
    const oldExpenses = await prisma.schoolExpense.findMany({
      where: { description: { contains: tagPrefix } },
    });
    for (const oe of oldExpenses) {
      await prisma.schoolExpense.delete({ where: { id: oe.id } });
    }
    return;
  }

  const txs = (await prisma.$queryRawUnsafe(
    `SELECT * FROM SupplierCariTransaction WHERE supplierId = ? ORDER BY date ASC, createdAt ASC`,
    supplierId
  )) as SupplierTransactionRow[];

  const purchases = txs.filter((t) => t.txType === "PURCHASE");
  const payments = txs.filter((t) => t.txType === "PAYMENT");

  // Her alımın ödeme yapılacağı tarihi (dueDate) belirle
  // Eğer dueDate girilmişse o tarihin Yıl-Ay'ı, girilmemişse alım tarihinin Yıl-Ay'ı ve carinin ödeme günü baz alınır
  const periodGroups = new Map<
    string,
    {
      year: number;
      month: number;
      dueDateISO: string;
      totalDue: number;
      items: SupplierTransactionRow[];
      paymentMethod: string;
      cardHolder: string | null;
      cardBank: string | null;
    }
  >();

  for (const p of purchases) {
    const rawDate = p.dueDate || p.date;
    const m = String(rawDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let day = supplier.paymentDay || 15;
    if (m) {
      year = parseInt(m[1], 10);
      month = parseInt(m[2], 10);
      day = parseInt(m[3], 10);
    }
    const maxD = new Date(year, month, 0).getDate();
    const safeDay = Math.min(Math.max(1, day), maxD);
    const effectiveDueISO = p.dueDate
      ? p.dueDate
      : `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;

    const ym = `${year}-${month}`;
    const existing = periodGroups.get(ym);
    if (!existing) {
      periodGroups.set(ym, {
        year,
        month,
        dueDateISO: effectiveDueISO,
        totalDue: Number(p.amount) || 0,
        items: [p],
        paymentMethod: p.paymentMethod || supplier.paymentMethod || "CASH",
        cardHolder: p.cardHolder || supplier.cardHolder || null,
        cardBank: p.cardBank || supplier.cardBank || null,
      });
    } else {
      existing.totalDue += Number(p.amount) || 0;
      existing.items.push(p);
      if (effectiveDueISO > existing.dueDateISO) {
        existing.dueDateISO = effectiveDueISO;
      }
      if (p.paymentMethod === "CREDIT_CARD") {
        existing.paymentMethod = "CREDIT_CARD";
        existing.cardHolder = p.cardHolder || existing.cardHolder;
        existing.cardBank = p.cardBank || existing.cardBank;
      }
    }
  }

  // Kronolojik sırala (en eski dönemden başla) ve yapılan ödemeleri FIFO + dönem eşleşmesi ile dağıt
  const sortedPeriods = Array.from(periodGroups.entries()).sort((a, b) => {
    const [yA, mA] = a[0].split("-").map(Number);
    const [yB, mB] = b[0].split("-").map(Number);
    return yA * 100 + mA - (yB * 100 + mB);
  });

  // Ödemeleri önce eğer dueDate ile belirli bir döneme işaretlenmişse o döneme, kalanını kronolojik olarak dağıt
  const periodPaidMap = new Map<string, number>();
  sortedPeriods.forEach(([ym]) => periodPaidMap.set(ym, 0));

  let unallocatedPaidPool = 0;
  for (const pay of payments) {
    const payAmt = Number(pay.amount) || 0;
    if (payAmt <= 0) continue;
    if (pay.dueDate) {
      const m = String(pay.dueDate).match(/^(\d{4})-(\d{2})/);
      if (m) {
        const targetYM = `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}`;
        const grp = periodGroups.get(targetYM);
        if (grp) {
          const curPaid = periodPaidMap.get(targetYM) || 0;
          const room = Math.max(0, grp.totalDue - curPaid);
          const applied = Math.min(room, payAmt);
          periodPaidMap.set(targetYM, curPaid + applied);
          unallocatedPaidPool += payAmt - applied;
          continue;
        }
      }
    }
    unallocatedPaidPool += payAmt;
  }

  for (const [ym, grp] of sortedPeriods) {
    if (unallocatedPaidPool <= 0) break;
    const curPaid = periodPaidMap.get(ym) || 0;
    const room = Math.max(0, grp.totalDue - curPaid);
    if (room > 0) {
      const applied = Math.min(room, unallocatedPaidPool);
      periodPaidMap.set(ym, curPaid + applied);
      unallocatedPaidPool -= applied;
    }
  }

  // Mevcut SchoolExpense kayıtlarını bul
  const existingExpenses = await prisma.schoolExpense.findMany({
    where: { description: { contains: tagPrefix } },
  });

  const activeTags = new Set<string>();

  for (const [ym, grp] of sortedPeriods) {
    const exactTag = `[SUPPLIER_CARI:${supplierId}:${ym}]`;
    activeTags.add(exactTag);

    const totalDue = Number(grp.totalDue.toFixed(2));
    const totalPaid = Number(Math.min(totalDue, periodPaidMap.get(ym) || 0).toFixed(2));
    const totalRemaining = Number(Math.max(0, totalDue - totalPaid).toFixed(2));
    const status =
      totalRemaining <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "PENDING";

    const [y, m, d] = grp.dueDateISO.split("-").map(Number);
    const parsedDue = new Date(y, m - 1, d, 12, 0, 0);
    const dueDateStr = formatTurkishDateISO(grp.dueDateISO);

    const summaryLines = grp.items
      .slice(-4)
      .map(
        (it) =>
          `${it.itemTitle}${it.quantity > 1 ? ` (${it.quantity} ${supplier.unitLabel})` : ""}: ${it.amount.toLocaleString("tr-TR")} ₺`
      )
      .join(" • ");

    const descText = `${supplier.productSummary} — ${grp.items.length} Alım (${summaryLines}) ${exactTag}`;
    const expTitle = `${supplier.name} (${supplier.productSummary})`;

    const matchedExp = existingExpenses.find((e) =>
      (e.description || "").includes(exactTag)
    );

    const paymentHistoryJson = JSON.stringify(
      payments.map((pay) => ({
        date: pay.date,
        amount: pay.amount,
        note: pay.notes || pay.itemTitle || "Cari Ödeme",
      }))
    );

    if (matchedExp) {
      await prisma.schoolExpense.update({
        where: { id: matchedExp.id },
        data: {
          title: expTitle,
          category: "SUPPLIER",
          subCategory: supplier.category || "Tedarikçi Cari",
          period: `${grp.month}. Ay (${grp.year})`,
          monthIndex: grp.month,
          dueDate: parsedDue,
          dueDateStr,
          amountDue: totalDue,
          amountPaid: totalPaid,
          amountRemaining: totalRemaining,
          status,
          periodStatus: "Tedarikçi Cari",
          description: descText,
          paymentMethod: grp.paymentMethod || "CASH",
          cardHolder: grp.cardHolder,
          cardBank: grp.cardBank,
          paymentHistory: payments.length > 0 ? paymentHistoryJson : null,
        },
      });
    } else if (totalDue > 0) {
      await prisma.schoolExpense.create({
        data: {
          title: expTitle,
          category: "SUPPLIER",
          subCategory: supplier.category || "Tedarikçi Cari",
          period: `${grp.month}. Ay (${grp.year})`,
          monthIndex: grp.month,
          dueDate: parsedDue,
          dueDateStr,
          amountDue: totalDue,
          amountPaid: totalPaid,
          amountRemaining: totalRemaining,
          status,
          periodStatus: "Tedarikçi Cari",
          description: descText,
          paymentMethod: grp.paymentMethod || "CASH",
          cardHolder: grp.cardHolder,
          cardBank: grp.cardBank,
          paymentHistory: payments.length > 0 ? paymentHistoryJson : null,
        },
      });
    }
  }

  // Artık alımı kalmayan dönemlerin SchoolExpense kaydını temizle
  for (const oldExp of existingExpenses) {
    const desc = oldExp.description || "";
    const match = desc.match(/\[SUPPLIER_CARI:[^:\]]+:\d{4}-\d{1,2}\]/);
    if (match && !activeTags.has(match[0])) {
      await prisma.schoolExpense.delete({ where: { id: oldExp.id } });
    }
  }
}

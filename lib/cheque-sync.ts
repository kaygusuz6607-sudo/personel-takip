import { prisma } from "@/lib/prisma";

export interface ChequeRecordRow {
  id: string;
  type: "GIVEN" | "RECEIVED"; // GIVEN = Verilen Çek (Ödeme), RECEIVED = Alınan Çek (Tahsilat)
  chequeNo?: string | null;
  bank?: string | null;
  branch?: string | null;
  accountNo?: string | null;
  issuer?: string | null; // Keşideci (Çeki düzenleyen / imzalayan)
  recipient?: string | null; // Lehtar / Muhatap (Kime verildi veya kimden alındı)
  amount: number;
  issueDate?: string | null;
  dueDate?: string | null;
  dueDateStr?: string | null;
  status: "PORTFOLIO" | "COLLECTED" | "BOUNCED" | "ENDORSED" | "CANCELLED"; // PORTFOLIO = Beklemede / Portföyde, COLLECTED = Tahsil Edildi / Ödendi, BOUNCED = Karşılıksız, ENDORSED = Ciro Edildi, CANCELLED = İptal
  paymentDate?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  expenseId?: string | null; // Bağlı SchoolExpense kaydı varsa
  studentPaymentId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function ensureChequeTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ChequeRecord (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'GIVEN',
      chequeNo TEXT,
      bank TEXT,
      branch TEXT,
      accountNo TEXT,
      issuer TEXT,
      recipient TEXT,
      amount REAL NOT NULL DEFAULT 0,
      issueDate TEXT,
      dueDate TEXT,
      dueDateStr TEXT,
      status TEXT NOT NULL DEFAULT 'PORTFOLIO',
      paymentDate TEXT,
      notes TEXT,
      photoUrl TEXT,
      expenseId TEXT,
      studentPaymentId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
}

/**
 * Okul Giderleri (SchoolExpense) tablosundaki çek kayıtlarını ChequeRecord tablosuyla eşitler.
 * Böylece Giderler ekranından eklenen tüm çekler Çek Takibi modülünde de eksiksiz görünür.
 */
export async function syncChequesFromSchoolExpenses() {
  await ensureChequeTable();

  // 1. SchoolExpense tablosundaki tüm çek benzeri kayıtları getir
  const allExpenses = await prisma.schoolExpense.findMany();
  const chequeExpenses = allExpenses.filter((exp) => {
    const isChequeCat = exp.category === "CHEQUE";
    const isChequeMethod = exp.paymentMethod === "CHEQUE";
    const hasChequeNo = Boolean(exp.chequeNo && exp.chequeNo.trim().length > 0);
    const hasChequeTitle = Boolean(exp.title && /çek/i.test(exp.title));
    return isChequeCat || isChequeMethod || hasChequeNo || hasChequeTitle;
  });

  // 2. Mevcut fotoğrafları al
  let photosMap: Record<string, string> = {};
  try {
    const photoRows = (await prisma.$queryRawUnsafe(
      `SELECT id, photoUrl FROM ChequePhotoStore WHERE photoUrl IS NOT NULL`
    )) as { id: string; photoUrl: string }[];
    photoRows.forEach((p) => {
      if (p.photoUrl) photosMap[p.id] = p.photoUrl;
    });
  } catch {}

  // 3. Mevcut ChequeRecord kayıtlarını al
  const existingCheques = (await prisma.$queryRawUnsafe(
    `SELECT id, expenseId, status, photoUrl FROM ChequeRecord`
  )) as { id: string; expenseId: string | null; status: string; photoUrl: string | null }[];

  const expenseIdMap = new Map<string, { id: string; status: string; photoUrl: string | null }>();
  existingCheques.forEach((c) => {
    if (c.expenseId) {
      expenseIdMap.set(c.expenseId, c);
    }
  });

  const nowISO = new Date().toISOString();

  for (const exp of chequeExpenses) {
    const matched = expenseIdMap.get(exp.id);
    const resolvedDueDate = exp.dueDate ? new Date(exp.dueDate).toISOString().slice(0, 10) : null;
    const resolvedStatus = exp.status === "PAID" ? "COLLECTED" : "PORTFOLIO";
    const photo = photosMap[exp.id] || null;

    if (!matched) {
      // Yeni kayıt oluştur
      const newId = `chk-exp-${exp.id}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO ChequeRecord (
          id, type, chequeNo, bank, branch, accountNo, issuer, recipient,
          amount, issueDate, dueDate, dueDateStr, status, paymentDate,
          notes, photoUrl, expenseId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId,
        "GIVEN", // Okul giderinden gelen çekler Verilen (Ödeme) Çekidir
        exp.chequeNo || null,
        exp.chequeBank || null,
        null,
        null,
        "Özel Kayseri Simya Çocuk Üniversitesi",
        exp.title,
        Number(exp.amountDue) || 0,
        exp.createdAt ? new Date(exp.createdAt).toISOString().slice(0, 10) : null,
        resolvedDueDate,
        exp.dueDateStr || null,
        resolvedStatus,
        exp.status === "PAID" ? nowISO : null,
        exp.description || null,
        photo,
        exp.id,
        exp.createdAt ? new Date(exp.createdAt).toISOString() : nowISO,
        nowISO
      );
    } else {
      // Varsa fotoğrafı veya gider durumunu güncelle
      const shouldUpdatePhoto = !matched.photoUrl && photo;
      const shouldUpdateStatus = (matched.status === "PORTFOLIO" && exp.status === "PAID") ||
                                 (matched.status === "COLLECTED" && exp.status !== "PAID");

      if (shouldUpdatePhoto || shouldUpdateStatus) {
        await prisma.$executeRawUnsafe(
          `UPDATE ChequeRecord SET
             photoUrl = COALESCE(?, photoUrl),
             status = ?,
             updatedAt = ?
           WHERE id = ?`,
          photo,
          resolvedStatus,
          nowISO,
          matched.id
        );
      }
    }
  }
}

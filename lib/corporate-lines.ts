import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface CorporatePhoneLineRow {
  id: string;
  phoneNumber: string;       // 05XX XXX XX XX
  userName: string;          // MAÇ, Şeyma Çağır, Halkla İlişkiler vb.
  operator: string;          // Vodafone, Turkcell, Türk Telekom
  packageName?: string | null;
  monthlyFee: number;        // Sabit paket ücreti (TL)
  startDate?: string | null; // Taahhüt Başlangıç (YYYY-MM-DD)
  endDate?: string | null;   // Taahhüt Bitiş (YYYY-MM-DD)
  commitmentMonths?: number | null;
  status: "ACTIVE" | "PASSIVE" | "CANCELLED";
  simCardNo?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function ensureCorporatePhoneLinesTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CorporatePhoneLine (
      id TEXT PRIMARY KEY,
      phoneNumber TEXT NOT NULL,
      userName TEXT NOT NULL,
      operator TEXT NOT NULL DEFAULT 'Vodafone',
      packageName TEXT,
      monthlyFee REAL NOT NULL DEFAULT 0,
      startDate TEXT,
      endDate TEXT,
      commitmentMonths INTEGER DEFAULT 12,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      simCardNo TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Eğer tablo boşsa, kurumun mevcut hatlarını başlangıç verisi olarak yükle
  const count = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM CorporatePhoneLine`
  )) as { count: number }[];

  if (count && count[0] && Number(count[0].count) === 0) {
    const defaultLines = [
      {
        id: "line-1",
        phoneNumber: "0545 545 10 58",
        userName: "MAÇ",
        operator: "Vodafone",
        packageName: "Red Business",
        monthlyFee: 2048.58,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "MAÇ (Yönetim)",
      },
      {
        id: "line-2",
        phoneNumber: "0545 545 09 58",
        userName: "Şeyma Çağır",
        operator: "Vodafone",
        packageName: "Red Business",
        monthlyFee: 1048.98,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "Şeyma Çağır",
      },
      {
        id: "line-3",
        phoneNumber: "0537 380 03 80",
        userName: "Halkla İlişkiler",
        operator: "Vodafone",
        packageName: "Kurumsal Hat",
        monthlyFee: 451.98,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "Halkla İlişkiler & Danışma",
      },
      {
        id: "line-4",
        phoneNumber: "0545 613 38 38",
        userName: "DK Kurumsal",
        operator: "Vodafone",
        packageName: "Kurumsal Hat",
        monthlyFee: 472.18,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "DK Kurumsal",
      },
      {
        id: "line-5",
        phoneNumber: "0544 613 38 38",
        userName: "OŞ Kurumsal",
        operator: "Vodafone",
        packageName: "Kurumsal Hat",
        monthlyFee: 488.08,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "OŞ Kurumsal",
      },
      {
        id: "line-6",
        phoneNumber: "0507 219 23 11",
        userName: "AS Hat",
        operator: "Vodafone",
        packageName: "Kurumsal Hat",
        monthlyFee: 475.00,
        endDate: "2026-10-21",
        commitmentMonths: 12,
        notes: "AS Hat",
      },
    ];

    const nowISO = new Date().toISOString();
    for (const l of defaultLines) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO CorporatePhoneLine (
          id, phoneNumber, userName, operator, packageName, monthlyFee,
          endDate, commitmentMonths, status, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        l.id,
        l.phoneNumber,
        l.userName,
        l.operator,
        l.packageName,
        l.monthlyFee,
        l.endDate,
        l.commitmentMonths,
        "ACTIVE",
        l.notes,
        nowISO,
        nowISO
      );
    }
  }
}

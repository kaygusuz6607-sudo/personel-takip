import { prisma } from "@/lib/prisma";

export interface WorkTaskRow {
  id: string;
  title: string;
  description: string | null;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  category: string; // BANKA, MEB, PERSONEL, TEDARIK, GORUSME, BAKIM, GENEL
  priority: string; // ACIL, NORMAL, DUSUK
  status: string; // BEKLIYOR, TAMAMLANDI
  completedAt: string | null;
  completedBy: string | null;
  assignedTo: string | null;
  recurring: string | null; // NONE, MONTHLY, WEEKLY
  createdAt: string;
  updatedAt: string;
}

export const TASK_CATEGORIES = [
  { id: "BANKA", label: "Banka & Finans", color: "amber", badgeBg: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "MEB", label: "MEB & Resmi Kurum", color: "rose", badgeBg: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "PERSONEL", label: "Personel & İK", color: "indigo", badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "TEDARIK", label: "Tedarik & Satınalma", color: "blue", badgeBg: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "GORUSME", label: "Toplantı & Görüşme", color: "purple", badgeBg: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "BAKIM", label: "Bakım & Onarım", color: "orange", badgeBg: "bg-orange-100 text-orange-800 border-orange-300" },
  { id: "GENEL", label: "Genel Görevler", color: "slate", badgeBg: "bg-slate-100 text-slate-800 border-slate-300" },
];

export const TASK_PRIORITIES = [
  { id: "ACIL", label: "Acil", badgeBg: "bg-red-500 text-white border-red-600" },
  { id: "NORMAL", label: "Normal", badgeBg: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "DUSUK", label: "Düşük", badgeBg: "bg-slate-50 text-slate-600 border-slate-200" },
];

export async function ensureWorkTasksTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS WorkTask (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT NOT NULL,
      dueTime TEXT,
      category TEXT NOT NULL DEFAULT 'GENEL',
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      status TEXT NOT NULL DEFAULT 'BEKLIYOR',
      completedAt TEXT,
      completedBy TEXT,
      assignedTo TEXT,
      recurring TEXT DEFAULT 'NONE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_worktask_duedate ON WorkTask(dueDate);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_worktask_status ON WorkTask(status);
    `);
  } catch (e) {
    // Index creation error ignored if exists
  }
}

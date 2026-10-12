import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureWorkTasksTable, WorkTaskRow, TASK_CATEGORIES } from "@/lib/work-tasks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await ensureWorkTasksTable();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL"; // ALL, BEKLIYOR, TAMAMLANDI, TODAY, OVERDUE, UPCOMING
    const category = searchParams.get("category") || "ALL";
    const priority = searchParams.get("priority") || "ALL";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    // Bugünü YYYY-MM-DD olarak al (Türkiye saati)
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    let query = `SELECT * FROM WorkTask WHERE 1=1`;
    const params: any[] = [];

    // Kategori Filtresi
    if (category && category !== "ALL") {
      query += ` AND category = ?`;
      params.push(category);
    }

    // Öncelik Filtresi
    if (priority && priority !== "ALL") {
      query += ` AND priority = ?`;
      params.push(priority);
    }

    // Tarih aralığı (özellikle takvim görünümü için)
    if (startDate && endDate) {
      query += ` AND dueDate >= ? AND dueDate <= ?`;
      params.push(startDate, endDate);
    }

    // Arama
    if (search && search.trim() !== "") {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      const q = `%${search.trim()}%`;
      params.push(q, q);
    }

    // Durum Filtresi
    if (status === "BEKLIYOR") {
      query += ` AND status = 'BEKLIYOR'`;
    } else if (status === "TAMAMLANDI") {
      query += ` AND status = 'TAMAMLANDI'`;
    } else if (status === "TODAY") {
      query += ` AND dueDate = ? AND status = 'BEKLIYOR'`;
      params.push(todayStr);
    } else if (status === "OVERDUE") {
      query += ` AND dueDate < ? AND status = 'BEKLIYOR'`;
      params.push(todayStr);
    } else if (status === "UPCOMING") {
      query += ` AND dueDate > ? AND status = 'BEKLIYOR'`;
      params.push(todayStr);
    }

    // Sıralama: Bekleyenler önce, gecikenler ve bugünkiler en üstte
    query += ` ORDER BY 
      CASE WHEN status = 'BEKLIYOR' THEN 0 ELSE 1 END ASC,
      dueDate ASC,
      CASE WHEN dueTime IS NULL THEN '23:59' ELSE dueTime END ASC,
      createdAt DESC`;

    const tasks = (await prisma.$queryRawUnsafe(query, ...params)) as WorkTaskRow[];

    // İstatistikler (Tüm görevler üzerinden)
    const allSummary = (await prisma.$queryRawUnsafe(
      `SELECT dueDate, status FROM WorkTask`
    )) as { dueDate: string; status: string }[];

    let overdueCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let totalPending = 0;

    allSummary.forEach((t) => {
      if (t.status === "TAMAMLANDI") {
        completedCount++;
      } else {
        totalPending++;
        if (t.dueDate < todayStr) {
          overdueCount++;
        } else if (t.dueDate === todayStr) {
          todayCount++;
        } else {
          upcomingCount++;
        }
      }
    });

    return NextResponse.json({
      tasks,
      todayStr,
      categories: TASK_CATEGORIES,
      stats: {
        totalPending,
        overdueCount,
        todayCount,
        upcomingCount,
        completedCount,
        totalCount: allSummary.length,
      },
    });
  } catch (error: any) {
    console.error("Görevler alınırken hata:", error);
    return NextResponse.json({ error: "Görevler yüklenemedi: " + (error?.message || "") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureWorkTasksTable();

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      dueTime,
      category,
      priority,
      assignedTo,
      recurring,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Lütfen bir iş başlığı girin." }, { status: 400 });
    }

    if (!dueDate || !dueDate.trim()) {
      return NextResponse.json({ error: "Lütfen bir tarih seçin." }, { status: 400 });
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO WorkTask (
        id, title, description, dueDate, dueTime, category, priority, status,
        completedAt, completedBy, assignedTo, recurring, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'BEKLIYOR', NULL, NULL, ?, ?, ?, ?)`,
      taskId,
      title.trim(),
      description && description.trim() ? description.trim() : null,
      dueDate.trim(),
      dueTime && dueTime.trim() ? dueTime.trim() : null,
      category || "GENEL",
      priority || "NORMAL",
      assignedTo && assignedTo.trim() ? assignedTo.trim() : null,
      recurring || "NONE",
      nowIso,
      nowIso
    );

    return NextResponse.json({ ok: true, id: taskId });
  } catch (error: any) {
    console.error("Görev eklenirken hata:", error);
    return NextResponse.json({ error: "Görev kaydedilemedi: " + (error?.message || "") }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureWorkTasksTable, WorkTaskRow } from "@/lib/work-tasks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureWorkTasksTable();
    const { id } = await params;
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
      return NextResponse.json({ error: "İş başlığı zorunludur." }, { status: 400 });
    }

    if (!dueDate || !dueDate.trim()) {
      return NextResponse.json({ error: "Tarih zorunludur." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE WorkTask SET
        title = ?,
        description = ?,
        dueDate = ?,
        dueTime = ?,
        category = ?,
        priority = ?,
        assignedTo = ?,
        recurring = ?,
        updatedAt = ?
      WHERE id = ?`,
      title.trim(),
      description && description.trim() ? description.trim() : null,
      dueDate.trim(),
      dueTime && dueTime.trim() ? dueTime.trim() : null,
      category || "GENEL",
      priority || "NORMAL",
      assignedTo && assignedTo.trim() ? assignedTo.trim() : null,
      recurring || "NONE",
      nowIso,
      id
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Görev güncellenirken hata:", error);
    return NextResponse.json({ error: "Görev güncellenemedi: " + (error?.message || "") }, { status: 500 });
  }
}

// Tek tıkla Tamamlandı / Bekliyor durumunu değiştirme
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureWorkTasksTable();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Mevcut görevi çek
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM WorkTask WHERE id = ?`,
      id
    )) as WorkTaskRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Görev bulunamadı." }, { status: 404 });
    }

    const currentTask = rows[0];
    const isCompleted = currentTask.status === "TAMAMLANDI";
    const nextStatus = body.status || (isCompleted ? "BEKLIYOR" : "TAMAMLANDI");
    const nowIso = new Date().toISOString();
    const completedAt = nextStatus === "TAMAMLANDI" ? nowIso : null;

    await prisma.$executeRawUnsafe(
      `UPDATE WorkTask SET
        status = ?,
        completedAt = ?,
        updatedAt = ?
      WHERE id = ?`,
      nextStatus,
      completedAt,
      nowIso,
      id
    );

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      completedAt,
    });
  } catch (error: any) {
    console.error("Görev durumu değiştirilirken hata:", error);
    return NextResponse.json({ error: "Durum değiştirilemedi: " + (error?.message || "") }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureWorkTasksTable();
    const { id } = await params;

    await prisma.$executeRawUnsafe(`DELETE FROM WorkTask WHERE id = ?`, id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Görev silinirken hata:", error);
    return NextResponse.json({ error: "Görev silinemedi: " + (error?.message || "") }, { status: 500 });
  }
}

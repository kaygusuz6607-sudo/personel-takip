import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, category, description, tags } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Evrak başlığı zorunludur." }, { status: 400 });
    }

    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE SchoolDocument SET 
        title = ?, category = ?, description = ?, tags = ?, updatedAt = ?
       WHERE id = ?`,
      title.trim(),
      category || "Kayıt & Veli Evrakları",
      description ? description.trim() : null,
      tags ? tags.trim() : null,
      now,
      id
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Evrak güncellenirken hata:", error);
    return NextResponse.json({ error: "Güncelleme başarısız: " + (error?.message || "") }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT filePath FROM SchoolDocument WHERE id = ?`,
      id
    )) as { filePath: string | null }[];

    if (rows[0]?.filePath) {
      try {
        const fullDiskPath = path.join(process.cwd(), rows[0].filePath);
        if (fs.existsSync(fullDiskPath)) {
          fs.unlinkSync(fullDiskPath);
        }
      } catch (err) {
        console.warn("Diskten dosya silinirken uyarı:", err);
      }
    }

    await prisma.$executeRawUnsafe(`DELETE FROM SchoolDocument WHERE id = ?`, id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Evrak silinirken hata:", error);
    return NextResponse.json({ error: "Silme başarısız: " + (error?.message || "") }, { status: 500 });
  }
}

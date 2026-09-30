import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import os from "os";

async function ensureChequePhotoTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ChequePhotoStore (
      id TEXT PRIMARY KEY,
      photoUrl TEXT,
      title TEXT,
      updatedAt TEXT
    )
  `);
}

function getLocalLanIp(): string | null {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal && iface.address) {
          return iface.address;
        }
      }
    }
  } catch {}
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureChequePhotoTable();

    let title = "Çek Ödemesi";
    let dueDateStr = "";
    let amountDue = 0;

    if (!id.startsWith("draft-")) {
      const exp = await prisma.schoolExpense.findUnique({
        where: { id },
      });
      if (exp) {
        title = exp.title;
        dueDateStr = exp.dueDateStr || "";
        amountDue = exp.amountDue || 0;
      }
    }

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, photoUrl, title, updatedAt FROM ChequePhotoStore WHERE id = ? LIMIT 1`,
      id
    )) as { id: string; photoUrl: string | null; title: string | null; updatedAt: string | null }[];

    const record = rows && rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      id,
      title: record?.title || title,
      dueDateStr,
      amountDue,
      photoUrl: record?.photoUrl || null,
      updatedAt: record?.updatedAt || null,
      lanIp: getLocalLanIp(),
    });
  } catch (error) {
    console.error("Çek fotoğrafı sorgulama hatası:", error);
    return NextResponse.json({ error: "Çek fotoğraf bilgisi alınamadı." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photoUrl, title } = body;

    await ensureChequePhotoTable();
    const nowISO = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO ChequePhotoStore (id, photoUrl, title, updatedAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         photoUrl = excluded.photoUrl,
         title = COALESCE(excluded.title, ChequePhotoStore.title),
         updatedAt = excluded.updatedAt`,
      id,
      photoUrl || null,
      title || null,
      nowISO
    );

    return NextResponse.json({
      success: true,
      id,
      photoUrl: photoUrl || null,
      updatedAt: nowISO,
    });
  } catch (error) {
    console.error("Çek fotoğrafı kaydetme hatası:", error);
    return NextResponse.json({ error: "Çek fotoğrafı kaydedilemedi." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureChequePhotoTable();

    await prisma.$executeRawUnsafe(`DELETE FROM ChequePhotoStore WHERE id = ?`, id);

    return NextResponse.json({
      success: true,
      message: "Çek fotoğrafı kaldırıldı.",
    });
  } catch (error) {
    console.error("Çek fotoğrafı silme hatası:", error);
    return NextResponse.json({ error: "Çek fotoğrafı silinemedi." }, { status: 500 });
  }
}

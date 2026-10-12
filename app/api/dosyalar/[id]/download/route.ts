import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, fileName, mimeType, filePath, fileData FROM SchoolDocument WHERE id = ?`,
      id
    )) as { id: string; fileName: string; mimeType: string; filePath: string | null; fileData: string | null }[];

    if (!rows || !rows[0]) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    const doc = rows[0];
    let fileBuffer: Buffer | null = null;

    // 1. Önce diskten okumayı dene
    if (doc.filePath) {
      const fullDiskPath = path.join(process.cwd(), doc.filePath);
      if (fs.existsSync(fullDiskPath)) {
        try {
          fileBuffer = fs.readFileSync(fullDiskPath);
        } catch (e) {
          console.warn("Disk okuma hatası, DB yedeği denenecek:", e);
        }
      }
    }

    // 2. Disk bulunamazsa DB'deki Base64 yedeğinden oku
    if (!fileBuffer && doc.fileData) {
      fileBuffer = Buffer.from(doc.fileData, "base64");
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "Dosya içeriğine ulaşılamadı." }, { status: 404 });
    }

    // İndirme sayacını 1 artır
    prisma.$executeRawUnsafe(
      `UPDATE SchoolDocument SET downloadCount = downloadCount + 1 WHERE id = ?`,
      id
    ).catch(() => {});

    // UTF-8 dosya adı başlığı
    const safeAsciiName = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const encodedFilename = encodeURIComponent(doc.fileName);

    const headers = new Headers();
    headers.set("Content-Type", doc.mimeType || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedFilename}`
    );
    headers.set("Content-Length", String(fileBuffer.length));

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Dosya indirme hatası:", error);
    return NextResponse.json({ error: "Dosya indirilemedi: " + (error?.message || "") }, { status: 500 });
  }
}

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

    // UTF-8 dosya adı başlığı
    const safeAsciiName = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const encodedFilename = encodeURIComponent(doc.fileName);

    let contentType = doc.mimeType || "application/octet-stream";
    const lowerName = doc.fileName.toLowerCase();
    if (lowerName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (lowerName.endsWith(".png")) {
      contentType = "image/png";
    } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (lowerName.endsWith(".txt")) {
      contentType = "text/plain; charset=utf-8";
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodedFilename}`
    );
    headers.set("Content-Length", String(fileBuffer.length));
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Dosya görüntüleme hatası:", error);
    return NextResponse.json({ error: "Dosya açılamadı: " + (error?.message || "") }, { status: 500 });
  }
}

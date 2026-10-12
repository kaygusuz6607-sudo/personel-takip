import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureSchoolDocumentsTable,
  SchoolDocumentRow,
  DOCUMENT_CATEGORIES,
  formatBytes,
  getMimeType,
} from "@/lib/school-documents";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await ensureSchoolDocumentsTable();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // fileData (Base64) alanını liste çağrısında çekmiyoruz, hafif kalsın
    let query = `SELECT id, title, category, fileName, fileExtension, fileSize, fileSizeFormatted, mimeType, filePath, description, tags, downloadCount, createdAt, updatedAt FROM SchoolDocument WHERE 1=1`;
    const params: any[] = [];

    if (category && category !== "ALL") {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== "") {
      query += ` AND (title LIKE ? OR fileName LIKE ? OR description LIKE ? OR tags LIKE ?)`;
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q);
    }

    query += ` ORDER BY createdAt DESC`;

    const documents = (await prisma.$queryRawUnsafe(query, ...params)) as Omit<SchoolDocumentRow, "fileData">[];

    // Kategori bazlı istatistikler
    const allDocs = (await prisma.$queryRawUnsafe(
      `SELECT category, fileSize, fileExtension FROM SchoolDocument`
    )) as { category: string; fileSize: number; fileExtension: string }[];

    const categoryCounts: Record<string, number> = {};
    const extensionCounts: Record<string, number> = {};
    let totalSize = 0;

    allDocs.forEach((d) => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
      const ext = (d.fileExtension || "").toLowerCase();
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      totalSize += Number(d.fileSize) || 0;
    });

    return NextResponse.json({
      documents,
      categories: DOCUMENT_CATEGORIES,
      categoryCounts,
      extensionCounts,
      stats: {
        totalCount: allDocs.length,
        totalSizeFormatted: formatBytes(totalSize),
        wordCount: (extensionCounts["docx"] || 0) + (extensionCounts["doc"] || 0),
        excelCount: (extensionCounts["xlsx"] || 0) + (extensionCounts["xls"] || 0),
        pdfCount: extensionCounts["pdf"] || 0,
        otherCount: allDocs.length - ((extensionCounts["docx"] || 0) + (extensionCounts["doc"] || 0) + (extensionCounts["xlsx"] || 0) + (extensionCounts["xls"] || 0) + (extensionCounts["pdf"] || 0)),
      },
    });
  } catch (error: any) {
    console.error("Evrak listesi alınırken hata:", error);
    return NextResponse.json({ error: "Evraklar yüklenemedi: " + (error?.message || "") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchoolDocumentsTable();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || "";
    const category = (formData.get("category") as string | null) || "Kayıt & Veli Evrakları";
    const description = (formData.get("description") as string | null) || "";
    const tags = (formData.get("tags") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "Lütfen bir dosya seçin." }, { status: 400 });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).replace(".", "").toLowerCase() || "bin";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileSize = buffer.length;
    const fileSizeFormatted = formatBytes(fileSize);
    const mimeType = file.type || getMimeType(ext);

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const finalTitle = title.trim() || path.basename(originalName, path.extname(originalName));

    // uploads/evraklar dizini oluştur ve diske kaydet
    const uploadDir = path.join(process.cwd(), "uploads", "evraklar");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeDiskFileName = `${docId}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fullDiskPath = path.join(uploadDir, safeDiskFileName);
    fs.writeFileSync(fullDiskPath, buffer);

    // DB'ye Base64 yedeği de alıyoruz (Docker yeniden başlatılsa dahi dosya asla kaybolmaz)
    const base64Data = buffer.toString("base64");
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO SchoolDocument (id, title, category, fileName, fileExtension, fileSize, fileSizeFormatted, mimeType, filePath, fileData, description, tags, downloadCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      docId,
      finalTitle,
      category,
      originalName,
      ext,
      fileSize,
      fileSizeFormatted,
      mimeType,
      `uploads/evraklar/${safeDiskFileName}`,
      base64Data,
      description.trim() || null,
      tags.trim() || null,
      now,
      now
    );

    return NextResponse.json({ ok: true, id: docId, title: finalTitle });
  } catch (error: any) {
    console.error("Dosya yüklenirken hata:", error);
    return NextResponse.json({ error: "Dosya yüklenemedi: " + (error?.message || "") }, { status: 500 });
  }
}

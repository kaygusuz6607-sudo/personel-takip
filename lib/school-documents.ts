import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export interface SchoolDocumentRow {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  filePath: string | null;
  fileData: string | null; // Base64 backup
  description: string | null;
  tags: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const DOCUMENT_CATEGORIES = [
  { id: "KAYIT_VELI", label: "Kayıt & Veli Evrakları", icon: "FileText", color: "blue" },
  { id: "MEB_RESMI", label: "MEB & Resmi Yazışmalar", icon: "Landmark", color: "red" },
  { id: "PERSONEL_IK", label: "Personel & İK Evrakları", icon: "Users", color: "emerald" },
  { id: "MUHASEBE_MALI", label: "Muhasebe & Mali Evraklar", icon: "Coins", color: "amber" },
  { id: "EGITIM_REHBERLIK", label: "Eğitim & Rehberlik Evrakları", icon: "GraduationCap", color: "purple" },
  { id: "KURUMSAL_SABLONLAR", label: "Kurumsal Şablonlar & Formlar", icon: "Building2", color: "teal" },
  { id: "DIGER", label: "Diğer Belgeler", icon: "Folder", color: "slate" },
];

export function getMimeType(extension: string): string {
  const ext = extension.toLowerCase().replace(".", "");
  switch (ext) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "txt":
      return "text/plain";
    case "zip":
      return "application/zip";
    case "rar":
      return "application/x-rar-compressed";
    default:
      return "application/octet-stream";
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bayt";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bayt", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function ensureSchoolDocumentsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS SchoolDocument (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Kayıt & Veli Evrakları',
      fileName TEXT NOT NULL,
      fileExtension TEXT NOT NULL,
      fileSize INTEGER NOT NULL DEFAULT 0,
      fileSizeFormatted TEXT NOT NULL DEFAULT '0 KB',
      mimeType TEXT NOT NULL,
      filePath TEXT,
      fileData TEXT,
      description TEXT,
      tags TEXT,
      downloadCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

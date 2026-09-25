import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const records = await prisma.studentAttendance.findMany({
      where: { studentId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("GET /api/ogrenciler/[id]/attendance error:", error);
    return NextResponse.json(
      { error: "Yoklama kayıtları alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { date, lessonHour, status, notes, isNotified } = body;

    const record = await prisma.studentAttendance.create({
      data: {
        studentId: id,
        date: date ? new Date(date) : new Date(),
        lessonHour: lessonHour || "Tüm Gün",
        status: status || "PRESENT",
        notes: notes?.trim() || null,
        isNotified: isNotified || false,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ogrenciler/[id]/attendance error:", error);
    return NextResponse.json(
      { error: "Yoklama kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

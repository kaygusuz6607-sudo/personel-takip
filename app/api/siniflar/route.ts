import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || "ALL";

    const where: any = {};
    if (academicYear !== "ALL") {
      where.academicYear = academicYear;
    }

    const classrooms = await prisma.classroom.findMany({
      where,
      include: {
        teacherStaff: {
          select: {
            id: true,
            fullName: true,
            title: true,
            phone: true,
          },
        },
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    const formatted = classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      gradeLevel: c.gradeLevel,
      branch: c.branch,
      capacity: c.capacity,
      academicYear: c.academicYear,
      roomNumber: c.roomNumber,
      teacherStaff: c.teacherStaff,
      activeStudentCount: c._count.students,
      occupancyRate: Math.round((c._count.students / (c.capacity || 1)) * 100),
      createdAt: c.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/siniflar error:", error);
    return NextResponse.json(
      { error: "Sınıflar yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { name, section, gradeLevel, branch, capacity, academicYear, roomNumber, teacherStaffId } = body;

    if (!name?.trim() || !gradeLevel?.trim()) {
      return NextResponse.json(
        { error: "Sınıf Adı ve Seviye zorunludur." },
        { status: 400 }
      );
    }

    // İsim benzersizlik kontrolü
    const existing = await prisma.classroom.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `"${name}" adında bir sınıf zaten mevcut.` },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        section: section || "ANAOKULU",
        gradeLevel: gradeLevel.trim(),
        branch: branch?.trim() || null,
        capacity: capacity ? parseInt(capacity) : 16,
        academicYear: academicYear || "2025-2026",
        roomNumber: roomNumber?.trim() || null,
        teacherStaffId: teacherStaffId || null,
      },
      include: {
        teacherStaff: true,
      },
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/siniflar error:", error);
    return NextResponse.json(
      { error: "Sınıf kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

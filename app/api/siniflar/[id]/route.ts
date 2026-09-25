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
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacherStaff: {
          select: {
            id: true,
            fullName: true,
            title: true,
            phone: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            studentNo: true,
            tcNo: true,
            fullName: true,
            status: true,
            primaryPhone: true,
            photoUrl: true,
            netAmount: true,
          },
          orderBy: { fullName: "asc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Sınıf bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(classroom);
  } catch (error: any) {
    console.error("GET /api/siniflar/[id] error:", error);
    return NextResponse.json(
      { error: "Sınıf bilgisi alınamadı." },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { name, section, gradeLevel, branch, capacity, academicYear, roomNumber, teacherStaffId } = body;

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        section: section !== undefined ? section : undefined,
        gradeLevel: gradeLevel !== undefined ? gradeLevel.trim() : undefined,
        branch: branch !== undefined ? branch : undefined,
        capacity: capacity !== undefined ? parseInt(capacity) : undefined,
        academicYear: academicYear !== undefined ? academicYear : undefined,
        roomNumber: roomNumber !== undefined ? roomNumber : undefined,
        teacherStaffId: teacherStaffId !== undefined ? (teacherStaffId || null) : undefined,
      },
      include: {
        teacherStaff: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/siniflar/[id] error:", error);
    return NextResponse.json(
      { error: "Sınıf güncellenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    // Sınıfta aktif öğrenci var mı kontrolü
    const studentCount = await prisma.student.count({
      where: { classroomId: id },
    });

    if (studentCount > 0) {
      return NextResponse.json(
        { error: `Bu sınıfa kayıtlı ${studentCount} öğrenci bulunmaktadır. Önce öğrencileri başka bir sınıfa taşıyınız.` },
        { status: 400 }
      );
    }

    await prisma.classroom.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/siniflar/[id] error:", error);
    return NextResponse.json(
      { error: "Sınıf silinirken hata oluştu." },
      { status: 500 }
    );
  }
}

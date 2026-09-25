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
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            branch: true,
            academicYear: true,
            roomNumber: true,
            teacherStaff: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        payments: {
          orderBy: { installmentNo: "asc" },
        },
        attendances: {
          orderBy: { date: "desc" },
        },
        lead: {
          select: {
            id: true,
            source: true,
            sourceDetail: true,
            assignedStaff: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    console.error("GET /api/ogrenciler/[id] error:", error);
    return NextResponse.json(
      { error: "Öğrenci bilgisi alınamadı." },
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

    const {
      studentNo,
      tcNo,
      fullName,
      birthDate,
      gender,
      bloodGroup,
      healthNotes,
      photoUrl,
      status,
      fatherName,
      fatherPhone,
      fatherJob,
      motherName,
      motherPhone,
      motherJob,
      guardianRelation,
      primaryPhone,
      primaryEmail,
      homeAddress,
      cityDistrict,
      classroomId,
      academicYear,
      previousSchool,
      graduationDate,
      tags,
      notes,
    } = body;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        studentNo: studentNo !== undefined ? studentNo : undefined,
        tcNo: tcNo !== undefined ? tcNo.trim() : undefined,
        fullName: fullName !== undefined ? fullName.trim() : undefined,
        birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
        gender: gender !== undefined ? gender : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        healthNotes: healthNotes !== undefined ? healthNotes : undefined,
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
        status: status !== undefined ? status : undefined,
        fatherName: fatherName !== undefined ? fatherName : undefined,
        fatherPhone: fatherPhone !== undefined ? fatherPhone : undefined,
        fatherJob: fatherJob !== undefined ? fatherJob : undefined,
        motherName: motherName !== undefined ? motherName : undefined,
        motherPhone: motherPhone !== undefined ? motherPhone : undefined,
        motherJob: motherJob !== undefined ? motherJob : undefined,
        guardianRelation: guardianRelation !== undefined ? guardianRelation : undefined,
        primaryPhone: primaryPhone !== undefined ? primaryPhone.trim() : undefined,
        primaryEmail: primaryEmail !== undefined ? primaryEmail : undefined,
        homeAddress: homeAddress !== undefined ? homeAddress : undefined,
        cityDistrict: cityDistrict !== undefined ? cityDistrict : undefined,
        classroomId: classroomId !== undefined ? (classroomId || null) : undefined,
        academicYear: academicYear !== undefined ? academicYear : undefined,
        previousSchool: previousSchool !== undefined ? previousSchool : undefined,
        graduationDate: graduationDate !== undefined ? (graduationDate ? new Date(graduationDate) : null) : undefined,
        tags: tags !== undefined ? JSON.stringify(tags) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        classroom: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/ogrenciler/[id] error:", error);
    return NextResponse.json(
      { error: "Öğrenci güncellenirken hata oluştu." },
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
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/ogrenciler/[id] error:", error);
    return NextResponse.json(
      { error: "Öğrenci silinirken hata oluştu." },
      { status: 500 }
    );
  }
}

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
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const classroomId = searchParams.get("classroomId") || "ALL";
    const academicYear = searchParams.get("academicYear") || "ALL";
    const tag = searchParams.get("tag") || "ALL";

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { tcNo: { contains: search } },
        { studentNo: { contains: search } },
        { primaryPhone: { contains: search } },
        { fatherName: { contains: search, mode: "insensitive" } },
        { motherName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "ALL") {
      where.status = status;
    }

    if (classroomId !== "ALL") {
      where.classroomId = classroomId === "UNASSIGNED" ? null : classroomId;
    }

    if (academicYear !== "ALL") {
      where.academicYear = academicYear;
    }

    if (tag !== "ALL") {
      where.tags = { contains: tag };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            branch: true,
          },
        },
        payments: {
          select: {
            id: true,
            installmentNo: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            isPaid: true,
          },
          orderBy: { installmentNo: "asc" },
        },
        _count: {
          select: {
            attendances: {
              where: { status: "ABSENT" },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { fullName: "asc" }],
    });

    // İstatistikler
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        status: true,
        netAmount: true,
        payments: {
          select: {
            amount: true,
            paidAmount: true,
            isPaid: true,
          },
        },
      },
    });

    let totalContractSum = 0;
    let totalPaidSum = 0;
    let totalRemainingSum = 0;

    allStudents.forEach((st) => {
      totalContractSum += st.netAmount || 0;
      st.payments.forEach((p) => {
        totalPaidSum += p.paidAmount || (p.isPaid ? p.amount : 0);
        if (!p.isPaid) {
          totalRemainingSum += Math.max(0, p.amount - (p.paidAmount || 0));
        }
      });
    });

    const stats = {
      total: allStudents.length,
      active: allStudents.filter((s) => s.status === "ACTIVE").length,
      frozen: allStudents.filter((s) => s.status === "FROZEN").length,
      transferred: allStudents.filter((s) => s.status === "TRANSFERRED").length,
      dropped: allStudents.filter((s) => s.status === "DROPPED").length,
      graduated: allStudents.filter((s) => s.status === "GRADUATED").length,
      totalContractSum,
      totalPaidSum,
      totalRemainingSum,
    };

    return NextResponse.json({ students, stats });
  } catch (error: any) {
    console.error("GET /api/ogrenciler error:", error);
    return NextResponse.json(
      { error: "Öğrenciler yüklenirken hata oluştu." },
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
    const {
      studentNo,
      tcNo,
      fullName,
      birthDate,
      gender,
      bloodGroup,
      healthNotes,
      photoUrl,
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
      contractAmount,
      discountAmount,
      netAmount,
      installmentCount,
      firstInstallmentDate,
      tags,
      notes,
    } = body;

    if (!tcNo?.trim() || !fullName?.trim() || !primaryPhone?.trim()) {
      return NextResponse.json(
        { error: "T.C. Kimlik No, Öğrenci Adı Soyadı ve İletişim Telefonu zorunludur." },
        { status: 400 }
      );
    }

    // TC No kontrolü
    const existing = await prisma.student.findUnique({
      where: { tcNo: tcNo.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Bu T.C. Kimlik Numarası (${tcNo}) ile bir öğrenci zaten kayıtlıdır.` },
        { status: 400 }
      );
    }

    // Otomatik Öğrenci No oluştur
    let finalStudentNo = studentNo?.trim();
    if (!finalStudentNo) {
      const yearPrefix = new Date().getFullYear().toString();
      const count = await prisma.student.count();
      finalStudentNo = `${yearPrefix}${(count + 1).toString().padStart(4, "0")}`;
    }

    const totalContract = parseFloat(contractAmount || 0);
    const totalDiscount = parseFloat(discountAmount || 0);
    const finalNet = netAmount !== undefined ? parseFloat(netAmount) : Math.max(0, totalContract - totalDiscount);
    const instCount = Math.max(1, parseInt(installmentCount || 1));
    const singleAmount = Math.round((finalNet / instCount) * 100) / 100;

    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          studentNo: finalStudentNo,
          tcNo: tcNo.trim(),
          fullName: fullName.trim(),
          birthDate: birthDate ? new Date(birthDate) : null,
          gender: gender || "UNSPECIFIED",
          bloodGroup: bloodGroup || null,
          healthNotes: healthNotes || null,
          photoUrl: photoUrl || null,
          status: "ACTIVE",
          fatherName: fatherName?.trim() || null,
          fatherPhone: fatherPhone?.trim() || null,
          fatherJob: fatherJob?.trim() || null,
          motherName: motherName?.trim() || null,
          motherPhone: motherPhone?.trim() || null,
          motherJob: motherJob?.trim() || null,
          guardianRelation: guardianRelation || "FATHER",
          primaryPhone: primaryPhone.trim(),
          primaryEmail: primaryEmail?.trim() || null,
          homeAddress: homeAddress?.trim() || null,
          cityDistrict: cityDistrict?.trim() || null,
          classroomId: classroomId || null,
          academicYear: academicYear || "2025-2026",
          previousSchool: previousSchool?.trim() || null,
          contractAmount: totalContract,
          discountAmount: totalDiscount,
          netAmount: finalNet,
          installmentCount: instCount,
          tags: tags ? JSON.stringify(tags) : null,
          notes: notes?.trim() || null,
        },
      });

      // Taksitleri oluştur
      if (instCount > 0 && finalNet > 0) {
        const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();
        for (let i = 1; i <= instCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));

          await tx.studentPayment.create({
            data: {
              studentId: created.id,
              installmentNo: i,
              title: instCount === 1 ? "Peşin Kayıt Tutarı" : `${i}. Taksit`,
              dueDate: dueDate,
              amount: i === instCount ? Math.round((finalNet - (singleAmount * (instCount - 1))) * 100) / 100 : singleAmount,
              paidAmount: 0,
              isPaid: false,
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ogrenciler error:", error);
    return NextResponse.json(
      { error: "Öğrenci kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

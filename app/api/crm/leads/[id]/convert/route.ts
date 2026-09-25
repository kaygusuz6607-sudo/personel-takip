import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    const {
      tcNo,
      studentNo,
      fullName,
      birthDate,
      gender,
      bloodGroup,
      healthNotes,
      classroomId,
      academicYear,
      contractAmount,
      discountAmount,
      netAmount,
      installmentCount,
      firstInstallmentDate,
      tags,
      notes,
    } = body;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { registeredStudent: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Aday bulunamadı" }, { status: 404 });
    }

    if (lead.registeredStudent) {
      return NextResponse.json(
        { error: "Bu aday zaten bir öğrenci kaydına dönüştürülmüş." },
        { status: 400 }
      );
    }

    if (!tcNo?.trim() || !fullName?.trim()) {
      return NextResponse.json(
        { error: "Öğrenci TC Kimlik No ve Adı Soyadı zorunludur." },
        { status: 400 }
      );
    }

    // TC No benzersizlik kontrolü
    const existingStudent = await prisma.student.findUnique({
      where: { tcNo: tcNo.trim() },
    });
    if (existingStudent) {
      return NextResponse.json(
        { error: `Bu T.C. Kimlik Numarası (${tcNo}) ile kayıtlı başka bir öğrenci zaten var.` },
        { status: 400 }
      );
    }

    // Otomatik Öğrenci No oluştur (eğer verilmediyse)
    let finalStudentNo = studentNo?.trim();
    if (!finalStudentNo) {
      const yearPrefix = new Date().getFullYear().toString();
      const count = await prisma.student.count();
      finalStudentNo = `${yearPrefix}${(count + 1).toString().padStart(4, "0")}`;
    }

    const totalNet = netAmount !== undefined ? parseFloat(netAmount) : (parseFloat(contractAmount || 0) - parseFloat(discountAmount || 0));
    const instCount = Math.max(1, parseInt(installmentCount || 1));
    const singleInstAmount = Math.round((totalNet / instCount) * 100) / 100;

    // Transaction ile Student, Payment ve Lead güncellemesi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Öğrenci oluştur
      const student = await tx.student.create({
        data: {
          leadId: lead.id,
          studentNo: finalStudentNo,
          tcNo: tcNo.trim(),
          fullName: fullName.trim(),
          birthDate: birthDate ? new Date(birthDate) : lead.birthDate,
          gender: gender || lead.gender || "UNSPECIFIED",
          bloodGroup: bloodGroup || null,
          healthNotes: healthNotes || null,
          status: "ACTIVE",
          fatherName: lead.parentRelation === "FATHER" ? lead.parentName : null,
          fatherPhone: lead.parentRelation === "FATHER" ? lead.parentPhone : null,
          fatherJob: lead.parentRelation === "FATHER" ? lead.parentJob : null,
          motherName: lead.parentRelation === "MOTHER" ? lead.parentName : null,
          motherPhone: lead.parentRelation === "MOTHER" ? lead.parentPhone : null,
          motherJob: lead.parentRelation === "MOTHER" ? lead.parentJob : null,
          guardianRelation: lead.parentRelation,
          primaryPhone: lead.parentPhone,
          primaryEmail: lead.parentEmail || null,
          homeAddress: lead.address || null,
          cityDistrict: lead.cityDistrict || null,
          classroomId: classroomId || null,
          academicYear: academicYear || "2025-2026",
          previousSchool: lead.currentSchool || null,
          contractAmount: parseFloat(contractAmount || 0),
          discountAmount: parseFloat(discountAmount || 0),
          netAmount: totalNet,
          installmentCount: instCount,
          tags: tags ? JSON.stringify(tags) : null,
          notes: notes?.trim() || lead.notes || null,
        },
      });

      // 2. Taksit planını otomatik oluştur
      if (instCount > 0 && totalNet > 0) {
        const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();
        for (let i = 1; i <= instCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));

          await tx.studentPayment.create({
            data: {
              studentId: student.id,
              installmentNo: i,
              title: instCount === 1 ? "Peşin Kayıt Bedeli" : `${i}. Taksit`,
              dueDate: dueDate,
              amount: i === instCount ? Math.round((totalNet - (singleInstAmount * (instCount - 1))) * 100) / 100 : singleInstAmount,
              paidAmount: 0,
              isPaid: false,
            },
          });
        }
      }

      // 3. Adayın durumunu REGISTERED yap
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "REGISTERED",
        },
      });

      // 4. Dönüşüm görüşme kaydı ekle
      await tx.leadInteraction.create({
        data: {
          leadId: lead.id,
          staffId: lead.assignedStaffId || null,
          type: "MEETING",
          result: "POSITIVE",
          notes: `Aday başarıyla kesin kayda dönüştürüldü. Öğrenci No: ${finalStudentNo}, Sınıf: ${classroomId || "Atanmadı"}, Tutar: ${totalNet.toLocaleString("tr-TR")} ₺`,
        },
      });

      return student;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leads/[id]/convert error:", error);
    return NextResponse.json(
      { error: error?.message || "Kesin kayda dönüştürülürken hata oluştu." },
      { status: 500 }
    );
  }
}

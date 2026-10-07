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

    // Kayıt Silme İşlemi (DROPPED & Sınıftan Düşür & İade Oluştur)
    if (body.action === "DROP_STUDENT") {
      const {
        reason = "Kayıt Silindi",
        cancellationDate,
        hasRefund,
        refundAmount,
        refundStartDate,
        refundInstallments = 1,
        refundIban,
        refundNotes,
      } = body;

      const student = await prisma.student.findUnique({
        where: { id },
        include: { classroom: true },
      });
      if (!student) {
        return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
      }

      let refundRecordId: string | null = null;
      const cDate = cancellationDate ? new Date(cancellationDate) : new Date();
      const sDate = refundStartDate ? new Date(refundStartDate) : new Date();

      // Para iadesi yapılacaksa StudentRefund oluştur ve okul giderlerine senkronize et
      if (hasRefund && Number(refundAmount) > 0) {
        const totAmt = Number(refundAmount);
        const instCount = Math.max(1, parseInt(String(refundInstallments), 10) || 1);

        const refund = await prisma.studentRefund.create({
          data: {
            studentName: student.fullName,
            parentName: student.fatherName || student.motherName || "Veli",
            phone: student.primaryPhone,
            iban: refundIban ? refundIban.trim() : null,
            reason: reason || "Kayıt Silme İadesi",
            cancellationDate: cDate,
            startDate: sDate,
            totalAmount: totAmt,
            installmentCount: instCount,
            notes: refundNotes ? refundNotes.trim() : `Öğrenci Kayıt Silme İadesi (${student.fullName} - Ref: ${student.id})`,
            status: "ACTIVE",
          },
        });
        refundRecordId = refund.id;

        // Taksitleri oluştur
        const basePerInst = Number((totAmt / instCount).toFixed(2));
        let currentRemainder = totAmt;
        const sYear = sDate.getFullYear();
        const sMonth = sDate.getMonth() + 1;
        const targetDay = sDate.getDate();

        const TR_MONTHS = [
          "",
          "Ocak",
          "Şubat",
          "Mart",
          "Nisan",
          "Mayıs",
          "Haziran",
          "Temmuz",
          "Ağustos",
          "Eylül",
          "Ekim",
          "Kasım",
          "Aralık",
        ];

        for (let i = 0; i < instCount; i++) {
          const isLast = i === instCount - 1;
          const instAmt = isLast ? Number(currentRemainder.toFixed(2)) : basePerInst;
          currentRemainder -= instAmt;

          const targetMonthOffset = sMonth - 1 + i;
          const rYear = sYear + Math.floor(targetMonthOffset / 12);
          const rMonth = (targetMonthOffset % 12) + 1;
          const lastDayOfMonth = new Date(rYear, rMonth, 0).getDate();
          const safeDay = Math.min(targetDay, lastDayOfMonth);
          const instDueDate = new Date(rYear, rMonth - 1, safeDay, 12, 0, 0);
          const dStr = `${safeDay} ${TR_MONTHS[rMonth] || rMonth} ${rYear}`;

          await prisma.refundInstallment.create({
            data: {
              refundId: refund.id,
              installmentNo: i + 1,
              dueDate: instDueDate,
              dueDateStr: dStr,
              amount: instAmt,
              paidAmount: 0,
              remainingAmount: instAmt,
              status: "PENDING",
              paymentMethod: "BANK_TRANSFER",
            },
          });
        }

        // Okul giderlerine ve kasa planına senkronize et
        try {
          const { syncRefundToSchoolExpenses } = await import("@/lib/student-refund-sync");
          await syncRefundToSchoolExpenses(refund.id);
        } catch (syncErr) {
          console.error("Gider senkronizasyonu hatası:", syncErr);
        }
      }

      // Bilgileri asla kaybetme: iptal detayını ve eski sınıfı JSON formatında notes içine kaydet
      let currentNotes = student.notes || "";
      const cancelInfo = {
        droppedAt: cDate.toISOString().split("T")[0],
        reason: reason || "Kayıt Silindi",
        hasRefund: Boolean(hasRefund),
        refundAmount: Number(refundAmount) || 0,
        refundId: refundRecordId,
        previousClassroomId: student.classroomId,
        previousClassroomName: student.classroom?.name || null,
      };

      let finalNotes = currentNotes;
      try {
        if (currentNotes.startsWith("{")) {
          const parsed = JSON.parse(currentNotes);
          parsed.cancellationInfo = cancelInfo;
          finalNotes = JSON.stringify(parsed);
        } else {
          finalNotes = JSON.stringify({
            userNote: currentNotes,
            cancellationInfo: cancelInfo,
          });
        }
      } catch {
        finalNotes = `${currentNotes}\n[KAYIT_SILINDI: ${JSON.stringify(cancelInfo)}]`;
      }

      // Öğrenciyi DROPPED yap ve sınıftan düşür (classroomId: null)
      const updated = await prisma.student.update({
        where: { id },
        data: {
          status: "DROPPED",
          classroomId: null,
          notes: finalNotes,
        },
        include: {
          classroom: true,
          payments: true,
        },
      });

      return NextResponse.json({
        success: true,
        student: updated,
        refundId: refundRecordId,
      });
    }

    // Kaydı Yeniden Aktif Etme İşlemi (Geri Al)
    if (body.action === "REINSTATE_STUDENT") {
      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) {
        return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
      }

      let restoredClassroomId: string | null = body.classroomId || null;
      if (!restoredClassroomId && student.notes) {
        try {
          if (student.notes.startsWith("{")) {
            const parsed = JSON.parse(student.notes);
            if (parsed.cancellationInfo?.previousClassroomId) {
              restoredClassroomId = parsed.cancellationInfo.previousClassroomId;
            }
          }
        } catch {}
      }

      const updated = await prisma.student.update({
        where: { id },
        data: {
          status: "ACTIVE",
          classroomId: restoredClassroomId,
        },
        include: {
          classroom: true,
          payments: true,
        },
      });

      return NextResponse.json({ success: true, student: updated });
    }

    const {
      studentNo,
      tcNo,
      fullName,
      birthDate,
      gender,
      bloodGroup,
      healthNotes,
      dietNotes,
      toiletTrained,
      napTime,
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
      authorizedPickups,
      emergencyContact,
      section,
      educationType,
      classroomId,
      academicYear,
      previousSchool,
      graduationDate,
      serviceUsed,
      mealUsed,
      contractAmount,
      discountAmount,
      contractDiscountType,
      netAmount,
      installmentCount,
      contractItems,
      portalUsername,
      portalPassword,
      kvkkConsent,
      photoConsent,
      tags,
      notes,
    } = body;

    let finalNotes = notes !== undefined ? notes : undefined;
    if (contractItems !== undefined) {
      finalNotes = JSON.stringify({
        contractItems: Array.isArray(contractItems) ? contractItems : [],
        userNote: typeof notes === "string" ? notes : "",
      });
    }

    let calculatedContractAmount = contractAmount !== undefined ? parseFloat(contractAmount) : undefined;
    if (Array.isArray(contractItems) && contractItems.length > 0) {
      calculatedContractAmount = contractItems.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    }

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
        dietNotes: dietNotes !== undefined ? dietNotes : undefined,
        toiletTrained: toiletTrained !== undefined ? Boolean(toiletTrained) : undefined,
        napTime: napTime !== undefined ? Boolean(napTime) : undefined,
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
        authorizedPickups: authorizedPickups !== undefined ? (typeof authorizedPickups === "string" ? authorizedPickups : JSON.stringify(authorizedPickups)) : undefined,
        emergencyContact: emergencyContact !== undefined ? (typeof emergencyContact === "string" ? emergencyContact : JSON.stringify(emergencyContact)) : undefined,
        section: section !== undefined ? section : undefined,
        educationType: educationType !== undefined ? educationType : undefined,
        classroomId: classroomId !== undefined ? (classroomId || null) : undefined,
        academicYear: academicYear !== undefined ? academicYear : undefined,
        previousSchool: previousSchool !== undefined ? previousSchool : undefined,
        graduationDate: graduationDate !== undefined ? (graduationDate ? new Date(graduationDate) : null) : undefined,
        serviceUsed: serviceUsed !== undefined ? Boolean(serviceUsed) : (Array.isArray(contractItems) ? contractItems.some((i: any) => i.type === "SERVICE") : undefined),
        mealUsed: mealUsed !== undefined ? Boolean(mealUsed) : (Array.isArray(contractItems) ? contractItems.some((i: any) => i.type === "MEAL") : undefined),
        contractAmount: calculatedContractAmount,
        discountAmount: discountAmount !== undefined ? parseFloat(discountAmount) : undefined,
        contractDiscountType: contractDiscountType !== undefined ? contractDiscountType : undefined,
        netAmount: netAmount !== undefined ? parseFloat(netAmount) : undefined,
        installmentCount: installmentCount !== undefined ? parseInt(installmentCount) : undefined,
        portalUsername: portalUsername !== undefined ? portalUsername : undefined,
        portalPassword: portalPassword !== undefined ? portalPassword : undefined,
        kvkkConsent: kvkkConsent !== undefined ? Boolean(kvkkConsent) : undefined,
        photoConsent: photoConsent !== undefined ? Boolean(photoConsent) : undefined,
        tags: tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : undefined,
        notes: finalNotes,
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

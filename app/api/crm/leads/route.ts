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
    const priority = searchParams.get("priority") || "ALL";
    const source = searchParams.get("source") || "ALL";
    const staffId = searchParams.get("staffId") || "ALL";
    const targetGrade = searchParams.get("targetGrade") || "ALL";

    // Where condition
    const where: any = {};

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { parentPhone: { contains: search } },
        { currentSchool: { contains: search, mode: "insensitive" } },
        { cityDistrict: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "ALL") {
      where.status = status;
    }

    if (priority !== "ALL") {
      where.priority = priority;
    }

    if (source !== "ALL") {
      where.source = source;
    }

    if (staffId !== "ALL") {
      where.assignedStaffId = staffId === "UNASSIGNED" ? null : staffId;
    }

    if (targetGrade !== "ALL") {
      where.targetGrade = targetGrade;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedStaff: {
          select: {
            id: true,
            fullName: true,
            title: true,
            phone: true,
          },
        },
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        registeredStudent: {
          select: {
            id: true,
            studentNo: true,
            fullName: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    // İstatistikler
    const allLeads = await prisma.lead.findMany({
      select: {
        id: true,
        status: true,
        source: true,
        offeredPrice: true,
        assignedStaffId: true,
      },
    });

    const stats = {
      total: allLeads.length,
      new: allLeads.filter((l) => l.status === "NEW").length,
      contacted: allLeads.filter((l) => l.status === "CONTACTED").length,
      appointment: allLeads.filter((l) => l.status === "APPOINTMENT").length,
      offerSent: allLeads.filter((l) => l.status === "OFFER_SENT").length,
      registered: allLeads.filter((l) => l.status === "REGISTERED").length,
      lost: allLeads.filter((l) => l.status === "LOST").length,
      conversionRate:
        allLeads.length > 0
          ? Math.round(
              (allLeads.filter((l) => l.status === "REGISTERED").length /
                allLeads.length) *
                100
            )
          : 0,
    };

    return NextResponse.json({ leads, stats });
  } catch (error: any) {
    console.error("GET /api/crm/leads error:", error);
    return NextResponse.json(
      { error: "Adaylar yüklenirken bir hata oluştu." },
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
      studentName,
      birthDate,
      gender,
      currentSchool,
      section,
      targetGrade,
      educationType,
      programInterest,
      source,
      sourceDetail,
      campaignType,
      priority,
      parentName,
      parentRelation,
      parentPhone,
      parentPhone2,
      parentEmail,
      parentJob,
      cityDistrict,
      address,
      assignedStaffId,
      offeredPrice,
      discountNote,
      notes,
      initialInteractionNote,
    } = body;

    if (!studentName?.trim() || !parentName?.trim() || !parentPhone?.trim()) {
      return NextResponse.json(
        { error: "Öğrenci Adı, Veli Adı ve Veli Telefonu zorunludur." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        studentName: studentName.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        currentSchool: currentSchool?.trim() || null,
        section: section || "ANAOKULU",
        targetGrade: targetGrade?.trim() || null,
        educationType: educationType || "TAM_GUN",
        programInterest: programInterest?.trim() || null,
        source: source || "OTHER",
        sourceDetail: sourceDetail?.trim() || null,
        campaignType: campaignType || null,
        status: "NEW",
        priority: priority || "MEDIUM",
        parentName: parentName.trim(),
        parentRelation: parentRelation || "MOTHER",
        parentPhone: parentPhone.trim(),
        parentPhone2: parentPhone2?.trim() || null,
        parentEmail: parentEmail?.trim() || null,
        parentJob: parentJob?.trim() || null,
        cityDistrict: cityDistrict?.trim() || null,
        address: address?.trim() || null,
        assignedStaffId: assignedStaffId || null,
        offeredPrice: offeredPrice ? parseFloat(offeredPrice) : 0,
        discountNote: discountNote?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        assignedStaff: true,
      },
    });

    // İlk görüşme notu varsa ekle
    if (initialInteractionNote?.trim()) {
      await prisma.leadInteraction.create({
        data: {
          leadId: lead.id,
          staffId: assignedStaffId || null,
          type: "PHONE_CALL",
          result: "NO_ANSWER",
          notes: initialInteractionNote.trim(),
        },
      });
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leads error:", error);
    return NextResponse.json(
      { error: "Aday kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}

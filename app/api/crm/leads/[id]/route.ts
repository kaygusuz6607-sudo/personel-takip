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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedStaff: {
          select: {
            id: true,
            fullName: true,
            title: true,
            phone: true,
            email: true,
          },
        },
        interactions: {
          include: {
            staff: {
              select: {
                id: true,
                fullName: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        registeredStudent: {
          select: {
            id: true,
            studentNo: true,
            fullName: true,
            status: true,
            classroomId: true,
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Aday bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("GET /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Aday bilgisi alınamadı." },
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
      status,
      lostReason,
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
    } = body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        studentName: studentName !== undefined ? studentName.trim() : undefined,
        birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
        gender: gender !== undefined ? gender : undefined,
        currentSchool: currentSchool !== undefined ? currentSchool : undefined,
        section: section !== undefined ? section : undefined,
        targetGrade: targetGrade !== undefined ? targetGrade : undefined,
        educationType: educationType !== undefined ? educationType : undefined,
        programInterest: programInterest !== undefined ? programInterest : undefined,
        source: source !== undefined ? source : undefined,
        sourceDetail: sourceDetail !== undefined ? sourceDetail : undefined,
        campaignType: campaignType !== undefined ? campaignType : undefined,
        status: status !== undefined ? status : undefined,
        lostReason: status === "LOST" ? lostReason || null : null,
        priority: priority !== undefined ? priority : undefined,
        parentName: parentName !== undefined ? parentName.trim() : undefined,
        parentRelation: parentRelation !== undefined ? parentRelation : undefined,
        parentPhone: parentPhone !== undefined ? parentPhone.trim() : undefined,
        parentPhone2: parentPhone2 !== undefined ? parentPhone2 : undefined,
        parentEmail: parentEmail !== undefined ? parentEmail : undefined,
        parentJob: parentJob !== undefined ? parentJob : undefined,
        cityDistrict: cityDistrict !== undefined ? cityDistrict : undefined,
        address: address !== undefined ? address : undefined,
        assignedStaffId: assignedStaffId !== undefined ? (assignedStaffId || null) : undefined,
        offeredPrice: offeredPrice !== undefined ? (offeredPrice ? parseFloat(offeredPrice) : 0) : undefined,
        discountNote: discountNote !== undefined ? discountNote : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        assignedStaff: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Aday güncellenirken hata oluştu." },
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
    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Aday silinirken hata oluştu." },
      { status: 500 }
    );
  }
}

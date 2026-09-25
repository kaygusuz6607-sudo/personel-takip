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
    const { type, result, notes, followUpDate, followUpTime, staffId, newLeadStatus } = body;

    if (!notes?.trim()) {
      return NextResponse.json(
        { error: "Görüşme notu girilmesi zorunludur." },
        { status: 400 }
      );
    }

    // 1. Görüşme kaydı oluştur
    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId: id,
        staffId: staffId || null,
        type: type || "PHONE_CALL",
        result: result || "NO_ANSWER",
        notes: notes.trim(),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpTime: followUpTime || null,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            title: true,
          },
        },
      },
    });

    // 2. Adayın durumunu güncelle (eğer belirtildiyse)
    if (newLeadStatus) {
      await prisma.lead.update({
        where: { id },
        data: {
          status: newLeadStatus,
        },
      });
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leads/[id]/interactions error:", error);
    return NextResponse.json(
      { error: "Görüşme kaydı oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}

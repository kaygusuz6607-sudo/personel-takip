import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkMebSgkNotification } from "@/lib/date-utils";

export async function GET() {
  try {
    const staffs = await prisma.staff.findMany({
      where: {
        mebAssignmentDate: { not: null },
        status: { in: ["ACTIVE", "ON_LEAVE"] },
      },
      include: {
        departments: { include: { department: true } },
      },
    });

    const notifications = [];

    for (const s of staffs) {
      const check = checkMebSgkNotification(s.mebAssignmentDate, s.isSgkNotified);
      if (check.needsNotification) {
        notifications.push({
          staffId: s.id,
          fullName: s.fullName,
          tcNo: s.tcNo,
          title: s.title,
          department: s.departments[0]?.department?.name || "—",
          mebAssignmentDate: s.mebAssignmentDate,
          isMonday: check.isMonday,
          urgency: check.urgency,
          message: check.message,
        });
      }
    }

    return NextResponse.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error("Bildirim hatası:", error);
    return NextResponse.json({ error: "Bildirimler alınamadı" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { staffId, isSgkNotified = true } = await request.json();
    if (!staffId) return NextResponse.json({ error: "staffId gerekli" }, { status: 400 });

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { isSgkNotified },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error("Bildirim güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}

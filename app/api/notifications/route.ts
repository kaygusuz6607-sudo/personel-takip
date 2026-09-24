import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkMebSgkNotification, checkMebEndNotification } from "@/lib/date-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const staffs = await prisma.staff.findMany({
      where: {
        status: { in: ["ACTIVE", "ON_LEAVE"] },
        OR: [
          { mebAssignmentDate: { not: null } },
          { mebAssignmentEndDate: { not: null } },
        ],
      },
      include: {
        departments: { include: { department: true } },
      },
    });

    const notifications = [];

    for (const s of staffs) {
      // 1. MEB Atama Başlangıç / SGK İşe Giriş Bildirimi
      if (s.mebAssignmentDate && !s.isSgkNotified) {
        const checkSgk = checkMebSgkNotification(s.mebAssignmentDate, s.isSgkNotified);
        if (checkSgk.needsNotification) {
          notifications.push({
            id: `sgk_${s.id}`,
            staffId: s.id,
            type: "SGK_START",
            fullName: s.fullName,
            tcNo: s.tcNo,
            title: s.title,
            department: s.departments[0]?.department?.name || "—",
            date: s.mebAssignmentDate,
            isMonday: checkSgk.isMonday,
            urgency: checkSgk.urgency,
            message: checkSgk.message,
          });
        }
      }

      // 2. MEB Atama Bitiş Bildirimi (1 Hafta kala veya bitmişse)
      if (!s.isMebPermanent && s.mebAssignmentEndDate && !s.isMebEndNotified) {
        const checkEnd = checkMebEndNotification(
          s.mebAssignmentEndDate,
          s.isMebPermanent,
          s.isMebEndNotified
        );
        if (checkEnd.needsNotification) {
          notifications.push({
            id: `meb_end_${s.id}`,
            staffId: s.id,
            type: "MEB_END",
            fullName: s.fullName,
            tcNo: s.tcNo,
            title: s.title,
            department: s.departments[0]?.department?.name || "—",
            date: s.mebAssignmentEndDate,
            isExpired: checkEnd.isExpired,
            daysRemaining: checkEnd.daysRemaining,
            urgency: checkEnd.urgency,
            message: checkEnd.message,
          });
        }
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
    const body = await request.json();
    const { staffId, type, isSgkNotified, isMebEndNotified } = body;

    if (!staffId) {
      return NextResponse.json({ error: "staffId gerekli" }, { status: 400 });
    }

    const dataToUpdate: any = {};

    if (type === "MEB_END" || isMebEndNotified !== undefined) {
      dataToUpdate.isMebEndNotified = isMebEndNotified !== undefined ? isMebEndNotified : true;
    }

    if (type === "SGK_START" || isSgkNotified !== undefined) {
      dataToUpdate.isSgkNotified = isSgkNotified !== undefined ? isSgkNotified : true;
    }

    // Eğer tip belirtilmemiş ve doğrudan parametre verilmemişse varsayılan olarak ikisini de kapatabilir
    if (Object.keys(dataToUpdate).length === 0) {
      dataToUpdate.isSgkNotified = true;
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error("Bildirim güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}


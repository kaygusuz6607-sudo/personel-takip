import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const [departments, staff, salaryConfigs, payrolls, leaves, users] = await Promise.all([
      prisma.department.findMany(),
      prisma.staff.findMany({
        include: {
          departments: true,
          salaryConfig: true,
        },
      }),
      prisma.salaryConfig.findMany(),
      prisma.payroll.findMany(),
      prisma.leaveRecord.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const backupData = {
      system: "COSMOS | Personel Takip",
      version: "2.0-HYBRID",
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
      },
      counts: {
        departments: departments.length,
        staff: staff.length,
        salaryConfigs: salaryConfigs.length,
        payrolls: payrolls.length,
        leaves: leaves.length,
        users: users.length,
      },
      data: {
        departments,
        staff,
        salaryConfigs,
        payrolls,
        leaves,
        users,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cosmos_tam_yedek_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Yedek dışa aktarma hatası:", error);
    return NextResponse.json(
      { error: "Yedek oluşturulurken sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}

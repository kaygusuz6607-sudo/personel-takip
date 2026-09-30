import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const staffCount = await prisma.staff.count();
    const sampleUser = await prisma.user.findFirst({
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({
      status: "ok",
      userCount,
      staffCount,
      sampleUser,
      dbUrlPresent: !!process.env.DATABASE_URL,
      sessionSecretPresent: !!process.env.SESSION_SECRET,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error?.message,
        code: error?.code,
        dbUrlPresent: !!process.env.DATABASE_URL,
        sessionSecretPresent: !!process.env.SESSION_SECRET,
      },
      { status: 500 }
    );
  }
}

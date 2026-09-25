import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const depts = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            staffs: {
              where: {
                staff: {
                  status: "ACTIVE",
                  terminationDate: null,
                },
              },
            },
          },
        },
        staffs: {
          where: {
            staff: {
              status: "ACTIVE",
              terminationDate: null,
            },
          },
          include: {
            staff: {
              select: {
                id: true,
                fullName: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(depts);
  } catch (error) {
    return NextResponse.json({ error: "Departmanlar alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, category } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 });
    }

    const created = await prisma.department.create({
      data: {
        name,
        description,
        category: category || "TEACHER",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Hata oluştu" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Departman Güncelleme (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Departman adı zorunludur." }, { status: 400 });
    }

    const cleanName = name.trim();

    // İsim çakışması kontrolü
    const existing = await prisma.department.findFirst({
      where: {
        name: cleanName,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu isimde bir departman zaten mevcut." },
        { status: 400 }
      );
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: cleanName,
        description: description ? description.trim() : null,
      },
      include: {
        _count: {
          select: { staffs: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Departman güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Departman güncellenirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

// Departman Silme (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staffs: true },
        },
      },
    });

    if (!dept) {
      return NextResponse.json({ error: "Departman bulunamadı." }, { status: 404 });
    }

    // İlişkili kayıtları temizle ve departmanı sil
    await prisma.staffDepartment.deleteMany({
      where: { departmentId: id },
    });

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `"${dept.name}" departmanı başarıyla silindi.`,
      staffCount: dept._count.staffs,
    });
  } catch (error: any) {
    console.error("Departman silme hatası:", error);
    return NextResponse.json(
      { error: "Departman silinirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

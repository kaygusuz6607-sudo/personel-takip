import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fotoğraf durumunu sorgula (Mobil sayfa ve masaüstü QR kontrolü için)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        title: true,
        photoUrl: true,
        updatedAt: true,
        departments: {
          include: { department: true },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Personel bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({
      id: staff.id,
      fullName: staff.fullName,
      title: staff.title || staff.departments[0]?.department.name || "Personel",
      photoUrl: staff.photoUrl,
      updatedAt: staff.updatedAt,
    });
  } catch (error) {
    console.error("Fotoğraf sorgulama hatası:", error);
    return NextResponse.json({ error: "Fotoğraf bilgisi alınamadı." }, { status: 500 });
  }
}

// Fotoğrafı güncelle / yükle (Telefondan veya bilgisayardan)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photoUrl } = body;

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        photoUrl: photoUrl || null,
      },
      select: {
        id: true,
        fullName: true,
        photoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fotoğraf başarıyla kaydedildi.",
      staff: updated,
    });
  } catch (error) {
    console.error("Fotoğraf kaydetme hatası:", error);
    return NextResponse.json({ error: "Fotoğraf kaydedilemedi." }, { status: 500 });
  }
}

// Fotoğrafı sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.staff.update({
      where: { id },
      data: {
        photoUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fotoğraf kaldırıldı.",
    });
  } catch (error) {
    console.error("Fotoğraf silme hatası:", error);
    return NextResponse.json({ error: "Fotoğraf silinemedi." }, { status: 500 });
  }
}

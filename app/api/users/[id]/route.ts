import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

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
    const { username, password, name, role, email } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const updateData: {
      username?: string;
      name?: string;
      role?: string;
      email?: string | null;
      password?: string;
    } = {};

    if (username) updateData.username = String(username).trim();
    if (name) updateData.name = String(name).trim();
    if (role) updateData.role = role;
    if (email !== undefined) updateData.email = email ? String(email).trim() : null;

    if (password && String(password).trim().length > 0) {
      updateData.password = await hashPassword(String(password));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı güncellenirken hata oluştu." },
      { status: 500 }
    );
  }
}

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

    // Kendini silmeyi engelle
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "Kendi aktif oturumunuzu silemezsiniz." },
        { status: 400 }
      );
    }

    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return NextResponse.json(
        { error: "Sistemde en az bir yönetici kalmalıdır." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Kullanıcı başarıyla silindi." });
  } catch (error) {
    console.error("Kullanıcı silme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı silinirken hata oluştu." },
      { status: 500 }
    );
  }
}

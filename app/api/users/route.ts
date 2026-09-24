import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, password, name, role = "ADMIN", email } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Kullanıcı adı, şifre ve ad soyad alanları zorunludur." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Çakışma kontrolü
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          ...(email ? [{ email: String(email).trim() }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı veya e-posta adresi zaten kullanımda." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: String(name).trim(),
        role: role || "ADMIN",
        email: email ? String(email).trim() : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Kullanıcı oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

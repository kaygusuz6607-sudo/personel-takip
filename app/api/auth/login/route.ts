import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gereklidir." },
        { status: 400 }
      );
    }

    const cleanInput = String(username).trim();

    // Kullanıcı adı veya e-posta ile ara
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanInput },
          { email: cleanInput },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Girdiğiniz kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Girdiğiniz kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    // Session token oluştur
    const token = await createSessionToken({
      id: user.id,
      username: user.username || cleanInput,
      name: user.name,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });

    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

    // 7 günlük güvenli HTTP-Only çerez ata
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 gün
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login hatası:", error);
    return NextResponse.json(
      { error: "Giriş işlemi sırasında sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

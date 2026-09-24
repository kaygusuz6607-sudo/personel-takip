import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik dosyaları, Next.js iç rotalarını ve varlıkları muaf tut
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.includes(".") // .css, .js, .png, vb.
  ) {
    return NextResponse.next();
  }

  // Giriş ve kimlik doğrulama API rotalarını muaf tut
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout"
  ) {
    return NextResponse.next();
  }

  // Çerezi kontrol et
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = token ? await verifySessionToken(token) : null;

  // Eğer kullanıcı giriş sayfasındaysa
  if (pathname === "/login") {
    // Zaten oturum açmışsa ana sayfaya yönlendir
    if (sessionUser) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Diğer tüm rotalar için: Oturum geçerli değilse
  if (!sessionUser) {
    // API çağrısı ise JSON 401 döndür
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      );
    }
    // Normal sayfa ise /login sayfasına yönlendir
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Yetkilendirilmiş istek
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

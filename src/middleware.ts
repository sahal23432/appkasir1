import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Redirect root ke halaman kasir jika sudah login
    if (pathname === "/" && token) {
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/kasir", req.url));
    }

    // Kasir tidak boleh akses halaman admin & supervisor
    if (token?.role === "kasir" && (pathname.startsWith("/admin") || pathname.startsWith("/supervisor"))) {
      return NextResponse.redirect(new URL("/kasir", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Hanya izinkan akses jika ada token (sudah login)
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Halaman login dan API auth selalu boleh diakses
        if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
          return true;
        }
        // API RFID boleh diakses tanpa token (dari ESP32)
        if (pathname.startsWith("/api/rfid")) {
          return true;
        }
        // Semua halaman lain butuh token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Jalankan middleware pada semua path KECUALI:
     * - _next/static (file statis)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

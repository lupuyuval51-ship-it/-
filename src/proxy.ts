import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/config/limits";

/**
 * First line of defence for signed-in screens: no session cookie → straight to the sign-in page, so protected pages
 * never even render for anonymous visitors. This only checks that a cookie EXISTS (the proxy cannot reach the
 * database); every page and API route still verifies the session server-side, and a stale cookie is bounced there.
 */
const PROTECTED = ["/dashboard", "/create", "/games", "/account", "/generate", "/play", "/billing"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/games/:path*", "/account/:path*", "/generate/:path*", "/play/:path*", "/billing/:path*"],
};

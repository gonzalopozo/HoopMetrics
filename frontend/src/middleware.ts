import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/_next/", "/favicon.ico"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const token = req.cookies.get("token")?.value;
    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Opcional: verificar rol desde JWT
    if (pathname.startsWith("/admin")) {
        try {
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
            if (payload.role !== "admin") {
                // Redirect non-admin users to a more friendly page
                const url = req.nextUrl.clone();
                url.pathname = "/"; // or a specific "access denied" page
                return NextResponse.redirect(url);
            }
        } catch {
            // Token parsing failed - redirect to signup
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };

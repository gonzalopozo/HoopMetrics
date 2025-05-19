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
                return new NextResponse("Forbidden", { status: 403 });
            }
        } catch {
            return new NextResponse("Invalid token", { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = { matcher: ["/protected/:path*"] };

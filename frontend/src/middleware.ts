import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/_next/", "/favicon.ico"];
const PROTECTED_PATHS = ["/admin", "/profile", "/favorites"]; // Rutas que SÍ requieren login

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const token = req.cookies.get("token")?.value;
    
    // Solo redirigir a login si no hay token Y es una ruta protegida
    if (!token && PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname); // ✅ Añadir parámetro de redirección
        return NextResponse.redirect(url);
    }

    // Check admin routes (solo si hay token)
    if (pathname.startsWith("/admin") && token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
            if (payload.role !== "admin") {
                // Redirect non-admin users to home
                const url = req.nextUrl.clone();
                url.pathname = "/";
                return NextResponse.redirect(url);
            }
        } catch {
            // Token parsing failed - redirect to login
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = { 
    matcher: [
        "/admin/:path*",
        "/profile/:path*", // ✅ Añadir rutas protegidas específicas
        "/favorites/:path*",
        "/((?!_next/static|_next/image|favicon.ico|api/).*)"
    ] 
};

import Cookies from "js-cookie";

export async function post<T, B>(path: string, body: B): Promise<T> {
    const res = await fetch(`${process.env.API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || res.statusText);
    }
    return res.json();
}

export function saveToken(token: string) {
    Cookies.set("token", token, { expires: 1, secure: true, sameSite: "lax" });
}

export function getToken(): string | undefined {
    return Cookies.get("token");
}

export function removeToken() {
    Cookies.remove("token");
}

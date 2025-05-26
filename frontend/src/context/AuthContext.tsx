"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { TokenResponse, UserRole } from "@/types";
import { getToken, saveToken, removeToken, post } from "@/lib/api";
import useSWR from "swr";

interface AuthContextType {
    user?: { username: string; role: UserRole };
    login: (email: string, password: string) => Promise<void>;
    signup: (data: { username: string; email: string; password: string; role: UserRole }) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    // On mount, read token from cookie
    useEffect(() => {
        const t = getToken();
        if (t) setToken(t);
    }, []);

    // Decode payload from JWT (simple b64 decode)
    function parseToken(tok: string) {
        try {
            const payload = JSON.parse(atob(tok.split(".")[1]));
            return { username: payload.sub, role: payload.role as UserRole };
        } catch {
            return null;
        }
    }

    const { data: user } = useSWR(
        token ? ["user", token] : null,
        () => Promise.resolve(parseToken(token!)),
        { revalidateOnFocus: false }
    );

    async function login(email: string, password: string) {
        const res = await post<TokenResponse, { email: string; password: string }>("/auth/login", { email, password });
        saveToken(res.access_token);
        setToken(res.access_token);
    }

    async function signup(data: { username: string; email: string; password: string; role: UserRole }) {
        const res = await post<TokenResponse, typeof data>("/auth/signup", data);
        saveToken(res.access_token);
        setToken(res.access_token);
    }

    function logout() {
        removeToken();
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ user: user ?? undefined, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

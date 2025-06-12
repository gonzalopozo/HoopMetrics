export type UserRole = "free" | "premium" | "ultimate" | "admin"

export const roleColors = {
    free: {
        light: "#22c55e",    // Verde más oscuro para mejor contraste con texto negro
        dark: "#4ade80",     // Verde más claro para mejor contraste con texto blanco
    },
    premium: {
        light: "#3b82f6",    // Azul más oscuro para mejor contraste con texto negro
        dark: "#60a5fa",     // Azul más claro para mejor contraste con texto blanco
    },
    ultimate: {
        light: "#7c3aed",    // Púrpura más oscuro para mejor contraste con texto negro
        dark: "#a78bfa",     // Púrpura más claro para mejor contraste con texto blanco
    },
    admin: {
        light: "#dc2626",    // Rojo más oscuro para mejor contraste con texto negro
        dark: "#f87171",     // Rojo más claro para mejor contraste con texto blanco
    },
};

export function getRoleColor(role: UserRole, isDark: boolean): string {
    return roleColors[role][isDark ? "dark" : "light"]
}

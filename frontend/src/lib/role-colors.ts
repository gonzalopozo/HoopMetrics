export type UserRole = "free" | "premium" | "ultimate" | "admin"

export const roleColors = {
    free: {
        light: "#16a34a",    // Verde más oscuro para contraste con texto blanco
        dark: "#86efac",     // Verde más claro para contraste con texto negro
    },
    premium: {
        light: "#2563eb",    // Azul más oscuro para contraste con texto blanco
        dark: "#93c5fd",     // Azul más claro para contraste con texto negro
    },
    ultimate: {
        light: "#7c3aed",    // Púrpura más oscuro para contraste con texto blanco
        dark: "#c4b5fd",     // Púrpura más claro para contraste con texto negro
    },
    admin: {
        light: "#dc2626",    // Rojo más oscuro para contraste con texto blanco
        dark: "#fca5a5",     // Rojo más claro para contraste con texto negro
    },
};

export function getRoleColor(role: UserRole, isDark: boolean): string {
    return roleColors[role][isDark ? "dark" : "light"]
}

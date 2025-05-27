export type UserRole = "free" | "premium" | "ultimate" | "admin"

export const roleColors = {
    free: {
        light: "#32CD32",    // Lime Green
        dark: "#ADFF2F",     // Green Yellow
    },
    premium: {
        light: "#FFA500",    // Vibrant Orange
        dark: "#FFD700",     // Gold
    },
    ultimate: {
        light: "#8A2BE2",    // Blue Violet
        dark: "#DA70D6",     // Orchid
    },
    admin: {
        light: "#00CED1",    // Dark Turquoise
        dark: "#40E0D0",     // Turquoise
    },
};


export function getRoleColor(role: UserRole, isDark: boolean): string {
    return roleColors[role][isDark ? "dark" : "light"]
}

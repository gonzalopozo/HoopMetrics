export type UserRole = "free" | "premium" | "ultimate" | "admin"

export interface RoleColors {
    light: string
    dark: string
}

export const roleColors: Record<UserRole, RoleColors> = {
    free: {
        light: "#A8D5FF", // pale sky blue
        dark: "#FFB3B3", // soft coral pink
    },
    premium: {
        light: "#4DA6FF", // mid dodger blue
        dark: "#FF6666", // standard tomato red
    },
    ultimate: {
        light: "#005FCC", // deep royal blue
        dark: "#CC0000", // strong crimson red
    },
    admin: {
        light: "#002147", // navy/ink blue
        dark: "#800000", // dark maroon
    },
}

export function getRoleColor(role: UserRole, theme: "light" | "dark"): string {
    return roleColors[role][theme]
}

export function getRoleDisplayName(role: UserRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
}

"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { getRoleColor, type UserRole } from "@/lib/role-colors"
import { useEffect, useState } from "react"

interface UserAvatarProps {
    src?: string
    alt?: string
    fallback?: string
    role: UserRole
}

export function UserAvatar({ fallback = "U", role }: UserAvatarProps) {
    const { resolvedTheme } = useTheme() // <-- usa resolvedTheme
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
    }

    const isDark = resolvedTheme === "dark" // <-- usa resolvedTheme
    const borderColor = getRoleColor(role, isDark)

    return (
        <div className="relative">
            {/* Avatar with colored border - increased size */}
            <div className="h-10 w-10 rounded-full p-0.5" style={{ backgroundColor: borderColor }}>
                <Avatar className="h-full w-full">
                    {/* <AvatarImage src={src || "/placeholder.svg"} alt={alt} /> */}
                    <AvatarFallback className="text-sm font-medium">{fallback}</AvatarFallback>
                </Avatar>
            </div>

            {/* Role badge - made smaller */}
            <div
                className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 px-1 py-0 rounded text-[8px] font-bold text-white uppercase leading-tight"
                style={{ backgroundColor: borderColor }}
            >
                {role}
            </div>
        </div>
    )
}

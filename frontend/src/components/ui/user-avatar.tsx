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
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    }

    const isDark = theme === "dark"
    const borderColor = getRoleColor(role, isDark)

    return (
        <div className="relative">
            {/* Avatar with colored border */}
            <div className="h-8 w-8 rounded-full p-0.5" style={{ backgroundColor: borderColor }}>
                <Avatar className="h-full w-full">
                    {/* <AvatarImage src={src || "/placeholder.svg"} alt={alt} /> */}
                    <AvatarFallback className="text-xs font-medium">{fallback}</AvatarFallback>
                </Avatar>
            </div>

            {/* Role badge */}
            <div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-1 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                style={{ backgroundColor: borderColor }}
            >
                {role}
            </div>
        </div>
    )
}

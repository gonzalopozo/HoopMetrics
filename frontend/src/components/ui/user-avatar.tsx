"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { getRoleColor, getRoleDisplayName, type UserRole } from "@/lib/role-colors"
import { useEffect, useState } from "react"

interface UserAvatarProps {
    src?: string
    alt?: string
    fallback?: string
    role: UserRole
    size?: "sm" | "md" | "lg"
    showBadge?: boolean
}

export function UserAvatar({
    // src,
    // alt = "User",
    fallback = "U",
    role,
    size = "md",
    showBadge = true,
}: UserAvatarProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div
                className={`
        ${size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10"}
        rounded-full bg-muted animate-pulse
      `}
            />
        )
    }

    const currentTheme = theme === "dark" ? "dark" : "light"
    const roleColor = getRoleColor(role, currentTheme)
    const roleDisplayName = getRoleDisplayName(role)

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
    }

    const badgeSize = {
        sm: "text-[10px] px-1 py-0",
        md: "text-xs px-1.5 py-0.5",
        lg: "text-sm px-2 py-1",
    }

    return (
        <div className="relative">
            <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {/* Avatar with colored border */}
                <div
                    className={`
            ${sizeClasses[size]} 
            rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-background
            transition-all duration-300
          `}
                    style={{
                        boxShadow: `0 0 0 2px ${roleColor}20`, // subtle glow
                        // Set ring color using borderColor as a workaround
                        borderColor: roleColor,
                    }}
                >
                    <Avatar className={`${sizeClasses[size]} border-2 border-background`}>
                        {/* <AvatarImage src={src || "/placeholder.svg"} alt={alt} /> */}
                        <AvatarFallback
                            className="font-semibold"
                            style={{
                                backgroundColor: `${roleColor}15`,
                                color: roleColor,
                            }}
                        >
                            {fallback}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Role badge */}
                {showBadge && (
                    <motion.div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 25 }}
                    >
                        <Badge
                            variant="secondary"
                            className={`
                ${badgeSize[size]}
                font-bold uppercase tracking-wider
                border-2 border-background
                shadow-lg
                `}
                            style={{
                                backgroundColor: roleColor,
                                color: currentTheme === "dark" ? "#ffffff" : "#ffffff",
                                borderColor: "hsl(var(--background))",
                            }}
                        >
                            {roleDisplayName}
                        </Badge>
                    </motion.div>
                )}
            </motion.div>

            {/* Subtle pulse animation for premium+ users */}
            {(role === "premium" || role === "ultimate" || role === "admin") && (
                <motion.div
                    className={`
            absolute inset-0 ${sizeClasses[size]} 
            rounded-full opacity-30
            `}
                    style={{ backgroundColor: roleColor }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
            )}
        </div>
    )
}

"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { getRoleColor, type UserRole } from "@/lib/role-colors"
import { useEffect, useState } from "react"
import Image from "next/image"

interface UserAvatarProps {
    src?: string
    alt?: string
    fallback?: string
    role: UserRole
    profileImageUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function UserAvatar({ 
    fallback = "U", 
    role, 
    profileImageUrl, 
    src, 
    alt, 
    size = 'md',
    className 
}: UserAvatarProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        const sizeClasses = {
            sm: "h-8 w-8",
            md: "h-10 w-10", 
            lg: "h-12 w-12"
        }
        return <div className={`${sizeClasses[size]} rounded-full bg-muted animate-pulse ${className}`} />
    }

    const isDark = resolvedTheme === "dark"
    const borderColor = getRoleColor(role, isDark)
    
    // Determinar el color del texto según el modo (invertido)
    const textColor = isDark ? "text-black" : "text-white"

    // Use profile image URL if available, otherwise fallback to src
    const imageUrl = profileImageUrl || src

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
    }

    const badgeSizeClasses = {
        sm: "text-[6px] px-0.5",
        md: "text-[8px] px-1",
        lg: "text-[10px] px-1.5"
    }

    // ✅ Convertir tamaños a píxeles para Next.js Image
    const sizePixels = {
        sm: 32,
        md: 40,
        lg: 48
    }

    return (
        <div className={`relative ${className}`}>
            {/* Avatar with colored border */}
            <div className={`${sizeClasses[size]} rounded-full p-0.5`} style={{ backgroundColor: borderColor }}>
                <Avatar className="h-full w-full">
                    {imageUrl ? (
                        // ✅ Usar div con posición relativa para contener Next.js Image
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt={alt || "Profile picture"}
                                fill
                                className="object-cover"
                                quality={90}
                                sizes={`${sizePixels[size]}px`} // ✅ Tamaño específico para cada size
                                priority={false} // ✅ No priority para avatares pequeños
                            />
                        </div>
                    ) : (
                        // ✅ Fallback cuando no hay imagen
                        <AvatarFallback className="text-sm font-medium">{fallback}</AvatarFallback>
                    )}
                </Avatar>
            </div>

            {/* Role badge */}
            <div
                className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 ${badgeSizeClasses[size]} ${textColor} py-0 rounded font-bold uppercase leading-tight`}
                style={{ backgroundColor: borderColor }}
            >
                {role}
            </div>
        </div>
    )
}

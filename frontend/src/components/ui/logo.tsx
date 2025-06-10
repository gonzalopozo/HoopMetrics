"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Logo() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Return a placeholder during hydration
        return (
            <Link href="/" className="flex items-center">
                <div className="h-10 w-auto">
                    <div className="h-10 w-32 bg-accent animate-pulse rounded" />
                </div>
            </Link>
        )
    }

    const desktopLogo = resolvedTheme === 'dark' ? '/HoopMetrics_dark.png' : '/HoopMetrics_light.png'

    return (
        <Link href="/" className="flex items-center">
            {/* Desktop Logo */}
            <div className="hidden md:block h-10 w-auto">
                <Image
                    src={desktopLogo}
                    alt="HoopMetrics"
                    width={160}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                />
            </div>
            
            {/* Mobile Logo */}
            <div className="block md:hidden h-10 w-auto">
                <Image
                    src="/HoopMetrics_mobile.png"
                    alt="HoopMetrics"
                    width={40}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                />
            </div>
        </Link>
    )
}

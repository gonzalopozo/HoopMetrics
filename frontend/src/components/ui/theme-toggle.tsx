"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Evitar problemas de hidratación
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Sun className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Moon className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    const isLight = resolvedTheme === "light"
    const isDark = resolvedTheme === "dark"
    const isSystem = theme === "system"

    return (
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            {/* Light Theme Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("light")}
                className={cn(
                    "h-7 w-7 p-0 transition-all duration-200",
                    isLight && !isSystem 
                        ? "bg-background shadow-sm text-foreground" 
                        : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                )}
                title="Light theme"
            >
                <Sun className="h-3 w-3" />
            </Button>

            {/* Dark Theme Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn(
                    "h-7 w-7 p-0 transition-all duration-200",
                    isDark && !isSystem 
                        ? "bg-background shadow-sm text-foreground" 
                        : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                )}
                title="Dark theme"
            >
                <Moon className="h-3 w-3" />
            </Button>

            {/* System Theme Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("system")}
                className={cn(
                    "h-7 w-7 p-0 transition-all duration-200",
                    isSystem 
                        ? "bg-background shadow-sm text-foreground" 
                        : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                )}
                title="System theme"
            >
                <Monitor className="h-3 w-3" />
            </Button>
        </div>
    )
}
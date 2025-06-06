"use client"

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FavoriteStarProps {
    isFavorite: boolean
    onToggle: () => Promise<boolean>
    className?: string
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean // ✅ Nuevo prop para estado de carga
}

export function FavoriteStar({ isFavorite, onToggle, className, size = 'md', isLoading: externalLoading = false }: FavoriteStarProps) {
    const [isToggling, setIsToggling] = useState(false)

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isToggling || externalLoading) return

        setIsToggling(true)
        try {
            await onToggle()
        } finally {
            setIsToggling(false)
        }
    }

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    }

    const isLoading = isToggling || externalLoading

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
                "p-1 rounded-full transition-all duration-100 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm",
                isLoading && "opacity-75 cursor-not-allowed",
                className
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                className={cn(
                    sizeClasses[size],
                    "transition-all duration-150", // ✅ Aumentar a 150ms para que sea más visible
                    externalLoading 
                        ? "text-gray-400 animate-pulse"
                        : isFavorite 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-white hover:text-yellow-400",
                    isToggling && "scale-95"
                )}
            />
        </button>
    )
}
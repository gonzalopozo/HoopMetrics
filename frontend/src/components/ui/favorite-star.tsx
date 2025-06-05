"use client"

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FavoriteStarProps {
    isFavorite: boolean
    onToggle: () => Promise<boolean>
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function FavoriteStar({ isFavorite, onToggle, className, size = 'md' }: FavoriteStarProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isLoading) return

        setIsLoading(true)
        try {
            await onToggle()
        } finally {
            setIsLoading(false)
        }
    }

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
                "p-1 rounded-full transition-all duration-200 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm",
                isLoading && "opacity-50 cursor-not-allowed",
                className
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                className={cn(
                    sizeClasses[size],
                    "transition-all duration-200",
                    isFavorite 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-white hover:text-yellow-400",
                    isLoading && "animate-pulse"
                )}
            />
        </button>
    )
}
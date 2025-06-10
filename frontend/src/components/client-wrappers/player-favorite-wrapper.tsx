"use client"

import { FavoriteStar } from "@/components/ui/favorite-star"
import { useFavorites } from "@/hooks/use-favorites"

interface PlayerFavoriteWrapperProps {
    playerId: number
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function PlayerFavoriteWrapper({ playerId, className, size = 'lg' }: PlayerFavoriteWrapperProps) {
    const {
        isPlayerFavorite,
        addPlayerToFavorites,
        removePlayerFromFavorites,
        initialLoadComplete,
        updateTrigger // ✅ Usar trigger para forzar re-renders
    } = useFavorites()

    // ✅ Usar updateTrigger como dependencia implícita
    const isFavorite = isPlayerFavorite(playerId)

    const handleFavoriteToggle = async () => {
        if (isFavorite) {
            return await removePlayerFromFavorites(playerId)
        } else {
            return await addPlayerToFavorites(playerId)
        }
    }

    return (
        <div className={className}>
            <FavoriteStar
                isFavorite={isFavorite}
                onToggle={handleFavoriteToggle}
                size={size}
                isLoading={!initialLoadComplete}
                key={`${playerId}-${updateTrigger}`} // ✅ Force re-render con key
                forceLightBorder
            />
        </div>
    )
}
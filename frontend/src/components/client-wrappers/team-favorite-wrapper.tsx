"use client"

import { FavoriteStar } from "@/components/ui/favorite-star"
import { useFavorites } from "@/hooks/use-favorites"

interface TeamFavoriteWrapperProps {
    teamId: number
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function TeamFavoriteWrapper({ teamId, className, size = 'lg' }: TeamFavoriteWrapperProps) {
    const {
        isTeamFavorite,
        addTeamToFavorites,
        removeTeamFromFavorites
    } = useFavorites()

    const isFavorite = isTeamFavorite(teamId)

    const handleFavoriteToggle = async () => {
        if (isFavorite) {
            return await removeTeamFromFavorites(teamId)
        } else {
            return await addTeamToFavorites(teamId)
        }
    }

    return (
        <div className={className}>
            <FavoriteStar
                isFavorite={isFavorite}
                onToggle={handleFavoriteToggle}
                size={size}
            />
        </div>
    )
}
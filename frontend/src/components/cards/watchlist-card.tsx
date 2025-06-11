"use client"

import { Star, Users, Shield, Crown, Heart, Plus } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"
import { useFavorites } from "@/hooks/use-favorites"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { FavoriteStar } from "@/components/ui/favorite-star"
import { getNBALogo } from "@/lib/utils"
import Cookies from 'js-cookie'

function getUserRoleFromToken(): string {
    if (typeof window === "undefined") return "free"
    
    const token = Cookies.get('token')
    if (!token) return "free"
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.role || "free"
    } catch {
        return "free"
    }
}

export function WatchlistCard() {
    const {
        favorites,
        loading,
        addPlayerToFavorites,
        removePlayerFromFavorites,
        addTeamToFavorites,
        removeTeamFromFavorites,
        isPlayerFavorite,
        isTeamFavorite
    } = useFavorites()

    const [userRole, setUserRole] = useState<string>('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const role = getUserRoleFromToken()
        setUserRole(role)
        setIsLoggedIn(!!Cookies.get('token'))
    }, [])

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'premium':
                return <Shield className="h-3 w-3 text-blue-500" />
            case 'ultimate':
                return <Crown className="h-3 w-3 text-purple-500" />
            default:
                return <Users className="h-3 w-3 text-green-500" />
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'premium':
                return 'text-blue-500'
            case 'ultimate':
                return 'text-purple-500'
            default:
                return 'text-green-500'
        }
    }

    const getLimitsText = (type: 'players' | 'teams') => {
        if (!favorites) return '0/0'
        
        const limit = favorites.limits[type]
        const current = favorites[type].length

        if (limit === -1) {
            return `${current}/∞`
        }
        return `${current}/${limit}`
    }

    if (loading && isLoggedIn) {
        return (
            <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <CardHeader title="Your Watchlist" icon={Star} />
                <div className="p-4">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <CardHeader title="Your Watchlist" icon={Star} />
                <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sign in to see your watchlist</span>
                        <Link href="/auth/login" className="text-xs font-medium text-primary hover:text-primary/90">
                            Sign In
                        </Link>
                    </div>
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Track your favorite players and teams</p>
                        <Link 
                            href="/auth/login"
                            className="inline-block mt-2 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (!favorites || (!favorites.players.length && !favorites.teams.length)) {
        return (
            <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <CardHeader title="Your Watchlist" icon={Star} />
                <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {getRoleIcon(userRole)}
                            <span className={`text-xs font-medium ${getRoleColor(userRole)}`}>
                                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Plan
                            </span>
                        </div>
                        <Link href="/favorites" className="text-xs font-medium text-primary hover:text-primary/90">
                            View All
                        </Link>
                    </div>
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">No favorites yet</p>
                        <div className="flex gap-2 justify-center">
                            <Link 
                                href="/players"
                                className="inline-block rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Browse Players
                            </Link>
                            <Link 
                                href="/teams"
                                className="inline-block rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
                            >
                                Browse Teams
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Show favorites with scrollable columns
    const visiblePlayers = favorites.players.slice(0, 6)
    const visibleTeams = favorites.teams.slice(0, 6)
    const remainingPlayers = Math.max(0, favorites.players.length - 6)
    const remainingTeams = Math.max(0, favorites.teams.length - 6)

    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
            <CardHeader title="Your Watchlist" icon={Star} />
            <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {getRoleIcon(userRole)}
                        <span className={`text-xs font-medium ${getRoleColor(userRole)}`}>
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Plan
                        </span>
                    </div>
                    <Link href="/favorites" className="text-xs font-medium text-primary hover:text-primary/90">
                        View All
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Players Column */}
                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Players</h4>
                            <span className="text-xs text-muted-foreground">{getLimitsText('players')}</span>
                        </div>
                        
                        {/* Scrollable container for players */}
                        <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-muted-foreground/40 scrollbar-track-rounded-full scrollbar-track-muted/20">
                            {visiblePlayers.map((player, index) => (
                                <div key={player.id} className={index > 0 ? "mt-2" : ""}>
                                    <PlayerMiniCard
                                        player={player}
                                        isFavorite={isPlayerFavorite(player.id)}
                                        onToggleFavorite={() =>
                                            isPlayerFavorite(player.id)
                                                ? removePlayerFromFavorites(player.id)
                                                : addPlayerToFavorites(player.id)
                                        }
                                    />
                                </div>
                            ))}
                            {visiblePlayers.length === 0 && (
                                <div className="border border-dashed border-border rounded p-3 text-center">
                                    <Plus className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">No players</p>
                                </div>
                            )}
                        </div>

                        {/* Show remaining count if more than 6 */}
                        {remainingPlayers > 0 && (
                            <div className="mt-2 text-center">
                                <Link 
                                    href="/favorites"
                                    className="text-xs text-primary hover:text-primary/90 font-medium"
                                >
                                    +{remainingPlayers} more
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Teams Column */}
                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teams</h4>
                            <span className="text-xs text-muted-foreground">{getLimitsText('teams')}</span>
                        </div>
                        
                        {/* Scrollable container for teams */}
                        <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-muted-foreground/40 scrollbar-track-rounded-full scrollbar-track-muted/20">
                            {visibleTeams.map((team, index) => (
                                <div key={team.id} className={index > 0 ? "mt-2" : ""}>
                                    <TeamMiniCard
                                        team={team}
                                        isFavorite={isTeamFavorite(team.id)}
                                        onToggleFavorite={() =>
                                            isTeamFavorite(team.id)
                                                ? removeTeamFromFavorites(team.id)
                                                : addTeamToFavorites(team.id)
                                        }
                                    />
                                </div>
                            ))}
                            {visibleTeams.length === 0 && (
                                <div className="border border-dashed border-border rounded p-3 text-center">
                                    <Plus className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">No teams</p>
                                </div>
                            )}
                        </div>

                        {/* Show remaining count if more than 6 */}
                        {remainingTeams > 0 && (
                            <div className="mt-2 text-center">
                                <Link 
                                    href="/favorites"
                                    className="text-xs text-primary hover:text-primary/90 font-medium"
                                >
                                    +{remainingTeams} more
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Mini Player Card Component
interface PlayerMiniCardProps {
    player: {
        id: number
        name: string
        position?: string
        url_pic?: string
    }
    isFavorite: boolean
    onToggleFavorite: () => Promise<boolean>
}

function PlayerMiniCard({ player, isFavorite, onToggleFavorite }: PlayerMiniCardProps) {
    return (
        <Link href={`/players/${player.id}`}>
            <div className="group relative overflow-hidden rounded border border-border bg-background p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
                {/* Favorite Star */}
                <div className="absolute top-2 right-2 z-20">
                    <FavoriteStar
                        isFavorite={isFavorite}
                        onToggle={onToggleFavorite}
                        size="sm"
                        className="p-0.5"
                        forceLightBorder
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Player Image - ✅ Optimizada para mejor calidad */}
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        <Image
                            src={player.url_pic || "/placeholder.svg"}
                            alt={player.name}
                            fill
                            className="object-cover"
                            quality={95} // ✅ Aumentar calidad
                            sizes="64px" // ✅ Doble del tamaño para pantallas de alta densidad
                            priority={false}
                        />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {player.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {player.position || "Player"}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

// Mini Team Card Component
interface TeamMiniCardProps {
    team: {
        id: number
        full_name: string
        abbreviation: string
    }
    isFavorite: boolean
    onToggleFavorite: () => Promise<boolean>
}

function TeamMiniCard({ team, isFavorite, onToggleFavorite }: TeamMiniCardProps) {
    return (
        <Link href={`/teams/${team.id}`}>
            <div className="group relative overflow-hidden rounded border border-border bg-background p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
                {/* Favorite Star */}
                <div className="absolute top-2 right-2 z-20">
                    <FavoriteStar
                        isFavorite={isFavorite}
                        onToggle={onToggleFavorite}
                        size="sm"
                        className="p-0.5"
                        forceLightBorder
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Team Logo */}
                    <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
                        {getNBALogo(team.full_name, { className: "h-6 w-6" })}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {team.abbreviation}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {team.full_name}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

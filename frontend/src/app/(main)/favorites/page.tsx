"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Shield, Crown, Heart } from 'lucide-react'
import { FavoriteStar } from '@/components/ui/favorite-star'
import { useFavorites } from '@/hooks/use-favorites'
import { getNBALogo } from '@/lib/utils'

export default function FavoritesPage() {
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

    useEffect(() => {
        // Get user role from token
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                setUserRole(payload.role || 'free')
            } catch (error) {
                console.error('Error parsing token:', error)
            }
        }
    }, [])

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your favorites...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!favorites) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex flex-col items-center justify-center py-20">
                    <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Please Login</h1>
                    <p className="text-muted-foreground mb-6 text-center">You need to be logged in to view and manage your favorites.</p>
                    <Link
                        href="/auth/login"
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        )
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'premium':
                return <Shield className="h-4 w-4 text-blue-500" />
            case 'ultimate':
                return <Crown className="h-4 w-4 text-purple-500" />
            default:
                return <Users className="h-4 w-4 text-green-500" />
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
        const limit = favorites.limits[type]
        const current = favorites[type].length

        if (limit === -1) {
            return `${current} / Unlimited`
        }
        return `${current} / ${limit}`
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    <h1 className="text-3xl font-bold">My Favorites</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getRoleIcon(userRole)}
                    <span className={getRoleColor(userRole)}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Plan
                    </span>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Players Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Favorite Players
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {getLimitsText('players')}
                        </span>
                    </div>

                    {favorites.players.length === 0 ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium text-muted-foreground mb-2">No favorite players yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Browse players and click the star to add them to your favorites
                            </p>
                            <Link
                                href="/players"
                                className="inline-block mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                            >
                                Browse Players
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {favorites.players.map((player) => (
                                <PlayerFavoriteCard
                                    key={player.id}
                                    player={player}
                                    isFavorite={isPlayerFavorite(player.id)}
                                    onToggleFavorite={() =>
                                        isPlayerFavorite(player.id)
                                            ? removePlayerFromFavorites(player.id)
                                            : addPlayerToFavorites(player.id)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Teams Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Favorite Teams
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {getLimitsText('teams')}
                        </span>
                    </div>

                    {favorites.teams.length === 0 ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium text-muted-foreground mb-2">No favorite teams yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Browse teams and click the star to add them to your favorites
                            </p>
                            <Link
                                href="/teams"
                                className="inline-block mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                            >
                                Browse Teams
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {favorites.teams.map((team) => (
                                <TeamFavoriteCard
                                    key={team.id}
                                    team={team}
                                    isFavorite={isTeamFavorite(team.id)}
                                    onToggleFavorite={() =>
                                        isTeamFavorite(team.id)
                                            ? removeTeamFromFavorites(team.id)
                                            : addTeamToFavorites(team.id)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Player Favorite Card Component
interface PlayerFavoriteCardProps {
    player: {
        id: number
        name: string
        position?: string
        team?: { full_name: string }
        url_pic?: string
        average_stats?: {
            points?: number
            rebounds?: number
            assists?: number
        }
    }
    isFavorite: boolean
    onToggleFavorite: () => Promise<boolean>
}

function PlayerFavoriteCard({ player, isFavorite, onToggleFavorite }: PlayerFavoriteCardProps) {
    return (
        <Link href={`/players/${player.id}`}>
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                {/* Favorite Star */}
                <div className="absolute top-2 right-2 z-20">
                    <FavoriteStar
                        isFavorite={isFavorite}
                        onToggle={onToggleFavorite}
                        size="sm"
                        forceLightBorder
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Player Image */}
                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted">
                        <Image
                            src={player.url_pic || "/placeholder.svg"}
                            alt={player.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{player.name}</h3>
                        <p className="text-sm text-muted-foreground">{player.position}</p>
                        {player.team && (
                            <p className="text-xs text-muted-foreground truncate">{player.team.full_name}</p>
                        )}

                        {/* Quick Stats */}
                        {player.average_stats && (
                            <div className="flex gap-3 mt-2 text-xs">
                                <span className="text-muted-foreground">
                                    {player.average_stats.points?.toFixed(1)} PPG
                                </span>
                                <span className="text-muted-foreground">
                                    {player.average_stats.rebounds?.toFixed(1)} RPG
                                </span>
                                <span className="text-muted-foreground">
                                    {player.average_stats.assists?.toFixed(1)} APG
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

// Team Favorite Card Component
interface TeamFavoriteCardProps {
    team: {
        id: number
        full_name: string
        abbreviation: string
        conference?: string
        division?: string
    }
    isFavorite: boolean
    onToggleFavorite: () => Promise<boolean>
}

function TeamFavoriteCard({ team, isFavorite, onToggleFavorite }: TeamFavoriteCardProps) {
    return (
        <Link href={`/teams/${team.id}`}>
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                {/* Favorite Star */}
                <div className="absolute top-2 right-2 z-20">
                    <FavoriteStar
                        isFavorite={isFavorite}
                        onToggle={onToggleFavorite}
                        size="sm"
                        forceLightBorder
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Team Logo */}
                    <div className="h-16 w-16 flex items-center justify-center">
                        {getNBALogo(team.full_name, { className: "h-12 w-12" })}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{team.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{team.abbreviation}</p>
                        {team.conference && team.division && (
                            <p className="text-xs text-muted-foreground truncate">
                                {team.conference} Conference • {team.division} Division
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
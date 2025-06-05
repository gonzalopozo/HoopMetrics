"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

interface FavoritePlayer {
    id: number
    name: string
    position?: string
    team?: { full_name: string }
    url_pic?: string
    average_stats?: any
}

interface FavoriteTeam {
    id: number
    full_name: string
    abbreviation: string
    conference?: string
    division?: string
}

interface UserFavorites {
    players: FavoritePlayer[]
    teams: FavoriteTeam[]
    limits: {
        players: number
        teams: number
    }
}

// Función para obtener el rol del usuario desde el token
function getUserRoleFromToken(): string {
    if (typeof window === "undefined") return "free"
    
    const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
    if (!token) return "free"
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.role || "free"
    } catch {
        return "free"
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<UserFavorites | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string>("free")

    const fetchFavorites = async () => {
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                setFavorites(null)
                setLoading(false)
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setFavorites(data)
            } else {
                setFavorites(null)
            }
        } catch (error) {
            console.error('Error fetching favorites:', error)
            setFavorites(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Detectar el rol del usuario al inicializar
        setUserRole(getUserRoleFromToken())
        fetchFavorites()
    }, [])

    const addPlayerToFavorites = async (playerId: number) => {
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                toast.error('Please login to add favorites')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/players/${playerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Player added to favorites!')
                await fetchFavorites()
                return true
            } else {
                toast.error(data.detail || 'Failed to add player to favorites')
                return false
            }
        } catch (error) {
            toast.error('Error adding player to favorites')
            return false
        }
    }

    const removePlayerFromFavorites = async (playerId: number) => {
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                toast.error('Please login to manage favorites')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/players/${playerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Player removed from favorites!')
                await fetchFavorites()
                return true
            } else {
                toast.error(data.detail || 'Failed to remove player from favorites')
                return false
            }
        } catch (error) {
            toast.error('Error removing player from favorites')
            return false
        }
    }

    const addTeamToFavorites = async (teamId: number) => {
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                toast.error('Please login to add favorites')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/teams/${teamId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Team added to favorites!')
                await fetchFavorites()
                return true
            } else {
                toast.error(data.detail || 'Failed to add team to favorites')
                return false
            }
        } catch (error) {
            toast.error('Error adding team to favorites')
            return false
        }
    }

    const removeTeamFromFavorites = async (teamId: number) => {
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                toast.error('Please login to manage favorites')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/teams/${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Team removed from favorites!')
                await fetchFavorites()
                return true
            } else {
                toast.error(data.detail || 'Failed to remove team from favorites')
                return false
            }
        } catch (error) {
            toast.error('Error removing team from favorites')
            return false
        }
    }

    const isPlayerFavorite = (playerId: number): boolean => {
        return favorites?.players.some(player => player.id === playerId) || false
    }

    const isTeamFavorite = (teamId: number): boolean => {
        return favorites?.teams.some(team => team.id === teamId) || false
    }

    const getLimitsInfo = () => {
        if (!favorites) return { players: '0/0', teams: '0/0' }
        
        const playersLimit = favorites.limits.players === -1 ? 'Unlimited' : favorites.limits.players
        const teamsLimit = favorites.limits.teams === -1 ? 'Unlimited' : favorites.limits.teams
        
        return {
            players: `${favorites.players.length}/${playersLimit}`,
            teams: `${favorites.teams.length}/${teamsLimit}`
        }
    }

    return {
        favorites,
        loading,
        userRole,
        addPlayerToFavorites,
        removePlayerFromFavorites,
        addTeamToFavorites,
        removeTeamFromFavorites,
        isPlayerFavorite,
        isTeamFavorite,
        refetchFavorites: fetchFavorites,
        getLimitsInfo
    }
}
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
    average_stats?: {
        points?: number
        rebounds?: number
        assists?: number
        steals?: number
        blocks?: number
        turnovers?: number
        field_goal_percentage?: number
        three_point_percentage?: number
        free_throw_percentage?: number
        games_played?: number
        minutes?: number
    }
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

// ✅ Cache simple para evitar re-fetch innecesarios
let favoritesCache: { data: UserFavorites | null, timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

export function useFavorites() {
    const [favorites, setFavorites] = useState<UserFavorites | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialLoadComplete, setInitialLoadComplete] = useState(false)
    const [userRole, setUserRole] = useState<string>('')

    // ✅ Nuevo estado para forzar re-renders
    const [updateTrigger, setUpdateTrigger] = useState(0)

    const fetchFavorites = async (useCache = true) => {
        try {
            // ✅ Usar cache si está disponible y es reciente
            if (useCache && favoritesCache && Date.now() - favoritesCache.timestamp < CACHE_DURATION) {
                setFavorites(favoritesCache.data)
                setLoading(false)
                setInitialLoadComplete(true)
                return
            }

            const token = Cookies.get('token')
            if (!token) {
                setLoading(false)
                setInitialLoadComplete(true)
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
                
                favoritesCache = {
                    data,
                    timestamp: Date.now()
                }
                
                // ✅ Trigger re-render después de actualizar favoritos
                setUpdateTrigger(prev => prev + 1)
            }
        } catch (error) {
            console.error('Error fetching favorites:', error)
        } finally {
            setLoading(false)
            setInitialLoadComplete(true) // ✅ Marcar carga inicial como completa
        }
    }

    useEffect(() => {
        // Detectar el rol del usuario al inicializar
        setUserRole(getUserRoleFromToken())
        fetchFavorites()
    }, [])

    const addPlayerToFavorites = async (playerId: number) => {
        try {
            const token = Cookies.get('token')
            if (!token) {
                toast.error('Please login to add favorites')
                return false
            }

            // ✅ OPTIMISTIC UPDATE mejorado
            const tempPlayer = { 
                id: playerId, 
                name: "Loading...", 
                position: "", 
                team: undefined, 
                url_pic: undefined, 
                average_stats: undefined 
            }

            if (favorites) {
                setFavorites(prev => prev ? {
                    ...prev,
                    players: [...prev.players, tempPlayer]
                } : null)
                
                // ✅ Trigger immediate re-render
                setUpdateTrigger(prev => prev + 1)
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
                await fetchFavorites(false) // ✅ Force refresh sin cache
                return true
            } else {
                // ✅ REVERTIR optimistic update
                if (favorites) {
                    setFavorites(prev => prev ? {
                        ...prev,
                        players: prev.players.filter(p => p.id !== playerId)
                    } : null)
                    setUpdateTrigger(prev => prev + 1)
                }
                toast.error(data.detail || 'Failed to add player to favorites')
                return false
            }
        } catch (error) {
            console.error('Error adding player to favorites:', error)
            // ✅ REVERTIR en caso de error
            if (favorites) {
                setFavorites(prev => prev ? {
                    ...prev,
                    players: prev.players.filter(p => p.id !== playerId)
                } : null)
                setUpdateTrigger(prev => prev + 1)
            }
            toast.error('Error adding player to favorites')
            return false
        }
    }

    const removePlayerFromFavorites = async (playerId: number) => {
        // ✅ OPTIMISTIC UPDATE
        const originalPlayer = favorites?.players.find(p => p.id === playerId)
        
        try {
            const token = Cookies.get('token')
            if (!token) {
                toast.error('Please login to manage favorites')
                return false
            }

            if (favorites && originalPlayer) {
                setFavorites(prev => prev ? {
                    ...prev,
                    players: prev.players.filter(p => p.id !== playerId)
                } : null)
                
                // ✅ Trigger immediate re-render
                setUpdateTrigger(prev => prev + 1)
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
                await fetchFavorites(false) // ✅ Force refresh sin cache
                return true
            } else {
                // ✅ REVERTIR
                if (favorites && originalPlayer) {
                    setFavorites(prev => prev ? {
                        ...prev,
                        players: [...prev.players, originalPlayer]
                    } : null)
                    setUpdateTrigger(prev => prev + 1)
                }
                toast.error(data.detail || 'Failed to remove player from favorites')
                return false
            }
        } catch (error) {
            console.error('Error removing player from favorites:', error)
            if (favorites && originalPlayer) {
                setFavorites(prev => prev ? {
                    ...prev,
                    players: [...prev.players, originalPlayer]
                } : null)
                setUpdateTrigger(prev => prev + 1)
            }
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

            const tempTeam = { 
                id: teamId, 
                full_name: "Loading...", 
                abbreviation: "", 
                conference: "", 
                division: "" 
            }

            if (favorites) {
                setFavorites(prev => prev ? {
                    ...prev,
                    teams: [...prev.teams, tempTeam]
                } : null)
                setUpdateTrigger(prev => prev + 1)
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
                await fetchFavorites(false)
                return true
            } else {
                if (favorites) {
                    setFavorites(prev => prev ? {
                        ...prev,
                        teams: prev.teams.filter(t => t.id !== teamId)
                    } : null)
                    setUpdateTrigger(prev => prev + 1)
                }
                toast.error(data.detail || 'Failed to add team to favorites')
                return false
            }
        } catch (error) {
            console.error('Error adding team to favorites:', error)
            if (favorites) {
                setFavorites(prev => prev ? {
                    ...prev,
                    teams: prev.teams.filter(t => t.id !== teamId)
                } : null)
                setUpdateTrigger(prev => prev + 1)
            }
            toast.error('Error adding team to favorites')
            return false
        }
    }

    const removeTeamFromFavorites = async (teamId: number) => {
        const originalTeam = favorites?.teams.find(t => t.id === teamId)
        
        try {
            const token = Cookies.get('token')  // ✅ Usar cookies en lugar de localStorage
            if (!token) {
                toast.error('Please login to manage favorites')
                return false
            }
            
            if (favorites && originalTeam) {
                setFavorites(prev => prev ? {
                    ...prev,
                    teams: prev.teams.filter(t => t.id !== teamId)
                } : null)
                setUpdateTrigger(prev => prev + 1)
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
                await fetchFavorites(false)
                return true
            } else {
                if (favorites && originalTeam) {
                    setFavorites(prev => prev ? {
                        ...prev,
                        teams: [...prev.teams, originalTeam]
                    } : null)
                    setUpdateTrigger(prev => prev + 1)
                }
                toast.error(data.detail || 'Failed to remove team from favorites')
                return false
            }
        } catch (error) {
            console.error('Error removing team from favorites:', error)
            if (favorites && originalTeam) {
                setFavorites(prev => prev ? {
                    ...prev,
                    teams: [...prev.teams, originalTeam]
                } : null)
                setUpdateTrigger(prev => prev + 1)
            }
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
        initialLoadComplete,
        userRole,
        addPlayerToFavorites,
        removePlayerFromFavorites,
        addTeamToFavorites,
        removeTeamFromFavorites,
        isPlayerFavorite,
        isTeamFavorite,
        refetchFavorites: fetchFavorites,
        getLimitsInfo,
        updateTrigger // ✅ Exportar trigger para forzar re-renders
    }
}
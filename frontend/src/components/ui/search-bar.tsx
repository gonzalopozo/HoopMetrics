"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Users, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { SearchSuggestions, SearchTeamResult, SearchPlayerResult } from "@/types/search"
import { getNBALogo } from "@/lib/utils"
import Image from "next/image"

export function SearchBar() {
    const [query, setQuery] = useState("")
    const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const router = useRouter()
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>(null)


    // Fetch suggestions
    const fetchSuggestions = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSuggestions(null)
            setIsOpen(false)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/search/suggestions?q=${encodeURIComponent(searchQuery)}`
            )
            
            if (response.ok) {
                const data: SearchSuggestions = await response.json()
                setSuggestions(data)
                setIsOpen(true)
                setSelectedIndex(-1)
            } else {
                setSuggestions(null)
                setIsOpen(false)
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error)
            setSuggestions(null)
            setIsOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(query)
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query])

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSelectedIndex(-1)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || !suggestions) return

        const totalItems = suggestions.teams.length + suggestions.players.length
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : -1)
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => prev > -1 ? prev - 1 : totalItems - 1)
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex === -1) {
                    // Submit search
                    handleSubmit()
                } else {
                    // Navigate to selected item
                    const allItems = [...suggestions.teams, ...suggestions.players]
                    const selectedItem = allItems[selectedIndex]
                    if (selectedItem) {
                        const isTeam = 'abbreviation' in selectedItem
                        const url = isTeam ? `/teams/${selectedItem.id}` : `/players/${selectedItem.id}`
                        router.push(url)
                        closeSearch()
                    }
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }

    const handleSubmit = () => {
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            closeSearch()
        }
    }

    const closeSearch = () => {
        setQuery("")
        setSuggestions(null)
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
    }

    const clearSearch = () => {
        setQuery("")
        setSuggestions(null)
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.focus()
    }

    return (
        <div ref={searchRef} className="relative mx-4 flex-1 max-w-md">
            <div className="relative">
                {/* ✅ Hacer la lupa clickeable como botón de búsqueda */}
                <button
                    onClick={handleSubmit}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 hover:text-foreground text-muted-foreground transition-colors"
                    type="button"
                    title="Search"
                >
                    <Search className="h-4 w-4" />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search players, teams..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-foreground text-muted-foreground transition-colors"
                        type="button"
                        title="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Search Suggestions Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <div className="animate-spin h-4 w-4 border border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                        </div>
                    ) : suggestions && (suggestions.teams.length > 0 || suggestions.players.length > 0) ? (
                        <div className="max-h-96 overflow-y-auto">
                            {/* Teams Section */}
                            {suggestions.teams.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                                        Teams ({suggestions.teams.length})
                                    </div>
                                    {suggestions.teams.map((team, index) => (
                                        <SearchTeamItem
                                            key={team.id}
                                            team={team}
                                            isSelected={selectedIndex === index}
                                            onSelect={() => {
                                                router.push(`/teams/${team.id}`)
                                                closeSearch()
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Players Section */}
                            {suggestions.players.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                                        Players ({suggestions.players.length})
                                    </div>
                                    {suggestions.players.map((player, index) => (
                                        <SearchPlayerItem
                                            key={player.id}
                                            player={player}
                                            isSelected={selectedIndex === (suggestions.teams.length + index)}
                                            onSelect={() => {
                                                router.push(`/players/${player.id}`)
                                                closeSearch()
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* View All Results */}
                            {(suggestions.total_teams > suggestions.teams.length || 
                              suggestions.total_players > suggestions.players.length) && (
                                <div className="border-t">
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full px-3 py-3 text-sm text-center text-primary hover:bg-muted/50 transition-colors"
                                    >
                                        {`View all results for "${query}"`}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">{`No results found for "${query}"`}</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}

// Team Search Item Component
interface SearchTeamItemProps {
    team: SearchTeamResult
    isSelected: boolean
    onSelect: () => void
}

function SearchTeamItem({ team, isSelected, onSelect }: SearchTeamItemProps) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0",
                isSelected && "bg-muted"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-shrink-0">
                    {getNBALogo(team.full_name, { 
                        width: 32, 
                        height: 32, 
                        className: "h-full w-full object-contain" 
                    })}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{team.full_name}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">
                            {team.abbreviation}
                        </span>
                    </div>
                    {team.city && (
                        <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{team.city}</span>
                        </div>
                    )}
                </div>
            </div>
        </button>
    )
}

// Player Search Item Component
interface SearchPlayerItemProps {
    player: SearchPlayerResult
    isSelected: boolean
    onSelect: () => void
}

function SearchPlayerItem({ player, isSelected, onSelect }: SearchPlayerItemProps) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0",
                isSelected && "bg-muted"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                    {player.url_pic ? (
                        <Image
                            src={player.url_pic}
                            alt={player.name}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{player.name}</span>
                        {player.number && (
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">
                                #{player.number}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{player.position}</span>
                        {player.team_name && (
                            <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground truncate">{player.team_name}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </button>
    )
}
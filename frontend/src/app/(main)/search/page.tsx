"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Users, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { SearchResults, SearchTeamResult, SearchPlayerResult } from "@/types/search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getNBALogo } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { PlayerFavoriteWrapper } from "@/components/client-wrappers/player-favorite-wrapper"
import { TeamFavoriteWrapper } from "@/components/client-wrappers/team-favorite-wrapper"


function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    const query = searchParams.get('q') || ""

    useEffect(() => {
        setSearchQuery(query)
        setCurrentPage(1)
    }, [query])

    useEffect(() => {
        fetchResults(searchQuery, currentPage)
    }, [searchQuery, currentPage])

    const fetchResults = async (q: string, page: number) => {
        if (!q.trim()) {
            setResults(null)
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/search/results?q=${encodeURIComponent(q)}&page=${page}&limit=20`
            )
            
            if (response.ok) {
                const data: SearchResults = await response.json()
                setResults(data)
            } else {
                setResults(null)
            }
        } catch (error) {
            console.error('Error fetching search results:', error)
            setResults(null)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Search Results</h1>
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search players, teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            {loading ? (
                <SearchResultsSkeleton />
            ) : !query.trim() ? (
                <EmptySearchState />
            ) : !results || (results.teams.length === 0 && results.players.length === 0) ? (
                <NoResultsState query={query} />
            ) : (
                <div>
                    {/* Results Summary */}
                    <div className="mb-6">
                        <p className="text-muted-foreground">
                            Found <span className="font-medium">{results.total_teams}</span> teams and{" "}
                            <span className="font-medium">{results.total_players}</span> players for{" "}
                            <span className="font-medium">{`"${results.query}"`}</span>
                        </p>
                    </div>

                    {/* Teams Results */}
                    {results.teams.length > 0 && (
                        <section className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-semibold">Teams</h2>
                                <Badge variant="secondary">{results.total_teams}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.teams.map((team) => (
                                    <TeamResultCard key={team.id} team={team} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Players Results */}
                    {results.players.length > 0 && (
                        <section className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-semibold">Players</h2>
                                <Badge variant="secondary">{results.total_players}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.players.map((player) => (
                                    <PlayerResultCard key={player.id} player={player} />
                                ))}
                            </div>

                            {/* Pagination for Players */}
                            {results.total_players > results.limit && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {Math.ceil(results.total_players / results.limit)}
                                    </span>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!results.has_next_page}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

// Team Result Card Component - ✅ MODIFICADO
// Team Result Card Component - ✅ MODIFICADO
function TeamResultCard({ team }: { team: SearchTeamResult }) {
    return (
        <Card className="group hover:shadow-md transition-shadow relative">
            {/* ✅ Estrella más grande */}
            <div className="absolute top-2 right-2 z-10">
                <div className="[&_svg]:stroke-black [&_svg]:stroke-[1.5] dark:[&_svg]:stroke-white">
                    <TeamFavoriteWrapper teamId={team.id} size="md" />
                </div>
            </div>
            
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0">
                        {getNBALogo(team.full_name, { 
                            width: 48, 
                            height: 48, 
                            className: "h-full w-full object-contain" 
                        })}
                    </div>
                    <div className="flex-1 min-w-0 pr-10"> {/* ✅ Aumentar padding para la estrella más grande */}
                        <Link 
                            href={`/teams/${team.id}`}
                            className="block hover:text-primary"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate group-hover:text-primary">
                                    {team.full_name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {team.abbreviation}
                                </Badge>
                            </div>
                            {team.city && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{team.city}</span>
                                    {team.conference && (
                                        <>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">{team.conference}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Player Result Card Component - ✅ MODIFICADO
function PlayerResultCard({ player }: { player: SearchPlayerResult }) {
    return (
        <Card className="group hover:shadow-md transition-shadow relative">
            {/* ✅ Estrella más grande */}
            <div className="absolute top-2 right-2 z-10">
                <div className="[&_svg]:stroke-black [&_svg]:stroke-[1.5] dark:[&_svg]:stroke-white">
                    <PlayerFavoriteWrapper playerId={player.id} size="md" />
                </div>
            </div>
            
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                        {player.url_pic ? (
                            <Image
                                src={player.url_pic}
                                alt={player.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pr-10"> {/* ✅ Aumentar padding para la estrella más grande */}
                        <Link 
                            href={`/players/${player.id}`}
                            className="block hover:text-primary"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate group-hover:text-primary">
                                    {player.name}
                                </h3>
                                {player.number && (
                                    <Badge variant="outline" className="text-xs">
                                        #{player.number}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{player.position}</span>
                                {player.team_name && (
                                    <>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {player.team_name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Loading Skeleton Component
function SearchResultsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            
            {/* Teams Skeleton */}
            <div>
                <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-muted animate-pulse rounded" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Empty Search State
function EmptySearchState() {
    return (
        <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start your search</h3>
            <p className="text-muted-foreground">
                Enter a player name, team name, or abbreviation to begin searching.
            </p>
        </div>
    )
}

// No Results State
function NoResultsState({ query }: { query: string }) {
    return (
        <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
                {`We couldn't find any players or teams matching `}<span className="font-medium">{`"${query}"`}</span>	
            </p>
            <p className="text-sm text-muted-foreground">
                Try searching with different keywords or check your spelling.
            </p>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchContent />
        </Suspense>
    )
}
"use client"

import axios from 'axios'
import {
    QueryClient,
    QueryClientProvider,
    HydrationBoundary,
    useInfiniteQuery,
} from '@tanstack/react-query'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import { PlayerCard } from '@/components/cards/player-card'
import { PlayersLoading } from '../loading/players-loading'

interface ApiPlayer {
    id: number
    name: string
    position: string
    team: { full_name: string, logo_url?: string }
    url_pic: string | null
    average_stats: {
        points: number
        rebounds: number
        assists: number
    }
}

interface Props {
    dehydratedState: unknown
    apiUrl: string
}

export default function PlayersInfiniteList({ dehydratedState, apiUrl }: Props) {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
                <InfiniteListCore apiUrl={apiUrl} />
            </HydrationBoundary>
        </QueryClientProvider>
    )
}

function InfiniteListCore({ apiUrl }: { apiUrl: string }) {
    // Uso de la API v5 de useInfiniteQuery con initialPageParam
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery<ApiPlayer[], Error>({
        queryKey: ['players'],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await axios.get<ApiPlayer[]>(
                `${apiUrl}/players/sortedbyppg/${pageParam}`
            )
            return res.data
        },
        getNextPageParam: (
            lastPage: ApiPlayer[],
            pages: ApiPlayer[][]
        ): number | undefined => {
            return lastPage.length > 0 ? pages.length + 1 : undefined
        },
        initialPageParam: 1,
    })

    const [sentryRef] = useInfiniteScroll({
        loading: isLoading || isFetchingNextPage,
        hasNextPage: Boolean(hasNextPage),
        onLoadMore: fetchNextPage,
        rootMargin: '0px 0px 400px 0px',
    })

    if (isLoading) return <PlayersLoading />
    if (isError) return <p>Error: {(error as Error).message}</p>

    // Aplanamos y tipamos el array de jugadores
    const allPlayers = data?.pages.flat() ?? []

    return (
        <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {allPlayers.map(player => (
                    <PlayerCard
                        key={player.id}
                        id={player.id.toString()}
                        name={player.name}
                        position={player.position}
                        team={{
                            name: player.team.full_name,
                            // Si tu API no devuelve logo_url, usa el placeholder:
                            logo: player.team['logo_url'] as string | undefined ?? '/placeholder.svg'
                        }}
                        image={player.url_pic ?? '/placeholder.svg'}
                        stats={{
                            points: player.average_stats.points,
                            rebounds: player.average_stats.rebounds,
                            assists: player.average_stats.assists,
                        }}
                    />
                ))}
            </div>
            <div ref={sentryRef} className="mt-8 flex justify-center" />
            {isFetchingNextPage && (
                <div className="mt-4 flex justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            )}
            {!hasNextPage && <p className="mt-6 text-center">No hay más jugadores.</p>}
        </>
    )
}
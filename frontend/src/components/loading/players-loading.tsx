import { PlayerCardSkeleton } from "@/components/cards/player-card-skeleton"

export function PlayersLoading() {
    // Create an array of 20 items
    const skeletonCards = Array.from({ length: 20 }, (_, i) => i)

    return (
        <div>
            <div className="mb-6">
                <Skeleton className="h-8 w-48" />
            </div>

            {/* Filters and Search Skeleton */}
            <div className="mb-6 flex flex-wrap gap-2">
                <div className="flex-1">
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Players Grid - Bento Layout with Skeletons */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {skeletonCards.map((index) => (
                    <PlayerCardSkeleton key={index} />
                ))}
            </div>
        </div>
    )
}

// Import Skeleton component
import { Skeleton } from "@/components/ui/skeleton"
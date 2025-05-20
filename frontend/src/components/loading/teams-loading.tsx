import { TeamCardSkeleton } from "@/components/cards/team-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamsLoading() {
    // Create an array of 30 items for skeleton cards
    const skeletonCards = Array.from({ length: 30 }, (_, i) => i)

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

            {/* Teams Grid - Bento Layout with Skeletons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {skeletonCards.map((index) => (
                    <TeamCardSkeleton key={index} />
                ))}
            </div>
        </div>
    )
}

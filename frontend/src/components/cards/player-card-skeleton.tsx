import { Skeleton } from "@/components/ui/skeleton"

export function PlayerCardSkeleton() {
    return (
        <div className="relative h-full overflow-hidden rounded-xl border border-border bg-card">
            {/* Player Image Skeleton */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Skeleton className="absolute inset-0 h-full w-full" />
            </div>

            {/* Player Info Skeleton */}
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="mt-1">
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        </div>
    )
}

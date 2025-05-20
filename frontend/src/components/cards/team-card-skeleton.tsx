import { Skeleton } from "@/components/ui/skeleton"

export function TeamCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* Team Logo Skeleton */}
            <div className="relative flex h-40 w-full items-center justify-center bg-accent/30 p-4">
                <Skeleton className="h-24 w-24 rounded-full" />
            </div>

            {/* Team Info Skeleton */}
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="mt-1 h-3 w-28" />
                    </div>
                    <Skeleton className="ml-2 h-8 w-8 shrink-0 rounded-full" />
                </div>

                <Skeleton className="mb-3 h-14 w-full rounded-lg" />

                <div className="mb-4">
                    <div className="mb-1 flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>

                <Skeleton className="h-8 w-full rounded-lg" />
            </div>
        </div>
    )
}

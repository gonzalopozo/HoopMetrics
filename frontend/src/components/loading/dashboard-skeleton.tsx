import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div>
            {/* Page Title Skeleton */}
            <Skeleton className="mb-6 h-8 w-64" />

            {/* Dashboard Grid Skeleton */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Trending Queries Card Skeleton */}
                <div className="col-span-1 lg:col-span-2 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-6 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Upcoming Games Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-5 w-16" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-10" />
                                            <Skeleton className="h-5 w-6" />
                                            <Skeleton className="h-5 w-10" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Performers Card Skeleton */}
                <div className="col-span-1 lg:col-span-2 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="relative flex items-center gap-3 rounded-lg border border-border p-3">
                                <div className="absolute top-2 right-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-4 w-6 rounded-sm" />
                                    </div>
                                    <Skeleton className="h-4 w-10 mb-1" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="p-4">
                        <Skeleton className="h-5 w-48 mx-auto mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-10" />
                                    </div>
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Standings Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <div className="overflow-hidden rounded-lg border border-border">
                            <div className="border-b border-border bg-accent p-2">
                                <div className="flex">
                                    <Skeleton className="h-5 w-12 mr-auto" />
                                    <Skeleton className="h-5 w-8 mx-2" />
                                    <Skeleton className="h-5 w-8 ml-2" />
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex p-2">
                                        <Skeleton className="h-5 w-12 mr-auto" />
                                        <Skeleton className="h-5 w-8 mx-2" />
                                        <Skeleton className="h-5 w-8 ml-2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* News Insights Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="border-b border-border pb-2 last:border-0 last:pb-0">
                                    <Skeleton className="h-5 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Watchlist Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="rounded-lg border border-dashed border-border p-6">
                            <Skeleton className="h-4 w-48 mx-auto mb-2" />
                            <Skeleton className="h-6 w-32 mx-auto" />
                        </div>
                    </div>
                </div>

                {/* Seasonal Milestones Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-lg border border-border p-3">
                                    <Skeleton className="h-5 w-32 mb-1" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

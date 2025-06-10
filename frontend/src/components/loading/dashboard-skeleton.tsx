import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div>
            {/* Dashboard Grid Skeleton - 2 filas x 2 columnas = 4 cards */}
            <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 auto-rows-fr">
                {/* Trending Queries Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-3">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <Skeleton className="h-5 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Watchlist Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-4 flex-1">
                        <div className="mb-4 flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {/* Players Column */}
                            <div className="space-y-3">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="rounded-lg border border-border p-3 min-h-[60px]">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-20 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Teams Column */}
                            <div className="space-y-3">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="rounded-lg border border-border p-3 min-h-[60px]">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 w-8 rounded" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-24 mb-1" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performers Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="p-6 flex-1">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 h-full">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="relative flex items-center gap-4 rounded-lg border border-border p-4 min-h-[140px]">
                                    {/* Logo NBA más grande en esquina superior derecha */}
                                    <div className="absolute top-3 right-3">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                    </div>
                                    {/* Imagen del jugador más grande */}
                                    <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-4 w-6 rounded-md" />
                                        </div>
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats Card Skeleton */}
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
                    <div className="border-b border-border p-4">
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <Skeleton className="h-5 w-48 mx-auto mb-6" />
                            <div className="space-y-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                        <Skeleton className="h-3 w-full rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Sección adicional para ocupar más espacio */}
                        <div className="mt-6 pt-4 border-t border-border">
                            <Skeleton className="h-4 w-32 mx-auto mb-3" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <Skeleton className="h-3 w-16 mx-auto mb-1" />
                                    <Skeleton className="h-6 w-8 mx-auto" />
                                </div>
                                <div className="text-center">
                                    <Skeleton className="h-3 w-12 mx-auto mb-1" />
                                    <Skeleton className="h-6 w-10 mx-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

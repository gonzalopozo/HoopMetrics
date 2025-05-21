import { Skeleton } from "@/components/ui/skeleton"

export function TeamDetailSkeleton() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Skeleton className="h-6 w-32" />
            </div>

            {/* Hero Section Skeleton */}
            <div className="relative mb-8 overflow-hidden rounded-xl border border-border p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center">
                    {/* Team Logo Skeleton */}
                    <Skeleton className="h-48 w-48 md:h-56 md:w-56 mb-6 md:mb-0 md:mr-8 flex-shrink-0" />

                    {/* Team Info Skeleton */}
                    <div className="flex-1 w-full">
                        <Skeleton className="h-10 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-6" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-10 w-full max-w-md mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}

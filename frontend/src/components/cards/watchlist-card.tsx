import { Star } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

export function WatchlistCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="Your Watchlist" icon={Star} />
            <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sign in to see your watchlist</span>
                    <button className="text-xs font-medium text-primary hover:text-primary/90">Sign In</button>
                </div>
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground">Track your favorite players and teams</p>
                    <button className="mt-2 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/80">
                        Try HoopMetrics Pro
                    </button>
                </div>
            </div>
        </div>
    )
}

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const TRENDING_QUERIES = [
    "LeBron James last 5 games",
    "Top scorers today",
    "Rookie watch",
    "Triple doubles this season",
    "Clutch performers",
    "Best 3PT shooters",
]

export function TrendingQueriesCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
            <CardHeader title="Trending Queries" icon={TrendingUp} />
            <div className="p-4">
                <ul className="space-y-3">
                    {TRENDING_QUERIES.map((query, index) => (
                        <li key={index}>
                            <Link
                                href="#"
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                                    {index + 1}
                                </span>
                                <span>{query}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

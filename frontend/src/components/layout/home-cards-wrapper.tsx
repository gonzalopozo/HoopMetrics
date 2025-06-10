import { TrendingQueriesCard } from "@/components/cards/trending-queries-card"
import { TopPerformersCard } from "@/components/cards/top-performers-card"
import { QuickStatsCard } from "@/components/cards/quick-stats-card"
import { WatchlistCard } from "@/components/cards/watchlist-card"
import { SeasonalMilestonesCard } from "@/components/cards/seasonal-milestones-card"
import axios from "axios"
import { TopPerformer } from "@/types"


export default async function CardsWrapper() {
    const response = await axios.get<TopPerformer[]>(`${process.env.NEXT_PUBLIC_API_URL}/home/top-performers`)
    const topPerformers: TopPerformer[] = response.data

    return (
        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            <TrendingQueriesCard />
            <WatchlistCard />
            <TopPerformersCard data={topPerformers} />
            <QuickStatsCard />
        </div>
    )
}
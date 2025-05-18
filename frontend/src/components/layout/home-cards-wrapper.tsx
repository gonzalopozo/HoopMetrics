import { TrendingQueriesCard } from "@/components/cards/trending-queries-card"
import { UpcomingGamesCard } from "@/components/cards/upcoming-games-card"
import { TopPerformersCard } from "@/components/cards/top-performers-card"
import { QuickStatsCard } from "@/components/cards/quick-stats-card"
import { TeamStandingsCard } from "@/components/cards/team-standings-card"
import { NewsInsightsCard } from "@/components/cards/news-insights-card"
import { WatchlistCard } from "@/components/cards/watchlist-card"
import { SeasonalMilestonesCard } from "@/components/cards/seasonal-milestones-card"
import axios from "axios"
import { TopPerformer } from "@/types"


export default async function CardsWrapper() {
    const response = await axios.get<TopPerformer[]>('http://localhost:8000/home/top-performers')
    const topPerformers: TopPerformer[] = response.data

    return (
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TrendingQueriesCard />
            <UpcomingGamesCard />
            <TopPerformersCard data={topPerformers} />
            <QuickStatsCard />
            <TeamStandingsCard />
            <NewsInsightsCard />
            <WatchlistCard />
            <SeasonalMilestonesCard />
        </div>
    )
}
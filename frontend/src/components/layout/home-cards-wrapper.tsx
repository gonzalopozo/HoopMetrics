import { TrendingQueriesCard } from "@/components/cards/trending-queries-card"
import { UpcomingGamesCard } from "@/components/cards/upcoming-games-card"
import { TopPerformersCard } from "@/components/cards/top-performers-card"
import { QuickStatsCard } from "@/components/cards/quick-stats-card"
import { TeamStandingsCard } from "@/components/cards/team-standings-card"
import { NewsInsightsCard } from "@/components/cards/news-insights-card"
import { WatchlistCard } from "@/components/cards/watchlist-card"
import { SeasonalMilestonesCard } from "@/components/cards/seasonal-milestones-card"


export default async function CardsWrapper() {
    

    return (
        <>
            <TrendingQueriesCard />
            <UpcomingGamesCard />
            <TopPerformersCard />
            <QuickStatsCard />
            <TeamStandingsCard />
            <NewsInsightsCard />
            <WatchlistCard />
            <SeasonalMilestonesCard />
        </>
    )
}
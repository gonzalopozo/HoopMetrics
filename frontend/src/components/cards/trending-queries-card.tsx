import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const TRENDING_QUERIES = [
	{
		text: "LeBron James",
		href: "/players/349",
		description: "View LeBron James player stats",
	},
	{
		text: "Top scorers today",
		href: "/players",
		description: "Browse players sorted by points per game",
	},
	{
		text: "Lakers team stats",
		href: "/teams/14",
		description: "View LA Lakers team profile",
	},
	{
		text: "Stephen Curry",
		href: "/players/244",
		description: "View Stephen Curry player stats",
	},
	{
		text: "Golden State Warriors",
		href: "/teams/10",
		description: "View Golden State Warriors team profile",
	},
	{
		text: "NBA teams ranking",
		href: "/teams",
		description: "Browse all NBA teams",
	},
	{
		text: "Kevin Durant",
		href: "/players/591",
		description: "View Kevin Durant player stats",
	},
	{
		text: "Boston Celtics",
		href: "/teams/2",
		description: "View Boston Celtics team profile",
	},  
	{
		text: "Giannis Antetokounmpo",
		href: "/players/424",
		description: "View Giannis Antetokounmpo player stats",
	},
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
								href={query.href}
								className="group flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								title={query.description}
							>
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
									{index + 1}
								</span>
								<span className="group-hover:text-primary transition-colors">
									{query.text}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

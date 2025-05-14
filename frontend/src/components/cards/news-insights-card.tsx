import Link from "next/link"
import { Bell } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const NEWS_ITEMS = [
    "Lakers' Anthony Davis questionable for next game with ankle sprain",
    "Celtics extend winning streak to 8 games with victory over Bulls",
    "Rookie sensation Victor Wembanyama records fifth triple-double",
    "Trade deadline approaching: Teams looking to make moves",
]

export function NewsInsightsCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="News & Insights" icon={Bell} />
            <div className="p-4">
                <ul className="space-y-3">
                    {NEWS_ITEMS.map((news, index) => (
                        <li key={index} className="border-b border-border pb-2 last:border-0 last:pb-0">
                            <Link href="#" className="block py-1 text-sm hover:text-primary">
                                {news}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

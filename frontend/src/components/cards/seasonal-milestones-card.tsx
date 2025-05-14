import { Award } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const MILESTONES = [
    { player: "Nikola Jokić", achievement: "Most triple-doubles (18)" },
    { player: "Shai Gilgeous-Alexander", achievement: "Leading scorer (31.4 PPG)" },
    { player: "Rudy Gobert", achievement: "Most blocks (189)" },
    { player: "Tyrese Haliburton", achievement: "Most assists (10.9 APG)" },
]

export function SeasonalMilestonesCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="Seasonal Milestones" icon={Award} />
            <div className="p-4">
                <ul className="space-y-3">
                    {MILESTONES.map((milestone, index) => (
                        <li key={index} className="rounded-lg border border-border p-3">
                            <div className="font-medium">{milestone.player}</div>
                            <div className="text-sm text-muted-foreground">{milestone.achievement}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

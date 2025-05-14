import { Table } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const TEAM_STANDINGS = [
    { team: "BOS", wins: 58, losses: 24 },
    { team: "MIL", wins: 56, losses: 26 },
    { team: "PHI", wins: 54, losses: 28 },
    { team: "CLE", wins: 51, losses: 31 },
    { team: "NYK", wins: 47, losses: 35 },
]

export function TeamStandingsCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="Team Standings" icon={Table} />
            <div className="p-4">
                <div className="mb-2 text-sm font-medium">Eastern Conference</div>
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-accent">
                                <th className="p-2 text-left font-medium text-muted-foreground">Team</th>
                                <th className="p-2 text-center font-medium text-muted-foreground">W</th>
                                <th className="p-2 text-center font-medium text-muted-foreground">L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TEAM_STANDINGS.map((team, index) => (
                                <tr key={index} className={`border-b border-border ${team.team === "BOS" ? "bg-accent/50" : ""}`}>
                                    <td className="p-2 font-medium">{team.team}</td>
                                    <td className="p-2 text-center">{team.wins}</td>
                                    <td className="p-2 text-center">{team.losses}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

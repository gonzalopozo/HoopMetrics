// import { Card, CardContent } from "@/components/ui/card"
// import {
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
//   Legend,
//   ResponsiveContainer,
// } from "@/components/ui/chart"
// import type { Player } from "@/lib/data"

// interface SkillsChartProps {
//   player: Player
// }

// export function SkillsChart({ player }: SkillsChartProps) {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-xl font-bold mb-2">Player Skills</h3>
//         <p className="text-muted-foreground mb-4">Skill breakdown for {player.name}</p>

//         <div className="h-[300px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <RadarChart
//               cx="50%"
//               cy="50%"
//               outerRadius="80%"
//               data={[
//                 {
//                   subject: "Scoring",
//                   A: player.skills.scoring,
//                   fullMark: 100,
//                 },
//                 {
//                   subject: "Passing",
//                   A: player.skills.passing,
//                   fullMark: 100,
//                 },
//                 {
//                   subject: "Defense",
//                   A: player.skills.defense,
//                   fullMark: 100,
//                 },
//                 {
//                   subject: "Leadership",
//                   A: player.skills.leadership,
//                   fullMark: 100,
//                 },
//                 {
//                   subject: "Athleticism",
//                   A: player.skills.athleticism,
//                   fullMark: 100,
//                 },
//                 {
//                   subject: "Basketball IQ",
//                   A: player.skills.basketball_iq,
//                   fullMark: 100,
//                 },
//               ]}
//             >
//               <PolarGrid stroke="hsl(var(--muted-foreground)/0.3)" />
//               <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))" }} />
//               <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
//               <Radar
//                 name="Skills"
//                 dataKey="A"
//                 stroke="hsl(var(--primary))"
//                 fill="hsl(var(--primary))"
//                 fillOpacity={0.6}
//               />
//               <Legend />
//             </RadarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="mt-6">
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground mb-2">Skill Analysis</div>
//               <p>
//                 {player.name} shows exceptional abilities in
//                 {player.skills.scoring > 95 ? " scoring, " : " "}
//                 {player.skills.passing > 95 ? "passing, " : ""}
//                 {player.skills.defense > 95 ? "defense, " : ""}
//                 {player.skills.leadership > 95 ? "leadership, " : ""}
//                 {player.skills.basketball_iq > 95 ? "basketball IQ, " : ""}
//                 making them one of the most versatile players in the league.
//               </p>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

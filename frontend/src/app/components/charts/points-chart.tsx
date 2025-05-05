// import { Card, CardContent } from "@/components/ui/card"
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"
// import type { Player } from "@/lib/data"

// interface PointsChartProps {
//   player: Player
// }

// export function PointsChart({ player }: PointsChartProps) {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-xl font-bold mb-2">Points Per Game</h3>
//         <p className="text-muted-foreground mb-4">Last 10 games performance for {player.name}</p>

//         <div className="h-[300px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={player.pointsHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//               <XAxis dataKey="game" />
//               <YAxis domain={[0, "dataMax + 5"]} />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "rgba(255, 255, 255, 0.9)",
//                   borderRadius: "8px",
//                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//                   border: "none",
//                 }}
//                 formatter={(value) => [`${value} PTS`, "Points"]}
//               />
//               <Legend />
//               <Bar
//                 dataKey="points"
//                 fill="hsl(var(--primary))"
//                 name="Points"
//                 radius={[4, 4, 0, 0]}
//                 animationDuration={1500}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="mt-6 grid grid-cols-2 gap-4">
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground">Average Points</div>
//               <div className="text-2xl font-bold">
//                 {(
//                   player.pointsHistory.reduce((sum, game) => sum + game.points, 0) / player.pointsHistory.length
//                 ).toFixed(1)}
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground">Highest Score</div>
//               <div className="text-2xl font-bold">{Math.max(...player.pointsHistory.map((game) => game.points))}</div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

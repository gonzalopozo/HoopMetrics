// import { Card, CardContent } from "@/components/ui/card"
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "@/components/ui/chart"
// import type { Player } from "@/lib/data"

// interface SeasonChartProps {
//   player: Player
// }

// export function SeasonChart({ player }: SeasonChartProps) {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-xl font-bold mb-2">Season Performance</h3>
//         <p className="text-muted-foreground mb-4">Monthly scoring averages for {player.name}</p>

//         <div className="h-[300px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={player.seasonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//               <XAxis dataKey="month" />
//               <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "rgba(255, 255, 255, 0.9)",
//                   borderRadius: "8px",
//                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//                   border: "none",
//                 }}
//                 formatter={(value) => [`${value} PPG`, "Points Per Game"]}
//               />
//               <Legend />
//               <Line
//                 type="monotone"
//                 dataKey="ppg"
//                 stroke="hsl(var(--primary))"
//                 strokeWidth={3}
//                 name="PPG"
//                 activeDot={{ r: 8, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="mt-6 grid grid-cols-3 gap-4">
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground">Season High</div>
//               <div className="text-2xl font-bold">
//                 {Math.max(...player.seasonData.map((month) => month.ppg)).toFixed(1)}
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground">Season Low</div>
//               <div className="text-2xl font-bold">
//                 {Math.min(...player.seasonData.map((month) => month.ppg)).toFixed(1)}
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground">Season Avg</div>
//               <div className="text-2xl font-bold">
//                 {(player.seasonData.reduce((sum, month) => sum + month.ppg, 0) / player.seasonData.length).toFixed(1)}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

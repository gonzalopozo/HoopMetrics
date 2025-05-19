"use client"

import { useEffect, useState } from "react"
import { Server, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"

interface SystemHealthCardProps {
  className?: string
  dateRange: DateRange
}

export function SystemHealthCard({ className, dateRange }: SystemHealthCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [systemData, setSystemData] = useState({
    uptime: 0,
    apiErrorRate: 0,
    avgLatency: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    recentErrors: [] as { time: string; endpoint: string; code: number; message: string }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSystemData({
        uptime: 99.98,
        apiErrorRate: 0.42,
        avgLatency: 128,
        cpuUsage: 42,
        memoryUsage: 68,
        diskUsage: 57,
        recentErrors: [
          { time: "10:42 AM", endpoint: "/api/stats/team", code: 500, message: "Database connection timeout" },
          { time: "09:15 AM", endpoint: "/api/user/profile", code: 404, message: "User not found" },
          { time: "08:30 AM", endpoint: "/api/games/upcoming", code: 503, message: "External API unavailable" },
          { time: "Yesterday", endpoint: "/api/auth/login", code: 429, message: "Rate limit exceeded" },
        ],
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <Server className="mr-2 h-4 w-4 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>Server status and performance metrics</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="errors">Error Logs</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="mt-1 text-xl font-bold text-green-500">{systemData.uptime}%</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm text-muted-foreground">API Error Rate</div>
                    <div className="mt-1 text-xl font-bold text-amber-500">{systemData.apiErrorRate}%</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm text-muted-foreground">Avg. Latency</div>
                    <div className="mt-1 text-xl font-bold">{systemData.avgLatency} ms</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">CPU Usage</span>
                      <span>{systemData.cpuUsage}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className={`h-full rounded-full ${
                          systemData.cpuUsage > 80
                            ? "bg-red-500"
                            : systemData.cpuUsage > 60
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${systemData.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Memory Usage</span>
                      <span>{systemData.memoryUsage}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className={`h-full rounded-full ${
                          systemData.memoryUsage > 80
                            ? "bg-red-500"
                            : systemData.memoryUsage > 60
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${systemData.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Disk Usage</span>
                      <span>{systemData.diskUsage}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className={`h-full rounded-full ${
                          systemData.diskUsage > 80
                            ? "bg-red-500"
                            : systemData.diskUsage > 60
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${systemData.diskUsage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="errors">
                <div className="mt-4 space-y-1">
                  <div className="flex items-center text-sm font-medium">
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                    Recent Error Logs
                  </div>
                  <div className="rounded-lg border border-border">
                    <div className="max-h-[200px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="whitespace-nowrap px-3 py-2 text-left font-medium">Time</th>
                            <th className="whitespace-nowrap px-3 py-2 text-left font-medium">Endpoint</th>
                            <th className="whitespace-nowrap px-3 py-2 text-left font-medium">Code</th>
                            <th className="whitespace-nowrap px-3 py-2 text-left font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {systemData.recentErrors.map((error, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="whitespace-nowrap px-3 py-2 text-xs">{error.time}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs font-mono">{error.endpoint}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                    error.code >= 500
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                      : error.code >= 400
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  {error.code}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs">{error.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}

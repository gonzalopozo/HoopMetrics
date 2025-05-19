"use client"

import { useEffect, useState } from "react"
import { Users, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"

// Simple bar chart component
function BarChart({ data, labels, maxValue }: { data: number[]; labels: string[]; maxValue: number }) {
  return (
    <div className="mt-4 space-y-2">
      {data.map((value, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>{labels[index]}</span>
            <span className="font-medium">{value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ActiveUsersCardProps {
  className?: string
  dateRange: DateRange
}

export function ActiveUsersCard({ className, dateRange }: ActiveUsersCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  const [userData, setUserData] = useState({
    daily: 0,
    monthly: 0,
    avgSessionTime: 0,
    featureUsage: [] as { feature: string; count: number }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUserData({
        daily: 3250,
        monthly: 12800,
        avgSessionTime: 8.5,
        featureUsage: [
          { feature: "Player Stats", count: 8500 },
          { feature: "Team Comparisons", count: 6200 },
          { feature: "Game Predictions", count: 4800 },
          { feature: "Historical Data", count: 3600 },
          { feature: "Custom Reports", count: 2100 },
        ],
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  const maxFeatureUsage = Math.max(...userData.featureUsage.map((item) => item.count))

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <Users className="mr-2 h-4 w-4 text-primary" />
            Active Users & Usage Metrics
          </CardTitle>
          <CardDescription>User engagement and feature adoption</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Active Users</TabsTrigger>
                <TabsTrigger value="features">Feature Usage</TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="space-y-4">
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm font-medium text-muted-foreground">Daily Active</div>
                    <div className="mt-1 text-2xl font-bold">{userData.daily.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm font-medium text-muted-foreground">Monthly Active</div>
                    <div className="mt-1 text-2xl font-bold">{userData.monthly.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-sm font-medium text-muted-foreground">DAU/MAU Ratio</div>
                    <div className="mt-1 text-2xl font-bold">
                      {((userData.daily / userData.monthly) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Average Session Duration</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">{userData.avgSessionTime} minutes</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(userData.avgSessionTime / 15) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>0 min</span>
                    <span>15 min</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features">
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-medium">Feature Adoption Rates</div>
                  <p className="text-xs text-muted-foreground">
                    Most used features in the last{" "}
                    {dateRange.from && dateRange.to
                      ? `${Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days`
                      : "30 days"}
                  </p>
                </div>
                <BarChart
                  data={userData.featureUsage.map((item) => item.count)}
                  labels={userData.featureUsage.map((item) => item.feature)}
                  maxValue={maxFeatureUsage}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}

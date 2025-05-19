"use client"

import { useEffect, useState } from "react"
import { BellRing } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

interface AlertsOverviewCardProps {
  className?: string
  dateRange: DateRange
}

export function AlertsOverviewCard({ className, dateRange }: AlertsOverviewCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [alertsData, setAlertsData] = useState({
    activeAlerts: 0,
    triggeredToday: 0,
    unreadNotifications: 0,
    recentAlerts: [] as { time: string; type: string; message: string; severity: "low" | "medium" | "high" }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAlertsData({
        activeAlerts: 8,
        triggeredToday: 12,
        unreadNotifications: 5,
        recentAlerts: [
          { time: "10:42 AM", type: "System", message: "High CPU usage detected", severity: "medium" },
          { time: "09:15 AM", type: "Security", message: "Multiple failed login attempts", severity: "high" },
          { time: "08:30 AM", type: "Database", message: "Slow query performance", severity: "low" },
          { time: "Yesterday", type: "API", message: "External service unavailable", severity: "medium" },
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
            <BellRing className="mr-2 h-4 w-4 text-primary" />
            Alerts & Notifications
          </CardTitle>
          <CardDescription>System alerts and notification status</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Active Alerts</div>
                <div className="mt-1 text-xl font-bold">{alertsData.activeAlerts}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Triggered Today</div>
                <div className="mt-1 text-xl font-bold">{alertsData.triggeredToday}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Unread</div>
                <div className="mt-1 text-xl font-bold">{alertsData.unreadNotifications}</div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-sm font-medium">Recent Alerts</div>
              <div className="rounded-lg border border-border">
                <div className="max-h-[120px] overflow-auto">
                  <div className="divide-y divide-border">
                    {alertsData.recentAlerts.map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div
                            className={`mr-3 h-2 w-2 rounded-full ${
                              alert.severity === "high"
                                ? "bg-red-500"
                                : alert.severity === "medium"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium">{alert.message}</div>
                            <div className="text-xs text-muted-foreground">
                              {alert.type} • {alert.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

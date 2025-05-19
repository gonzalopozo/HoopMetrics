"use client"

import { useEffect, useState } from "react"
import { History, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

interface UserActivityCardProps {
  className?: string
  dateRange: DateRange
}

export function UserActivityCard({ className, dateRange }: UserActivityCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activityData, setActivityData] = useState({
    recentActivity: [] as {
      id: string
      user: string
      action: string
      resource: string
      time: string
      ip: string
    }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setActivityData({
        recentActivity: [
          {
            id: "act-1",
            user: "admin@hoopmetrics.com",
            action: "Updated subscription",
            resource: "User #1245",
            time: "10:42 AM",
            ip: "192.168.1.1",
          },
          {
            id: "act-2",
            user: "john.doe@example.com",
            action: "Login",
            resource: "Account",
            time: "10:30 AM",
            ip: "203.0.113.1",
          },
          {
            id: "act-3",
            user: "admin@hoopmetrics.com",
            action: "Created new alert",
            resource: "System Alerts",
            time: "10:15 AM",
            ip: "192.168.1.1",
          },
          {
            id: "act-4",
            user: "jane.smith@example.com",
            action: "Password reset",
            resource: "Account",
            time: "09:58 AM",
            ip: "198.51.100.1",
          },
          {
            id: "act-5",
            user: "admin@hoopmetrics.com",
            action: "Updated system settings",
            resource: "System Configuration",
            time: "09:45 AM",
            ip: "192.168.1.1",
          },
          {
            id: "act-6",
            user: "support@hoopmetrics.com",
            action: "Closed ticket",
            resource: "Ticket #4532",
            time: "09:30 AM",
            ip: "192.168.1.2",
          },
          {
            id: "act-7",
            user: "mark.wilson@example.com",
            action: "Upgraded plan",
            resource: "Subscription",
            time: "09:15 AM",
            ip: "203.0.113.5",
          },
          {
            id: "act-8",
            user: "admin@hoopmetrics.com",
            action: "Added new feature flag",
            resource: "Feature Flags",
            time: "09:00 AM",
            ip: "192.168.1.1",
          },
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
            <History className="mr-2 h-4 w-4 text-primary" />
            User Activity Logs
          </CardTitle>
          <CardDescription>Recent user actions and system events</CardDescription>
        </div>
        <div className="relative w-[200px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">User</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Action</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Resource</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Time</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activityData.recentActivity.map((activity) => (
                    <tr key={activity.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{activity.user}</td>
                      <td className="whitespace-nowrap px-4 py-3">{activity.action}</td>
                      <td className="whitespace-nowrap px-4 py-3">{activity.resource}</td>
                      <td className="whitespace-nowrap px-4 py-3">{activity.time}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{activity.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

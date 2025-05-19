"use client"

import { useEffect, useState } from "react"
import { DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

interface RevenueByPlanCardProps {
  className?: string
  dateRange: DateRange
}

export function RevenueByPlanCard({ className, dateRange }: RevenueByPlanCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState({
    pro: 0,
    enterprise: 0,
    total: 0,
    arpu: {
      overall: 0,
      pro: 0,
      enterprise: 0,
    },
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setRevenueData({
        pro: 48000,
        enterprise: 67500,
        total: 115500,
        arpu: {
          overall: 31.5,
          pro: 15,
          enterprise: 150,
        },
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
            <DollarSign className="mr-2 h-4 w-4 text-primary" />
            Revenue by Plan
          </CardTitle>
          <CardDescription>Revenue breakdown and ARPU</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-sm text-muted-foreground">Total Monthly Revenue</div>
              <div className="text-3xl font-bold">${revenueData.total.toLocaleString()}</div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Pro Plan</span>
                  <span>${revenueData.pro.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(revenueData.pro / revenueData.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {((revenueData.pro / revenueData.total) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Enterprise Plan</span>
                  <span>${revenueData.enterprise.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(revenueData.enterprise / revenueData.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {((revenueData.enterprise / revenueData.total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-sm font-medium">Average Revenue Per User (ARPU)</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border p-2">
                  <div className="text-xs text-muted-foreground">Overall</div>
                  <div className="text-lg font-bold">${revenueData.arpu.overall}</div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="text-xs text-muted-foreground">Pro</div>
                  <div className="text-lg font-bold">${revenueData.arpu.pro}</div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="text-xs text-muted-foreground">Enterprise</div>
                  <div className="text-lg font-bold">${revenueData.arpu.enterprise}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

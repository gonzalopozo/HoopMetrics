"use client"

import { useEffect, useState } from "react"
import { UserMinus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

// Simple donut chart component
function DonutChart({ value, color }: { value: number; color: string }) {
  const circumference = 2 * Math.PI * 40
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex h-[120px] w-[120px] items-center justify-center">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
        {/* Foreground circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
        <span className="text-xs text-muted-foreground">Churn Rate</span>
      </div>
    </div>
  )
}

interface ChurnRateCardProps {
  className?: string
  dateRange: DateRange
}

export function ChurnRateCard({ className, dateRange }: ChurnRateCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [churnData, setChurnData] = useState({
    rate: 0,
    previousRate: 0,
    subscribers: 0,
    churned: 0,
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setChurnData({
        rate: 3.2,
        previousRate: 3.8,
        subscribers: 5250,
        churned: 168,
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  const isImproved = churnData.rate < churnData.previousRate
  const difference = Math.abs(churnData.rate - churnData.previousRate).toFixed(1)

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <UserMinus className="mr-2 h-4 w-4 text-primary" />
            Customer Churn Rate
          </CardTitle>
          <CardDescription>Subscriber cancellations per period</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <DonutChart
              value={churnData.rate}
              color={churnData.rate < 5 ? "rgb(var(--primary))" : "rgb(239, 68, 68)"}
            />

            <div className="text-center">
              <div className={`text-sm font-medium ${isImproved ? "text-green-500" : "text-red-500"}`}>
                {isImproved ? "↓" : "↑"} {difference}% from previous period
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Subscribers</div>
                  <div className="text-xl font-bold">{churnData.subscribers.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Churned Users</div>
                  <div className="text-xl font-bold">{churnData.churned.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

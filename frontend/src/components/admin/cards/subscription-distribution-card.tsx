"use client"

import { useEffect, useState } from "react"
import { Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

// Simple pie chart component
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((acc, item) => acc + item.value, 0)
  let cumulativePercent = 0

  return (
    <div className="relative flex h-[160px] w-[160px] items-center justify-center mx-auto">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        {data.map((item, i) => {
          const percent = (item.value / total) * 100
          const startAngle = cumulativePercent * 3.6 // 3.6 = 360 / 100
          const endAngle = (cumulativePercent + percent) * 3.6

          // Calculate the SVG arc path
          const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
          const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
          const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
          const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))

          const largeArcFlag = percent > 50 ? 1 : 0

          const pathData = [`M 50 50`, `L ${x1} ${y1}`, `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

          cumulativePercent += percent

          return <path key={i} d={pathData} fill={item.color} />
        })}
        {/* Inner circle for donut effect */}
        <circle cx="50" cy="50" r="25" fill="hsl(var(--card))" />
      </svg>
    </div>
  )
}

interface SubscriptionDistributionCardProps {
  className?: string
  dateRange: DateRange
}

export function SubscriptionDistributionCard({ className, dateRange }: SubscriptionDistributionCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState({
    free: 0,
    pro: 0,
    enterprise: 0,
    total: 0,
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSubscriptionData({
        free: 8500,
        pro: 3200,
        enterprise: 450,
        total: 12150,
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  const pieData = [
    { label: "Free", value: subscriptionData.free, color: "hsl(var(--muted))" },
    { label: "Pro", value: subscriptionData.pro, color: "hsl(var(--primary))" },
    { label: "Enterprise", value: subscriptionData.enterprise, color: "hsl(215, 100%, 50%)" },
  ]

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <Layers className="mr-2 h-4 w-4 text-primary" />
            Subscription Plans
          </CardTitle>
          <CardDescription>Distribution of subscription tiers</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <PieChart data={pieData} />

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {pieData.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <div className="text-lg font-bold">{item.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {((item.value / subscriptionData.total) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-border p-3 text-center">
              <div className="text-sm text-muted-foreground">Total Subscribers</div>
              <div className="text-2xl font-bold">{subscriptionData.total.toLocaleString()}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

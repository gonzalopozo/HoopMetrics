"use client"

import { useEffect, useState } from "react"
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

// Import a chart library like Chart.js or Recharts
// For this example, we'll create a mock chart component
interface LineChartProps {
  labels: string[];
  colors: string[];
  data?: number[][];
}

function LineChart({ labels, colors }: LineChartProps) {
  return (
    <div className="h-[200px] w-full">
      {/* This would be replaced with an actual chart component */}
      <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed border-border p-4 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            {colors.map((color: string, i: number) => (
              <div key={i} className="flex items-center space-x-1">
                <div className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-xs">{labels[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Chart visualization would appear here</p>
        </div>
      </div>
    </div>
  )
}

interface MrrTrendsCardProps {
  className?: string
  dateRange: DateRange
}

export function MrrTrendsCard({ className, dateRange }: MrrTrendsCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mrrData, setMrrData] = useState({
    current: 0,
    new: 0,
    expansion: 0,
    churn: 0,
    netGrowth: 0,
    percentChange: 0,
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setMrrData({
        current: 125000,
        new: 15000,
        expansion: 5000,
        churn: -8000,
        netGrowth: 12000,
        percentChange: 10.7,
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  // Mock chart data
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Current MRR",
        data: [95000, 100000, 105000, 110000, 115000, 125000],
      },
      {
        label: "New MRR",
        data: [10000, 12000, 13000, 14000, 15000, 15000],
      },
      {
        label: "Expansion MRR",
        data: [3000, 3500, 4000, 4500, 5000, 5000],
      },
      {
        label: "Churned MRR",
        data: [-5000, -6000, -7000, -7500, -8000, -8000],
      },
    ],
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <TrendingUp className="mr-2 h-4 w-4 text-primary" />
            Monthly Recurring Revenue (MRR)
          </CardTitle>
          <CardDescription>Track revenue growth and predict cash flow</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MrrMetricCard
                title="Current MRR"
                value={`$${(mrrData.current / 1000).toFixed(1)}k`}
                change={mrrData.percentChange}
                isPositive={mrrData.percentChange > 0}
              />
              <MrrMetricCard
                title="New MRR"
                value={`$${(mrrData.new / 1000).toFixed(1)}k`}
                change={12.5}
                isPositive={true}
              />
              <MrrMetricCard
                title="Expansion MRR"
                value={`$${(mrrData.expansion / 1000).toFixed(1)}k`}
                change={8.2}
                isPositive={true}
              />
              <MrrMetricCard
                title="Churned MRR"
                value={`$${(Math.abs(mrrData.churn) / 1000).toFixed(1)}k`}
                change={5.3}
                isPositive={false}
              />
            </div>
            <LineChart
              data={chartData.datasets.map((dataset) => dataset.data)}
              labels={chartData.datasets.map((dataset) => dataset.label)}
              colors={["bg-primary", "bg-green-500", "bg-blue-500", "bg-red-500"]}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface MrrMetricCardProps {
  title: string
  value: string
  change: number
  isPositive: boolean
}

function MrrMetricCard({ title, value, change, isPositive }: MrrMetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className={cn("mt-1 flex items-center text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
        {isPositive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
        {change}% from last period
      </div>
    </div>
  )
}

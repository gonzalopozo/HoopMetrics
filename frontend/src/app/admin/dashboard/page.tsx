"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { MrrTrendsCard } from "@/components/admin/cards/mrr-trends-card"
import { ChurnRateCard } from "@/components/admin/cards/churn-rate-card"
import { ActiveUsersCard } from "@/components/admin/cards/active-users-card"
import { SubscriptionDistributionCard } from "@/components/admin/cards/subscription-distribution-card"
import { RevenueByPlanCard } from "@/components/admin/cards/revenue-by-plan-card"
import { SupportTicketsCard } from "@/components/admin/cards/support-tickets-card"
import { SystemHealthCard } from "@/components/admin/cards/system-health-card"
import { TaskQueueCard } from "@/components/admin/cards/task-queue-card"
import { AlertsOverviewCard } from "@/components/admin/cards/alerts-overview-card"
import { UserActivityCard } from "@/components/admin/cards/user-activity-card"
import { DateRangePicker } from "@/components/admin/date-range-picker"

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })

  return (
    <>
      <AdminHeader title="Admin Dashboard" description="Monitor key business metrics and system health">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </AdminHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Revenue Metrics */}
        <MrrTrendsCard className="col-span-1 lg:col-span-2" dateRange={dateRange} />
        <ChurnRateCard dateRange={dateRange} />
        <RevenueByPlanCard dateRange={dateRange} />

        {/* User Metrics */}
        <ActiveUsersCard className="col-span-1 lg:col-span-2" dateRange={dateRange} />
        <SubscriptionDistributionCard dateRange={dateRange} />
        <SupportTicketsCard dateRange={dateRange} />

        {/* System Metrics */}
        <SystemHealthCard className="col-span-1 lg:col-span-2" dateRange={dateRange} />
        <TaskQueueCard dateRange={dateRange} />
        <AlertsOverviewCard dateRange={dateRange} />

        {/* User Activity Logs */}
        <UserActivityCard className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4" dateRange={dateRange} />
      </div>
    </>
  )
}

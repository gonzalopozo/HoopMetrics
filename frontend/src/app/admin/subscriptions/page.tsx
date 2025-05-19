"use client"

// import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Download, MoreHorizontal } from "lucide-react"

export default function AdminSubscriptionsPage() {
  // const [isLoading, setIsLoading] = useState(false)

  // Sample subscription data
  const subscriptions = [
    {
      id: 1,
      user: "John Doe",
      email: "john@example.com",
      plan: "Enterprise",
      status: "Active",
      amount: "$150.00",
      nextBilling: "Jun 15, 2023",
    },
    {
      id: 2,
      user: "Jane Smith",
      email: "jane@example.com",
      plan: "Pro",
      status: "Active",
      amount: "$15.00",
      nextBilling: "Jun 22, 2023",
    },
    {
      id: 3,
      user: "Robert Johnson",
      email: "robert@example.com",
      plan: "Pro",
      status: "Canceled",
      amount: "$15.00",
      nextBilling: "N/A",
    },
    {
      id: 4,
      user: "Emily Davis",
      email: "emily@example.com",
      plan: "Enterprise",
      status: "Active",
      amount: "$150.00",
      nextBilling: "Jun 30, 2023",
    },
    {
      id: 5,
      user: "Michael Wilson",
      email: "michael@example.com",
      plan: "Pro",
      status: "Past Due",
      amount: "$15.00",
      nextBilling: "Jun 10, 2023",
    },
  ]

  return (
    <>
      <AdminHeader title="Subscription Management" description="Manage user subscriptions and billing">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              className="h-10 w-[200px] rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </AdminHeader>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Manage user subscriptions and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Next Billing</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{subscription.user}</td>
                      <td className="px-4 py-3">{subscription.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            subscription.plan === "Enterprise"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {subscription.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            subscription.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : subscription.status === "Canceled"
                                ? "bg-muted text-muted-foreground"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{subscription.amount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{subscription.nextBilling}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

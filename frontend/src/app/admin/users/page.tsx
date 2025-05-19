"use client"

// import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, UserPlus, Filter, MoreHorizontal } from "lucide-react"

export default function AdminUsersPage() {
  // const [isLoading, setIsLoading] = useState(false)

  // Sample user data
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Active",
      lastLogin: "Today, 10:30 AM",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "Active",
      lastLogin: "Yesterday, 3:45 PM",
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "User",
      status: "Inactive",
      lastLogin: "May 10, 2023",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: "Editor",
      status: "Active",
      lastLogin: "Today, 9:15 AM",
    },
    {
      id: 5,
      name: "Michael Wilson",
      email: "michael@example.com",
      role: "User",
      status: "Active",
      lastLogin: "May 15, 2023",
    },
  ]

  return (
    <>
      <AdminHeader title="User Management" description="Manage users, roles, and permissions">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="h-10 w-[200px] rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </AdminHeader>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage your system users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Last Login</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === "Admin"
                              ? "bg-primary/10 text-primary"
                              : user.role === "Editor"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.lastLogin}</td>
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

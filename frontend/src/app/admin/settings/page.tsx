"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Globe, Bell, Shield, Database, Mail } from "lucide-react"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <>
      <AdminHeader title="System Settings" description="Configure system-wide settings and preferences" />

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border">
              <div className="flex overflow-x-auto">
                <TabsList className="justify-start rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger
                    value="general"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="database"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Database
                  </TabsTrigger>
                  <TabsTrigger
                    value="email"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="p-4">
              <TabsContent value="general" className="mt-0 border-0 p-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">General Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure general system settings</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="site-name" className="text-sm font-medium">
                        Site Name
                      </label>
                      <input
                        id="site-name"
                        type="text"
                        defaultValue="HoopMetrics"
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="site-description" className="text-sm font-medium">
                        Site Description
                      </label>
                      <textarea
                        id="site-description"
                        defaultValue="Advanced NBA statistics, analytics, and insights for basketball fans and analysts"
                        rows={3}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="timezone" className="text-sm font-medium">
                        Default Timezone
                      </label>
                      <select
                        id="timezone"
                        defaultValue="America/New_York"
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="maintenance-mode"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="maintenance-mode" className="text-sm font-medium">
                        Enable Maintenance Mode
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 border-0 p-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure system notifications and alerts</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-medium">Alert Thresholds</h4>
                      <div className="mt-2 space-y-3">
                        <div className="grid gap-2">
                          <label htmlFor="cpu-threshold" className="text-sm">
                            CPU Usage Threshold (%)
                          </label>
                          <input
                            id="cpu-threshold"
                            type="number"
                            defaultValue="80"
                            min="0"
                            max="100"
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="memory-threshold" className="text-sm">
                            Memory Usage Threshold (%)
                          </label>
                          <input
                            id="memory-threshold"
                            type="number"
                            defaultValue="85"
                            min="0"
                            max="100"
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="disk-threshold" className="text-sm">
                            Disk Usage Threshold (%)
                          </label>
                          <input
                            id="disk-threshold"
                            type="number"
                            defaultValue="90"
                            min="0"
                            max="100"
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-medium">Notification Channels</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="email-notifications"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="email-notifications" className="text-sm">
                            Email Notifications
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="slack-notifications"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="slack-notifications" className="text-sm">
                            Slack Notifications
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="sms-notifications"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="sms-notifications" className="text-sm">
                            SMS Notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0 border-0 p-0">
                <div>Security settings content</div>
              </TabsContent>

              <TabsContent value="database" className="mt-0 border-0 p-0">
                <div>Database settings content</div>
              </TabsContent>

              <TabsContent value="email" className="mt-0 border-0 p-0">
                <div>Email settings content</div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}

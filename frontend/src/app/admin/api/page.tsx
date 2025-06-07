"use client"

import { useState, useEffect } from 'react'
import { 
    RefreshCw, 
    AlertTriangle, 
    Globe,
    TrendingUp,
    Clock,
    BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminHeader } from '@/components/admin/admin-header'
import { MetricCard } from '@/components/admin/metric-card'
import { useAdminData } from '@/hooks/use-admin-data'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminAPIPage() {
    const { 
        apiMetrics,
        loading, 
        error, 
        fetchAPIMetrics
    } = useAdminData()
    
    const [isRefreshing, setIsRefreshing] = useState(false)

    // ✅ Llamar fetchAPIMetrics cuando el componente se monta
    useEffect(() => {
        console.log('🔄 AdminAPIPage mounted, calling fetchAPIMetrics...')
        fetchAPIMetrics()
    }, [fetchAPIMetrics])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchAPIMetrics()
        setIsRefreshing(false)
    }

    if (loading && !apiMetrics) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="API Metrics" 
                    description="Monitor API performance and usage analytics"
                />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-muted rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="API Metrics" 
                    description="Monitor API performance and usage analytics"
                />
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-2 pt-6">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Error loading API metrics: {error}</span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                "Retry"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!apiMetrics) {
        console.log('❌ No API metrics data available yet')
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="API Metrics" 
                    description="Monitor API performance and usage analytics"
                />
                <Card>
                    <CardContent className="flex items-center justify-center py-8">
                        <span className="text-muted-foreground">No API metrics data available</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    console.log('✅ Rendering API metrics with data:', apiMetrics)

    const statusCodesData = Object.entries(apiMetrics.status_codes_distribution).map(([code, count]) => ({
        name: code,
        value: count
    }))

    const endpointsData = apiMetrics.most_used_endpoints.map(endpoint => ({
        name: endpoint.endpoint,
        value: endpoint.count
    }))

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="API Metrics" 
                description="Monitor API performance and usage analytics"
            >
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </AdminHeader>

            {/* API Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Requests Today"
                    value={apiMetrics.total_requests_today.toLocaleString()}
                    description="Total API requests today"
                    icon={<Globe className="h-4 w-4" />}
                    trend={{
                        value: 12.5,
                        isPositive: true
                    }}
                />
                <MetricCard
                    title="Requests This Week"
                    value={apiMetrics.total_requests_this_week.toLocaleString()}
                    description="Total API requests this week"
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                    title="Avg Response Time"
                    value={`${apiMetrics.avg_response_time.toFixed(0)}ms`}
                    description="Average response time"
                    icon={<Clock className="h-4 w-4" />}
                    valueClassName={apiMetrics.avg_response_time > 100 ? "text-red-600" : "text-green-600"}
                />
                <MetricCard
                    title="Error Rate"
                    value={`${apiMetrics.error_rate.toFixed(1)}%`}
                    description="API error rate"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    valueClassName={apiMetrics.error_rate > 5 ? "text-red-600" : "text-green-600"}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Status Codes Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusCodesData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusCodesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Requests by Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={apiMetrics.requests_by_hour}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="requests" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Endpoint Usage */}
            <Card>
                <CardHeader>
                    <CardTitle>Most Used Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={endpointsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="name" 
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                interval={0}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
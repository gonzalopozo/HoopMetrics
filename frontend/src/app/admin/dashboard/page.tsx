"use client"

import { useState } from 'react'
import { 
    RefreshCw, 
    Cpu, 
    Server, 
    HardDrive, 
    Activity,
    Users,
    Database,
    CreditCard,
    Globe,
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboardPage() {
    const { 
        dashboardData, 
        loading, 
        error, 
        refreshAll 
    } = useAdminData();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshAll();
        setIsRefreshing(false);
    };

    if (loading && !dashboardData) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="Admin Dashboard" 
                    description="System overview and metrics"
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
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="Admin Dashboard" 
                    description="System overview and metrics"
                />
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-2 pt-6">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Error loading dashboard: {error}</span>
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
        );
    }

    if (!dashboardData) {
        return null;
    }

    const { 
        system_health, 
        database_metrics, 
        user_metrics, 
        subscription_metrics, 
        api_metrics,
        last_updated 
    } = dashboardData;

    // Format uptime
    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    // Get status color based on percentage
    const getStatusColor = (percentage: number) => {
        if (percentage > 90) return "text-red-600";
        if (percentage > 75) return "text-yellow-600";
        return "text-green-600";
    };

    // Prepare chart data
    const requestsData = api_metrics.requests_by_hour.map(item => ({
        hour: item.hour,
        requests: item.requests
    }));

    const statusCodesData = Object.entries(api_metrics.status_codes_distribution).map(([code, count]) => ({
        name: code,
        value: count
    }));

    const userRoleData = Object.entries(user_metrics.users_by_role).map(([role, count]) => ({
        name: role,
        value: count
    }));

    const subscriptionData = Object.entries(subscription_metrics.subscriptions_by_plan).map(([plan, count]) => ({
        name: plan,
        value: count
    }));

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Admin Dashboard" 
                description="System overview and key metrics"
            >
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(last_updated).toLocaleString()}
                    </p>
                </div>
            </AdminHeader>

            {/* System Health Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="CPU Usage"
                    value={`${system_health.cpu_usage.toFixed(1)}%`}
                    description="Current CPU utilization"
                    icon={<Cpu className="h-4 w-4" />}
                    valueClassName={getStatusColor(system_health.cpu_usage)}
                />
                <MetricCard
                    title="Memory Usage"
                    value={`${system_health.memory_usage.toFixed(1)}%`}
                    description="RAM utilization"
                    icon={<Server className="h-4 w-4" />}
                    valueClassName={getStatusColor(system_health.memory_usage)}
                />
                <MetricCard
                    title="Disk Usage"
                    value={`${system_health.disk_usage.toFixed(1)}%`}
                    description="Storage utilization"
                    icon={<HardDrive className="h-4 w-4" />}
                    valueClassName={getStatusColor(system_health.disk_usage)}
                />
                <MetricCard
                    title="Uptime"
                    value={formatUptime(system_health.uptime_seconds)}
                    description="System uptime"
                    icon={<Activity className="h-4 w-4" />}
                    valueClassName="text-green-600"
                />
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Users"
                    value={user_metrics.total_users.toLocaleString()}
                    description={`${user_metrics.new_users_today} new today`}
                    icon={<Users className="h-4 w-4" />}
                    trend={{
                        value: ((user_metrics.new_users_this_week / user_metrics.total_users) * 100),
                        isPositive: true
                    }}
                />
                <MetricCard
                    title="Database Size"
                    value={`${database_metrics.database_size_mb.toFixed(1)} MB`}
                    description={`${database_metrics.tables_count} tables`}
                    icon={<Database className="h-4 w-4" />}
                />
                <MetricCard
                    title="Monthly Revenue"
                    value={`€${subscription_metrics.revenue_this_month.toFixed(2)}`}
                    description={`${subscription_metrics.active_subscriptions} active subs`}
                    icon={<CreditCard className="h-4 w-4" />}
                    trend={{
                        value: subscription_metrics.churn_rate,
                        isPositive: subscription_metrics.churn_rate < 5
                    }}
                />
                <MetricCard
                    title="API Requests Today"
                    value={api_metrics.total_requests_today.toLocaleString()}
                    description={`${api_metrics.avg_response_time.toFixed(0)}ms avg response`}
                    icon={<Globe className="h-4 w-4" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>API Requests by Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={requestsData}>
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

                <Card>
                    <CardHeader>
                        <CardTitle>HTTP Status Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusCodesData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
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
            </div>

            {/* Additional Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Users by Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userRoleData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subscriptions by Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={subscriptionData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#ffc658"
                                    dataKey="value"
                                    label
                                >
                                    {subscriptionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* System Health Details */}
            <Card>
                <CardHeader>
                    <CardTitle>System Health Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>CPU Usage</span>
                            <span className={getStatusColor(system_health.cpu_usage)}>
                                {system_health.cpu_usage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={system_health.cpu_usage} />
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Memory Usage</span>
                            <span className={getStatusColor(system_health.memory_usage)}>
                                {system_health.memory_usage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={system_health.memory_usage} />
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Disk Usage</span>
                            <span className={getStatusColor(system_health.disk_usage)}>
                                {system_health.disk_usage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={system_health.disk_usage} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{system_health.active_connections}</div>
                            <div className="text-sm text-muted-foreground">Active Connections</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{system_health.response_time_avg.toFixed(0)}ms</div>
                            <div className="text-sm text-muted-foreground">Avg Response Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{system_health.error_rate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Error Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{system_health.requests_per_minute}</div>
                            <div className="text-sm text-muted-foreground">Requests/min</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

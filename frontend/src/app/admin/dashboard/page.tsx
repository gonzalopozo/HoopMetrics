"use client"

import { useAdminData } from "@/hooks/use-admin-data"
import { AdminHeader } from "@/components/admin/admin-header"
import { MetricCard } from "@/components/admin/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
    RefreshCw, 
    Cpu, 
    Server, 
    HardDrive, 
    Activity, 
    Users, 
    DollarSign, 
    Globe,
    TrendingUp,
    BarChart2,
    AlertTriangle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    ComposedChart
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

    // ✅ Debug logging
    useEffect(() => {
        console.log('📊 Dashboard data updated:', {
            hasData: !!dashboardData,
            userRoles: dashboardData?.user_metrics?.users_by_role,
            subscriptionPlans: dashboardData?.subscription_metrics?.subscriptions_by_plan,
            timestamp: dashboardData?.last_updated
        });
    }, [dashboardData]);

    if (loading && !dashboardData) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="Admin Dashboard" 
                    description="System overview and metrics"
                />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
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
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Error loading dashboard data: {error}</span>
                        </div>
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

    const userRoleData = user_metrics?.users_by_role ? 
        Object.entries(user_metrics.users_by_role)
            .filter(([role, count]) => count > 0) // Solo roles con usuarios
            .map(([role, count]) => ({
                name: role,
                value: count
            })) : [];

    const subscriptionData = subscription_metrics?.subscriptions_by_plan ?
        Object.entries(subscription_metrics.subscriptions_by_plan)
            .filter(([plan, count]) => count > 0) // Solo planes con usuarios
            .map(([plan, count]) => ({
                name: plan,
                value: count
            })) : [];

    // Preparar datos para gráficos
    const dailyRequestsData = api_metrics.daily_requests_trend || [];
    const featureUsageData = api_metrics.feature_usage_stats || [];

    console.log('📈 Chart data prepared:', {
        userRoles: userRoleData,
        subscriptions: subscriptionData
    });

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
                    <span className="text-xs text-muted-foreground">
                        Last updated: {new Date(last_updated).toLocaleString()}
                    </span>
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
                    description="Registered users"
                    icon={<Users className="h-4 w-4" />}
                />
                <MetricCard
                    title="Active Users (24h)"
                    value={user_metrics.active_users_24h.toLocaleString()}
                    description="Users active in last 24 hours"
                    icon={<Activity className="h-4 w-4" />}
                />
                <MetricCard
                    title="API Requests Today"
                    value={api_metrics.total_requests_today.toLocaleString()}
                    description="Total requests today"
                    icon={<Globe className="h-4 w-4" />}
                />
                <MetricCard
                    title="Revenue This Month"
                    value={`${subscription_metrics.revenue_this_month.toLocaleString()}€`}
                    description="Monthly recurring revenue"
                    icon={<DollarSign className="h-4 w-4" />}
                />
            </div>

            {/* Distribution Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* User Roles Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Roles Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={userRoleData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {userRoleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Subscription Plans Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={subscriptionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
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

            {/* Database Health */}
            <Card>
                <CardHeader>
                    <CardTitle>Database Health</CardTitle>
                    <CardDescription>Current database performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active Connections</span>
                                <span>{database_metrics.active_connections}/{database_metrics.connection_pool_size}</span>
                            </div>
                            <Progress 
                                value={(database_metrics.active_connections / database_metrics.connection_pool_size) * 100} 
                                className="h-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Database Size</span>
                                <span>{database_metrics.database_size_mb.toFixed(1)} MB</span>
                            </div>
                            <Progress value={75} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Avg Query Time</span>
                                <span>{database_metrics.avg_query_time_ms.toFixed(1)} ms</span>
                            </div>
                            <Progress 
                                value={Math.min((database_metrics.avg_query_time_ms / 100) * 100, 100)} 
                                className="h-2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

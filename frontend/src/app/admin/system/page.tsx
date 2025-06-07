"use client"

import { useState } from 'react'
import { 
    RefreshCw, 
    Cpu, 
    Server, 
    HardDrive, 
    Activity,
    Database,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AdminHeader } from '@/components/admin/admin-header'
import { MetricCard } from '@/components/admin/metric-card'
import { useAdminData } from '@/hooks/use-admin-data'
import { Badge } from '@/components/ui/badge'

export default function AdminSystemPage() {
    const { 
        systemHealth, 
        databaseMetrics,
        loading, 
        error, 
        fetchSystemHealth,
        fetchDatabaseMetrics
    } = useAdminData()
    
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await Promise.all([
            fetchSystemHealth(),
            fetchDatabaseMetrics()
        ])
        setIsRefreshing(false)
    }

    const getStatusColor = (percentage: number) => {
        if (percentage > 90) return "text-red-600"
        if (percentage > 75) return "text-yellow-600"
        return "text-green-600"
    }

    const getStatusBadge = (percentage: number) => {
        if (percentage > 90) return { variant: "destructive" as const, text: "Critical", icon: XCircle }
        if (percentage > 75) return { variant: "secondary" as const, text: "Warning", icon: AlertTriangle }
        return { variant: "default" as const, text: "Healthy", icon: CheckCircle }
    }

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    if (loading && !systemHealth) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="System Health" 
                    description="Monitor system performance and health metrics"
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
                    title="System Health" 
                    description="Monitor system performance and health metrics"
                />
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-2 pt-6">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Error loading system health: {error}</span>
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

    if (!systemHealth || !databaseMetrics) {
        return null
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="System Health" 
                description="Monitor system performance and health metrics"
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

            {/* System Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="CPU Usage"
                    value={`${systemHealth.cpu_usage.toFixed(1)}%`}
                    description="Current CPU utilization"
                    icon={<Cpu className="h-4 w-4" />}
                    valueClassName={getStatusColor(systemHealth.cpu_usage)}
                />
                <MetricCard
                    title="Memory Usage"
                    value={`${systemHealth.memory_usage.toFixed(1)}%`}
                    description="RAM utilization"
                    icon={<Server className="h-4 w-4" />}
                    valueClassName={getStatusColor(systemHealth.memory_usage)}
                />
                <MetricCard
                    title="Disk Usage"
                    value={`${systemHealth.disk_usage.toFixed(1)}%`}
                    description="Storage utilization"
                    icon={<HardDrive className="h-4 w-4" />}
                    valueClassName={getStatusColor(systemHealth.disk_usage)}
                />
                <MetricCard
                    title="Uptime"
                    value={formatUptime(systemHealth.uptime_seconds)}
                    description="System uptime"
                    icon={<Activity className="h-4 w-4" />}
                    valueClassName="text-green-600"
                />
            </div>

            {/* Detailed System Metrics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            System Resources
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>CPU Usage</span>
                                <div className="flex items-center gap-2">
                                    <span className={getStatusColor(systemHealth.cpu_usage)}>
                                        {systemHealth.cpu_usage.toFixed(1)}%
                                    </span>
                                    <Badge variant={getStatusBadge(systemHealth.cpu_usage).variant}>
                                        {(() => {
                                            const IconComponent = getStatusBadge(systemHealth.cpu_usage).icon;
                                            return <IconComponent className="h-3 w-3 mr-1" />;
                                        })()}
                                        {getStatusBadge(systemHealth.cpu_usage).text}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={systemHealth.cpu_usage} />
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Memory Usage</span>
                                <div className="flex items-center gap-2">
                                    <span className={getStatusColor(systemHealth.memory_usage)}>
                                        {systemHealth.memory_usage.toFixed(1)}%
                                    </span>
                                    <Badge variant={getStatusBadge(systemHealth.memory_usage).variant}>
                                        {(() => {
                                            const IconComponent = getStatusBadge(systemHealth.memory_usage).icon;
                                            return <IconComponent className="h-3 w-3 mr-1" />;
                                        })()}
                                        {getStatusBadge(systemHealth.memory_usage).text}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={systemHealth.memory_usage} />
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Disk Usage</span>
                                <div className="flex items-center gap-2">
                                    <span className={getStatusColor(systemHealth.disk_usage)}>
                                        {systemHealth.disk_usage.toFixed(1)}%
                                    </span>
                                    <Badge variant={getStatusBadge(systemHealth.disk_usage).variant}>
                                        {(() => {
                                            const IconComponent = getStatusBadge(systemHealth.disk_usage).icon;
                                            return <IconComponent className="h-3 w-3 mr-1" />;
                                        })()}
                                        {getStatusBadge(systemHealth.disk_usage).text}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={systemHealth.disk_usage} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Database Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <div className="text-2xl font-bold">{databaseMetrics.active_connections}</div>
                                <div className="text-sm text-muted-foreground">Active Connections</div>
                            </div>
                            <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <div className="text-2xl font-bold">{databaseMetrics.idle_connections}</div>
                                <div className="text-sm text-muted-foreground">Idle Connections</div>
                            </div>
                            <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <div className="text-2xl font-bold">{databaseMetrics.tables_count}</div>
                                <div className="text-sm text-muted-foreground">Tables</div>
                            </div>
                            <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <div className="text-2xl font-bold">{databaseMetrics.database_size_mb.toFixed(0)}MB</div>
                                <div className="text-sm text-muted-foreground">DB Size</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Pool Utilization</span>
                                <span>{((databaseMetrics.active_connections / databaseMetrics.connection_pool_size) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(databaseMetrics.active_connections / databaseMetrics.connection_pool_size) * 100} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Network and Performance */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Network Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{systemHealth.active_connections}</div>
                            <div className="text-sm text-muted-foreground">Active Connections</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{systemHealth.requests_per_minute}</div>
                            <div className="text-sm text-muted-foreground">Requests/min</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{systemHealth.response_time_avg.toFixed(0)}ms</div>
                            <div className="text-sm text-muted-foreground">Avg Response Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{databaseMetrics.avg_query_time_ms.toFixed(1)}ms</div>
                            <div className="text-sm text-muted-foreground">Avg Query Time</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Error Monitoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{systemHealth.error_rate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Error Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{databaseMetrics.slow_queries_count}</div>
                            <div className="text-sm text-muted-foreground">Slow Queries</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
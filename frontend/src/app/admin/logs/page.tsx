"use client"

import { useState } from 'react'
import { 
    RefreshCw, 
    FileText, 
    Filter,
    AlertTriangle,
    Info,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminHeader } from '@/components/admin/admin-header'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAdminData } from '@/hooks/use-admin-data'
import { format } from 'date-fns'

interface LogEntry {
    timestamp: string
    level: string
    message: string
    module: string
}

export default function AdminLogsPage() {
    const { logs, loading, error, fetchLogs } = useAdminData()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [levelFilter, setLevelFilter] = useState("all")
    const [moduleFilter, setModuleFilter] = useState("all")

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchLogs()
        setIsRefreshing(false)
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.module.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesLevel = levelFilter === "all" || log.level.toLowerCase() === levelFilter.toLowerCase()
        const matchesModule = moduleFilter === "all" || log.module.toLowerCase() === moduleFilter.toLowerCase()
        
        return matchesSearch && matchesLevel && matchesModule
    })

    const logCounts = logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const uniqueModules = Array.from(new Set(logs.map(log => log.module)))

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-6">
                <AdminHeader 
                    title="System Logs" 
                    description="Monitor system logs and events"
                />
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                                <div className="h-3 bg-muted rounded w-3/4"></div>
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
                    title="System Logs" 
                    description="Monitor system logs and events"
                />
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-2 pt-6">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Error loading logs: {error}</span>
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

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="System Logs" 
                description="Monitor system logs and events"
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

            {/* Log Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <div>
                                <div className="text-2xl font-bold">{logCounts.ERROR || 0}</div>
                                <div className="text-sm text-muted-foreground">Errors</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <div>
                                <div className="text-2xl font-bold">{logCounts.WARNING || 0}</div>
                                <div className="text-sm text-muted-foreground">Warnings</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold">{logCounts.INFO || 0}</div>
                                <div className="text-sm text-muted-foreground">Info</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <div>
                                <div className="text-2xl font-bold">{logs.length}</div>
                                <div className="text-sm text-muted-foreground">Total Logs</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select value={levelFilter} onValueChange={setLevelFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Log Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="debug">Debug</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={moduleFilter} onValueChange={setModuleFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Module" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modules</SelectItem>
                                {uniqueModules.map(module => (
                                    <SelectItem key={module} value={module}>
                                        {module}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Recent Logs ({filteredLogs.length})</span>
                        <Badge variant="outline">{format(new Date(), 'MMM dd, yyyy HH:mm')}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No logs found matching the current filters.
                            </div>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <LogEntry key={index} log={log} />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface LogEntryProps {
    log: LogEntry
}

function LogEntry({ log }: LogEntryProps) {
    const getLevelIcon = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error':
                return <AlertTriangle className="h-4 w-4 text-red-600" />
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />
            case 'info':
                return <Info className="h-4 w-4 text-blue-600" />
            default:
                return <CheckCircle className="h-4 w-4 text-green-600" />
        }
    }

    const getLevelBadgeVariant = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error':
                return 'destructive' as const
            case 'warning':
                return 'secondary' as const
            case 'info':
                return 'default' as const
            default:
                return 'outline' as const
        }
    }

    return (
        <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
                {getLevelIcon(log.level)}
                <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                    {log.level}
                </Badge>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{log.module}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                    </span>
                </div>
                <p className="text-sm text-foreground break-words">{log.message}</p>
            </div>
        </div>
    )
}
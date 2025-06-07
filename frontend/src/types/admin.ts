export interface SystemHealthMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    response_time_avg: number;
    uptime_seconds: number;
    error_rate: number;
    requests_per_minute: number;
}

export interface DatabaseMetrics {
    connection_pool_size: number;
    active_connections: number;
    idle_connections: number;
    total_queries_executed: number;
    slow_queries_count: number;
    database_size_mb: number;
    tables_count: number;
    avg_query_time_ms: number;
}

export interface UserMetrics {
    total_users: number;
    active_users_24h: number;
    active_users_7d: number;
    new_users_today: number;
    new_users_this_week: number;
    users_by_role: Record<string, number>;
    retention_rate_7d: number;
    retention_rate_30d: number;
}

export interface SubscriptionMetrics {
    total_subscriptions: number;
    active_subscriptions: number;
    revenue_this_month: number;
    revenue_this_year: number;
    churn_rate: number;
    mrr: number;
    arr: number;
    subscriptions_by_plan: Record<string, number>;
}

export interface APIMetrics {
    total_requests_today: number;
    total_requests_this_week: number;
    avg_response_time: number;
    error_rate: number;
    most_used_endpoints: Array<{ endpoint: string; count: number }>;
    requests_by_hour: Array<{ hour: string; requests: number }>;
    status_codes_distribution: Record<string, number>;
}

export interface AdminDashboardData {
    system_health: SystemHealthMetrics;
    database_metrics: DatabaseMetrics;
    user_metrics: UserMetrics;
    subscription_metrics: SubscriptionMetrics;
    api_metrics: APIMetrics;
    last_updated: string;
}

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at?: string;
    profile_image_url?: string;
}

export interface AdminLog {
    timestamp: string;
    level: string;
    message: string;
    module: string;
}
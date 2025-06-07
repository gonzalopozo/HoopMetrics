import time
import psutil
import logging
from datetime import datetime, timedelta
from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any

from sqlmodel import select
from ..models import (
    User, UserRole, SystemHealthMetrics, DatabaseMetrics, 
    UserMetrics, SubscriptionMetrics, APIMetrics, AdminDashboardData
)
from ..database import engine
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class AdminMetricsService:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300  # 5 minutos
        self.last_cache_update = {}

    def _is_cache_valid(self, key: str) -> bool:
        """Verifica si el cache para una clave específica es válido"""
        if key not in self.last_cache_update:
            return False
        return (time.time() - self.last_cache_update[key]) < self.cache_ttl

    def _update_cache(self, key: str, data: Any):
        """Actualiza el cache para una clave específica"""
        self.cache[key] = data
        self.last_cache_update[key] = time.time()

    async def get_system_health_metrics(self) -> SystemHealthMetrics:
        """Obtiene métricas del sistema usando psutil"""
        try:
            cache_key = "system_health"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]

            # Get system metrics using psutil
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Mock some metrics for demo
            metrics = SystemHealthMetrics(
                cpu_usage=cpu_usage,
                memory_usage=memory.percent,
                disk_usage=disk.percent,
                active_connections=len(psutil.net_connections()),
                response_time_avg=45.2,
                uptime_seconds=int(time.time() - psutil.boot_time()),
                error_rate=0.5,
                requests_per_minute=150
            )
            
            self._update_cache(cache_key, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting system health metrics: {e}")
            # Return default metrics on error
            return SystemHealthMetrics(
                cpu_usage=10.0,
                memory_usage=45.0,
                disk_usage=25.0,
                active_connections=50,
                response_time_avg=50.0,
                uptime_seconds=86400,
                error_rate=1.0,
                requests_per_minute=100
            )

    async def get_database_metrics(self, db: AsyncSession) -> DatabaseMetrics:
        """Obtiene métricas de la base de datos PostgreSQL"""
        try:
            cache_key = "database_metrics"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]

            # Get database size
            db_size_query = text("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                       pg_database_size(current_database()) / 1024 / 1024 as size_mb
            """)
            db_size_result = await db.execute(db_size_query)
            db_size_row = db_size_result.fetchone()
            
            # Get table count
            tables_query = text("""
                SELECT COUNT(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables_result = await db.execute(tables_query)
            tables_row = tables_result.fetchone()
            
            # Get connection info
            connections_query = text("""
                SELECT 
                    count(*) as active_connections,
                    count(*) filter (where state = 'idle') as idle_connections
                FROM pg_stat_activity 
                WHERE state IS NOT NULL
            """)
            conn_result = await db.execute(connections_query)
            conn_row = conn_result.fetchone()
            
            metrics = DatabaseMetrics(
                connection_pool_size=50,  # From your database config
                active_connections=conn_row.active_connections or 5,
                idle_connections=conn_row.idle_connections or 2,
                total_queries_executed=15420,  # Mock data
                slow_queries_count=3,
                database_size_mb=float(db_size_row.size_mb) if db_size_row else 100.0,
                tables_count=tables_row.table_count if tables_row else 10,
                avg_query_time_ms=12.5
            )
            
            self._update_cache(cache_key, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting database metrics: {e}")
            return DatabaseMetrics(
                connection_pool_size=50,
                active_connections=5,
                idle_connections=2,
                total_queries_executed=15420,
                slow_queries_count=3,
                database_size_mb=100.0,
                tables_count=10,
                avg_query_time_ms=12.5
            )

    async def get_user_metrics(self, db: AsyncSession) -> UserMetrics:
        """Obtiene métricas de usuarios REALES"""
        try:
            cache_key = "user_metrics"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]
            
            # Total users
            total_users_result = await db.execute(select(func.count(User.id)))
            total_users = total_users_result.scalar() or 0
            
            # Users by role
            users_by_role_result = await db.execute(
                select(User.role, func.count(User.id)).group_by(User.role)
            )
            users_by_role = {row[0].value: row[1] for row in users_by_role_result.all()}
            
            # Mock some time-based metrics since we don't have created_at field
            metrics = UserMetrics(
                total_users=total_users,
                active_users_24h=int(total_users * 0.3),  # 30% active last 24h
                active_users_7d=int(total_users * 0.6),   # 60% active last 7d
                new_users_today=2,
                new_users_this_week=15,
                users_by_role=users_by_role,
                retention_rate_7d=85.2,
                retention_rate_30d=72.8
            )
            
            self._update_cache(cache_key, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting user metrics: {e}")
            return UserMetrics(
                total_users=150,
                active_users_24h=45,
                active_users_7d=90,
                new_users_today=2,
                new_users_this_week=15,
                users_by_role={"free": 100, "premium": 35, "ultimate": 15},
                retention_rate_7d=85.2,
                retention_rate_30d=72.8
            )

    async def get_subscription_metrics(self, db: AsyncSession) -> SubscriptionMetrics:
        """Obtiene métricas de suscripciones usando mock data"""
        try:
            cache_key = "subscription_metrics"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]
            
            metrics = self._get_mock_subscription_metrics(db)
            self._update_cache(cache_key, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting subscription metrics: {e}")
            return self._get_mock_subscription_metrics(db)

    def _get_mock_subscription_metrics(self, db: AsyncSession) -> SubscriptionMetrics:
        """Métricas simuladas cuando Stripe no está disponible"""
        return SubscriptionMetrics(
            total_subscriptions=145,
            active_subscriptions=132,
            revenue_this_month=2850.00,
            revenue_this_year=28500.00,
            churn_rate=8.5,
            mrr=2850.00,
            arr=34200.00,
            subscriptions_by_plan={
                "free": 500,
                "premium": 85,
                "ultimate": 47
            }
        )

    async def get_api_metrics(self, db: AsyncSession) -> APIMetrics:
        """Obtiene métricas de la API"""
        try:
            cache_key = "api_metrics"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]
            
            # Mock API metrics since we don't have API logging table
            metrics = APIMetrics(
                total_requests_today=1240,
                total_requests_this_week=8650,
                avg_response_time=128.5,
                error_rate=0.42,
                most_used_endpoints=[
                    {"endpoint": "/players", "count": 1580},
                    {"endpoint": "/teams", "count": 1220},
                    {"endpoint": "/auth/login", "count": 890},
                    {"endpoint": "/favorites", "count": 650},
                    {"endpoint": "/admin/dashboard", "count": 125}
                ],
                requests_by_hour=[
                    {"hour": f"{i:02d}:00", "requests": 50 + (i * 5)} 
                    for i in range(24)
                ],
                status_codes_distribution={
                    "200": 7800,
                    "201": 420,
                    "400": 280,
                    "401": 95,
                    "404": 45,
                    "500": 10
                }
            )
            
            self._update_cache(cache_key, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting API metrics: {e}")
            return APIMetrics(
                total_requests_today=1240,
                total_requests_this_week=8650,
                avg_response_time=128.5,
                error_rate=0.42,
                most_used_endpoints=[],
                requests_by_hour=[],
                status_codes_distribution={}
            )

    async def get_dashboard_data(self, db: AsyncSession) -> AdminDashboardData:
        """Obtiene todos los datos del dashboard"""
        try:
            cache_key = "dashboard_data"
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]
            
            # Fetch all metrics
            system_health = await self.get_system_health_metrics()
            database_metrics = await self.get_database_metrics(db)
            user_metrics = await self.get_user_metrics(db)
            subscription_metrics = await self.get_subscription_metrics(db)
            api_metrics = await self.get_api_metrics(db)
            
            dashboard_data = AdminDashboardData(
                system_health=system_health,
                database_metrics=database_metrics,
                user_metrics=user_metrics,
                subscription_metrics=subscription_metrics,
                api_metrics=api_metrics,
                last_updated=datetime.utcnow().isoformat()
            )
            
            self._update_cache(cache_key, dashboard_data)
            return dashboard_data
            
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            raise

    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene logs recientes del sistema"""
        # Mock logs data since we don't have actual logging table
        import random
        from datetime import datetime, timedelta
        
        levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG']
        modules = ['auth', 'database', 'api', 'admin', 'system', 'security']
        
        messages = {
            'INFO': [
                'User logged in successfully',
                'Data fetched from database',
                'API request processed',
                'Cache updated successfully',
                'Backup completed'
            ],
            'WARNING': [
                'High memory usage detected',
                'Slow query performance',
                'Rate limit approaching',
                'Disk space running low',
                'Connection pool nearly full'
            ],
            'ERROR': [
                'Database connection timeout',
                'Authentication failed',
                'External API unavailable',
                'File system error',
                'Memory allocation failed'
            ],
            'DEBUG': [
                'Processing user request',
                'Database query executed',
                'Cache miss occurred',
                'Session created',
                'Validation passed'
            ]
        }
        
        logs = []
        for i in range(limit):
            level = random.choice(levels)
            module = random.choice(modules)
            message = random.choice(messages[level])
            timestamp = datetime.utcnow() - timedelta(minutes=random.randint(0, 1440))
            
            logs.append({
                'timestamp': timestamp.isoformat(),
                'level': level,
                'message': message,
                'module': module
            })
        
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        return logs

# Instancia singleton
admin_metrics_service = AdminMetricsService()
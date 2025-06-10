from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, delete
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

from deps import get_db, require_role
from models import (
    User, UserRole, AdminDashboardData, SystemHealthMetrics,
    DatabaseMetrics, UserMetrics, SubscriptionMetrics, APIMetrics,
    AdminUserResponse
)
from ..services.admin_metrics import admin_metrics_service
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

logger = logging.getLogger(__name__)


@router.get("/dashboard", response_model=AdminDashboardData)
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    """Obtiene todos los datos del dashboard de administración"""
    try:
        return await admin_metrics_service.get_dashboard_data(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting dashboard data: {str(e)}"
        )

@router.get("/system-health", response_model=SystemHealthMetrics)
async def get_system_health():
    """Obtiene métricas de salud del sistema"""
    try:
        return await admin_metrics_service.get_system_health_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting system health: {str(e)}"
        )

@router.get("/database-metrics", response_model=DatabaseMetrics)
async def get_database_metrics(db: AsyncSession = Depends(get_db)):
    """Obtiene métricas de la base de datos"""
    try:
        return await admin_metrics_service.get_database_metrics(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting database metrics: {str(e)}"
        )

@router.get("/user-metrics", response_model=UserMetrics)
async def get_user_metrics(db: AsyncSession = Depends(get_db)):
    """Obtiene métricas de usuarios"""
    try:
        return await admin_metrics_service.get_user_metrics(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting user metrics: {str(e)}"
        )

@router.get("/subscription-metrics", response_model=SubscriptionMetrics)
async def get_subscription_metrics(db: AsyncSession = Depends(get_db)):
    """Obtiene métricas de suscripciones"""
    try:
        return await admin_metrics_service.get_subscription_metrics(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting subscription metrics: {str(e)}"
        )

@router.get("/api-metrics", response_model=APIMetrics)
async def get_api_metrics(db: AsyncSession = Depends(get_db)):
    """Obtiene métricas de la API"""
    try:
        return await admin_metrics_service.get_api_metrics(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting API metrics: {str(e)}"
        )

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role_filter: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Obtiene lista de usuarios para administración"""
    try:
        query = select(User).offset(skip).limit(limit)

        if role_filter and role_filter != "all":
            query = query.where(User.role == UserRole(role_filter))
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        return [
            AdminUserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                role=user.role.value,
                profile_image_url=user.profile_image_url
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting users: {str(e)}"
        )

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    new_role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    """Actualiza el rol de un usuario"""
    try:
        # No permitir que se modifique a sí mismo
        if current_user.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify your own role"
            )
        
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.role = new_role
        await db.commit()
        await db.refresh(user)
        
        return {"message": "User role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user role: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    """Elimina un usuario"""
    try:
        # No permitir que se elimine a sí mismo
        if current_user.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        await db.delete(user)
        await db.commit()
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )

@router.get("/users/stats")
async def get_user_stats(db: AsyncSession = Depends(get_db)):
    """Obtiene estadísticas rápidas de usuarios"""
    try:
        total_users_result = await db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0
        
        # Count by role
        users_by_role_result = await db.execute(
            select(User.role, func.count(User.id)).group_by(User.role)
        )
        users_by_role = {row[0].value: row[1] for row in users_by_role_result.all()}
        
        return {
            "total_users": total_users,
            "users_by_role": users_by_role
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting user stats: {str(e)}"
        )

@router.get("/logs/recent")
async def get_recent_logs(limit: int = 50):
    """Obtiene logs recientes del sistema"""
    try:
        logs = admin_metrics_service.get_recent_logs(limit)
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recent logs: {str(e)}"
        )

@router.post("/users/{user_id}/send-notification")
async def send_user_notification(
    user_id: int,
    message: str,
    db: AsyncSession = Depends(get_db)
):
    """Envía una notificación a un usuario específico"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Aquí podrías implementar un sistema de notificaciones real
        # Por ahora solo retornamos un éxito simulado
        return {"message": f"Notification sent to {user.username}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

@router.post("/api-metrics/refresh")
async def force_refresh_api_metrics(db: AsyncSession = Depends(get_db)):
    """Fuerza la actualización de métricas de API limpiando el cache"""
    try:
        # ✅ Limpiar cache específico para métricas críticas
        cache_keys_to_clear = ["api_metrics", "user_metrics", "subscription_metrics", "dashboard_data"]
        for key in cache_keys_to_clear:
            if key in admin_metrics_service.cache:
                del admin_metrics_service.cache[key]
            if key in admin_metrics_service.last_cache_update:
                del admin_metrics_service.last_cache_update[key]
        
        logger.info("🧹 Cache cleared for critical metrics")
        
        # Obtener datos frescos
        fresh_metrics = await admin_metrics_service.get_api_metrics(db)
        
        return {
            "message": "API metrics refreshed successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": fresh_metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing API metrics: {str(e)}"
        )
"use client"

import { useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'
import { APIMetrics, AdminDashboardData, SystemHealthMetrics, DatabaseMetrics, UserMetrics, SubscriptionMetrics, AdminUser, AdminLog } from '@/types/admin'

interface UseAdminDataReturn {
    dashboardData: AdminDashboardData | null;
    systemHealth: SystemHealthMetrics | null;
    databaseMetrics: DatabaseMetrics | null;
    userMetrics: UserMetrics | null;
    subscriptionMetrics: SubscriptionMetrics | null;
    apiMetrics: APIMetrics | null;
    users: AdminUser[];
    logs: AdminLog[];
    loading: boolean;
    error: string | null;
    fetchDashboardData: () => Promise<void>;
    fetchSystemHealth: () => Promise<void>;
    fetchDatabaseMetrics: () => Promise<void>;
    fetchUserMetrics: () => Promise<void>;
    fetchSubscriptionMetrics: () => Promise<void>;
    fetchAPIMetrics: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchLogs: () => Promise<void>;
    updateUserRole: (userId: number, newRole: string) => Promise<boolean>;
    deleteUser: (userId: number) => Promise<boolean>;
    refreshAll: () => Promise<void>;
}

export function useAdminData(): UseAdminDataReturn {
    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
    const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics | null>(null);
    const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
    const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics | null>(null);
    const [apiMetrics, setAPIMetrics] = useState<APIMetrics | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const handleApiCall = async <T>(
        url: string,
        setter: (data: T) => void,
        errorMessage: string
    ): Promise<void> => {
        try {
            setError(null);
            console.log(`🔄 Starting API call to ${url}`);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                headers: getAuthHeaders(),
                cache: 'no-store', // ✅ Evitar cache del navegador
            });

            console.log(`📡 Response status for ${url}:`, response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ API error for ${url}:`, errorData);
                throw new Error(errorData.detail || errorMessage);
            }

            const data = await response.json();
            console.log(`✅ Success response for ${url}:`, data);
            
            // ✅ Verificar que los datos no estén vacíos antes de settear
            if (data && typeof data === 'object') {
                setter(data);
            } else {
                console.warn(`⚠️ Empty or invalid data received from ${url}`);
            }
        } catch (err) {
            console.error(`❌ ${errorMessage} (${url}):`, err);
            setError(err instanceof Error ? err.message : errorMessage);
            throw err;
        }
    };

    const fetchDashboardData = useCallback(async () => {
        await handleApiCall<AdminDashboardData>(
            '/admin/dashboard',
            setDashboardData,
            'Failed to fetch dashboard data'
        );
    }, []);

    const fetchSystemHealth = useCallback(async () => {
        await handleApiCall<SystemHealthMetrics>(
            '/admin/system-health',
            setSystemHealth,
            'Failed to fetch system health data'
        );
    }, []);

    const fetchDatabaseMetrics = useCallback(async () => {
        await handleApiCall<DatabaseMetrics>(
            '/admin/database-metrics',
            setDatabaseMetrics,
            'Failed to fetch database metrics'
        );
    }, []);

    const fetchUserMetrics = useCallback(async () => {
        await handleApiCall<UserMetrics>(
            '/admin/user-metrics',
            setUserMetrics,
            'Failed to fetch user metrics'
        );
    }, []);

    const fetchSubscriptionMetrics = useCallback(async () => {
        await handleApiCall<SubscriptionMetrics>(
            '/admin/subscription-metrics',
            setSubscriptionMetrics,
            'Failed to fetch subscription metrics'
        );
    }, []);

    const fetchAPIMetrics = useCallback(async () => {
        console.log('🔄 Starting fetchAPIMetrics...');
        await handleApiCall<APIMetrics>(
            '/admin/api-metrics',
            (data) => {
                console.log('🎯 Setting API metrics data:', data);
                // ✅ Validar estructura de datos antes de settear
                if (data && data.status_codes_distribution && data.most_used_endpoints) {
                    setAPIMetrics(data);
                } else {
                    console.error('❌ Invalid API metrics data structure:', data);
                }
            },
            'Failed to fetch API metrics'
        );
    }, []);

    const fetchUsers = useCallback(async () => {
        await handleApiCall<AdminUser[]>(
            '/admin/users',
            setUsers,
            'Failed to fetch users'
        );
    }, []);

    const fetchLogs = useCallback(async () => {
        await handleApiCall<AdminLog[]>(
            '/admin/logs/recent?limit=100',
            setLogs,
            'Failed to fetch logs'
        );
    }, []);

    const updateUserRole = async (userId: number, newRole: string): Promise<boolean> => {
        try {
            console.log(`🔄 Updating user ${userId} role to ${newRole}`);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ new_role: newRole }),
            });

            console.log(`📡 Update role response:`, response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ Update role error:`, errorData);
                throw new Error(errorData.detail || 'Failed to update user role');
            }

            // Refresh users list
            await fetchUsers();
            return true;
        } catch (err) {
            console.error('❌ Error updating user role:', err);
            setError(err instanceof Error ? err.message : 'Failed to update user role');
            return false;
        }
    };

    const deleteUser = async (userId: number): Promise<boolean> => {
        try {
            console.log(`🗑️ Deleting user ${userId}`);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            console.log(`📡 Delete user response:`, response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ Delete user error:`, errorData);
                throw new Error(errorData.detail || 'Failed to delete user');
            }

            // Refresh users list
            await fetchUsers();
            return true;
        } catch (err) {
            console.error('❌ Error deleting user:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            return false;
        }
    };

    const refreshAll = async () => {
        console.log('🔄 Starting refreshAll...');
        setLoading(true);
        setError(null);

        try {
            // ✅ Primero limpiar el cache del backend
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/api-metrics/refresh`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                });
                console.log('🧹 Backend cache cleared');
            } catch (refreshError) {
                console.warn('⚠️ Could not clear backend cache:', refreshError);
            }

            const results = await Promise.allSettled([
                fetchDashboardData(),
                fetchSystemHealth(),
                fetchDatabaseMetrics(),
                fetchUsers(),
                fetchLogs(),
                fetchUserMetrics(),
                fetchSubscriptionMetrics(),
                fetchAPIMetrics()
            ]);

            console.log('📊 RefreshAll results:', results);
        } catch (err) {
            console.error('❌ Error refreshing data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        console.log('🚀 Initial data load starting...');
        refreshAll();
    }, []);

    // Auto-refresh every 5 minutes for dashboard data
    useEffect(() => {
        if (!dashboardData) return;

        console.log('⏰ Setting up auto-refresh interval');
        const interval = setInterval(() => {
            console.log('⏰ Auto-refreshing dashboard data...');
            fetchDashboardData();
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            console.log('⏰ Clearing auto-refresh interval');
            clearInterval(interval);
        };
    }, [fetchDashboardData, dashboardData]);

    // Debug log current state
    useEffect(() => {
        console.log('📊 Current hook state:', {
            loading,
            error,
            hasApiMetrics: !!apiMetrics,
            hasSystemHealth: !!systemHealth,
            hasDatabaseMetrics: !!databaseMetrics,
            apiMetrics: apiMetrics ? 'loaded' : 'null'
        });
    }, [loading, error, apiMetrics, systemHealth, databaseMetrics]);

    useEffect(() => {
        if (!apiMetrics) return;

        console.log('⏰ Setting up API metrics auto-refresh interval');
        const interval = setInterval(() => {
            console.log('⏰ Auto-refreshing API metrics...');
            fetchAPIMetrics();
        }, 30 * 1000); // ✅ Cada 30 segundos para API metrics

        return () => {
            console.log('⏰ Clearing API metrics auto-refresh interval');
            clearInterval(interval);
        };
    }, [fetchAPIMetrics, apiMetrics]);

    return {
        dashboardData,
        systemHealth,
        databaseMetrics,
        userMetrics,
        subscriptionMetrics,
        apiMetrics,
        users,
        logs,
        loading,
        error,
        fetchDashboardData,
        fetchSystemHealth,
        fetchDatabaseMetrics,
        fetchUserMetrics,
        fetchSubscriptionMetrics,
        fetchAPIMetrics,
        fetchUsers,
        fetchLogs,
        updateUserRole,
        deleteUser,
        refreshAll,
    };
}
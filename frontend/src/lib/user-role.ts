export function getUserRoleFromToken(): string {
    if (typeof window === 'undefined') return 'free'
    
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]
    
    if (!token) return 'free'
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.role || 'free'
    } catch {
        return 'free'
    }
}
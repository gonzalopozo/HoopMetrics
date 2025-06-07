"use client"

import { useState } from 'react'
import { 
    Search, 
    RefreshCw, 
    AlertTriangle, 
    Crown, 
    Shield, 
    User, 
    Calendar,
    Mail,
    Trash2 // ✅ Añadir icono de papelera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AdminHeader } from '@/components/admin/admin-header'
import { useAdminData } from '@/hooks/use-admin-data'
import { toast } from 'sonner'
import type { AdminUser } from '@/types/admin'

export default function AdminUsersPage() {
    const { users, loading, error, fetchUsers, updateUserRole, deleteUser } = useAdminData()
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchUsers()
        setIsRefreshing(false)
    }

    const handleRoleUpdate = async (userId: number, newRole: string) => {
        const success = await updateUserRole(userId, newRole)
        if (success) {
            toast.success('User role updated successfully')
        } else {
            toast.error('Failed to update user role')
        }
    }

    const handleDeleteUser = async (userId: number, username: string) => {
        const success = await deleteUser(userId)
        if (success) {
            toast.success(`User "${username}" deleted successfully`)
        } else {
            toast.error('Failed to delete user')
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return <Crown className="h-4 w-4 text-purple-600" />
            case 'premium':
                return <Shield className="h-4 w-4 text-blue-600" />
            case 'ultimate':
                return <Crown className="h-4 w-4 text-yellow-600" />
            default:
                return <User className="h-4 w-4 text-gray-600" />
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'destructive'
            case 'premium':
                return 'default'
            case 'ultimate':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
        
        return matchesSearch && matchesRole
    })

    if (loading && users.length === 0) {
        return (
            <div className="space-y-6">
                <AdminHeader title="User Management" description="Manage users, roles, and permissions" />
                <Card className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-muted rounded-full"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-32"></div>
                                            <div className="h-3 bg-muted rounded w-48"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-20 bg-muted rounded"></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminHeader title="User Management" description="Manage users, roles, and permissions" />
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-2 pt-6">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Error loading users: {error}</span>
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
            <AdminHeader title="User Management" description="Manage users, roles, and permissions">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="h-10 w-[200px] rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="ultimate">Ultimate</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </AdminHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.map(user => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                onRoleUpdate={handleRoleUpdate}
                                onDeleteUser={handleDeleteUser}
                            />
                        ))}
                        
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found matching your criteria.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface UserRowProps {
    user: AdminUser
    onRoleUpdate: (userId: number, newRole: string) => Promise<void>
    onDeleteUser: (userId: number, username: string) => Promise<void>
}

function UserRow({ user, onRoleUpdate, onDeleteUser }: UserRowProps) {
    const [isUpdatingRole, setIsUpdatingRole] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleRoleChange = async (newRole: string) => {
        if (newRole === user.role) return
        
        setIsUpdatingRole(true)
        try {
            await onRoleUpdate(user.id, newRole)
        } finally {
            setIsUpdatingRole(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDeleteUser(user.id, user.username)
        } finally {
            setIsDeleting(false)
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return <Crown className="h-4 w-4 text-purple-600" />
            case 'premium':
                return <Shield className="h-4 w-4 text-blue-600" />
            case 'ultimate':
                return <Crown className="h-4 w-4 text-yellow-600" />
            default:
                return <User className="h-4 w-4 text-gray-600" />
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'destructive'
            case 'premium':
                return 'default'
            case 'ultimate':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={user.profile_image_url} />
                    <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.username}</h3>
                        <Badge variant={getRoleBadgeVariant(user.role) as any}>
                            <span className="flex items-center gap-1">
                                {getRoleIcon(user.role)}
                                {user.role}
                            </span>
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                        </span>
                        {user.created_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(user.created_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Select 
                    value={user.role} 
                    onValueChange={handleRoleChange}
                    disabled={isUpdatingRole || isDeleting}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="ultimate">Ultimate</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>

                {/* Delete Button with Confirmation Dialog */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isUpdatingRole || isDeleting || user.role === 'admin'}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete user "{user.username}"? 
                                This action cannot be undone. All user data, including favorites and profile information, will be permanently removed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete User"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

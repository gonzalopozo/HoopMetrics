"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, Check, X, Edit2, Mail, User, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfile } from "@/hooks/use-profile"
import { toast } from "sonner"

export default function ProfilePage() {
    const {
        profile,
        loading,
        isUpdating,
        isUploading,
        updateProfile,
        uploadProfileImage,
        deleteProfileImage
    } = useProfile()

    const [editingUsername, setEditingUsername] = useState(false)
    const [tempUsername, setTempUsername] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUsernameEdit = () => {
        setEditingUsername(true)
        setTempUsername(profile?.username || "")
    }

    const handleUsernameSave = async () => {
        if (tempUsername.trim() && tempUsername !== profile?.username) {
            const success = await updateProfile({ username: tempUsername.trim() })
            if (success) {
                setEditingUsername(false)
            }
        } else {
            setEditingUsername(false)
        }
    }

    const handleUsernameCancel = () => {
        setTempUsername(profile?.username || "")
        setEditingUsername(false)
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB')
                return
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file')
                return
            }

            await uploadProfileImage(file)
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleImageDelete = async () => {
        if (profile?.profile_image_url) {
            await deleteProfileImage()
        }
    }

    const getRoleDisplayName = (role: string) => {
        const roleMap: Record<string, string> = {
            free: "Free",
            premium: "Premium",
            ultimate: "Ultimate",
            admin: "Admin"
        }
        return roleMap[role] || role
    }

    const getRoleBadgeColor = (role: string) => {
        const colorMap: Record<string, string> = {
            free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            premium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            ultimate: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }
        return colorMap[role] || "bg-gray-100 text-gray-800"
    }

    if (loading) {
        return (
            <div className="container mx-auto max-w-2xl py-8 px-4">
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
                    <Card>
                        <CardHeader>
                            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="h-32 w-32 bg-muted animate-pulse rounded-full"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="container mx-auto max-w-2xl py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
                    <p className="text-muted-foreground">Please log in to view your profile.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="space-y-6">
                {/* Profile Picture Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Profile Picture
                        </CardTitle>
                        <CardDescription>Upload a new profile picture to personalize your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                {/* ✅ Usar fill con contenedor de posición relativa */}
                                <div className="relative w-32 h-32 rounded-full border-4 border-border bg-muted overflow-hidden">
                                    {isUploading ? (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                        </div>
                                    ) : (
                                        <Image
                                            src={profile.profile_image_url || "/placeholder.svg"}
                                            alt="Profile picture"
                                            fill // ✅ Usar fill para que rellene todo el contenedor
                                            className="object-cover" // ✅ object-cover para mantener proporciones y rellenar
                                            quality={95} // ✅ Aumentar calidad de 90 a 95
                                            sizes="(max-width: 768px) 256px, 256px" // ✅ Tamaño más grande para pantallas de alta densidad
                                            priority // ✅ Prioridad alta para imagen de perfil
                                            unoptimized={false} // ✅ Asegurar que está optimizado
                                        />
                                    )}
                                </div>

                                {/* Upload button */}
                                <label
                                    htmlFor="profile-upload"
                                    className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                                >
                                    <Camera className="h-4 w-4" />
                                    <input
                                        ref={fileInputRef}
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                </label>

                                {/* Delete button - show only if user has a profile image */}
                                {profile.profile_image_url && (
                                    <button
                                        onClick={handleImageDelete}
                                        className="absolute bottom-0 left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
                                        title="Delete profile picture"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Click the camera icon to upload a new picture</p>
                                <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, GIF (max 5MB)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Username Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Username
                        </CardTitle>
                        <CardDescription>Your unique username for the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-3">
                            {editingUsername ? (
                                <>
                                    <input
                                        type="text"
                                        value={tempUsername}
                                        onChange={(e) => setTempUsername(e.target.value)}
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Enter username"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUsernameSave}
                                        disabled={!tempUsername.trim() || isUpdating}
                                        className="flex h-9 w-9 items-center justify-center rounded-md bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {isUpdating ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleUsernameCancel}
                                        disabled={isUpdating}
                                        className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2">
                                        <span className="text-sm font-medium">@{profile.username}</span>
                                    </div>
                                    <button
                                        onClick={handleUsernameEdit}
                                        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Email Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Email Address
                        </CardTitle>
                        <CardDescription>Your email address cannot be changed from this page</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2">
                                <span className="text-sm text-muted-foreground">{profile.email}</span>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            To change your email address, please contact support or visit account settings.
                        </p>
                    </CardContent>
                </Card>

                {/* Account Info Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your account details and subscription status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Account Type</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                                {getRoleDisplayName(profile.role)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Member Since</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(profile.registration_date).toLocaleDateString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
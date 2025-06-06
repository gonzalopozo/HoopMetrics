"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

interface UserProfile {
    id: number
    username: string
    email: string
    role: string
    profile_image_url: string | null
    registration_date: string
}

export function useProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const fetchProfile = async () => {
        try {
            const token = Cookies.get('token')
            if (!token) {
                setLoading(false)
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setProfile(data)
            } else {
                toast.error('Failed to load profile')
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Error loading profile')
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (updates: { username?: string; profile_image_url?: string | null }) => {
        try {
            setIsUpdating(true)
            const token = Cookies.get('token')
            if (!token) {
                toast.error('Please login to update profile')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            })

            const data = await response.json()

            if (response.ok) {
                setProfile(data)
                toast.success('Profile updated successfully')
                
                // ✅ Disparar evento para que el header se actualice
                window.dispatchEvent(new CustomEvent('profileUpdated', { 
                    detail: data 
                }))
                
                return true
            } else {
                toast.error(data.detail || 'Failed to update profile')
                return false
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Error updating profile')
            return false
        } finally {
            setIsUpdating(false)
        }
    }

    const uploadProfileImage = async (file: File): Promise<string | null> => {
        try {
            setIsUploading(true)
            const token = Cookies.get('token')
            if (!token) {
                toast.error('Please login to upload image')
                return null
            }

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                // Update local profile with new image URL
                if (profile) {
                    const updatedProfile = { ...profile, profile_image_url: data.image_url }
                    setProfile(updatedProfile)
                    
                    // ✅ Disparar evento para que el header se actualice
                    window.dispatchEvent(new CustomEvent('profileUpdated', { 
                        detail: updatedProfile 
                    }))
                }
                toast.success('Profile image uploaded successfully')
                return data.image_url
            } else {
                toast.error(data.detail || 'Failed to upload image')
                return null
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error uploading image')
            return null
        } finally {
            setIsUploading(false)
        }
    }

    const deleteProfileImage = async (): Promise<boolean> => {
        try {
            const token = Cookies.get('token')
            if (!token) {
                toast.error('Please login to delete image')
                return false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                // Update local profile to remove image URL
                if (profile) {
                    const updatedProfile = { ...profile, profile_image_url: null }
                    setProfile(updatedProfile)
                    
                    // ✅ Disparar evento para que el header se actualice
                    window.dispatchEvent(new CustomEvent('profileUpdated', { 
                        detail: updatedProfile 
                    }))
                }
                toast.success('Profile image deleted successfully')
                return true
            } else {
                const data = await response.json()
                toast.error(data.detail || 'Failed to delete image')
                return false
            }
        } catch (error) {
            console.error('Error deleting image:', error)
            toast.error('Error deleting image')
            return false
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    return {
        profile,
        loading,
        isUpdating,
        isUploading,
        updateProfile,
        uploadProfileImage,
        deleteProfileImage,
        refetchProfile: fetchProfile
    }
}
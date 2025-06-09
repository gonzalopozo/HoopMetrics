"use client"

import { useState, useCallback } from 'react'
import { SearchSuggestions, SearchResults } from '@/types/search'

export function useSearch() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const searchSuggestions = useCallback(async (query: string): Promise<SearchSuggestions | null> => {
        if (query.length < 2) return null

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/search/suggestions?q=${encodeURIComponent(query)}`
            )
            
            if (!response.ok) {
                throw new Error('Failed to fetch suggestions')
            }

            const data: SearchSuggestions = await response.json()
            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const searchResults = useCallback(async (
        query: string, 
        page: number = 1, 
        limit: number = 20
    ): Promise<SearchResults | null> => {
        if (!query.trim()) return null

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/search/results?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
            )
            
            if (!response.ok) {
                throw new Error('Failed to fetch search results')
            }

            const data: SearchResults = await response.json()
            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        searchSuggestions,
        searchResults,
        loading,
        error
    }
}
'use client'

import { useState, useEffect } from 'react'
import {
    EmbeddedCheckout,
    EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { fetchClientSecret as originalFetchClientSecret } from '@/app/actions/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
    priceId: string
}

export default function Checkout({ priceId }: CheckoutProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getClientSecret = async () => {
            try {
                const secret = await originalFetchClientSecret(priceId)
                if (!secret) {
                    throw new Error('Failed to retrieve client secret')
                }
                setClientSecret(secret)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (priceId) {
            getClientSecret()
        }
    }, [priceId])

    if (loading) {
        return <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    }

    if (error) {
        return <div className="text-red-500 p-4 text-center">{error}</div>
    }

    if (!clientSecret) {
        return <div className="text-amber-500 p-4 text-center">Unable to initialize payment system</div>
    }

    return (
        <div id='checkout'>
            <EmbeddedCheckoutProvider 
                stripe={stripePromise}
                options={{ clientSecret }}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}
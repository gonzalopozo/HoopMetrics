"use client"

import type React from "react"
import axios from "axios"
import Cookies from "js-cookie"

import { useState } from "react"
import { useStripe, useElements, PaymentElement, AddressElement } from "@stripe/react-stripe-js"
import { motion } from "framer-motion"
import { AlertTriangle, CreditCard, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { confirmSubscription } from "@/app/actions/stripe"
// import { useRouter } from "next/navigation"

interface PaymentFormProps {
    amount: number
    currency: string
    planName: string
    billing: string
    plan: string
    onSuccess: (subscriptionId: string) => void
    onError: (error: string) => void
    email: string // <--- Añade esta línea
}

export function PaymentForm({ amount, currency, planName, billing, plan, onSuccess, onError, email }: PaymentFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    // const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string>("")

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)
        setErrorMessage("")

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            })

            if (error) {
                setErrorMessage(error.message || "An error occurred")
                onError(error.message || "Payment failed")
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                // 1. Confirma la suscripción en tu backend
                const result = await confirmSubscription(paymentIntent.id)
                if (result.success) {
                    // 2. Llama a /auth/upgrade para obtener el nuevo JWT
                    console.log({ email, new_role: plan.toLowerCase() })
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/upgrade`,
                        { email, new_role: plan.toLowerCase() },
                        { headers: { "Content-Type": "application/json" } }
                    )
                    const newToken = response.data.access_token
                    if (newToken) {
                        // 3. Sobrescribe la cookie 'token' con el nuevo JWT
                        Cookies.set("token", newToken, { path: "/" })
                    }
                    onSuccess(result.subscriptionId!)
                    // router.push(`/checkout/success?plan=${plan}&billing=${billing}`)
                    window.location.href = `/checkout/success?plan=${plan}&billing=${billing}`
                } else {
                    setErrorMessage(result.error || "Subscription confirmation failed")
                    onError(result.error || "Subscription confirmation failed")
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred"
            setErrorMessage(message)
            onError(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email bloqueado */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full rounded-md border px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    {/* Order Summary */}
                    <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{planName} Plan</span>
                            <span className="font-bold">€{amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Billing: {billing}</span>
                            <span>{currency.toUpperCase()}</span>
                        </div>
                        {billing === "annual" && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                🎉 Save 17% with annual billing!
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Payment Element */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Method</label>
                                <div className="border rounded-lg p-3">
                                    <PaymentElement
                                        options={{
                                            layout: "tabs",
                                            paymentMethodOrder: ["card", "apple_pay", "google_pay"],
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Address Element */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Billing Address</label>
                                <div className="border rounded-lg p-3">
                                    <AddressElement
                                        options={{
                                            mode: "billing",
                                            allowedCountries: ["US", "CA", "GB", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT"],
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
                            >
                                <p className="text-sm text-destructive">{errorMessage}</p>
                            </motion.div>
                        )}

                        {/* Security Notice */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg p-3">
                            <Shield className="h-4 w-4" />
                            <span>Your payment information is encrypted and secure. Powered by Stripe.</span>
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-amber-800 bg-amber-100/80 rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                <span className="font-medium">This is a test payment gateway:</span>
                            </div>
                            <ul className="ml-6 space-y-1 list-disc">
                                <li>Use the test card number: <span className="font-semibold">4242 4242 4242 4242</span></li>
                                <li>Use 3 digits for the CVC</li>
                                <li>For American Express cards, use 4 digits for the CVC</li>
                                <li>Use any valid future date for the expiration</li>
                                <li>All other fields can be filled with any values</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" disabled={!stripe || isLoading} className="w-full h-12 text-base font-medium">
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Pay €{amount} {billing}
                                </div>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            By completing your purchase, you agree to our{" "}
                            <a href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    )
}

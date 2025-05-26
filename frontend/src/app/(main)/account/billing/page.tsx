"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, Calendar, AlertCircle, CheckCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSubscriptionStatus, cancelSubscription } from "@/app/actions/stripe"

export default function BillingPage() {
    const [subscription, setSubscription] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [canceling, setCanceling] = useState(false)

    useEffect(() => {
        // In a real app, you'd get the customer ID from your auth system
        const loadSubscription = async () => {
            try {
                // This is a placeholder - replace with actual customer ID
                const result = await getSubscriptionStatus("cus_placeholder")
                if (result.hasActiveSubscription) {
                    setSubscription(result.subscription)
                }
            } catch (error) {
                console.error("Error loading subscription:", error)
            } finally {
                setLoading(false)
            }
        }

        loadSubscription()
    }, [])

    const handleCancelSubscription = async () => {
        if (!subscription) return

        setCanceling(true)
        try {
            const result = await cancelSubscription(subscription.id)
            if (result.success) {
                setSubscription({
                    ...subscription,
                    cancelAtPeriodEnd: true,
                    // currentPeriodEnd: result.subscription?.currentPeriodEnd,
                })
            }
        } catch (error) {
            console.error("Error canceling subscription:", error)
        } finally {
            setCanceling(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-accent rounded w-1/3"></div>
                        <div className="h-32 bg-accent rounded"></div>
                        <div className="h-32 bg-accent rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
                    <p className="text-muted-foreground">Manage your subscription and billing information</p>
                </motion.div>

                {subscription ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Current Subscription */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    Current Subscription
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Plan</label>
                                        <p className="text-lg font-semibold capitalize">
                                            {subscription.priceId.includes("premium") ? "Premium" : "Ultimate"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                                        <p className="text-lg font-semibold">
                                            €{subscription.amount}/{subscription.interval}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                                                {subscription.status}
                                            </Badge>
                                            {subscription.cancelAtPeriodEnd && <Badge variant="destructive">Canceling</Badge>}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {subscription.cancelAtPeriodEnd
                                                ? `Access ends on ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                                                : `Next billing date: ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    {!subscription.cancelAtPeriodEnd && (
                                        <Button variant="destructive" onClick={handleCancelSubscription} disabled={canceling}>
                                            {canceling ? "Canceling..." : "Cancel Subscription"}
                                        </Button>
                                    )}
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Invoice
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Method
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium">•••• •••• •••• 4242</p>
                                            <p className="text-sm text-muted-foreground">Expires 12/25</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Update
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                            <CardContent className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                                <p className="text-muted-foreground mb-6">
                                    You don't have an active subscription. Upgrade to access premium features.
                                </p>
                                <Button asChild>
                                    <a href="/pricing">View Plans</a>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

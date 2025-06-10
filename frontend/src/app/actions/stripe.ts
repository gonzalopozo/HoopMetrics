"use server"

import Stripe from "stripe"
import { SUBSCRIPTION_PLANS, type PlanType, type BillingCycle } from "@/lib/stripe"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
})

export async function createPaymentIntent(plan: PlanType, billing: BillingCycle, email: string) {
    try {
        const planConfig = SUBSCRIPTION_PLANS[plan][billing]
        const amount = Math.round(planConfig.price * 100) // Convert to cents

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                plan,
                billing,
                priceId: planConfig.priceId!,
                email, // email real del usuario
                tier: plan, // premium o ultimate
            },
        })

        return {
            clientSecret: paymentIntent.client_secret!,
            amount: planConfig.price,
        }
    } catch (error) {
        console.error("Error creating payment intent:", error)
        throw new Error("Failed to create payment intent")
    }
}

export async function confirmSubscription(paymentIntentId: string) {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (paymentIntent.status !== "succeeded") {
            return { success: false, error: "Payment not completed" }
        }

        // Create customer if needed
        const customer = await stripe.customers.create({
            // TODO: Replace with actual email
            email: "user@example.com", // Replace with actual user email
            metadata: {
                paymentIntentId,
            },
        })

        // Create subscription using the price ID from metadata
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                {
                    price: paymentIntent.metadata.priceId,
                },
            ],
            payment_behavior: "default_incomplete",
            payment_settings: { save_default_payment_method: "on_subscription" },
        })

        return {
            success: true,
            subscriptionId: subscription.id,
            customerId: customer.id,
        }
    } catch (error) {
        console.error("Error confirming subscription:", error)
        return { success: false, error: "Failed to create subscription" }
    }
}

export async function getSubscriptionStatus(customerId: string) {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
        })

        if (subscriptions.data.length === 0) {
            return { hasActiveSubscription: false }
        }

        const subscription = subscriptions.data[0]
        const price = subscription.items.data[0].price

        return {
            hasActiveSubscription: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                // currentPeriodEnd: subscription.current_period_end,
                priceId: price.id,
                amount: price.unit_amount! / 100,
                currency: price.currency,
                interval: price.recurring?.interval,
            },
        }
    } catch (error) {
        console.error("Error getting subscription status:", error)
        return { hasActiveSubscription: false, error: "Failed to get subscription status" }
    }
}

export async function cancelSubscription(subscriptionId: string) {
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        })

        return {
            success: true,
            subscription: {
                id: subscription.id,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                // currentPeriodEnd: subscription.current_period_end,
            },
        }
    } catch (error) {
        console.error("Error canceling subscription:", error)
        return { success: false, error: "Failed to cancel subscription" }
    }
}

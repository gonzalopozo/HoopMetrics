import { loadStripe } from "@stripe/stripe-js"

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export const STRIPE_CONFIG = {
    currency: "eur",
    payment_method_types: ["card"],
}

export const SUBSCRIPTION_PLANS = {
    premium: {
        monthly: {
            price: 24.99,
            priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        },
        annual: {
            price: 249.99,
            priceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
        },
    },
    ultimate: {
        monthly: {
            price: 49.99,
            priceId: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID,
        },
        annual: {
            price: 499.99,
            priceId: process.env.STRIPE_ULTIMATE_ANNUAL_PRICE_ID,
        },
    },
} as const

export type PlanType = keyof typeof SUBSCRIPTION_PLANS
export type BillingCycle = "monthly" | "annual"

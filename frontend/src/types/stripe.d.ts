export interface CheckoutSession {
    plan: "premium" | "ultimate"
    billing: "monthly" | "annual"
    amount: number
    currency: string
}

export interface PaymentIntentResponse {
    clientSecret: string
    amount: number
    currency: string
}

export interface SubscriptionDetails {
    planName: string
    amount: number
    billing: string
    features: string[]
}

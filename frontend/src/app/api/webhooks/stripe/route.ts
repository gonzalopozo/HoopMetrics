import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = (await headers()).get("stripe-signature")!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
        console.error("Webhook signature verification failed:", error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                console.log("Payment succeeded:", paymentIntent.id)

                // Here you would typically:
                // 1. Update user subscription in your database
                // 2. Send confirmation email
                // 3. Grant access to premium features

                break

            case "payment_intent.payment_failed":
                const failedPayment = event.data.object as Stripe.PaymentIntent
                console.log("Payment failed:", failedPayment.id)

                // Handle failed payment
                // 1. Log the failure
                // 2. Notify user if needed
                // 3. Update subscription status

                break

            case "invoice.payment_succeeded":
                const invoice = event.data.object as Stripe.Invoice
                console.log("Invoice payment succeeded:", invoice.id)

                // Handle successful recurring payment

                break

            case "invoice.payment_failed":
                const failedInvoice = event.data.object as Stripe.Invoice
                console.log("Invoice payment failed:", failedInvoice.id)

                // Handle failed recurring payment
                // 1. Notify user
                // 2. Update subscription status
                // 3. Potentially downgrade access

                break

            case "customer.subscription.created":
                const newSubscription = event.data.object as Stripe.Subscription
                console.log("New subscription created:", newSubscription.id)

                // Handle new subscription

                break

            case "customer.subscription.updated":
                const updatedSubscription = event.data.object as Stripe.Subscription
                console.log("Subscription updated:", updatedSubscription.id)

                // Handle subscription changes

                break

            case "customer.subscription.deleted":
                const deletedSubscription = event.data.object as Stripe.Subscription
                console.log("Subscription cancelled:", deletedSubscription.id)

                // Handle subscription cancellation

                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Error processing webhook:", error)
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
}

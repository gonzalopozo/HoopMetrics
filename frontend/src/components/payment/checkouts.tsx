'use client'

import {
    EmbeddedCheckout,
    EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// import { fetchClientSecret } from '@/app/actions/stripe'
import { fetchClientSecret as originalFetchClientSecret } from '@/app/actions/stripe'

const fetchClientSecret = async (): Promise<string> => {
    const secret = await originalFetchClientSecret();
    if (secret === null) {
        throw new Error('Client secret is null');
    }
    return secret;
};


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default async function Checkout() {
    return (
        <div id='checkout'>
            <EmbeddedCheckoutProvider 
                stripe={stripePromise}
                options={{ fetchClientSecret }}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}
'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'

export async function fetchClientSecret() {
    const origin = (await headers()).get('origin')

    const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
            {
                price: 'price_1RRA6e2cPejVT0hsZA0U1wJQ',
                quantity: 1
            },
            {
                price: 'price_1RRphR2cPejVT0hsN5BFQdXO',
                quantity: 1
            },
            {
                price: 'price_1RRpgV2cPejVT0hskHLy9sIk',
                quantity: 1
            },
            {
                price: 'price_1RRphR2cPejVT0hspMaAwRAc',
                quantity: 1
            },
        ],
        mode: 'subscription',
        return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    })

    return session.client_secret
}
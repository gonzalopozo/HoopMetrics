import Checkout from "@/components/payment/checkouts";

interface PayPageProps {
    searchParams: { price?: string }
}

export default async function Pay({ searchParams }: PayPageProps) {
    const { price } = await searchParams
    
    // Define los precios disponibles
    const validPrices = [
        'price_1RRA6e2cPejVT0hsZA0U1wJQ',
        'price_1RRphR2cPejVT0hsN5BFQdXO',
        'price_1RRpgV2cPejVT0hskHLy9sIk',
        'price_1RRphR2cPejVT0hspMaAwRAc'
    ]
    
    const selectedPrice = price && validPrices.includes(price) 
        ? price 
        : 'price_1RRA6e2cPejVT0hsZA0U1wJQ' // precio por defecto

    return (
        <div id="checkout">
            <Checkout priceId={selectedPrice} />
        </div>
    )
}
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Elements } from "@stripe/react-stripe-js"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useTheme } from "next-themes" // ✅ Agregar import
import { stripePromise, SUBSCRIPTION_PLANS, type PlanType, type BillingCycle } from "@/lib/stripe"
import { createPaymentIntent } from "@/app/actions/stripe"
import { PaymentForm } from "@/components/checkout/payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

type CheckoutStep = "loading" | "payment" | "success" | "error"

function CheckoutContent() {
    const searchParams = useSearchParams()
    const { resolvedTheme } = useTheme() // ✅ Usar useTheme
    const [step, setStep] = useState<CheckoutStep>("loading")
    const [clientSecret, setClientSecret] = useState<string>("")
    const [subscriptionDetails, setSubscriptionDetails] = useState<{
        plan: PlanType
        billing: BillingCycle
        amount: number
        planName: string
    } | null>(null)
    const [subscriptionId, setSubscriptionId] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [email, setEmail] = useState<string>("")

    function getCookie(name: string) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()!.split(';').shift();
    }

    // 2. SEGUNDO EFECTO: Inicializar el pago SOLO cuando ya tenemos email
    useEffect(() => {
        console.log("document.cookie:", document.cookie);

        const token = getCookie("token");
        console.log("Token leído:", token);

        if (!token) {
            setError("No hay sesión activa. Por favor, inicia sesión.")
            setStep("error")
            return
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Payload JWT:", payload);

            // Usa payload.email o payload.sub como email
            const userEmail = payload.email || payload.sub;
            if (!userEmail) {
                setError("No se ha podido obtener el email del usuario. Por favor, inicia sesión de nuevo.")
                setStep("error")
                return
            }
            setEmail(userEmail);

            // Si hay email, inicializar el pago
            const plan = searchParams.get("plan") as PlanType
            const billing = searchParams.get("billing") as BillingCycle

            if (!plan || !billing || !(plan in SUBSCRIPTION_PLANS) || !(billing in SUBSCRIPTION_PLANS[plan])) {
                setError("Invalid subscription parameters")
                setStep("error")
                return
            }

            const initializePayment = async () => {
                try {
                    const result = await createPaymentIntent(plan, billing, payload.email)
                    setClientSecret(result.clientSecret)
                    setSubscriptionDetails({
                        plan,
                        billing,
                        amount: result.amount,
                        planName: plan.charAt(0).toUpperCase() + plan.slice(1),
                    })
                    setStep("payment")
                } catch (err) {
                    setError("Failed to initialize payment")
                    setStep("error")
                    console.error("Payment initialization error:", err)
                }
            }

            initializePayment()
        } catch (err) {
            setError("Error al obtener datos de la sesión. Por favor, inicia sesión de nuevo.")
            setStep("error")
            console.error("Error al parsear token:", err)
        }
    }, [searchParams])

    const handlePaymentSuccess = (id: string) => {
        setSubscriptionId(id)
        console.log(subscriptionId);
        setStep("success")
    }

    const handlePaymentError = (errorMessage: string) => {
        setError(errorMessage)
        setStep("error")
    }

    // ✅ Mejorar la configuración de Stripe con más variables
    const stripeOptions = {
        clientSecret,
        appearance: {
            theme: resolvedTheme === "dark" ? "night" as const : "stripe" as const,
            variables: {
                colorPrimary: "hsl(var(--primary))",
                colorBackground: "hsl(var(--background))",
                colorText: "hsl(var(--foreground))",
                colorDanger: "hsl(var(--destructive))",
                // ✅ Hacer los placeholders más claros en modo dark
                colorTextPlaceholder: resolvedTheme === "dark" 
                    ? "hsl(0, 0%, 50%)"  // Gris más claro en dark mode
                    : "hsl(var(--muted-foreground))", // Color normal en light mode
                colorInputBackground: "hsl(var(--input))",
                colorInputBorder: "hsl(var(--border))",
                colorInputText: "hsl(var(--foreground))",
                colorTextSecondary: resolvedTheme === "dark"
                    ? "hsl(0, 0%, 60%)"  // También más claro para texto secundario
                    : "hsl(var(--muted-foreground))",
                colorSuccess: "hsl(120, 70%, 50%)",
                // ✅ Agregar más variables para mejor control
                colorTextPlaceholderSecondary: resolvedTheme === "dark"
                    ? "hsl(0, 0%, 45%)"  // Placeholder secundario aún más claro
                    : "hsl(214, 30%, 60%)",
                fontFamily: "system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
            },
        },
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link href="/upgrade">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Pricing
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
                    <p className="text-muted-foreground mt-2">Secure checkout powered by Stripe</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Subscription Details */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscriptionDetails && (
                                    <>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Plan:</span>
                                                <span>{subscriptionDetails.planName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Billing:</span>
                                                <span className="capitalize">{subscriptionDetails.billing}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Amount:</span>
                                                <span className="font-bold">€{subscriptionDetails.amount}</span>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-2">{`What's included:`}</h4>
                                            <ul className="space-y-1 text-sm text-muted-foreground">
                                                {subscriptionDetails.plan === "premium" ? (
                                                    <>
                                                        <li>• All Free features</li>
                                                        <li>• Derived statistics</li>
                                                        <li>• Up to 3 favorite players & teams</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>• All Premium features</li>
                                                        <li>• Advanced statistics</li>
                                                        <li>• Unlimited favorites</li>
                                                        <li>• Early access to new features</li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Right Column - Payment Form or Status */}
                    <div className="flex justify-center">
                        <AnimatePresence mode="wait">
                            {step === "loading" && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-12"
                                >
                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                    <p className="text-muted-foreground">Initializing payment...</p>
                                </motion.div>
                            )}

                            {step === "payment" && clientSecret && subscriptionDetails && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Elements stripe={stripePromise} options={stripeOptions}>
                                        <PaymentForm
                                            amount={subscriptionDetails.amount}
                                            currency="eur"
                                            planName={subscriptionDetails.planName}
                                            billing={subscriptionDetails.billing}
                                            plan={subscriptionDetails.plan}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                            email={email} // <-- Aquí pasas el email extraído del JWT
                                        />
                                    </Elements>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card className="w-full max-w-md text-center">
                                        <CardContent className="pt-6 space-y-4">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: "spring" }}
                                            >
                                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                                            </motion.div>
                                            <h3 className="text-xl font-bold">Payment Successful!</h3>
                                            <p className="text-muted-foreground">
                                                Your subscription has been activated. Welcome to HoopMetrics!
                                            </p>
                                            <div className="space-y-2">
                                                <Button asChild className="w-full">
                                                    <Link href="/">Go to Dashboard</Link>
                                                </Button>
                                                <Button variant="outline" asChild className="w-full">
                                                    <Link href="/upgrade">View Plans</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {step === "error" && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card className="w-full max-w-md text-center">
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                                                <span className="text-2xl">⚠️</span>
                                            </div>
                                            <h3 className="text-xl font-bold">Payment Failed</h3>
                                            <p className="text-muted-foreground">{error}</p>
                                            <div className="space-y-2">
                                                <Button onClick={() => window.location.reload()} className="w-full">
                                                    Try Again
                                                </Button>
                                                <Button variant="outline" asChild className="w-full">
                                                    <Link href="/upgrade">Back to Pricing</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    )
}

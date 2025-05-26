"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Download, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function SuccessContent() {
    const searchParams = useSearchParams()
    const [plan, setPlan] = useState<string>("")
    const [billing, setBilling] = useState<string>("")

    useEffect(() => {
        setPlan(searchParams.get("plan") || "")
        setBilling(searchParams.get("billing") || "")
    }, [searchParams])

    const confettiVariants = {
        initial: { scale: 0, rotate: 0 },
        animate: {
            scale: [0, 1, 0.8, 1],
            rotate: [0, 180, 360],
            transition: {
                duration: 2,
                times: [0, 0.3, 0.7, 1],
                repeat: 2,
            },
        },
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20 py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-8"
                >
                    {/* Confetti Animation */}
                    <div className="relative">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                style={{
                                    left: `${20 + i * 12}%`,
                                    top: `${10 + (i % 2) * 20}px`,
                                }}
                                variants={confettiVariants}
                                initial="initial"
                                animate="animate"
                            >
                                <Sparkles className="h-6 w-6 text-yellow-500" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="flex justify-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-20"
                            />
                            <CheckCircle className="h-24 w-24 text-green-500 relative z-10" />
                        </div>
                    </motion.div>

                    {/* Success Message */}
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
                        >
                            Welcome to HoopMetrics {plan.charAt(0).toUpperCase() + plan.slice(1)}!
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-xl text-muted-foreground"
                        >
                            Your subscription has been activated successfully
                        </motion.p>
                    </div>

                    {/* Subscription Details Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                        <Card className="border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    Subscription Active
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Plan:</span>
                                        <p className="text-muted-foreground capitalize">{plan}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Billing:</span>
                                        <p className="text-muted-foreground capitalize">{billing}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">{`What's next?`}</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Access to all {plan} features
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Confirmation email sent
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Invoice available in your account
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" className="group">
                                <Link href="/">
                                    Start Exploring
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>

                            <Button variant="outline" size="lg" asChild>
                                <Link href="/account/billing">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Invoice
                                </Link>
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Need help? Contact our{" "}
                            <Link href="/support" className="text-primary hover:underline">
                                support team
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    )
}

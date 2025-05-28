"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function UpgradePage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleBillingCycle = () => {
        setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        },
        hover: {
            y: -10,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            transition: { type: "spring", stiffness: 400, damping: 10 },
        },
    }

    const featureVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
    }

    if (!mounted) return null

    return (
        <div className="container mx-auto py-8 px-4">
            <motion.div
                className="mb-8 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Select the plan that best fits your needs. Upgrade or downgrade at any time.
                </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
                className="flex items-center justify-center mb-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                <span className={cn("mr-2 text-sm", billingCycle === "monthly" ? "font-medium" : "text-muted-foreground")}>
                    Monthly
                </span>
                <div className="relative">
                    <Switch checked={billingCycle === "annual"} onCheckedChange={toggleBillingCycle} />
                    <AnimatePresence>
                        {billingCycle === "annual" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -top-3 -right-3"
                            >
                                <Sparkles className="h-4 w-4 text-nba-blue-500 dark:text-nba-red-500" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <span className={cn("ml-2 text-sm", billingCycle === "annual" ? "font-medium" : "text-muted-foreground")}>
                    Annual <span className="text-nba-blue-600 dark:text-nba-red-500 font-medium">Save 17%</span>
                </span>
            </motion.div>

            {/* Pricing Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Free Tier */}
                <motion.div variants={cardVariants} whileHover="hover">
                    <Card className="border-border hover:border-primary/50 transition-colors h-full flex flex-col">
                        <CardHeader className="text-center pb-8 pt-6">
                            <CardTitle className="text-xl">Free</CardTitle>
                            <CardDescription>Basic stats for casual fans</CardDescription>
                            <motion.div
                                className="mt-4 text-4xl font-bold"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                €0
                            </motion.div>
                            <div className="text-sm text-muted-foreground">Forever free</div>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <motion.div className="space-y-4" variants={containerVariants}>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>1 favorite player</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>1 favorite team</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Notifications for that player and team</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Basic player and team stats</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Game schedules and results</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Advanced search filters</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Derived statistics</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Head-to-head comparisons</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <motion.button
                                className="w-full py-2 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Current Plan
                            </motion.button>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Premium Tier */}
                <motion.div
                    variants={cardVariants}
                    whileHover="hover"
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        scale: 1.05,
                        transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                            delay: 0.1,
                        },
                    }}
                    className="relative mt-6 md:mt-0"
                >
                    {/* Most Popular Badge - Positioned outside the card */}
                    <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-6 rounded-full shadow-lg z-20"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                    >
                        Most Popular
                    </motion.div>

                    <Card className="border-primary/50 shadow-md shadow-primary/10 h-full flex flex-col pt-2">
                        <CardHeader className="text-center pb-8 pt-6">
                            <CardTitle className="text-xl">Premium</CardTitle>
                            <CardDescription>Advanced stats for serious fans</CardDescription>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={billingCycle}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-4 text-4xl font-bold"
                                >
                                    {billingCycle === "monthly" ? "€24.99" : "€249.99"}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">
                                        /{billingCycle === "monthly" ? "month" : "year"}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                            {billingCycle === "annual" && (
                                <motion.div
                                    className="text-sm text-nba-blue-600 dark:text-nba-red-500 font-medium"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Save €49.89 per year
                                </motion.div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <motion.div className="space-y-4" variants={containerVariants}>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>All Free features</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Advanced search (filter by date, stat type, opponent, etc.)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>
                                        Derived statistics (efficiency ratings, shooting percentages, trends)
                                    </FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Up to 3 favorite players</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Up to 3 favorite teams</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Notifications for all favorites</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Head-to-head comparisons</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Exportable PDF reports</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <Link
                                // href={billingCycle === "monthly" ? "/pay?price=price_1RRA6e2cPejVT0hsZA0U1wJQ" : "/pay?price=price_1RRpgV2cPejVT0hskHLy9sIk"}
                                href={`/checkout?plan=premium&billing=${billingCycle}`}
                                className="w-full cursor-pointer"
                            >
                                <motion.button
                                    className="w-full cursor-pointer py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >

                                    Upgrade Now
                                </motion.button>
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Ultimate Tier */}
                <motion.div variants={cardVariants} whileHover="hover">
                    <Card className="border-border hover:border-primary/50 transition-colors bg-gradient-to-b from-background to-accent/30 h-full flex flex-col">
                        <CardHeader className="text-center pb-8 pt-6">
                            <CardTitle className="text-xl">Ultimate</CardTitle>
                            <CardDescription>Complete access for analysts and power users</CardDescription>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={billingCycle}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-4 text-4xl font-bold"
                                >
                                    {billingCycle === "monthly" ? "€49.99" : "€499.99"}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">
                                        /{billingCycle === "monthly" ? "month" : "year"}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                            {billingCycle === "annual" && (
                                <motion.div
                                    className="text-sm text-nba-blue-600 dark:text-nba-red-500 font-medium"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Save €99.89 per year
                                </motion.div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <motion.div className="space-y-4" variants={containerVariants}>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>All Premium features</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Head-to-head comparison between any two players</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Head-to-head comparison between any two teams</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Exportable PDF report of comparisons (with charts and key metrics)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Unlimited favorites</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Early access to new features</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <Link
                                // href={billingCycle === "monthly" ? "/pay?price=price_1RRphR2cPejVT0hsN5BFQdXO" : "/pay?price=price_1RRphR2cPejVT0hspMaAwRAc"}
                                href={`/checkout?plan=ultimate&billing=${billingCycle}`}
                                className="w-full cursor-pointer"
                            >
                                <motion.button
                                    className="w-full py-2 rounded-lg bg-gradient-to-r from-nba-blue-600 to-nba-blue-800 dark:from-nba-red-600 dark:to-nba-red-800 text-white hover:opacity-90 transition-opacity cursor-pointer"
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: "0 0 15px rgba(66, 115, 255, 0.5)",
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Get Ultimate
                                </motion.button>
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
                className="mt-16 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <FaqItem
                        question="Can I change my plan later?"
                        answer="Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes to your subscription will take effect immediately."
                    />
                    <FaqItem
                        question="How do I cancel my subscription?"
                        answer="You can cancel your subscription from your account settings. Once canceled, you'll still have access to your premium features until the end of your billing period."
                    />
                    <FaqItem
                        question="Do you offer refunds?"
                        answer="We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied with your subscription, contact our support team within 14 days of purchase."
                    />
                    <FaqItem
                        question="What payment methods do you accept?"
                        answer="We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through our payment provider."
                    />
                </div>
            </motion.div>
        </div>
    )
}

interface FeatureItemProps {
    children: React.ReactNode
    included?: boolean
}

function FeatureItem({ children, included = false }: FeatureItemProps) {
    return (
        <div className="flex items-center">
            {included ? (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                    <Check className="h-5 w-5 text-nba-blue-600 dark:text-nba-red-500 mr-2 flex-shrink-0" />
                </motion.div>
            ) : (
                <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
            )}
            <span className={cn("text-sm", !included && "text-muted-foreground line-through")}>{children}</span>
        </div>
    )
}

interface FaqItemProps {
    question: string
    answer: string
}

function FaqItem({ question, answer }: FaqItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.div
            className="border border-border rounded-lg p-4 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.01 }}
            layout
        >
            <motion.h3 className="font-medium mb-2 flex justify-between items-center">
                {question}
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-primary">
                    +
                </motion.span>
            </motion.h3>
            <AnimatePresence>
                {isOpen && (
                    <motion.p
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {answer}
                    </motion.p>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, Sparkles, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getUserRoleFromToken } from "@/lib/user-role"
import Link from "next/link"

export default function UpgradePage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
    const [mounted, setMounted] = useState(false)
    const [userRole, setUserRole] = useState<string>("free")

    // Prevent hydration mismatch and get user role
    useEffect(() => {
        setMounted(true)
        const role = getUserRoleFromToken()
        setUserRole(role)
    }, [])

    const toggleBillingCycle = () => {
        setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
    }

    // Helper functions to determine plan status
    const isPlanCurrent = (plan: string) => {
        return userRole === plan
    }

    const isPlanDowngrade = (plan: string) => {
        const hierarchy = { "free": 0, "premium": 1, "ultimate": 2, "admin": 3 }
        return hierarchy[userRole as keyof typeof hierarchy] > hierarchy[plan as keyof typeof hierarchy]
    }

    const canUpgrade = (plan: string) => {
        return !isPlanCurrent(plan) && !isPlanDowngrade(plan)
    }

    const getPlanButtonText = (plan: string) => {
        if (isPlanCurrent(plan)) return "Current Plan"
        if (isPlanDowngrade(plan)) return "Downgrade"
        return plan === "premium" ? "Upgrade Now" : "Get Ultimate"
    }

    const getPlanButtonVariant = (plan: string) => {
        if (isPlanCurrent(plan)) return "current"
        if (isPlanDowngrade(plan)) return "downgrade"
        return "upgrade"
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
                    {userRole === "free" 
                        ? "Select the plan that best fits your needs. Upgrade or downgrade at any time."
                        : `You're currently on the ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} plan. ${userRole !== "ultimate" ? "Upgrade to unlock more features." : "You have access to all features!"}`
                    }
                </p>
                {userRole !== "free" && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <Crown className="h-4 w-4 text-nba-blue-600 dark:text-nba-red-500" />
                        <span className="text-sm font-medium text-nba-blue-600 dark:text-nba-red-500">
                            Current Plan: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                    </div>
                )}
            </motion.div>

            {/* Billing Toggle - Hide if user is admin or ultimate */}
            {userRole !== "admin" && userRole !== "ultimate" && (
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
            )}

            {/* Pricing Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Free Tier */}
                <motion.div variants={cardVariants} whileHover={canUpgrade("free") ? "hover" : undefined}>
                    <Card className={cn(
                        "transition-colors h-full flex flex-col relative",
                        isPlanCurrent("free") 
                            ? "border-nba-blue-500 dark:border-nba-red-500 bg-nba-blue-50/50 dark:bg-nba-red-950/20" 
                            : "border-border hover:border-primary/50"
                    )}>
                        {isPlanCurrent("free") && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-nba-blue-600 dark:bg-nba-red-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-6 rounded-full shadow-lg z-20">
                                Current Plan
                            </div>
                        )}
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
                                    <FeatureItem included>Basic player stats (PPG, RPG, APG)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Basic team stats (wins/losses, PPG, standings)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Player search functionality</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Team roster information</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Recent games and schedules</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Advanced search filters</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Derived statistics & analytics</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Performance progression charts</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Advanced impact metrics</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <PlanButton 
                                plan="free" 
                                variant={getPlanButtonVariant("free")}
                                text={getPlanButtonText("free")}
                                canUpgrade={canUpgrade("free")}
                                billingCycle={billingCycle}
                            />
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Premium Tier */}
                <motion.div
                    variants={cardVariants}
                    whileHover={canUpgrade("premium") ? "hover" : undefined}
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        scale: isPlanCurrent("premium") ? 1.05 : userRole === "free" ? 1.05 : 1,
                        transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                            delay: 0.1,
                        },
                    }}
                    className="relative mt-6 md:mt-0"
                >
                    {/* Current Plan or Most Popular Badge */}
                    {isPlanCurrent("premium") ? (
                        <motion.div
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-nba-blue-600 dark:bg-nba-red-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-6 rounded-full shadow-lg z-20"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                        >
                            Current Plan
                        </motion.div>
                    ) : userRole === "free" && (
                        <motion.div
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-6 rounded-full shadow-lg z-20"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                        >
                            Most Popular
                        </motion.div>
                    )}

                    <Card className={cn(
                        "h-full flex flex-col pt-2",
                        isPlanCurrent("premium") 
                            ? "border-nba-blue-500 dark:border-nba-red-500 bg-nba-blue-50/50 dark:bg-nba-red-950/20" 
                            : isPlanDowngrade("premium")
                            ? "border-muted bg-muted/30 opacity-75"
                            : "border-primary/50 shadow-md shadow-primary/10"
                    )}>
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
                            {billingCycle === "annual" && !isPlanCurrent("premium") && (
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
                                    <FeatureItem included>Up to 3 favorite players</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Up to 3 favorite teams</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Derived statistics (efficiency ratings, shooting percentages)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Points progression charts</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Minutes progression tracking</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Participation rates analytics</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Skill profile radar charts</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Bar chart comparisons vs league average</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Shooting distribution by type</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Ultimate player impact metrics (LEBRON, PIPM, RAPTOR)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem>Advanced team analytics (TMPRI, TTAQ, Clutch DNA)</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <PlanButton 
                                plan="premium" 
                                variant={getPlanButtonVariant("premium")}
                                text={getPlanButtonText("premium")}
                                canUpgrade={canUpgrade("premium")}
                                billingCycle={billingCycle}
                            />
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Ultimate Tier */}
                <motion.div variants={cardVariants} whileHover={canUpgrade("ultimate") ? "hover" : undefined}>
                    <Card className={cn(
                        "transition-colors bg-gradient-to-b from-background to-accent/30 h-full flex flex-col relative",
                        isPlanCurrent("ultimate") 
                            ? "border-nba-blue-500 dark:border-nba-red-500 bg-gradient-to-b from-nba-blue-50/50 to-nba-blue-100/30 dark:from-nba-red-950/20 dark:to-nba-red-900/10" 
                            : isPlanDowngrade("ultimate")
                            ? "border-muted bg-muted/30 opacity-75"
                            : "border-border hover:border-primary/50"
                    )}>
                        {isPlanCurrent("ultimate") && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-nba-blue-600 to-nba-blue-800 dark:from-nba-red-600 dark:to-nba-red-800 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-6 rounded-full shadow-lg z-20">
                                Current Plan
                            </div>
                        )}
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
                            {billingCycle === "annual" && !isPlanCurrent("ultimate") && (
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
                                    <FeatureItem included>Unlimited favorites (players & teams)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Advanced impact metrics (LEBRON, PIPM, RAPTOR WAR)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Position comparison scatter plots</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Pace impact analysis</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Fatigue performance curves</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Team momentum & resilience metrics (TMPRI)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Tactical adaptability quotient (TTAQ)</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Clutch DNA performance profiles</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Efficiency radar charts for teams</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Points vs opponent progression tracking</FeatureItem>
                                </motion.div>
                                <motion.div variants={featureVariants}>
                                    <FeatureItem included>Early access to new features</FeatureItem>
                                </motion.div>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <PlanButton 
                                plan="ultimate" 
                                variant={getPlanButtonVariant("ultimate")}
                                text={getPlanButtonText("ultimate")}
                                canUpgrade={canUpgrade("ultimate")}
                                billingCycle={billingCycle}
                            />
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

interface PlanButtonProps {
    plan: string
    variant: "current" | "downgrade" | "upgrade"
    text: string
    canUpgrade: boolean
    billingCycle: "monthly" | "annual"
}

function PlanButton({ plan, variant, text, canUpgrade, billingCycle }: PlanButtonProps) {
    console.log(canUpgrade, variant, text, plan, billingCycle)
    if (variant === "current") {
        return (
            <motion.button
                className="w-full py-2 rounded-lg border border-nba-blue-500 dark:border-nba-red-500 text-nba-blue-600 dark:text-nba-red-500 bg-nba-blue-50 dark:bg-nba-red-950/30 cursor-default"
                whileHover={{ scale: 1.02 }}
            >
                {text}
            </motion.button>
        )
    }

    if (variant === "downgrade") {
        return (
            <motion.button
                className="w-full py-2 rounded-lg border border-muted text-muted-foreground cursor-not-allowed opacity-60"
                disabled
            >
                {text}
            </motion.button>
        )
    }

    // Upgrade button
    if (plan === "premium") {
        return (
            <Link
                href={`/checkout?plan=premium&billing=${billingCycle}`}
                className="w-full cursor-pointer"
            >
                <motion.button
                    className="w-full cursor-pointer py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {text}
                </motion.button>
            </Link>
        )
    }

    return (
        <Link
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
                {text}
            </motion.button>
        </Link>
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

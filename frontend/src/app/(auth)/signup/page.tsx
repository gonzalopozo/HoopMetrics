"use client"

import { useContext, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthContext } from "@/context/AuthContext"
import { Logo } from "@/components/ui/logo"

const schema = z.object({
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, { 
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol" 
        }),
    role: z.enum(["free", "premium", "enterprise", "admin"], {
        message: "Please select a valid subscription plan",
    }),
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: "free",
        },
    })

    const [showPassword, setShowPassword] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    
    // Watch password field to show real-time validation
    const password = watch("password", "")

    const auth = useContext(AuthContext)!;
    const router = useRouter()

    // Password validation helpers
    const hasMinLength = password.length >= 6
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[@$!%*?&]/.test(password)

    const onSubmit = async (data: FormData) => {
        try {
            setAuthError(null)
            await auth.signup(data)
            
            // ✅ Disparar evento después del signup exitoso
            setTimeout(() => {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent('authStateChanged'));
                }
            }, 100);
            
            router.push("/") // Cambiar a "/" en lugar de "/admin"
        } catch (err: unknown) {
            setAuthError(err instanceof Error ? err.message : "Ocurrió un error desconocido");
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex justify-center">
                        <Logo />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Join HoopMetrics</h1>
                    <p className="mt-2 text-muted-foreground">Create your account to get started</p>
                </div>

                {/* Signup Card */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    {/* Basketball Court Top Design */}
                    <div className="relative h-8 bg-primary">
                        <div className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 rounded-full border-4 border-primary bg-card"></div>
                        <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-primary"></div>
                    </div>

                    <div className="p-6 pt-10">
                        {authError && (
                            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                <p>{authError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        {...register("username")}
                                        id="username"
                                        placeholder="johndoe"
                                        type="text"
                                        autoComplete="username"
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            errors.username && "border-destructive focus-visible:ring-destructive",
                                        )}
                                    />
                                </div>
                                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        {...register("email")}
                                        id="email"
                                        placeholder="you@example.com"
                                        type="email"
                                        autoComplete="email"
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            errors.email && "border-destructive focus-visible:ring-destructive",
                                        )}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        {...register("password")}
                                        id="password"
                                        placeholder="••••••"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            errors.password && "border-destructive focus-visible:ring-destructive",
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                
                                {/* Password Requirements */}
                                {password && (
                                    <div className="space-y-1 text-xs">
                                        <div className={cn("flex items-center gap-1", hasMinLength ? "text-green-600" : "text-muted-foreground")}>
                                            <div className={cn("h-1 w-1 rounded-full", hasMinLength ? "bg-green-600" : "bg-muted-foreground")} />
                                            At least 6 characters
                                        </div>
                                        <div className={cn("flex items-center gap-1", hasUppercase ? "text-green-600" : "text-muted-foreground")}>
                                            <div className={cn("h-1 w-1 rounded-full", hasUppercase ? "bg-green-600" : "bg-muted-foreground")} />
                                            One uppercase letter
                                        </div>
                                        <div className={cn("flex items-center gap-1", hasLowercase ? "text-green-600" : "text-muted-foreground")}>
                                            <div className={cn("h-1 w-1 rounded-full", hasLowercase ? "bg-green-600" : "bg-muted-foreground")} />
                                            One lowercase letter
                                        </div>
                                        <div className={cn("flex items-center gap-1", hasNumber ? "text-green-600" : "text-muted-foreground")}>
                                            <div className={cn("h-1 w-1 rounded-full", hasNumber ? "bg-green-600" : "bg-muted-foreground")} />
                                            One number
                                        </div>
                                        <div className={cn("flex items-center gap-1", hasSymbol ? "text-green-600" : "text-muted-foreground")}>
                                            <div className={cn("h-1 w-1 rounded-full", hasSymbol ? "bg-green-600" : "bg-muted-foreground")} />
                                            One symbol (@$!%*?&)
                                        </div>
                                    </div>
                                )}
                                
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="h-4 w-4 rounded border border-primary text-primary focus:ring-primary"
                                />
                                <label htmlFor="terms" className="text-sm text-muted-foreground">
                                    I agree to the{" "}
                                    <Link href="/terms" className="font-medium text-primary hover:underline">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="font-medium text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create account</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Already have an account?</span>{" "}
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} HoopMetrics. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}

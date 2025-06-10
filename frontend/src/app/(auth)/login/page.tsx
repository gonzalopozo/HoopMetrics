"use client";

import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart2, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthContext } from "@/context/AuthContext";

const schema = z.object({
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(schema),
    });

    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const auth = useContext(AuthContext)!;
    const router = useRouter();

    const onSubmit = async (data: z.infer<typeof schema>) => {
        try {
            setAuthError(null);
            await auth.login(data.email, data.password);
            router.push("/admin"); // or '/'
        } catch (err: unknown) {
            setAuthError(err instanceof Error ? err.message : "An unknown error occurred");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <BarChart2 className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to HoopMetrics</h1>
                    <p className="mt-2 text-muted-foreground">Sign in to access your dashboard</p>
                </div>

                {/* Login Card */}
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
                                        placeholder="your@email.com"
                                        type="email"
                                        autoComplete="email"
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            errors.email && "border-destructive focus-visible:ring-destructive",
                                        )}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message?.toString()}</p>}
                            </div>

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
                                        autoComplete="current-password"
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
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message?.toString()}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="h-4 w-4 rounded border border-primary text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                                        Remember me
                                    </label>
                                </div>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    Forgot your password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">{`Don't have an account?`}</span>{" "}
                            <Link href="/signup" className="font-medium text-primary hover:underline">
                                Sign up
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
    );
}
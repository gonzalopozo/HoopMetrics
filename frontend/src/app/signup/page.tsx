"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";

const schema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["free", "premium", "enterprise", "admin"]),
});

export default function SignupPage() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });
    const auth = useContext(AuthContext)!;
    const router = useRouter();

    const onSubmit = async (data: any) => {
        try {
            await auth.signup(data);
            router.push("/protected/admin"); // o '/'
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-4">
            <h1 className="text-2xl mb-4">Registro</h1>
            <input {...register("username")} placeholder="Usuario" />
            {errors.username && <p>{errors.username.message}</p>}
            <input {...register("email")} placeholder="Email" type="email" />
            {errors.email && <p>{errors.email.message}</p>}
            <input {...register("password")} placeholder="Contraseña" type="password" />
            {errors.password && <p>{errors.password.message}</p>}
            <select {...register("role")}>
                {["free", "premium", "enterprise", "admin"].map(r => (
                    <option key={r} value={r}>{r}</option>
                ))}
            </select>
            {errors.role && <p>{errors.role.message}</p>}
            <button type="submit" className="mt-4">Crear cuenta</button>
        </form>
    );
}

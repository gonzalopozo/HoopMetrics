"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });
    const auth = useContext(AuthContext)!;
    const router = useRouter();

    const onSubmit = async (data: any) => {
        try {
            await auth.login(data.email, data.password);
            router.push("/protected/admin"); // o '/'
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-4">
            <h1 className="text-2xl mb-4">Login</h1>
            <input {...register("email")} placeholder="Email" type="email" />
            {errors.email && <p>{errors.email.message}</p>}
            <input {...register("password")} placeholder="Contraseña" type="password" />
            {errors.password && <p>{errors.password.message}</p>}
            <button type="submit" className="mt-4">Entrar</button>
        </form>
    );
}

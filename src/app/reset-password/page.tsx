"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";

const schema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  confirmation: z.string().min(8, "Confirme a nova senha."),
}).refine((data) => data.password === data.confirmation, {
  message: "As senhas não coincidem.",
  path: ["confirmation"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") ?? "";
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setServerError("");
    if (!token) {
      setServerError("Link de recuperação inválido.");
      return;
    }
    try {
      await api.post("/api/v1/auth/reset-password", { token, password: values.password });
      setSuccess(true);
    } catch {
      setServerError("O link é inválido, expirou ou já foi utilizado.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <section className="w-full max-w-md rounded-3xl border bg-surface p-8 shadow-glow">
        <p className="text-sm font-medium text-secondary">Segurança da conta</p>
        <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold">Criar nova senha</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Defina uma nova senha com pelo menos 8 caracteres.</p>

        {success ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Senha redefinida com sucesso.</div>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white">Entrar na plataforma</Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">Nova senha</label>
              <div className="flex items-center gap-3 rounded-xl border bg-elevated px-4 focus-within:border-primary"><LockKeyhole size={17} className="text-muted" /><input id="password" type="password" autoComplete="new-password" className="h-12 w-full bg-transparent text-sm outline-none" {...register("password")} /></div>
              {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirmation" className="mb-2 block text-sm font-medium">Confirmar nova senha</label>
              <div className="flex items-center gap-3 rounded-xl border bg-elevated px-4 focus-within:border-primary"><LockKeyhole size={17} className="text-muted" /><input id="confirmation" type="password" autoComplete="new-password" className="h-12 w-full bg-transparent text-sm outline-none" {...register("confirmation")} /></div>
              {errors.confirmation && <p className="mt-2 text-xs text-red-400">{errors.confirmation.message}</p>}
            </div>
            {serverError && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{serverError}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-70">{isSubmitting && <LoaderCircle className="animate-spin" size={18} />}{isSubmitting ? "Salvando" : "Redefinir senha"}</button>
          </form>
        )}
      </section>
    </main>
  );
}

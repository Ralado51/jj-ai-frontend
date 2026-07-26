"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";

const schema = z.object({ email: z.string().email("Informe um e-mail válido.") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setServerError("");
    try {
      await api.post("/api/v1/auth/forgot-password", values);
      setSent(true);
    } catch {
      setServerError("Não foi possível processar a solicitação. Tente novamente.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <section className="w-full max-w-md rounded-3xl border bg-surface p-8 shadow-glow">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white"><ArrowLeft size={16} />Voltar ao login</Link>
        <p className="text-sm font-medium text-secondary">Recuperação de acesso</p>
        <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold">Esqueci minha senha</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Informe seu e-mail para receber o link de redefinição.</p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label>
              <div className="flex items-center gap-3 rounded-xl border bg-elevated px-4 focus-within:border-primary">
                <Mail size={17} className="text-muted" />
                <input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com" className="h-12 w-full bg-transparent text-sm outline-none" {...register("email")} />
              </div>
              {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            {serverError && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{serverError}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-70">
              {isSubmitting && <LoaderCircle className="animate-spin" size={18} />}
              {isSubmitting ? "Enviando" : "Enviar link de recuperação"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

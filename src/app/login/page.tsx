"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Bot, LoaderCircle, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/providers/auth-provider";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError("");
    try {
      await login(values);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setServerError("E-mail ou senha inválidos.");
        return;
      }
      setServerError("Não foi possível conectar à plataforma. Tente novamente.");
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background px-5 py-10 lg:grid-cols-2 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_35%)]" />
      <section className="relative hidden flex-col justify-between rounded-3xl border bg-surface/70 p-10 shadow-glow backdrop-blur lg:flex">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white"><Bot size={22} /></div><div><p className="font-[var(--font-manrope)] text-lg font-bold">JJ AI Platform</p><p className="text-xs text-muted">AI Premium Workspace</p></div></div>
        <div className="max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-secondary"><Sparkles size={14} />Inteligência aplicada</div><h1 className="font-[var(--font-manrope)] text-5xl font-bold leading-tight tracking-tight">Operação conectada para criar, automatizar e escalar.</h1><p className="mt-6 max-w-lg text-base leading-7 text-muted">Centralize projetos, agentes, conhecimento e workflows em uma única plataforma segura.</p></div>
        <p className="text-xs text-muted">JJ Network · Ambiente protegido por autenticação JWT</p>
      </section>
      <section className="relative grid place-items-center py-8 lg:py-0">
        <div className="w-full max-w-md rounded-3xl border bg-surface/90 p-7 shadow-glow backdrop-blur md:p-9">
          <div className="mb-8 lg:hidden"><div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white"><Bot size={22} /></div><p className="font-[var(--font-manrope)] text-xl font-bold">JJ AI Platform</p></div>
          <p className="text-sm font-medium text-secondary">Acesso seguro</p><h2 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight">Entrar na plataforma</h2><p className="mt-3 text-sm leading-6 text-muted">Use sua conta cadastrada na API da JJ AI Platform.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div><label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label><div className="flex items-center gap-3 rounded-xl border bg-elevated px-4 focus-within:border-primary"><Mail size={17} className="text-muted" /><input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted" {...register("email")} /></div>{errors.email && <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>}</div>
            <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium">Senha</label><Link href="/forgot-password" className="text-xs font-medium text-secondary hover:underline">Esqueci minha senha</Link></div><div className="flex items-center gap-3 rounded-xl border bg-elevated px-4 focus-within:border-primary"><LockKeyhole size={17} className="text-muted" /><input id="password" type="password" autoComplete="current-password" placeholder="Sua senha" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted" {...register("password")} /></div>{errors.password && <p className="mt-2 text-xs text-red-400">{errors.password.message}</p>}</div>
            {serverError && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{serverError}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">{isSubmitting && <LoaderCircle className="animate-spin" size={18} />}{isSubmitting ? "Entrando" : "Entrar"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}

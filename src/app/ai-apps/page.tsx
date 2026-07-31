"use client";

import { Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { aiApps, getAiAppStatusLabel } from "@/lib/ai-apps/registry";

export default function AiAppsPage() {
  const featuredApp = aiApps.find((app) => app.featured);

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-8">
        <div className="overflow-hidden rounded-3xl border bg-surface shadow-glow">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
                <Sparkles size={14} /> Aplicativos especializados de IA
              </div>
              <h1 className="mt-5 font-[var(--font-manrope)] text-4xl font-bold tracking-tight md:text-5xl">AI Apps</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Use experiências guiadas para executar tarefas completas. Cada app compartilha os projetos,
                documentos, histórico e recursos de IA da JJ AI Platform.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-secondary">
                  <Bot size={22} />
                </div>
                <div>
                  <p className="font-semibold">Primeiro app disponível</p>
                  <p className="text-xs text-muted">{featuredApp?.title ?? "Criador de Conteúdo"}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                Selecione um projeto para abrir os AI Apps disponíveis e iniciar um fluxo guiado.
              </p>
              <Link
                href="/projects"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Escolher projeto
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[var(--font-manrope)] text-2xl font-bold">Catálogo de apps</h2>
              <p className="mt-1 text-sm text-muted">O catálogo é renderizado a partir do registro central de AI Apps.</p>
            </div>
            <span className="text-xs font-medium text-muted">1 disponível · 7 planejados</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiApps.map((app) => {
              const Icon = app.icon;
              const card = (
                <article
                  className={`group flex min-h-56 flex-col rounded-2xl border p-5 transition ${
                    app.featured
                      ? "bg-gradient-to-br from-primary/15 via-surface to-secondary/10 hover:border-primary/50"
                      : "bg-surface hover:bg-elevated/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border bg-background text-secondary">
                      <Icon size={21} />
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${app.status === "available" ? "border-primary/40 bg-primary/15 text-secondary" : "text-muted"}`}>
                      {getAiAppStatusLabel(app.status)}
                    </span>
                  </div>
                  <h3 className="mt-5 font-[var(--font-manrope)] text-xl font-bold">{app.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{app.description}</p>
                  <div className="mt-auto pt-5 text-sm font-semibold text-secondary">
                    {app.status === "available" ? "Selecionar projeto →" : "Em desenvolvimento"}
                  </div>
                </article>
              );

              return app.status === "available" ? (
                <Link key={app.id} href="/projects" className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {card}
                </Link>
              ) : (
                <div key={app.id} aria-disabled="true">
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

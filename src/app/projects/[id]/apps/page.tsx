"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { aiApps, getAiAppStatusLabel } from "@/lib/ai-apps/registry";

export default function ProjectAiAppsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-7">
        <div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline">
            <ArrowLeft size={15} /> Voltar para projetos
          </Link>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
                <Sparkles size={14} /> Aplicativos deste projeto
              </div>
              <h1 className="mt-4 font-[var(--font-manrope)] text-4xl font-bold tracking-tight">AI Apps</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Execute fluxos especializados usando o conhecimento, histórico e recursos de IA deste projeto.
              </p>
            </div>
            <Link href={`/projects/${projectId}/ai`} className="inline-flex h-11 items-center justify-center rounded-xl border bg-surface px-4 text-sm font-semibold transition hover:bg-elevated">
              Abrir AI Workspace
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aiApps.map((app) => {
            const Icon = app.icon;
            const href = app.route?.(projectId);
            const card = (
              <article className={`flex min-h-60 flex-col rounded-2xl border p-5 transition ${app.featured ? "bg-gradient-to-br from-primary/15 via-surface to-secondary/10 hover:border-primary/50" : "bg-surface hover:bg-elevated/60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border bg-background text-secondary"><Icon size={21} /></div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${app.status === "available" ? "border-primary/40 bg-primary/15 text-secondary" : "text-muted"}`}>
                    {getAiAppStatusLabel(app.status)}
                  </span>
                </div>
                <h2 className="mt-5 font-[var(--font-manrope)] text-xl font-bold">{app.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{app.description}</p>
                <div className="mt-auto pt-5 text-sm font-semibold text-secondary">{href ? "Abrir app →" : "Em desenvolvimento"}</div>
              </article>
            );

            return href ? (
              <Link key={app.id} href={href} className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40">{card}</Link>
            ) : (
              <div key={app.id} aria-disabled="true">{card}</div>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}

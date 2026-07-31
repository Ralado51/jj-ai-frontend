"use client";

import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Code2,
  FileText,
  Megaphone,
  PlayCircle,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";

const apps = [
  {
    title: "Criador de Conteúdo",
    description: "Transforme um briefing em roteiro, títulos, legenda, hashtags e prompts de produção.",
    icon: PlayCircle,
    href: "/projects",
    status: "Disponível",
    featured: true,
  },
  {
    title: "Gerador de Documentação",
    description: "Crie documentação funcional, técnica, atas, planos e entregáveis com contexto do projeto.",
    icon: FileText,
    status: "Em breve",
  },
  {
    title: "Business Analyst",
    description: "Converta necessidades de negócio em processos, requisitos, histórias e critérios de aceite.",
    icon: BriefcaseBusiness,
    status: "Em breve",
  },
  {
    title: "Salesforce Builder",
    description: "Estruture soluções Salesforce, automações, objetos, integrações e planos de implementação.",
    icon: Workflow,
    status: "Em breve",
  },
  {
    title: "Code Assistant",
    description: "Planeje, gere e revise código com contexto técnico e padrões do projeto.",
    icon: Code2,
    status: "Em breve",
  },
  {
    title: "Marketing",
    description: "Crie campanhas, mensagens, calendários e análises para diferentes canais.",
    icon: Megaphone,
    status: "Em breve",
  },
  {
    title: "Analytics",
    description: "Transforme dados e indicadores em diagnósticos, hipóteses e próximos passos.",
    icon: BarChart3,
    status: "Em breve",
  },
  {
    title: "Marketplace",
    description: "Catálogo futuro de AI Apps prontos e extensões especializadas.",
    icon: Plus,
    status: "Planejado",
  },
];

export default function AiAppsPage() {
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
                  <p className="text-xs text-muted">Criador de Conteúdo</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                Selecione um projeto para abrir o AI Workspace e iniciar o fluxo guiado de criação.
              </p>
              <Link
                href="/projects"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <PlayCircle size={17} /> Abrir Criador de Conteúdo
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[var(--font-manrope)] text-2xl font-bold">Catálogo de apps</h2>
              <p className="mt-1 text-sm text-muted">Novos apps reutilizarão a mesma base da plataforma.</p>
            </div>
            <span className="text-xs font-medium text-muted">1 disponível · 7 planejados</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {apps.map(({ title, description, icon: Icon, href, status, featured }) => {
              const card = (
                <article
                  className={`group flex min-h-56 flex-col rounded-2xl border p-5 transition ${
                    featured
                      ? "bg-gradient-to-br from-primary/15 via-surface to-secondary/10 hover:border-primary/50"
                      : "bg-surface hover:bg-elevated/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border bg-background text-secondary">
                      <Icon size={21} />
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${featured ? "border-primary/40 bg-primary/15 text-secondary" : "text-muted"}`}>
                      {status}
                    </span>
                  </div>
                  <h3 className="mt-5 font-[var(--font-manrope)] text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                  <div className="mt-auto pt-5 text-sm font-semibold text-secondary">
                    {href ? "Abrir app →" : "Em desenvolvimento"}
                  </div>
                </article>
              );

              return href ? (
                <Link key={title} href={href} className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {card}
                </Link>
              ) : (
                <div key={title} aria-disabled="true">
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

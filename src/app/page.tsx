import { Activity, Bot, Boxes, FileText, Sparkles, Workflow } from "lucide-react";
import { ApiStatus } from "@/components/api-status";
import { DashboardShell } from "@/components/dashboard-shell";

const metrics = [
  { label: "Projetos", value: "—", icon: Boxes, detail: "CRUD será integrado na Sprint 3" },
  { label: "Documentos", value: "—", icon: FileText, detail: "Upload será integrado na Sprint 4" },
  { label: "Agentes", value: "—", icon: Bot, detail: "Base preparada para expansão" },
  { label: "Workflows", value: "—", icon: Workflow, detail: "Integração com n8n planejada" },
];

export default function Home() {
  return (
    <DashboardShell>
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-secondary">
              <Sparkles size={14} />
              Front Foundation
            </div>
            <h1 className="font-[var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
              Visão inicial da JJ AI Platform com identidade AI Premium e conexão ao backend publicado.
            </p>
          </div>

          <div className="rounded-xl border bg-gradient-to-r from-primary/15 to-secondary/10 px-4 py-3 text-sm">
            <p className="font-semibold">Inteligência aplicada.</p>
            <p className="text-muted">Operação conectada.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, detail }) => (
            <article key={label} className="rounded-xl border bg-surface p-5 shadow-glow transition hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-3 font-[var(--font-manrope)] text-3xl font-bold">{value}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 text-secondary ring-1 ring-primary/20">
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">{detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border bg-surface p-5 shadow-glow md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Atividade recente</p>
                <h2 className="mt-1 font-[var(--font-manrope)] text-xl font-bold">Fundação da plataforma</h2>
              </div>
              <Activity className="text-secondary" size={22} />
            </div>

            <div className="mt-6 space-y-4">
              {[
                "Brand kit AI Premium aplicado",
                "Layout responsivo com sidebar e header",
                "Tema escuro padrão e tema claro opcional",
                "Cliente HTTP conectado à API de produção",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-xl border bg-elevated/55 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-xs font-bold text-secondary">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{item}</p>
                    <p className="mt-1 text-xs text-muted">Implementação disponível nesta primeira versão navegável.</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <ApiStatus />

            <section className="rounded-xl border bg-surface p-5 shadow-glow">
              <p className="text-sm text-muted">Próximo marco</p>
              <h2 className="mt-2 font-[var(--font-manrope)] text-xl font-bold">Autenticação visual</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                O próximo incremento conecta login, cadastro, sessão JWT e permissões por perfil ao frontend.
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-elevated">
                <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>
              <p className="mt-2 text-xs text-muted">Roadmap frontend: 1 de 5 sprints iniciada</p>
            </section>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

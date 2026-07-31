"use client";

import { ArrowLeft, FileText, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ContentCreatorWizard } from "@/components/ai/content-creator-wizard";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ContentCreatorAppPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;
  const [open, setOpen] = useState(false);

  function handleApply(prompt: string) {
    sessionStorage.setItem(`jj-ai-content-briefing:${projectId}`, prompt);
    router.push(`/projects/${projectId}/ai?source=content-creator`);
  }

  return (
    <DashboardShell>
      <ContentCreatorWizard open={open} onClose={() => setOpen(false)} onApply={handleApply} />

      <section className="mx-auto max-w-[1200px] space-y-7">
        <div>
          <Link href={`/projects/${projectId}/apps`} className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline">
            <ArrowLeft size={15} /> Voltar para AI Apps
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-surface to-secondary/10 shadow-glow">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-semibold text-secondary">
                <Sparkles size={14} /> AI App disponível
              </div>
              <h1 className="mt-5 font-[var(--font-manrope)] text-4xl font-bold tracking-tight md:text-5xl">Criador de Conteúdo</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
                Construa um briefing guiado e transforme-o em roteiro, títulos, legenda, hashtags, CTA e prompts de produção.
              </p>
              <button type="button" onClick={() => setOpen(true)} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white transition hover:opacity-90">
                <PlayCircle size={18} /> Criar novo conteúdo
              </button>
            </div>

            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fluxo do app</p>
              <div className="mt-4 space-y-3 text-sm">
                {["Briefing guiado", "Prompt estruturado", "Geração no AI Workspace", "Histórico salvo no projeto"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border bg-surface px-3 py-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-secondary">{index + 1}</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border bg-surface p-5">
            <PlayCircle className="text-secondary" size={22} />
            <h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">Novo conteúdo</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Inicie o wizard e monte um briefing completo em poucos passos.</p>
          </article>
          <article className="rounded-2xl border bg-surface p-5">
            <FileText className="text-secondary" size={22} />
            <h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">Templates</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Use a biblioteca existente para complementar o fluxo de criação.</p>
          </article>
          <article className="rounded-2xl border bg-surface p-5">
            <Sparkles className="text-secondary" size={22} />
            <h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">AI Workspace</h2>
            <p className="mt-2 text-sm leading-6 text-muted">O briefing final é enviado ao runtime compartilhado de IA do projeto.</p>
          </article>
        </div>
      </section>
    </DashboardShell>
  );
}

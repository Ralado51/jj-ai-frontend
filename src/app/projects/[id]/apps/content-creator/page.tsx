"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  FileText,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ContentCreatorWizard } from "@/components/ai/content-creator-wizard";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  ContentCreatorBriefing,
  ContentCreatorResponse,
  generateContent,
} from "@/lib/content-creator";

const scoreLabels: Record<string, string> = {
  hook: "Gancho",
  storytelling: "Storytelling",
  clarity: "Clareza",
  originality: "Originalidade",
  call_to_action: "CTA",
  structure: "Estrutura",
};

export default function ContentCreatorAppPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ContentCreatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleApply(briefing: ContentCreatorBriefing) {
    setOpen(false);
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      setResult(await generateContent(projectId, briefing));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível gerar o conteúdo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyContent() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
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
                Gere conteúdo com validação, avaliação de qualidade e refinamento automático.
              </p>
              <button type="button" onClick={() => setOpen(true)} disabled={loading} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                {loading ? <LoaderCircle className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                {loading ? "Gerando e avaliando" : "Criar novo conteúdo"}
              </button>
            </div>

            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fluxo do app</p>
              <div className="mt-4 space-y-3 text-sm">
                {["Briefing estruturado", "Geração com Prompt Engine", "Validator + Evaluator", "Refinamento automático"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border bg-surface px-3 py-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-secondary">{index + 1}</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border bg-surface">
            <div className="text-center">
              <LoaderCircle className="mx-auto animate-spin text-secondary" size={28} />
              <p className="mt-3 font-semibold">Gerando, validando e avaliando o conteúdo</p>
              <p className="mt-1 text-sm text-muted">O refinamento pode adicionar uma segunda chamada ao modelo.</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <article className="rounded-2xl border bg-surface p-5 shadow-glow">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Conteúdo final</p>
                  <p className="mt-1 text-xs text-muted">Modelo: {result.model} · Provider: {result.provider}</p>
                </div>
                <button type="button" onClick={() => void copyContent()} className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-elevated">
                  <Clipboard size={14} /> {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className="mt-5 text-sm leading-7">
                <MarkdownMessage content={result.content} />
              </div>
            </article>

            <aside className="space-y-4">
              <div className={`rounded-2xl border p-5 ${result.evaluation.passed ? "bg-emerald-400/10" : "bg-amber-400/10"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nota geral</p>
                    <p className="mt-2 text-4xl font-bold">{result.evaluation.scores.overall.toFixed(1)}</p>
                  </div>
                  {result.evaluation.passed ? <CheckCircle2 className="text-emerald-300" size={30} /> : <TriangleAlert className="text-amber-300" size={30} />}
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {result.evaluation.passed ? "Qualidade aprovada" : "Abaixo do limiar de qualidade"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {result.refined ? "A resposta passou por refinamento automático." : "A resposta foi aprovada sem refinamento."}
                </p>
              </div>

              <div className="rounded-2xl border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Dimensões</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(result.evaluation.scores)
                    .filter(([key]) => key !== "overall")
                    .map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs">
                          <span>{scoreLabels[key] ?? key}</span>
                          <strong>{value.toFixed(1)}</strong>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-background">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Validação</p>
                <p className="mt-3 text-sm font-semibold">{result.validation.is_valid ? "Estrutura válida" : "Estrutura com pendências"}</p>
                {result.validation.issues.length > 0 && <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">{result.validation.issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul>}
              </div>

              {(result.evaluation.issues.length > 0 || result.evaluation.strengths.length > 0) && (
                <div className="rounded-2xl border bg-surface p-5">
                  {result.evaluation.strengths.length > 0 && <><p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Pontos fortes</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted">{result.evaluation.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></>}
                  {result.evaluation.issues.length > 0 && <><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-amber-300">Melhorias</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted">{result.evaluation.issues.map((item) => <li key={item}>• {item}</li>)}</ul></>}
                </div>
              )}
            </aside>
          </div>
        )}

        {!result && !loading && (
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border bg-surface p-5"><PlayCircle className="text-secondary" size={22} /><h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">Novo conteúdo</h2><p className="mt-2 text-sm leading-6 text-muted">Preencha o briefing e gere diretamente no runtime especializado.</p></article>
            <article className="rounded-2xl border bg-surface p-5"><FileText className="text-secondary" size={22} /><h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">Qualidade mensurável</h2><p className="mt-2 text-sm leading-6 text-muted">Veja notas de gancho, narrativa, clareza, originalidade, CTA e estrutura.</p></article>
            <article className="rounded-2xl border bg-surface p-5"><Sparkles className="text-secondary" size={22} /><h2 className="mt-4 font-[var(--font-manrope)] text-lg font-bold">Refinamento automático</h2><p className="mt-2 text-sm leading-6 text-muted">Conteúdos reprovados recebem no máximo uma tentativa adicional.</p></article>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

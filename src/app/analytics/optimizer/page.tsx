"use client";

import { AlertTriangle, BadgeDollarSign, CheckCircle2, Gauge, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AICostOptimizerFilters, AICostOptimizerResponse, getAICostRecommendations } from "@/lib/ai-cost-optimizer";

const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const priorityLabel = { high: "Alta", medium: "Média", low: "Baixa" } as const;
const priorityClass = {
  high: "border-red-500/30 bg-red-500/10 text-red-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
} as const;

export default function AICostOptimizerPage() {
  const [filters, setFilters] = useState<AICostOptimizerFilters>({});
  const [data, setData] = useState<AICostOptimizerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAICostRecommendations(filters));
    } catch {
      setError("Não foi possível carregar as recomendações de otimização.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const highPriority = useMemo(() => data?.recommendations.filter((item) => item.priority === "high").length ?? 0, [data]);
  const averageConfidence = useMemo(() => {
    if (!data?.recommendations.length) return 0;
    return data.recommendations.reduce((sum, item) => sum + item.confidence, 0) / data.recommendations.length;
  }, [data]);

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border bg-surface p-6 shadow-glow md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Inteligência de custos</p>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold md:text-4xl">AI Cost Optimizer</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Recomendações explicáveis para reduzir custos e latência sem alterar automaticamente seus workflows.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition hover:bg-elevated disabled:opacity-60">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Projeto" value={filters.projectId ?? ""} placeholder="UUID do projeto" onChange={(value) => setFilters((current) => ({ ...current, projectId: value || undefined }))} />
          <Field label="Agente" value={filters.agentId ?? ""} placeholder="UUID do agente" onChange={(value) => setFilters((current) => ({ ...current, agentId: value || undefined }))} />
          <Field label="Provider" value={filters.provider ?? ""} placeholder="ollama, openai..." onChange={(value) => setFilters((current) => ({ ...current, provider: value || undefined }))} />
          <Field label="Modelo" value={filters.model ?? ""} placeholder="gemma3:4b" onChange={(value) => setFilters((current) => ({ ...current, model: value || undefined }))} />
          <button type="button" onClick={() => setFilters({})} className="mt-auto h-11 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-elevated">Limpar filtros</button>
          <label className="grid gap-2 text-sm font-semibold">De<input type="date" value={filters.dateFrom ?? ""} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value || undefined }))} className="h-11 rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label>
          <label className="grid gap-2 text-sm font-semibold">Até<input type="date" value={filters.dateTo ?? ""} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value || undefined }))} className="h-11 rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label>
        </div>

        {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Analisando oportunidades...</div> : null}
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

        {!loading && data ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric icon={BadgeDollarSign} label="Economia mensal potencial" value={usd.format(Number(data.potential_monthly_savings))} />
              <Metric icon={AlertTriangle} label="Prioridade alta" value={String(highPriority)} />
              <Metric icon={Gauge} label="Confiança média" value={`${averageConfidence.toFixed(0)}%`} />
            </div>

            {data.recommendations.length ? (
              <div className="space-y-4">
                {data.recommendations.map((item) => (
                  <article key={item.id} className="rounded-2xl border bg-surface p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass[item.priority]}`}>Prioridade {priorityLabel[item.priority]}</span>
                          <span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold text-muted">{item.category}</span>
                        </div>
                        <div>
                          <h2 className="font-[var(--font-manrope)] text-xl font-bold">{item.title}</h2>
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{item.description}</p>
                        </div>
                      </div>
                      <div className="min-w-48 rounded-xl border bg-background p-4 lg:text-right">
                        <p className="text-xs uppercase tracking-wide text-muted">Economia estimada</p>
                        <p className="mt-1 text-2xl font-bold text-secondary">{usd.format(Number(item.estimated_monthly_savings))}</p>
                        <p className="mt-1 text-xs text-muted">Confiança: {item.confidence.toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border bg-background p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} /> Ação recomendada</p>
                        <p className="mt-2 text-sm leading-6 text-muted">{item.action}</p>
                      </div>
                      <div className="rounded-xl border bg-background p-4">
                        <p className="text-sm font-semibold">Evidências</p>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-muted">{JSON.stringify(item.evidence, null, 2)}</pre>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-surface p-10 text-center">
                <CheckCircle2 className="mx-auto text-secondary" size={36} />
                <h2 className="mt-4 text-lg font-bold">Nenhuma otimização prioritária encontrada</h2>
                <p className="mt-2 text-sm text-muted">Continue coletando telemetria para melhorar a precisão das recomendações.</p>
              </div>
            )}
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/30" /></label>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-3 text-muted"><Icon size={18} /><span className="text-sm">{label}</span></div><p className="mt-4 truncate font-[var(--font-manrope)] text-2xl font-bold">{value}</p></article>;
}

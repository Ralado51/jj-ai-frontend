"use client";

import { Activity, Coins, Database, Gauge, LoaderCircle, RefreshCw, ServerCog } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AIUsageFilters, AIUsageSummary, getAIUsageSummary } from "@/lib/ai-costs";

const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export default function AICostDashboardPage() {
  const [filters, setFilters] = useState<AIUsageFilters>({});
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await getAIUsageSummary(filters));
    } catch {
      setError("Não foi possível carregar os dados de consumo de IA.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const cost = Number(summary?.estimated_cost ?? 0);
  const ollamaSavings = Number(summary?.ollama_savings ?? 0);
  const cacheRate = useMemo(() => summary?.total_requests ? (summary.cache_hits / summary.total_requests) * 100 : 0, [summary]);

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border bg-surface p-6 shadow-glow md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Governança financeira</p>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold md:text-4xl">AI Cost Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Acompanhe tokens, custos estimados, economia com modelos locais e eficiência das chamadas de IA.</p>
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

        {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando custos...</div> : null}
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <Metric icon={Activity} label="Requisições" value={integer.format(summary.total_requests)} />
              <Metric icon={Database} label="Tokens" value={integer.format(summary.total_tokens)} />
              <Metric icon={Coins} label="Custo estimado" value={usd.format(cost)} />
              <Metric icon={ServerCog} label="Economia com Ollama" value={usd.format(ollamaSavings)} />
              <Metric icon={Gauge} label="Latência média" value={`${(summary.average_latency_ms / 1000).toFixed(2)} s`} />
              <Metric icon={Gauge} label="Taxa de cache" value={`${cacheRate.toFixed(1)}%`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <article className="rounded-2xl border bg-surface p-6">
                <p className="text-sm text-muted">Economia total estimada</p>
                <p className="mt-3 font-[var(--font-manrope)] text-4xl font-bold text-secondary">{usd.format(ollamaSavings)}</p>
                <p className="mt-3 text-sm leading-6 text-muted">Comparação entre chamadas locais pelo Ollama e o custo equivalente usando o modelo de referência configurado no backend.</p>
              </article>
              <article className="rounded-2xl border bg-surface p-6">
                <p className="text-sm text-muted">Eficiência do cache</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, cacheRate)}%` }} /></div>
                <div className="mt-3 flex justify-between text-sm"><span>{integer.format(summary.cache_hits)} respostas em cache</span><span className="font-semibold">{cacheRate.toFixed(1)}%</span></div>
              </article>
            </div>

            {summary.total_requests === 0 ? <p className="rounded-2xl border bg-surface p-8 text-center text-sm text-muted">Ainda não há telemetria no período selecionado. Execute uma aplicação de IA instrumentada para começar a preencher o Cost Center.</p> : null}
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/30" /></label>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-3 text-muted"><Icon size={18} /><span className="text-sm">{label}</span></div><p className="mt-4 truncate font-[var(--font-manrope)] text-2xl font-bold">{value}</p></article>;
}

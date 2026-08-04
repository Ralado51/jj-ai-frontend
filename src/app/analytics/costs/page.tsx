"use client";

import { Activity, Coins, Database, Gauge, LoaderCircle, RefreshCw, ServerCog, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AICostDashboard, AICostRankingItem, AIUsageFilters, getAICostDashboard } from "@/lib/ai-costs";

const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export default function AICostDashboardPage() {
  const [filters, setFilters] = useState<AIUsageFilters>({});
  const [dashboard, setDashboard] = useState<AICostDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setDashboard(await getAICostDashboard(filters)); }
    catch { setError("Não foi possível carregar os dados de consumo de IA."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);
  const summary = dashboard?.summary;

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border bg-surface p-6 shadow-glow md:flex-row md:items-end md:justify-between md:p-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Governança financeira</p><h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold md:text-4xl">AI Cost Center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Custos, tendências, economia e rankings de consumo em uma única visão.</p></div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-elevated disabled:opacity-60"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Atualizar</button>
        </div>

        <div className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Projeto" value={filters.projectId ?? ""} placeholder="UUID do projeto" onChange={(value) => setFilters((current) => ({ ...current, projectId: value || undefined }))} />
          <Field label="Agente" value={filters.agentId ?? ""} placeholder="UUID do agente" onChange={(value) => setFilters((current) => ({ ...current, agentId: value || undefined }))} />
          <Field label="Provider" value={filters.provider ?? ""} placeholder="ollama, openai..." onChange={(value) => setFilters((current) => ({ ...current, provider: value || undefined }))} />
          <Field label="Modelo" value={filters.model ?? ""} placeholder="gemma3:4b" onChange={(value) => setFilters((current) => ({ ...current, model: value || undefined }))} />
          <button type="button" onClick={() => setFilters({})} className="mt-auto h-11 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-elevated">Limpar filtros</button>
          <label className="grid gap-2 text-sm font-semibold">De<input type="date" value={filters.dateFrom ?? ""} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value || undefined }))} className="h-11 rounded-xl border bg-background px-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Até<input type="date" value={filters.dateTo ?? ""} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value || undefined }))} className="h-11 rounded-xl border bg-background px-3 font-normal" /></label>
        </div>

        {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando custos...</div> : null}
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

        {!loading && dashboard && summary ? <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Metric icon={Activity} label="Requisições" value={integer.format(summary.total_requests)} />
            <Metric icon={Database} label="Tokens" value={integer.format(summary.total_tokens)} />
            <Metric icon={Coins} label="Custo estimado" value={usd.format(Number(summary.estimated_cost))} />
            <Metric icon={ServerCog} label="Economia com Ollama" value={usd.format(Number(summary.ollama_savings))} />
            <Metric icon={Gauge} label="Latência média" value={`${(summary.average_latency_ms / 1000).toFixed(2)} s`} />
            <Metric icon={Gauge} label="Taxa de cache" value={`${(summary.cache_hit_rate ?? 0).toFixed(1)}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Trend label="Custo semanal" value={dashboard.trends.weekly_cost_growth} />
            <Trend label="Tokens semanais" value={dashboard.trends.weekly_token_growth} />
            <Trend label="Requisições semanais" value={dashboard.trends.weekly_request_growth} />
          </div>

          <article className="rounded-2xl border bg-surface p-6">
            <h2 className="font-[var(--font-manrope)] text-xl font-bold">Evolução diária</h2>
            <div className="mt-6 flex h-56 items-end gap-2 overflow-x-auto border-b pb-2">
              {dashboard.timeline.map((item) => { const max = Math.max(...dashboard.timeline.map((entry) => entry.tokens), 1); const height = Math.max(8, (item.tokens / max) * 180); return <div key={item.date} className="flex min-w-12 flex-1 flex-col items-center gap-2"><span className="text-xs text-muted">{integer.format(item.tokens)}</span><div className="w-full rounded-t-lg bg-primary/80" style={{ height }} title={`${item.date}: ${item.tokens} tokens`} /><span className="text-[10px] text-muted">{item.date.slice(5)}</span></div>; })}
            </div>
          </article>

          <div className="grid gap-5 xl:grid-cols-2">
            <Ranking title="Modelos" items={dashboard.models} />
            <Ranking title="Providers" items={dashboard.providers} />
            <Ranking title="Agentes" items={dashboard.agents} />
            <Ranking title="Projetos" items={dashboard.projects} />
            <Ranking title="Execuções de workflow" items={dashboard.workflows} />
          </div>

          {summary.total_requests === 0 ? <p className="rounded-2xl border bg-surface p-8 text-center text-sm text-muted">Ainda não há telemetria no período selecionado.</p> : null}
        </> : null}
      </section>
    </DashboardShell>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold">{label}<input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal" /></label>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) { return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-3 text-muted"><Icon size={18} /><span className="text-sm">{label}</span></div><p className="mt-4 truncate font-[var(--font-manrope)] text-2xl font-bold">{value}</p></article>; }
function Trend({ label, value }: { label: string; value: number }) { return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-2 text-muted"><TrendingUp size={17} /><span className="text-sm">{label}</span></div><p className={`mt-3 text-2xl font-bold ${value > 0 ? "text-amber-400" : "text-secondary"}`}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</p></article>; }
function Ranking({ title, items }: { title: string; items: AICostRankingItem[] }) { return <article className="overflow-hidden rounded-2xl border bg-surface"><div className="border-b p-5"><h2 className="font-[var(--font-manrope)] text-xl font-bold">{title}</h2></div><div className="divide-y">{items.length ? items.slice(0, 8).map((item, index) => <div key={item.key} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 p-4"><span className="text-sm font-bold text-muted">{index + 1}</span><div className="min-w-0"><p className="truncate font-mono text-sm">{item.key}</p><p className="mt-1 text-xs text-muted">{integer.format(item.requests)} requisições · {integer.format(item.tokens)} tokens</p></div><span className="font-semibold">{usd.format(Number(item.cost))}</span></div>) : <p className="p-6 text-sm text-muted">Sem dados neste recorte.</p>}</div></article>; }

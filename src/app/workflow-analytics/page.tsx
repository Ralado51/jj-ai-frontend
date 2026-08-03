"use client";

import { AlertTriangle, CheckCircle2, Clock3, HeartPulse, Info, LineChart, LoaderCircle, RefreshCw, RotateCcw, Save, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  createWorkflowHealthSnapshot,
  getWorkflowAnalytics,
  getWorkflowHealthHistory,
  getWorkflowInsights,
  WorkflowAnalytics,
  WorkflowHealthHistory,
  WorkflowHealthHistoryItem,
  WorkflowInsight,
  WorkflowInsights,
  WorkflowRecommendation,
} from "@/lib/workflow-analytics";

export default function WorkflowAnalyticsPage() {
  const [data, setData] = useState<WorkflowAnalytics | null>(null);
  const [insights, setInsights] = useState<WorkflowInsights | null>(null);
  const [history, setHistory] = useState<WorkflowHealthHistory | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [analyticsData, insightsData, historyData] = await Promise.all([
        getWorkflowAnalytics(),
        getWorkflowInsights(),
        getWorkflowHealthHistory(undefined, 180),
      ]);
      setData(analyticsData);
      setInsights(insightsData);
      setHistory(historyData);
    } catch {
      setError("Não foi possível carregar os analytics, insights e histórico de saúde.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSnapshot() {
    setSavingSnapshot(true);
    setError("");
    setMessage("");
    try {
      await createWorkflowHealthSnapshot(selectedWorkflow === "all" ? undefined : selectedWorkflow);
      setHistory(await getWorkflowHealthHistory(undefined, 180));
      setMessage("Snapshot de saúde atualizado com sucesso.");
    } catch {
      setError("Não foi possível salvar o snapshot de saúde.");
    } finally {
      setSavingSnapshot(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const historyItems = useMemo(() => {
    const items = history?.items ?? [];
    const filtered = selectedWorkflow === "all" ? items : items.filter((item) => item.workflow_id === selectedWorkflow);
    return [...filtered].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  }, [history, selectedWorkflow]);

  const workflowOptions = insights?.workflows ?? [];

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Workflow Intelligence</p><h1 className="mt-2 text-3xl font-bold">Analytics de workflows</h1><p className="mt-2 text-sm text-muted">Acompanhe confiabilidade, duração, retries, gargalos, recomendações e evolução do Health Score.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void saveSnapshot()} disabled={savingSnapshot} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-60">{savingSnapshot ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Salvar snapshot</button><button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><RefreshCw size={16} /> Atualizar</button></div>
      </div>
    </header>

    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando métricas...</div> : null}
    {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}
    {message ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</p> : null}

    {!loading && data ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Workflow} label="Execuções" value={data.total_executions} />
        <Metric icon={CheckCircle2} label="Concluídas" value={data.completed_executions} />
        <Metric icon={AlertTriangle} label="Falhas" value={data.failed_executions} />
        <Metric icon={RotateCcw} label="Retries" value={data.retry_executions} />
        <Metric icon={CheckCircle2} label="Sucesso" value={`${data.success_rate.toFixed(1)}%`} />
        <Metric icon={Clock3} label="Duração média" value={`${(data.average_duration_ms / 1000).toFixed(2)} s`} />
      </div>

      <section className="rounded-2xl border bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4"><div className="flex items-center gap-3"><LineChart size={20} className="text-secondary" /><div><h2 className="text-xl font-bold">Evolução do Health Score</h2><p className="text-sm text-muted">Snapshots diários para identificar melhorias e regressões.</p></div></div><label className="grid gap-1 text-xs font-semibold text-muted">Workflow<select value={selectedWorkflow} onChange={(event) => setSelectedWorkflow(event.target.value)} className="h-10 min-w-[260px] rounded-xl border bg-background px-3 text-sm font-normal text-foreground"><option value="all">Todos os workflows</option>{workflowOptions.map((item) => <option key={item.workflow_id} value={item.workflow_id}>{item.workflow_name}</option>)}</select></label></div>
        <div className="mt-5"><HealthTrendChart items={historyItems} /></div>
      </section>

      <section className="rounded-2xl border bg-surface p-5">
        <div className="flex items-center gap-3"><HeartPulse size={20} className="text-secondary" /><div><h2 className="text-xl font-bold">Saúde dos workflows</h2><p className="text-sm text-muted">Diagnósticos e recomendações calculados a partir do histórico real.</p></div></div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">{insights?.workflows.length ? insights.workflows.map((item) => <WorkflowHealthCard key={item.workflow_id} item={item} />) : <p className="text-sm text-muted">Ainda não há dados suficientes para gerar insights.</p>}</div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-surface"><div className="border-b p-5"><h2 className="text-xl font-bold">Desempenho por workflow</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-elevated"><tr><th className="p-4">Workflow</th><th className="p-4">Execuções</th><th className="p-4">Sucesso</th><th className="p-4">Duração média</th></tr></thead><tbody>{data.workflows.length ? data.workflows.map((item) => <tr key={item.workflow_id} className="border-b last:border-0"><td className="p-4 font-semibold">{item.workflow_name}</td><td className="p-4">{item.executions}</td><td className="p-4">{item.success_rate.toFixed(1)}%</td><td className="p-4">{(item.average_duration_ms / 1000).toFixed(2)} s</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted">Sem dados.</td></tr>}</tbody></table></div></section>
        <section className="overflow-hidden rounded-2xl border bg-surface"><div className="border-b p-5"><h2 className="text-xl font-bold">Etapas mais lentas</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-elevated"><tr><th className="p-4">Etapa</th><th className="p-4">Agente</th><th className="p-4">Execuções</th><th className="p-4">Tempo médio</th></tr></thead><tbody>{data.slowest_steps.length ? data.slowest_steps.map((item) => <tr key={`${item.agent_id}-${item.position}`} className="border-b last:border-0"><td className="p-4">{item.position}</td><td className="p-4 font-semibold">{item.agent_name}</td><td className="p-4">{item.executions}</td><td className="p-4">{(item.average_duration_ms / 1000).toFixed(2)} s</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted">Sem dados.</td></tr>}</tbody></table></div></section>
      </div>

      <section className="rounded-2xl border bg-surface p-5"><h2 className="text-xl font-bold">Principais pontos de falha</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{data.failure_points.length ? data.failure_points.map((item, index) => <article key={`${item.workflow_name}-${item.step}-${index}`} className="rounded-xl border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{item.workflow_name}</p><p className="text-xs text-muted">Etapa {item.step}</p></div><span className="rounded-full border px-2.5 py-1 text-xs">{item.occurrences} ocorrência(s)</span></div><p className="mt-3 text-sm text-red-300">{item.error_message}</p></article>) : <p className="text-sm text-muted">Nenhuma falha registrada.</p>}</div></section>
    </> : null}
  </section></DashboardShell>;
}

function HealthTrendChart({ items }: { items: WorkflowHealthHistoryItem[] }) {
  if (!items.length) return <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted">Nenhum snapshot registrado. Use “Salvar snapshot” para iniciar o histórico.</div>;
  const width = 900;
  const height = 260;
  const padding = 34;
  const grouped = new Map<string, WorkflowHealthHistoryItem[]>();
  items.forEach((item) => grouped.set(item.workflow_id, [...(grouped.get(item.workflow_id) ?? []), item]));
  const dates = [...new Set(items.map((item) => item.snapshot_date))].sort();
  const x = (date: string) => padding + (dates.length === 1 ? (width - padding * 2) / 2 : (dates.indexOf(date) / (dates.length - 1)) * (width - padding * 2));
  const y = (score: number) => height - padding - (score / 100) * (height - padding * 2);
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[760px] w-full" role="img" aria-label="Evolução do Health Score dos workflows">
    {[0, 25, 50, 75, 100].map((score) => <g key={score}><line x1={padding} x2={width - padding} y1={y(score)} y2={y(score)} className="stroke-border" strokeWidth="1" /><text x="4" y={y(score) + 4} className="fill-muted text-[11px]">{score}</text></g>)}
    {[...grouped.entries()].map(([workflowId, points], seriesIndex) => { const sorted = [...points].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)); const path = sorted.map((item, index) => `${index === 0 ? "M" : "L"}${x(item.snapshot_date)},${y(item.health_score)}`).join(" "); return <g key={workflowId}><path d={path} fill="none" className="stroke-secondary" strokeWidth={2 + (seriesIndex % 2)} opacity={Math.max(0.45, 1 - seriesIndex * 0.12)} />{sorted.map((item) => <g key={item.id}><circle cx={x(item.snapshot_date)} cy={y(item.health_score)} r="4" className="fill-background stroke-secondary" strokeWidth="2"><title>{item.workflow_name}: {item.health_score} em {formatDate(item.snapshot_date)}</title></circle></g>)}</g>; })}
    {dates.map((date, index) => (index === 0 || index === dates.length - 1 || index % Math.ceil(dates.length / 6) === 0) ? <text key={date} x={x(date)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">{formatDate(date)}</text> : null)}
  </svg><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">{[...grouped.entries()].map(([id, values]) => <span key={id} className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary" />{values[0]?.workflow_name}</span>)}</div></div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T12:00:00`)); }

function WorkflowHealthCard({ item }: { item: WorkflowInsight }) {
  const tone = item.health_score >= 90 ? "border-emerald-500/30" : item.health_score >= 75 ? "border-sky-500/30" : item.health_score >= 60 ? "border-amber-500/30" : "border-red-500/30";
  return <article className={`rounded-2xl border bg-background p-5 ${tone}`}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{item.workflow_name}</h3><p className="mt-1 text-sm text-muted">{item.executions} execução(ões)</p></div><div className="text-right"><p className="text-3xl font-bold">{item.health_score}</p><p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.health_label}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm"><HealthMetric label="Sucesso" value={`${item.success_rate.toFixed(1)}%`} /><HealthMetric label="Retries" value={`${item.retry_rate.toFixed(1)}%`} /><HealthMetric label="Gargalo" value={item.bottleneck_step ? `Etapa ${item.bottleneck_step}` : "Nenhum"} /></div><div className="mt-4 space-y-3">{item.recommendations.map((recommendation) => <Recommendation key={`${recommendation.code}-${recommendation.step ?? "all"}`} item={recommendation} />)}</div></article>;
}

function Recommendation({ item }: { item: WorkflowRecommendation }) { const Icon = item.severity === "critical" || item.severity === "warning" ? AlertTriangle : item.severity === "success" ? CheckCircle2 : Info; return <div className="rounded-xl border bg-surface p-3"><div className="flex gap-3"><Icon size={17} className="mt-0.5 shrink-0" /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted">{item.description}</p><p className="mt-2 text-xs font-medium">Ação: {item.action}</p>{item.model ? <p className="mt-1 text-xs text-muted">Modelo: <span className="font-mono">{item.model}</span></p> : null}</div></div></div>; }
function HealthMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-surface p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Workflow; label: string; value: string | number }) { return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-2 text-muted"><Icon size={17} /><span className="text-sm">{label}</span></div><p className="mt-3 text-2xl font-bold">{value}</p></article>; }

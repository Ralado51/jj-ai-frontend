"use client";

import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, RefreshCw, RotateCcw, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkflowAnalytics, WorkflowAnalytics } from "@/lib/workflow-analytics";

export default function WorkflowAnalyticsPage() {
  const [data, setData] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getWorkflowAnalytics());
    } catch {
      setError("Não foi possível carregar os analytics de workflows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Workflow Intelligence</p><h1 className="mt-2 text-3xl font-bold">Analytics de workflows</h1><p className="mt-2 text-sm text-muted">Acompanhe confiabilidade, duração, retries e gargalos por etapa.</p></div>
        <button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><RefreshCw size={16} /> Atualizar</button>
      </div>
    </header>

    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando métricas...</div> : null}
    {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

    {!loading && data ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Workflow} label="Execuções" value={data.total_executions} />
        <Metric icon={CheckCircle2} label="Concluídas" value={data.completed_executions} />
        <Metric icon={AlertTriangle} label="Falhas" value={data.failed_executions} />
        <Metric icon={RotateCcw} label="Retries" value={data.retry_executions} />
        <Metric icon={CheckCircle2} label="Sucesso" value={`${data.success_rate.toFixed(1)}%`} />
        <Metric icon={Clock3} label="Duração média" value={`${(data.average_duration_ms / 1000).toFixed(2)} s`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-surface"><div className="border-b p-5"><h2 className="text-xl font-bold">Desempenho por workflow</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-elevated"><tr><th className="p-4">Workflow</th><th className="p-4">Execuções</th><th className="p-4">Sucesso</th><th className="p-4">Duração média</th></tr></thead><tbody>{data.workflows.length ? data.workflows.map((item) => <tr key={item.workflow_id} className="border-b last:border-0"><td className="p-4 font-semibold">{item.workflow_name}</td><td className="p-4">{item.executions}</td><td className="p-4">{item.success_rate.toFixed(1)}%</td><td className="p-4">{(item.average_duration_ms / 1000).toFixed(2)} s</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted">Sem dados.</td></tr>}</tbody></table></div></section>

        <section className="overflow-hidden rounded-2xl border bg-surface"><div className="border-b p-5"><h2 className="text-xl font-bold">Etapas mais lentas</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-elevated"><tr><th className="p-4">Etapa</th><th className="p-4">Agente</th><th className="p-4">Execuções</th><th className="p-4">Tempo médio</th></tr></thead><tbody>{data.slowest_steps.length ? data.slowest_steps.map((item) => <tr key={`${item.agent_id}-${item.position}`} className="border-b last:border-0"><td className="p-4">{item.position}</td><td className="p-4 font-semibold">{item.agent_name}</td><td className="p-4">{item.executions}</td><td className="p-4">{(item.average_duration_ms / 1000).toFixed(2)} s</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted">Sem dados.</td></tr>}</tbody></table></div></section>
      </div>

      <section className="rounded-2xl border bg-surface p-5"><h2 className="text-xl font-bold">Principais pontos de falha</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{data.failure_points.length ? data.failure_points.map((item, index) => <article key={`${item.workflow_name}-${item.step}-${index}`} className="rounded-xl border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{item.workflow_name}</p><p className="text-xs text-muted">Etapa {item.step}</p></div><span className="rounded-full border px-2.5 py-1 text-xs">{item.occurrences} ocorrência(s)</span></div><p className="mt-3 text-sm text-red-300">{item.error_message}</p></article>) : <p className="text-sm text-muted">Nenhuma falha registrada.</p>}</div></section>
    </> : null}
  </section></DashboardShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Workflow; label: string; value: string | number }) {
  return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-2 text-muted"><Icon size={17} /><span className="text-sm">{label}</span></div><p className="mt-3 text-2xl font-bold">{value}</p></article>;
}

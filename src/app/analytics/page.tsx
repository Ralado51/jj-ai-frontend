"use client";

import { Activity, BrainCircuit, Gauge, LoaderCircle, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnalyticsSummary, getAnalyticsSummary } from "@/lib/benchmark";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAnalyticsSummary()
      .then((data) => active && setSummary(data))
      .catch(() => active && setError("Não foi possível carregar o histórico de benchmarks."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Inteligência operacional</p>
          <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold md:text-4xl">AI Analytics</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Acompanhe qualidade, desempenho e vitórias dos modelos avaliados no Prompt Benchmark.</p>
        </div>

        {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando métricas...</div> : null}
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

        {summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Activity} label="Benchmarks" value={summary.total_runs.toString()} />
              <Metric icon={BrainCircuit} label="Execuções" value={summary.total_results.toString()} />
              <Metric icon={Gauge} label="Taxa de sucesso" value={`${summary.success_rate.toFixed(1)}%`} />
              <Metric icon={Trophy} label="Melhor modelo" value={summary.top_model ?? "Sem dados"} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-x-auto rounded-2xl border bg-surface">
                <div className="border-b p-5"><h2 className="font-[var(--font-manrope)] text-xl font-bold">Desempenho por modelo</h2></div>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b bg-elevated"><tr><th className="p-4">Modelo</th><th className="p-4">Execuções</th><th className="p-4">Nota média</th><th className="p-4">Tempo médio</th><th className="p-4">Tokens estimados</th></tr></thead>
                  <tbody>{summary.models.length ? summary.models.map((model) => <tr key={model.model} className="border-b last:border-0"><td className="p-4 font-mono">{model.model}</td><td className="p-4">{model.executions}</td><td className="p-4 font-semibold">{model.average_score.toFixed(2)}</td><td className="p-4">{(model.average_duration_ms / 1000).toFixed(2)} s</td><td className="p-4">{model.estimated_tokens}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-muted">Execute benchmarks para alimentar o painel.</td></tr>}</tbody>
                </table>
              </div>

              <aside className="rounded-2xl border bg-surface p-5">
                <h2 className="font-[var(--font-manrope)] text-xl font-bold">Vitórias</h2>
                <p className="mt-1 text-sm text-muted">Quantidade de vezes em que cada modelo liderou um benchmark.</p>
                <div className="mt-5 space-y-3">{summary.winners.length ? summary.winners.map((winner, index) => <div key={winner.model} className="flex items-center justify-between rounded-xl border bg-background p-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-secondary">{index + 1}</span><span className="font-mono text-sm">{winner.model}</span></div><span className="font-semibold">{winner.wins}</span></div>) : <p className="rounded-xl border bg-background p-4 text-sm text-muted">Ainda não há vencedores registrados.</p>}</div>
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-3 text-muted"><Icon size={18} /><span className="text-sm">{label}</span></div><p className="mt-4 truncate font-[var(--font-manrope)] text-2xl font-bold">{value}</p></article>;
}

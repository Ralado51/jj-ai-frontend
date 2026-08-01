"use client";

import { AxiosError } from "axios";
import { BarChart3, LoaderCircle, Play, Trophy } from "lucide-react";
import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AITaskType, AI_TASK_OPTIONS, BenchmarkRunResponse, runBenchmark } from "@/lib/benchmark";

const defaultModels = "qwen2.5:3b\ngemma3:4b";

export default function BenchmarkPage() {
  const [task, setTask] = useState<AITaskType>("general");
  const [systemPrompt, setSystemPrompt] = useState("Você é um assistente útil e objetivo.");
  const [prompt, setPrompt] = useState("");
  const [modelsText, setModelsText] = useState(defaultModels);
  const [result, setResult] = useState<BenchmarkRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const models = modelsText.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    if (new Set(models).size < 2) {
      setError("Informe pelo menos dois modelos distintos.");
      return;
    }

    setLoading(true);
    try {
      setResult(await runBenchmark({ task, system_prompt: systemPrompt, prompt, models }));
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível executar o benchmark.");
    } finally {
      setLoading(false);
    }
  }

  const resultTask = AI_TASK_OPTIONS.find((item) => item.value === result?.task)?.label;

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-secondary"><BarChart3 /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Laboratório de modelos</p>
              <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold md:text-4xl">Prompt Benchmark</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Compare modelos dentro da mesma categoria de tarefa para alimentar a seleção automática corretamente.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 rounded-2xl border bg-surface p-5 md:p-6">
          <label className="grid gap-2 text-sm font-semibold">Tipo de tarefa
            <select value={task} onChange={(event) => setTask(event.target.value as AITaskType)} className="h-12 rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30">
              {AI_TASK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Os resultados serão usados apenas para recomendar modelos nesta categoria.</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">System prompt
            <textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} className="min-h-24 rounded-xl border bg-background p-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Prompt a comparar
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-36 rounded-xl border bg-background p-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex.: Crie um roteiro de 20 segundos sobre guard-rails em IA." required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Modelos — um por linha ou separados por vírgula
            <textarea value={modelsText} onChange={(event) => setModelsText(event.target.value)} className="min-h-28 rounded-xl border bg-background p-3 font-mono text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30" required />
          </label>
          {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
          <button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 font-semibold text-white disabled:opacity-60">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}
            {loading ? "Executando modelos em sequência..." : "Executar benchmark"}
          </button>
        </form>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border bg-primary/10 p-4">
              <Trophy className="text-secondary" />
              <div><p className="text-xs text-muted">Vencedor em {resultTask ?? result.task}</p><p className="font-semibold">{result.winner ?? "Nenhum modelo concluiu"}</p></div>
            </div>
            <div className="overflow-x-auto rounded-2xl border bg-surface">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-elevated"><tr><th className="p-4">Posição</th><th className="p-4">Modelo</th><th className="p-4">Nota</th><th className="p-4">Tempo</th><th className="p-4">Tokens estimados</th><th className="p-4">Status</th></tr></thead>
                <tbody>{result.results.map((item, index) => <tr key={item.model} className="border-b last:border-0"><td className="p-4 font-semibold">{index + 1}º</td><td className="p-4 font-mono">{item.model}</td><td className="p-4">{item.scores?.overall.toFixed(2) ?? "—"}</td><td className="p-4">{(item.duration_ms / 1000).toFixed(2)} s</td><td className="p-4">{item.estimated_tokens}</td><td className="p-4">{item.success ? "Concluído" : item.error ?? "Falhou"}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">{result.results.map((item) => <article key={item.model} className="rounded-2xl border bg-surface p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{item.model}</h2><span className="rounded-full border px-2 py-1 text-xs">Nota {item.scores?.overall.toFixed(2) ?? "—"}</span></div><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-xs leading-6">{item.response || item.error}</pre></article>)}</div>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}

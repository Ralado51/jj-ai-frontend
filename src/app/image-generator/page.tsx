"use client";

import { Images, LoaderCircle, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { createImageJob, createImageJobsBatch, ImageJob } from "@/lib/image-jobs";
import { listProjects, Project } from "@/lib/projects";

const DEFAULT_MODEL = "stable-diffusion-v1-5/stable-diffusion-v1-5";
const DEFAULT_PROVIDER = "free-worker";

export default function ImageGeneratorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState("");
  const [batchText, setBatchText] = useState("");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState("");
  const [queuedJobs, setQueuedJobs] = useState<ImageJob[]>([]);

  const parsedItems = useMemo(() => batchText.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const separator = line.indexOf("|");
    if (separator === -1) return { external_id: `image-${index + 1}`, prompt: line };
    return {
      external_id: line.slice(0, separator).trim() || `image-${index + 1}`,
      prompt: line.slice(separator + 1).trim(),
    };
  }).filter((item) => item.prompt), [batchText]);

  useEffect(() => {
    async function load() {
      try {
        const items = await listProjects({ is_active: true, limit: 100 });
        setProjects(items);
        if (items.length) setProjectId(items[0].id);
      } catch (err) {
        setError(readError(err));
      } finally {
        setLoadingProjects(false);
      }
    }
    void load();
  }, []);

  async function runSingle() {
    if (!projectId || !prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const job = await createImageJob({
        project_id: projectId,
        provider: DEFAULT_PROVIDER,
        model,
        prompt: prompt.trim(),
        width: 1344,
        height: 768,
      });
      setQueuedJobs([job]);
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }

  async function runBatch() {
    if (!projectId || !parsedItems.length) return;
    setLoading(true);
    setError("");
    try {
      const response = await createImageJobsBatch(parsedItems.map((item) => ({
        project_id: projectId,
        external_id: item.external_id,
        provider: DEFAULT_PROVIDER,
        model,
        prompt: item.prompt,
        width: 1344,
        height: 768,
      })));
      setQueuedJobs(response.jobs);
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <div className="rounded-3xl border bg-surface p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Media Generation</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Image Generator</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Crie jobs persistentes para geração gratuita. Workers disponíveis processam a fila e enviam as imagens para revisão humana.</p>
    </div>

    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <div className="space-y-5 rounded-2xl border bg-surface p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button onClick={() => setMode("single")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "single" ? "bg-primary text-white" : "text-muted"}`}>Individual</button>
          <button onClick={() => setMode("batch")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "batch" ? "bg-primary text-white" : "text-muted"}`}>Lote</button>
        </div>

        <label className="grid gap-2 text-sm font-semibold">Projeto
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={loadingProjects} className="input">
            {loadingProjects ? <option>Carregando projetos...</option> : null}
            {!loadingProjects && projects.length === 0 ? <option value="">Nenhum projeto ativo</option> : null}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">Motor
          <input value="Free Worker Pool" disabled className="input opacity-80" />
          <span className="text-xs font-normal text-muted">A plataforma entrega o job ao primeiro worker gratuito compatível disponível.</span>
        </label>

        <label className="grid gap-2 text-sm font-semibold">Modelo
          <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
        </label>

        {mode === "single" ? <label className="grid gap-2 text-sm font-semibold">Prompt
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={14} className="rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Descreva a imagem..." />
        </label> : <label className="grid gap-2 text-sm font-semibold">Imagens do lote
          <textarea value={batchText} onChange={(e) => setBatchText(e.target.value)} rows={14} className="rounded-xl border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30" placeholder={"ansiedade-adulto | Professional editorial healthcare photograph...\ntdah-adulto | Brazilian adult working naturally..."} />
          <span className="text-xs font-normal text-muted">Uma imagem por linha no formato <code>id | prompt</code>. {parsedItems.length} itens prontos.</span>
        </label>}

        <button disabled={loading || !projectId || (mode === "single" ? !prompt.trim() : !parsedItems.length)} onClick={() => void (mode === "single" ? runSingle() : runBatch())} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
          {loading ? "Enviando para fila..." : mode === "single" ? "Adicionar à fila" : `Adicionar ${parsedItems.length} jobs à fila`}
        </button>
      </div>

      <div className="min-h-[520px] rounded-2xl border bg-surface p-5">
        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

        {!queuedJobs.length && !loading ? <div className="grid min-h-[470px] place-items-center text-center text-muted"><div className="max-w-md"><Images className="mx-auto mb-3" size={40} /><p className="font-semibold text-foreground">Fila de geração</p><p className="mt-1 text-sm">Os pedidos ficam persistidos na JJ AI Platform. Quando um worker gratuito estiver online, ele busca o próximo job, gera a imagem e envia o resultado para Image Review.</p></div></div> : null}

        {queuedJobs.length ? <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3"><Sparkles className="mt-0.5 text-emerald-300" size={20} /><div><p className="font-semibold text-emerald-200">{queuedJobs.length} {queuedJobs.length === 1 ? "job adicionado" : "jobs adicionados"} à fila</p><p className="mt-1 text-sm text-muted">A geração agora é assíncrona. Você não precisa manter esta página aberta.</p></div></div>
          </div>

          <div className="space-y-3">
            {queuedJobs.map((job) => <article key={job.id} className="rounded-xl border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{job.external_id ?? `Job ${job.id.slice(0, 8)}`}</p><p className="mt-1 text-xs text-muted">{job.model} · {job.width}×{job.height}</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold">{job.status}</span></div><p className="mt-3 line-clamp-3 text-sm text-muted">{job.prompt}</p></article>)}
          </div>

          <Link href="/image-review" className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold">Abrir Image Review</Link>
        </div> : null}
      </div>
    </div>
  </section></DashboardShell>;
}

function readError(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Não foi possível adicionar o job à fila de imagens.";
}

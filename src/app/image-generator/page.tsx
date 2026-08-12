"use client";

import { Download, Images, LoaderCircle, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  BatchImageGenerationResponse,
  generateImage,
  generateImagesBatch,
  ImageGenerationResponse,
  ImageProvider,
  imageDataUrl,
} from "@/lib/image-generation";
import { createImageJob, createImageJobsBatch, ImageJob } from "@/lib/image-jobs";
import { listProjects, Project } from "@/lib/projects";

type GeneratorProvider = "free-worker" | ImageProvider;

const providerConfig: Record<GeneratorProvider, { label: string; model: string; help: string }> = {
  "free-worker": {
    label: "JJ Free Compute",
    model: "stable-diffusion-v1-5/stable-diffusion-v1-5",
    help: "Envia o job para a fila persistente e usa o primeiro worker gratuito compatível disponível.",
  },
  huggingface: {
    label: "Hugging Face",
    model: "Tongyi-MAI/Z-Image-Turbo",
    help: "Geração direta pela API do Hugging Face configurada no backend.",
  },
  google: {
    label: "Google Gemini",
    model: "gemini-3.1-flash-lite-image",
    help: "Geração direta pela API do Google configurada no backend.",
  },
};

export default function ImageGeneratorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [provider, setProvider] = useState<GeneratorProvider>("free-worker");
  const [model, setModel] = useState(providerConfig["free-worker"].model);
  const [prompt, setPrompt] = useState("");
  const [batchText, setBatchText] = useState("");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState("");
  const [queuedJobs, setQueuedJobs] = useState<ImageJob[]>([]);
  const [result, setResult] = useState<ImageGenerationResponse | null>(null);
  const [batch, setBatch] = useState<BatchImageGenerationResponse | null>(null);

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

  function changeProvider(value: GeneratorProvider) {
    setProvider(value);
    setModel(providerConfig[value].model);
    setQueuedJobs([]);
    setResult(null);
    setBatch(null);
    setError("");
  }

  async function runSingle() {
    if (!prompt.trim()) return;
    if (provider === "free-worker" && !projectId) return;
    setLoading(true);
    setError("");
    setQueuedJobs([]);
    setResult(null);
    setBatch(null);
    try {
      if (provider === "free-worker") {
        const job = await createImageJob({
          project_id: projectId,
          provider,
          model,
          prompt: prompt.trim(),
          width: 1344,
          height: 768,
        });
        setQueuedJobs([job]);
      } else {
        setResult(await generateImage({
          provider,
          model,
          prompt: prompt.trim(),
          width: 1344,
          height: 768,
        }));
      }
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }

  async function runBatch() {
    if (!parsedItems.length) return;
    if (provider === "free-worker" && !projectId) return;
    setLoading(true);
    setError("");
    setQueuedJobs([]);
    setResult(null);
    setBatch(null);
    try {
      if (provider === "free-worker") {
        const response = await createImageJobsBatch(parsedItems.map((item) => ({
          project_id: projectId,
          external_id: item.external_id,
          provider,
          model,
          prompt: item.prompt,
          width: 1344,
          height: 768,
        })));
        setQueuedJobs(response.jobs);
      } else {
        setBatch(await generateImagesBatch(provider, parsedItems.map((item) => ({
          id: item.external_id,
          prompt: item.prompt,
          model,
          width: 1344,
          height: 768,
        }))));
      }
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }

  function download(image: ImageGenerationResponse, name: string) {
    const anchor = document.createElement("a");
    anchor.href = imageDataUrl(image);
    anchor.download = `${name}.png`;
    anchor.click();
  }

  const requiresProject = provider === "free-worker";
  const disabled = loading || (requiresProject && !projectId) || (mode === "single" ? !prompt.trim() : !parsedItems.length);

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <div className="rounded-3xl border bg-surface p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Media Generation</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Image Generator</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Use o compute gratuito da JJ como padrão ou escolha um provider externo configurado no backend.</p>
    </div>

    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <div className="space-y-5 rounded-2xl border bg-surface p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button onClick={() => setMode("single")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "single" ? "bg-primary text-white" : "text-muted"}`}>Individual</button>
          <button onClick={() => setMode("batch")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "batch" ? "bg-primary text-white" : "text-muted"}`}>Lote</button>
        </div>

        {requiresProject ? <label className="grid gap-2 text-sm font-semibold">Projeto
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={loadingProjects} className="input">
            {loadingProjects ? <option>Carregando projetos...</option> : null}
            {!loadingProjects && projects.length === 0 ? <option value="">Nenhum projeto ativo</option> : null}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label> : null}

        <label className="grid gap-2 text-sm font-semibold">Provider
          <select value={provider} onChange={(e) => changeProvider(e.target.value as GeneratorProvider)} className="input">
            <option value="free-worker">JJ Free Compute</option>
            <option value="huggingface">Hugging Face</option>
            <option value="google">Google Gemini</option>
          </select>
          <span className="text-xs font-normal text-muted">{providerConfig[provider].help}</span>
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

        <button disabled={disabled} onClick={() => void (mode === "single" ? runSingle() : runBatch())} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : provider === "free-worker" ? <Send size={18} /> : <Sparkles size={18} />}
          {loading ? (provider === "free-worker" ? "Enviando para fila..." : "Gerando...") : provider === "free-worker" ? (mode === "single" ? "Adicionar à fila" : `Adicionar ${parsedItems.length} jobs à fila`) : (mode === "single" ? "Gerar imagem" : `Gerar ${parsedItems.length} imagens`)}
        </button>
      </div>

      <div className="min-h-[520px] rounded-2xl border bg-surface p-5">
        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

        {!queuedJobs.length && !result && !batch && !loading ? <div className="grid min-h-[470px] place-items-center text-center text-muted"><div className="max-w-md"><Images className="mx-auto mb-3" size={40} /><p className="font-semibold text-foreground">Pronto para gerar</p><p className="mt-1 text-sm">JJ Free Compute envia para a fila de revisão. Hugging Face e Google executam diretamente usando as APIs configuradas.</p></div></div> : null}

        {queuedJobs.length ? <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3"><Sparkles className="mt-0.5 text-emerald-300" size={20} /><div><p className="font-semibold text-emerald-200">{queuedJobs.length} {queuedJobs.length === 1 ? "job adicionado" : "jobs adicionados"} à fila</p><p className="mt-1 text-sm text-muted">A geração é assíncrona e seguirá para Image Review quando concluída.</p></div></div>
          </div>
          <div className="space-y-3">
            {queuedJobs.map((job) => <article key={job.id} className="rounded-xl border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{job.external_id ?? `Job ${job.id.slice(0, 8)}`}</p><p className="mt-1 text-xs text-muted">{job.model} · {job.width}×{job.height}</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold">{job.status}</span></div><p className="mt-3 line-clamp-3 text-sm text-muted">{job.prompt}</p></article>)}
          </div>
          <Link href="/image-review" className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold">Abrir Image Review</Link>
        </div> : null}

        {result ? <ImageCard id="generated-image" image={result} onDownload={download} /> : null}

        {batch ? <div className="space-y-4"><div className="flex flex-wrap gap-3 text-sm"><span className="rounded-full border px-3 py-1">Total: {batch.total}</span><span className="rounded-full border px-3 py-1 text-emerald-300">Concluídas: {batch.completed}</span>{batch.failed ? <span className="rounded-full border px-3 py-1 text-red-300">Falhas: {batch.failed}</span> : null}</div><div className="grid gap-4 md:grid-cols-2">{batch.results.map((item) => item.image ? <ImageCard key={item.id} id={item.id} image={item.image} onDownload={download} /> : <article key={item.id} className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"><p className="font-semibold">{item.id}</p><p className="mt-2 text-sm text-red-300">{item.error ?? "Falha na geração."}</p></article>)}</div></div> : null}
      </div>
    </div>
  </section></DashboardShell>;
}

function ImageCard({ id, image, onDownload }: { id: string; image: ImageGenerationResponse; onDownload: (image: ImageGenerationResponse, id: string) => void }) {
  return <article className="overflow-hidden rounded-2xl border bg-background"><img src={imageDataUrl(image)} alt={id} className="aspect-video w-full object-cover" /><div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate font-semibold">{id}</p><p className="truncate text-xs text-muted">{image.model} · {(image.latency_ms / 1000).toFixed(1)}s{image.seed !== null ? ` · seed ${image.seed}` : ""}</p></div><button onClick={() => onDownload(image, id)} className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold"><Download size={16} /> Baixar</button></div></article>;
}

function readError(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Não foi possível processar a geração de imagem.";
}

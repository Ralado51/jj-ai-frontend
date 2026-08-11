"use client";

import { Download, Images, LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  BatchImageGenerationResponse,
  ImageGenerationResponse,
  ImageProvider,
  generateImage,
  generateImagesBatch,
  imageDataUrl,
} from "@/lib/image-generation";

const providerDefaults: Record<ImageProvider, string> = {
  huggingface: "Tongyi-MAI/Z-Image-Turbo",
  google: "gemini-3.1-flash-lite-image",
};

export default function ImageGeneratorPage() {
  const [provider, setProvider] = useState<ImageProvider>("huggingface");
  const [model, setModel] = useState(providerDefaults.huggingface);
  const [prompt, setPrompt] = useState("");
  const [batchText, setBatchText] = useState("");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImageGenerationResponse | null>(null);
  const [batch, setBatch] = useState<BatchImageGenerationResponse | null>(null);

  const parsedItems = useMemo(() => batchText.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const separator = line.indexOf("|");
    if (separator === -1) return { id: `image-${index + 1}`, prompt: line, model };
    return { id: line.slice(0, separator).trim() || `image-${index + 1}`, prompt: line.slice(separator + 1).trim(), model };
  }).filter((item) => item.prompt), [batchText, model]);

  function changeProvider(value: ImageProvider) {
    setProvider(value);
    setModel(providerDefaults[value]);
  }

  async function runSingle() {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setBatch(null);
    try { setResult(await generateImage({ provider, model, prompt, width: 1344, height: 768 })); }
    catch (err) { setError(readError(err)); }
    finally { setLoading(false); }
  }

  async function runBatch() {
    if (!parsedItems.length) return;
    setLoading(true); setError(""); setResult(null);
    try { setBatch(await generateImagesBatch(provider, parsedItems.map((item) => ({ ...item, width: 1344, height: 768 })))); }
    catch (err) { setError(readError(err)); }
    finally { setLoading(false); }
  }

  function download(image: ImageGenerationResponse, name: string) {
    const anchor = document.createElement("a");
    anchor.href = imageDataUrl(image);
    anchor.download = `${name}.png`;
    anchor.click();
  }

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <div className="rounded-3xl border bg-surface p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Media Generation</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Image Generator</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Gere imagens individuais ou em lote usando os providers configurados no backend da JJ AI Platform.</p>
    </div>

    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <div className="space-y-5 rounded-2xl border bg-surface p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button onClick={() => setMode("single")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "single" ? "bg-primary text-white" : "text-muted"}`}>Individual</button>
          <button onClick={() => setMode("batch")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "batch" ? "bg-primary text-white" : "text-muted"}`}>Lote</button>
        </div>

        <label className="grid gap-2 text-sm font-semibold">Provider<select value={provider} onChange={(e) => changeProvider(e.target.value as ImageProvider)} className="input"><option value="huggingface">Hugging Face</option><option value="google">Google Gemini</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Modelo<input value={model} onChange={(e) => setModel(e.target.value)} className="input" /></label>

        {mode === "single" ? <label className="grid gap-2 text-sm font-semibold">Prompt<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={14} className="rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Descreva a imagem..." /></label> : <label className="grid gap-2 text-sm font-semibold">Imagens do lote<textarea value={batchText} onChange={(e) => setBatchText(e.target.value)} rows={14} className="rounded-xl border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30" placeholder={"ansiedade | Create a photorealistic editorial photograph...\ndepressao | Create a calm everyday scene..."} /><span className="text-xs font-normal text-muted">Uma imagem por linha no formato <code>id | prompt</code>. {parsedItems.length} itens prontos.</span></label>}

        <button disabled={loading || (mode === "single" ? !prompt.trim() : !parsedItems.length)} onClick={() => void (mode === "single" ? runSingle() : runBatch())} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? "Gerando..." : mode === "single" ? "Gerar imagem" : `Gerar ${parsedItems.length} imagens`}</button>
      </div>

      <div className="min-h-[520px] rounded-2xl border bg-surface p-5">
        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}
        {!result && !batch && !loading ? <div className="grid min-h-[470px] place-items-center text-center text-muted"><div><Images className="mx-auto mb-3" size={40} /><p className="font-semibold text-foreground">As imagens aparecem aqui</p><p className="mt-1 text-sm">Use Hugging Face para Z-Image-Turbo ou Google para Nano Banana.</p></div></div> : null}
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
  return "Não foi possível gerar a imagem.";
}

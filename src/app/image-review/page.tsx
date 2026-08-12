"use client";

import { Check, ImageIcon, LoaderCircle, RefreshCw, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  ImageJob,
  ImageJobReviewAction,
  ImageJobStatus,
  listImageJobs,
  reviewImageJob,
} from "@/lib/image-jobs";

const filters: Array<{ label: string; value: ImageJobStatus | "all" }> = [
  { label: "Todos", value: "all" },
  { label: "Aguardando", value: "pending" },
  { label: "Processando", value: "processing" },
  { label: "Para revisão", value: "generated" },
  { label: "Aprovados", value: "approved" },
  { label: "Rejeitados", value: "rejected" },
  { label: "Falhas", value: "failed" },
];

const statusLabels: Record<ImageJobStatus, string> = {
  pending: "Aguardando",
  processing: "Processando",
  generated: "Para revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  failed: "Falhou",
};

export default function ImageReviewPage() {
  const [statusFilter, setStatusFilter] = useState<ImageJobStatus | "all">("generated");
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const loadJobs = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setJobs(await listImageJobs(statusFilter === "all" ? undefined : statusFilter));
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function review(job: ImageJob, action: ImageJobReviewAction) {
    setActingId(job.id);
    setError("");
    try {
      const updated = await reviewImageJob(job.id, action);
      if (statusFilter === "all" || updated.status === statusFilter) {
        setJobs((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        setJobs((current) => current.filter((item) => item.id !== updated.id));
      }
    } catch (err) {
      setError(readError(err));
    } finally {
      setActingId(null);
    }
  }

  const reviewCount = useMemo(() => jobs.filter((job) => job.status === "generated").length, [jobs]);

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex flex-col gap-5 rounded-3xl border bg-surface p-6 md:flex-row md:items-end md:justify-between md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Media Operations</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Image Review Queue</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Acompanhe a fila persistente, valide imagens geradas pelos workers e aprove, rejeite ou solicite uma nova geração.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border px-3 py-2 text-sm"><strong>{reviewCount}</strong> para revisar</span>
        <button type="button" onClick={() => void loadJobs(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />Atualizar</button>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 rounded-2xl border bg-surface p-3">
      {filters.map((filter) => <button key={filter.value} type="button" onClick={() => setStatusFilter(filter.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${statusFilter === filter.value ? "bg-primary text-white" : "text-muted hover:bg-elevated hover:text-foreground"}`}>{filter.label}</button>)}
    </div>

    {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

    {loading ? <div className="grid min-h-[420px] place-items-center rounded-2xl border bg-surface"><div className="text-center text-muted"><LoaderCircle className="mx-auto mb-3 animate-spin" size={34} /><p>Carregando fila...</p></div></div> : null}

    {!loading && jobs.length === 0 ? <div className="grid min-h-[420px] place-items-center rounded-2xl border bg-surface"><div className="max-w-md text-center text-muted"><ImageIcon className="mx-auto mb-3" size={40} /><p className="font-semibold text-foreground">Nenhum job neste status</p><p className="mt-1 text-sm">Quando os workers concluírem novas imagens, elas aparecerão aqui para revisão.</p></div></div> : null}

    {!loading && jobs.length > 0 ? <div className="grid gap-5 xl:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} acting={actingId === job.id} onReview={review} />)}</div> : null}
  </section></DashboardShell>;
}

function JobCard({ job, acting, onReview }: { job: ImageJob; acting: boolean; onReview: (job: ImageJob, action: ImageJobReviewAction) => Promise<void> }) {
  return <article className="overflow-hidden rounded-2xl border bg-surface">
    <div className="relative aspect-video bg-background">
      {job.asset_url ? <img src={job.asset_url} alt={job.external_id ?? "Imagem gerada"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted"><div className="text-center"><ImageIcon className="mx-auto mb-2" size={34} /><p className="text-sm">Imagem ainda não disponível</p></div></div>}
      <span className="absolute left-3 top-3 rounded-full border bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">{statusLabels[job.status]}</span>
    </div>
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><h2 className="truncate text-lg font-bold">{job.external_id ?? `Job ${job.id.slice(0, 8)}`}</h2><p className="mt-1 text-xs text-muted">{job.model} · {job.width}×{job.height}{job.seed !== null ? ` · seed ${job.seed}` : ""}</p></div>
        <time className="shrink-0 text-xs text-muted">{formatDate(job.updated_at)}</time>
      </div>
      <div className="rounded-xl bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Prompt</p><p className="mt-2 line-clamp-5 text-sm leading-6">{job.prompt}</p></div>
      {job.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{job.error}</div> : null}
      {job.status === "generated" ? <div className="grid gap-2 sm:grid-cols-3">
        <ActionButton disabled={acting} onClick={() => void onReview(job, "approve")} icon={<Check size={16} />} label="Aprovar" primary />
        <ActionButton disabled={acting} onClick={() => void onReview(job, "reject")} icon={<X size={16} />} label="Rejeitar" />
        <ActionButton disabled={acting} onClick={() => void onReview(job, "regenerate")} icon={<RotateCcw size={16} />} label="Gerar novamente" />
      </div> : job.status === "rejected" || job.status === "failed" ? <ActionButton disabled={acting} onClick={() => void onReview(job, "regenerate")} icon={<RotateCcw size={16} />} label="Gerar novamente" /> : null}
      {acting ? <p className="text-center text-xs text-muted">Atualizando job...</p> : null}
    </div>
  </article>;
}

function ActionButton({ disabled, onClick, icon, label, primary = false }: { disabled: boolean; onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 ${primary ? "bg-primary text-white" : "border bg-background"}`}>{icon}{label}</button>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function readError(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Não foi possível carregar ou atualizar a fila de imagens.";
}

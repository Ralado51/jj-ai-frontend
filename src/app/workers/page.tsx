"use client";

import { Activity, CheckCircle2, Cpu, LoaderCircle, RefreshCw, Server, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  getImageWorkerManagement,
  ImageWorkerManagementSummary,
  ImageWorkerOperational,
} from "@/lib/image-workers";

export default function WorkersPage() {
  const [data, setData] = useState<ImageWorkerManagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setData(await getImageWorkerManagement());
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-5 rounded-3xl border bg-surface p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Compute Operations</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Worker Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Acompanhe os runtimes distribuídos de geração, modelos carregados, heartbeat e volume de jobs processados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

        {loading ? (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border bg-surface">
            <div className="text-center text-muted"><LoaderCircle className="mx-auto mb-3 animate-spin" size={34} /><p>Carregando workers...</p></div>
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <Metric label="Workers" value={data.total_workers} icon={<Server size={18} />} />
              <Metric label="Online" value={data.online_workers} icon={<CheckCircle2 size={18} />} />
              <Metric label="Offline" value={data.offline_workers} icon={<XCircle size={18} />} />
              <Metric label="Jobs ativos" value={data.active_jobs} icon={<Activity size={18} />} />
              <Metric label="Concluídos" value={data.completed_jobs} icon={<CheckCircle2 size={18} />} />
              <Metric label="Falhas" value={data.failed_jobs} icon={<XCircle size={18} />} />
            </div>

            {data.workers.length === 0 ? (
              <div className="grid min-h-[320px] place-items-center rounded-2xl border bg-surface text-center text-muted">
                <div><Server className="mx-auto mb-3" size={40} /><p className="font-semibold text-foreground">Nenhum worker registrado</p><p className="mt-1 text-sm">Workers aparecerão aqui após o primeiro register/heartbeat.</p></div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {data.workers.map((worker) => <WorkerCard key={worker.id} worker={worker} />)}
              </div>
            )}
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border bg-surface p-5"><div className="flex items-center justify-between text-muted"><span className="text-sm">{label}</span>{icon}</div><p className="mt-3 text-3xl font-bold">{value}</p></div>;
}

function WorkerCard({ worker }: { worker: ImageWorkerOperational }) {
  return (
    <article className="rounded-2xl border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><Cpu size={18} /><h2 className="truncate text-lg font-bold">{worker.name}</h2></div>
          <p className="mt-1 text-xs text-muted">{worker.runtime} · {worker.model}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${worker.is_online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-slate-500/30 bg-slate-500/10 text-muted"}`}>
          {worker.is_online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <SmallMetric label="Ativos" value={worker.active_jobs} />
        <SmallMetric label="Concluídos" value={worker.completed_jobs} />
        <SmallMetric label="Falhas" value={worker.failed_jobs} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted">
        <span>Worker ID: {worker.id.slice(0, 8)}</span>
        <span>Último heartbeat: {formatRelative(worker.last_seen_at)}</span>
      </div>
    </article>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

function formatRelative(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h atrás`;
}

function readError(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Não foi possível carregar o estado dos workers.";
}

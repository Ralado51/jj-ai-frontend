"use client";

import { AxiosError } from "axios";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkflowExecutionLineage } from "@/components/workflow-execution-lineage";
import {
  cancelWorkflowExecution,
  getWorkflowExecution,
  isWorkflowExecutionActive,
  listWorkflowExecutions,
  retryWorkflowExecution,
  retryWorkflowExecutionFromStep,
  WorkflowExecution,
} from "@/lib/workflows";

const POLLING_INTERVAL_MS = 2_000;

function statusLabel(status: string) {
  if (status === "pending") return "Na fila";
  if (status === "running") return "Executando";
  if (status === "cancelling") return "Cancelando";
  if (status === "cancelled") return "Cancelada";
  if (status === "completed") return "Concluída";
  if (status === "failed") return "Falhou";
  return status;
}

function sourceLabel(source: string) {
  if (source === "benchmark_history") return "Histórico de benchmark";
  if (source === "configured_router") return "Modelo configurado";
  return source.replaceAll("_", " ");
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 size={17} className="text-emerald-400" />;
  if (status === "failed") return <AlertCircle size={17} className="text-red-400" />;
  if (status === "cancelled") return <Ban size={17} className="text-amber-400" />;
  return <LoaderCircle size={17} className="animate-spin text-secondary" />;
}

export default function WorkflowExecutionsPage() {
  const [rows, setRows] = useState<WorkflowExecution[]>([]);
  const [selected, setSelected] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryingStep, setRetryingStep] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refresh(selectId?: string, silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const executions = await listWorkflowExecutions(undefined, 100);
      setRows(executions);
      const targetId = selectId ?? selected?.id;
      if (targetId) setSelected(await getWorkflowExecution(targetId));
    } catch {
      setError("Não foi possível carregar o histórico de execuções.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!rows.some((item) => isWorkflowExecutionActive(item.status)) && !selected) return;
    const timer = window.setInterval(() => void refresh(undefined, true), POLLING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rows, selected?.id]);

  const totals = useMemo(() => ({
    completed: rows.filter((item) => item.status === "completed").length,
    failed: rows.filter((item) => item.status === "failed").length,
    active: rows.filter((item) => isWorkflowExecutionActive(item.status)).length,
    cancelled: rows.filter((item) => item.status === "cancelled").length,
  }), [rows]);

  async function openExecution(id: string) {
    setLoadingDetails(true);
    setError("");
    setSuccess("");
    try {
      setSelected(await getWorkflowExecution(id));
    } catch {
      setError("Não foi possível carregar os detalhes da execução.");
    } finally {
      setLoadingDetails(false);
    }
  }

  async function retrySelected() {
    if (!selected || isWorkflowExecutionActive(selected.status)) return;
    setRetrying(true);
    setError("");
    setSuccess("");
    try {
      const response = await retryWorkflowExecution(selected.id);
      setSuccess("Nova execução criada com os mesmos parâmetros.");
      await refresh(response.execution_id);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível tentar novamente esta execução.");
    } finally {
      setRetrying(false);
    }
  }

  async function retryFromStep(step: number) {
    if (!selected || isWorkflowExecutionActive(selected.status)) return;
    setRetryingStep(step);
    setError("");
    setSuccess("");
    try {
      const execution = await retryWorkflowExecutionFromStep(selected.id, { step });
      setSuccess(`Nova execução iniciada a partir da etapa ${step}.`);
      await refresh(execution.id);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? `Não foi possível reexecutar a partir da etapa ${step}.`);
    } finally {
      setRetryingStep(null);
    }
  }

  async function cancelSelected() {
    if (!selected || !isWorkflowExecutionActive(selected.status) || selected.status === "cancelling") return;
    setCancelling(true);
    setError("");
    setSuccess("");
    try {
      const execution = await cancelWorkflowExecution(selected.id);
      setSelected(execution);
      setSuccess(execution.status === "cancelled"
        ? "Execução cancelada."
        : "Cancelamento solicitado. O agente atual será concluído antes da interrupção.");
      await refresh(execution.id, true);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível cancelar esta execução.");
    } finally {
      setCancelling(false);
    }
  }

  const canRetry = selected ? !isWorkflowExecutionActive(selected.status) : false;
  const nextStep = selected && selected.steps_completed < selected.steps_total
    ? selected.steps_completed + 1
    : null;

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-secondary"><Workflow /></div><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Execution Center</p><h1 className="mt-2 text-3xl font-bold">Execuções de workflows</h1><p className="mt-2 text-sm text-muted">Acompanhe, cancele, repita e inspecione cada etapa.</p></div></div>
        <button type="button" onClick={() => void refresh()} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><RefreshCw size={16} /> Atualizar</button>
      </div>
    </header>

    <div className="grid gap-4 md:grid-cols-4">
      <article className="rounded-2xl border bg-surface p-5"><p className="text-sm text-muted">Concluídas</p><p className="mt-2 text-3xl font-bold">{totals.completed}</p></article>
      <article className="rounded-2xl border bg-surface p-5"><p className="text-sm text-muted">Falhas</p><p className="mt-2 text-3xl font-bold">{totals.failed}</p></article>
      <article className="rounded-2xl border bg-surface p-5"><p className="text-sm text-muted">Ativas</p><p className="mt-2 text-3xl font-bold">{totals.active}</p></article>
      <article className="rounded-2xl border bg-surface p-5"><p className="text-sm text-muted">Canceladas</p><p className="mt-2 text-3xl font-bold">{totals.cancelled}</p></article>
    </div>

    {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
    {success ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{success}</p> : null}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <section className="overflow-hidden rounded-2xl border bg-surface">
        {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="animate-spin" /></div> : rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-background/60 text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Workflow</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Etapas</th><th className="px-4 py-3">Duração</th><th className="px-4 py-3">Início</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} onClick={() => void openExecution(item.id)} className={`cursor-pointer border-b last:border-0 hover:bg-elevated ${selected?.id === item.id ? "bg-primary/10" : ""}`}><td className="px-4 py-4 font-medium">{item.workflow_name}</td><td className="px-4 py-4 text-xs text-muted">{item.parent_execution_id ? `Retry · etapa ${item.retry_from_step ?? 1}` : "Original"}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-2"><StatusIcon status={item.status} />{statusLabel(item.status)}</span></td><td className="px-4 py-4">{item.steps_completed}/{item.steps_total}</td><td className="px-4 py-4">{(item.total_duration_ms / 1000).toFixed(2)} s</td><td className="px-4 py-4 text-muted">{new Date(item.created_at).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-muted">Nenhuma execução registrada.</p>}
      </section>

      <aside className="h-fit rounded-2xl border bg-surface p-5 xl:sticky xl:top-24">
        {loadingDetails ? <div className="grid min-h-56 place-items-center"><LoaderCircle className="animate-spin" /></div> : selected ? <div className="space-y-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-secondary">Execução</p><h2 className="mt-1 text-xl font-bold">{selected.workflow_name}</h2></div><StatusIcon status={selected.status} /></div>
          <WorkflowExecutionLineage selected={selected} executions={rows} onSelect={(id) => void openExecution(id)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => void cancelSelected()} disabled={cancelling || !isWorkflowExecutionActive(selected.status) || selected.status === "cancelling"} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/40 text-amber-300 disabled:cursor-not-allowed disabled:opacity-40">{cancelling ? <LoaderCircle className="animate-spin" size={17} /> : <Ban size={17} />}{selected.status === "cancelling" ? "Cancelando..." : "Cancelar execução"}</button>
            <button type="button" onClick={() => void retrySelected()} disabled={retrying || !canRetry || retryingStep !== null} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border font-semibold disabled:cursor-not-allowed disabled:opacity-50">{retrying ? <LoaderCircle className="animate-spin" size={17} /> : <RotateCcw size={17} />}{retrying ? "Executando novamente..." : "Reexecutar tudo"}</button>
          </div>
          {nextStep && canRetry ? <button type="button" onClick={() => void retryFromStep(nextStep)} disabled={retryingStep !== null || retrying} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary/15 font-semibold text-secondary disabled:opacity-50">{retryingStep === nextStep ? <LoaderCircle className="animate-spin" size={17} /> : <RotateCcw size={17} />}Continuar da etapa {nextStep}</button> : null}
          {selected.status === "cancelling" ? <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">O agente atual será concluído. O workflow será interrompido antes da próxima etapa.</p> : null}
          <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">Status</p><p className="mt-1 font-semibold">{statusLabel(selected.status)}</p></div><div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">Duração</p><p className="mt-1 font-semibold">{(selected.total_duration_ms / 1000).toFixed(2)} s</p></div><div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">Etapas</p><p className="mt-1 font-semibold">{selected.steps_completed}/{selected.steps_total}</p></div><div className="rounded-xl bg-background p-3"><p className="text-xs text-muted">Memória</p><p className="mt-1 font-semibold">{selected.use_memory ? "Ativa" : "Desativada"}</p></div></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Instrução</p><p className="mt-2 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm leading-6">{selected.instruction}</p></div>
          {selected.error_message ? <div><p className="text-xs font-semibold uppercase tracking-wide text-red-300">Erro</p><p className="mt-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{selected.error_message}</p></div> : null}
          <div><p className="text-xs font-semibold uppercase tracking-wide text-secondary">Etapas executadas</p>{selected.step_details.length ? <div className="mt-3 space-y-3">{selected.step_details.map((step) => <article key={`${step.position}-${step.agent_id}`} className="rounded-xl border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-muted">Etapa {step.position}</p><p className="font-semibold">{step.agent_name}</p><p className="mt-1 text-xs text-muted">{step.task_type}</p></div><span className="rounded-full border px-2.5 py-1 text-xs">{(step.duration_ms / 1000).toFixed(2)} s</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg border p-2"><p className="text-muted">Modelo</p><p className="mt-1 break-all font-medium">{step.model}</p></div><div className="rounded-lg border p-2"><p className="text-muted">Provider</p><p className="mt-1 font-medium">{step.provider}</p></div><div className="rounded-lg border p-2"><p className="text-muted">Seleção</p><p className="mt-1 font-medium">{sourceLabel(step.model_selection_source)}</p></div><div className="rounded-lg border p-2"><p className="text-muted">Memória usada</p><p className="mt-1 font-medium">{step.memory_items_used} item(ns)</p></div></div><details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-secondary">Ver resposta da etapa</summary><div className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-xs leading-5">{step.content}</div></details>{canRetry ? <button type="button" onClick={() => void retryFromStep(step.position)} disabled={retryingStep !== null || retrying} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold disabled:opacity-50">{retryingStep === step.position ? <LoaderCircle className="animate-spin" size={14} /> : <RotateCcw size={14} />}Reexecutar a partir daqui</button> : null}</article>)}</div> : <p className="mt-2 rounded-xl border border-dashed p-3 text-sm text-muted">Nenhuma etapa concluída até o momento.</p>}</div>
          {selected.final_content ? <div><p className="text-xs font-semibold uppercase tracking-wide text-secondary">Conteúdo final ou parcial</p><div className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3 text-sm leading-6">{selected.final_content}</div></div> : null}
          <p className="flex items-center gap-2 text-xs text-muted"><Clock3 size={14} /> Atualizada em {new Date(selected.updated_at).toLocaleString("pt-BR")}</p>
        </div> : <p className="text-sm text-muted">Selecione uma execução para ver os detalhes.</p>}
      </aside>
    </div>
  </section></DashboardShell>;
}

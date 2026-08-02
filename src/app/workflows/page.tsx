"use client";

import { AxiosError } from "axios";
import { ArrowDown, ChevronDown, ChevronUp, LoaderCircle, Play, Plus, Save, Trash2, Workflow } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AgentDescriptor, AgentOrchestrationResponse, AgentOrchestrationStep, listAgents, orchestrateAgents } from "@/lib/agents";
import { listProjects, Project } from "@/lib/projects";
import { archiveWorkflow, createWorkflow, listWorkflows, PersistedWorkflow, runPersistedWorkflow, updateWorkflow } from "@/lib/workflows";

type BuilderStep = AgentOrchestrationStep & { id: string };
type LegacyWorkflow = { id: string; name: string; steps: AgentOrchestrationStep[] };

const STORAGE_KEY = "jj-ai-saved-workflows";
const MIGRATION_KEY = "jj-ai-workflows-migrated-v1";

function newStep(agentId = "general"): BuilderStep {
  return { id: crypto.randomUUID(), agent_id: agentId, instruction: "" };
}

function normalizedSteps(steps: BuilderStep[]): AgentOrchestrationStep[] {
  return steps.map(({ agent_id, instruction }) => ({ agent_id, instruction: instruction?.trim() || undefined }));
}

export default function WorkflowsPage() {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saved, setSaved] = useState<PersistedWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [steps, setSteps] = useState<BuilderStep[]>([newStep()]);
  const [instruction, setInstruction] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sessionKey, setSessionKey] = useState("workflow-principal");
  const [useMemory, setUseMemory] = useState(true);
  const [workflowName, setWorkflowName] = useState("");
  const [result, setResult] = useState<AgentOrchestrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const requiresProject = useMemo(() => steps.some((step) => step.agent_id === "rag"), [steps]);

  async function refreshSaved() {
    setSaved(await listWorkflows());
  }

  async function migrateLocalWorkflows() {
    if (localStorage.getItem(MIGRATION_KEY) === "done") return;
    let legacy: LegacyWorkflow[] = [];
    try {
      legacy = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      legacy = [];
    }
    for (const item of legacy) {
      if (!item.name || !Array.isArray(item.steps) || item.steps.length === 0) continue;
      await createWorkflow({ name: item.name, steps: item.steps, use_memory: true });
    }
    localStorage.setItem(MIGRATION_KEY, "done");
    localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    Promise.all([listAgents(), listProjects({ is_active: true, limit: 100 })])
      .then(async ([agentRows, projectRows]) => {
        setAgents(agentRows);
        setProjects(projectRows);
        setSteps([newStep(agentRows[0]?.id ?? "general")]);
        try {
          await migrateLocalWorkflows();
          await refreshSaved();
        } catch {
          setError("Os agentes foram carregados, mas não foi possível sincronizar os workflows salvos.");
        }
      })
      .catch(() => setError("Não foi possível carregar agentes e projetos."))
      .finally(() => setLoading(false));
  }, []);

  function updateStep(id: string, patch: Partial<BuilderStep>) {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  function addStep() {
    if (steps.length < 6) setSteps((current) => [...current, newStep(agents[0]?.id ?? "general")]);
  }

  function removeStep(id: string) {
    setSteps((current) => current.length === 1 ? current : current.filter((step) => step.id !== id));
  }

  async function saveCurrentWorkflow() {
    const name = workflowName.trim();
    if (!name) return setError("Informe um nome para salvar o workflow.");
    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        project_id: projectId || null,
        steps: normalizedSteps(steps),
        default_instruction: instruction.trim() || null,
        session_key: sessionKey.trim() || null,
        use_memory: useMemory,
      };
      const item = selectedWorkflowId
        ? await updateWorkflow(selectedWorkflowId, payload)
        : await createWorkflow(payload);
      setSelectedWorkflowId(item.id);
      setWorkflowName(item.name);
      await refreshSaved();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível salvar o workflow.");
    } finally {
      setSaving(false);
    }
  }

  function loadWorkflow(item: PersistedWorkflow) {
    setSelectedWorkflowId(item.id);
    setWorkflowName(item.name);
    setProjectId(item.project_id ?? "");
    setInstruction(item.default_instruction ?? "");
    setSessionKey(item.session_key ?? "workflow-principal");
    setUseMemory(item.use_memory);
    setSteps(item.steps.map((step) => ({ ...step, id: crypto.randomUUID(), instruction: step.instruction ?? "" })));
    setResult(null);
    setError("");
  }

  function newWorkflow() {
    setSelectedWorkflowId(null);
    setWorkflowName("");
    setInstruction("");
    setProjectId("");
    setSessionKey("workflow-principal");
    setUseMemory(true);
    setSteps([newStep(agents[0]?.id ?? "general")]);
    setResult(null);
  }

  async function deleteWorkflow(id: string) {
    try {
      await archiveWorkflow(id);
      if (selectedWorkflowId === id) newWorkflow();
      await refreshSaved();
    } catch {
      setError("Não foi possível arquivar o workflow.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (requiresProject && !projectId) return setError("Selecione um projeto porque o pipeline contém o agente RAG.");
    setRunning(true);
    try {
      if (selectedWorkflowId) {
        const response = await runPersistedWorkflow(selectedWorkflowId, {
          instruction: instruction.trim() || undefined,
          project_id: requiresProject ? projectId || null : null,
          session_key: sessionKey.trim() || null,
          use_memory: useMemory,
        });
        setResult(response);
      } else {
        setResult(await orchestrateAgents({
          instruction,
          project_id: requiresProject ? projectId : undefined,
          session_key: sessionKey || undefined,
          use_memory: useMemory,
          steps: normalizedSteps(steps),
        }));
      }
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível executar o workflow.");
    } finally {
      setRunning(false);
    }
  }

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8"><div className="flex gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-secondary"><Workflow /></div><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Multi-Agent</p><h1 className="mt-2 text-3xl font-bold">Workflow Builder</h1><p className="mt-2 text-sm text-muted">Monte, salve e execute pipelines multiagente sincronizados com sua conta.</p></div></div></header>
    {loading ? <div className="grid min-h-72 place-items-center rounded-2xl border bg-surface"><LoaderCircle className="animate-spin" /></div> : <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6"><form onSubmit={submit} className="space-y-5 rounded-2xl border bg-surface p-5 md:p-6">
        <label className="grid gap-2 text-sm font-semibold">Objetivo do workflow<textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="min-h-32 rounded-xl border bg-background p-3 font-normal" required /></label>
        <div className="grid gap-4 md:grid-cols-2">{requiresProject ? <label className="grid gap-2 text-sm font-semibold">Projeto<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-12 rounded-xl border bg-background px-3 font-normal" required><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label> : null}<label className="grid gap-2 text-sm font-semibold">Sessão<input value={sessionKey} onChange={(event) => setSessionKey(event.target.value)} className="h-12 rounded-xl border bg-background px-3 font-normal" /></label></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useMemory} onChange={(event) => setUseMemory(event.target.checked)} /> Usar memória dos agentes</label>
        <div className="space-y-3">{steps.map((step, index) => <div key={step.id}><article className="rounded-2xl border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-muted">Etapa {index + 1}</p><p className="font-semibold">{agents.find((item) => item.id === step.agent_id)?.name ?? step.agent_id}</p></div><div className="flex gap-1"><button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ChevronUp size={16} /></button><button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ChevronDown size={16} /></button><button type="button" onClick={() => removeStep(step.id)} disabled={steps.length === 1} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><Trash2 size={16} /></button></div></div><div className="mt-4 grid gap-3"><select value={step.agent_id} onChange={(event) => updateStep(step.id, { agent_id: event.target.value })} className="h-11 rounded-xl border bg-surface px-3">{agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><textarea value={step.instruction ?? ""} onChange={(event) => updateStep(step.id, { instruction: event.target.value })} className="min-h-24 rounded-xl border bg-surface p-3 text-sm" placeholder="Instrução opcional desta etapa" /></div></article>{index < steps.length - 1 ? <div className="grid h-10 place-items-center text-muted"><ArrowDown size={18} /></div> : null}</div>)}</div>
        <button type="button" onClick={addStep} disabled={steps.length >= 6} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40"><Plus size={17} /> Adicionar etapa</button>
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <button disabled={running} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-60">{running ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}{running ? "Executando pipeline..." : selectedWorkflowId ? "Executar workflow salvo" : "Executar workflow"}</button>
      </form>
      {result ? <section className="space-y-4 rounded-2xl border bg-surface p-5"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Resultado</h2><span className="rounded-full border px-3 py-1 text-xs">{(result.total_duration_ms / 1000).toFixed(2)} s</span></div>{result.steps.map((item, index) => <article key={`${item.agent.id}-${index}`} className="rounded-xl border bg-background p-4"><div className="flex justify-between gap-2"><p className="font-semibold">{index + 1}. {item.agent.name}</p><span className="text-xs text-muted">{item.model}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{item.content}</p></article>)}<div className="rounded-xl bg-background p-4"><p className="text-xs font-semibold uppercase text-secondary">Conteúdo final</p><div className="mt-3 whitespace-pre-wrap text-sm leading-7">{result.final_content}</div></div></section> : null}</div>
      <aside className="h-fit space-y-4 rounded-2xl border bg-surface p-5 xl:sticky xl:top-24"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Workflows salvos</h2><p className="mt-1 text-xs text-muted">Sincronizados no backend.</p></div><button type="button" onClick={newWorkflow} className="rounded-lg border px-3 py-2 text-xs">Novo</button></div><div className="flex gap-2"><input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm" placeholder="Nome do workflow" /><button type="button" onClick={saveCurrentWorkflow} disabled={saving} className="grid h-11 w-11 place-items-center rounded-xl border disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}</button></div><div className="space-y-2">{saved.length ? saved.map((item) => <div key={item.id} className={`rounded-xl border p-3 ${item.id === selectedWorkflowId ? "border-primary/50 bg-primary/10" : "bg-background"}`}><button type="button" onClick={() => loadWorkflow(item)} className="w-full text-left"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">{item.steps.length} etapa(s) · {new Date(item.updated_at).toLocaleDateString("pt-BR")}</p></button><button type="button" onClick={() => deleteWorkflow(item.id)} className="mt-3 inline-flex items-center gap-2 text-xs text-red-300"><Trash2 size={14} /> Arquivar</button></div>) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted">Nenhum workflow salvo.</p>}</div></aside>
    </div>}
  </section></DashboardShell>;
}

"use client";

import { AxiosError } from "axios";
import { ArrowDown, ChevronDown, ChevronUp, LoaderCircle, Play, Plus, Save, Trash2, Workflow } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  AgentDescriptor,
  AgentOrchestrationResponse,
  AgentOrchestrationStep,
  listAgents,
  orchestrateAgents,
} from "@/lib/agents";
import { listProjects, Project } from "@/lib/projects";

type BuilderStep = AgentOrchestrationStep & { id: string };
type SavedWorkflow = {
  id: string;
  name: string;
  steps: AgentOrchestrationStep[];
};

const STORAGE_KEY = "jj-ai-saved-workflows";

function newStep(agentId = "general"): BuilderStep {
  return { id: crypto.randomUUID(), agent_id: agentId, instruction: "" };
}

export default function WorkflowsPage() {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [steps, setSteps] = useState<BuilderStep[]>([newStep()]);
  const [instruction, setInstruction] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sessionKey, setSessionKey] = useState("workflow-principal");
  const [useMemory, setUseMemory] = useState(true);
  const [workflowName, setWorkflowName] = useState("");
  const [saved, setSaved] = useState<SavedWorkflow[]>([]);
  const [result, setResult] = useState<AgentOrchestrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const requiresProject = useMemo(
    () => steps.some((step) => step.agent_id === "rag"),
    [steps],
  );

  useEffect(() => {
    Promise.all([listAgents(), listProjects({ is_active: true, limit: 100 })])
      .then(([agentRows, projectRows]) => {
        setAgents(agentRows);
        setProjects(projectRows);
        setSteps([newStep(agentRows[0]?.id ?? "general")]);
      })
      .catch(() => setError("Não foi possível carregar agentes e projetos."))
      .finally(() => setLoading(false));

    try {
      setSaved(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      setSaved([]);
    }
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
    if (steps.length >= 6) return;
    setSteps((current) => [...current, newStep(agents[0]?.id ?? "general")]);
  }

  function removeStep(id: string) {
    setSteps((current) => current.length === 1 ? current : current.filter((step) => step.id !== id));
  }

  function persistSaved(next: SavedWorkflow[]) {
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveWorkflow() {
    const name = workflowName.trim();
    if (!name) return setError("Informe um nome para salvar o workflow.");
    const item: SavedWorkflow = {
      id: crypto.randomUUID(),
      name,
      steps: steps.map(({ agent_id, instruction: stepInstruction }) => ({
        agent_id,
        instruction: stepInstruction?.trim() || undefined,
      })),
    };
    persistSaved([...saved, item]);
    setWorkflowName("");
    setError("");
  }

  function loadWorkflow(item: SavedWorkflow) {
    setSteps(item.steps.map((step) => ({ ...step, id: crypto.randomUUID(), instruction: step.instruction ?? "" })));
    setResult(null);
  }

  function deleteWorkflow(id: string) {
    persistSaved(saved.filter((item) => item.id !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (requiresProject && !projectId) {
      setError("Selecione um projeto porque o pipeline contém o agente RAG.");
      return;
    }
    setRunning(true);
    try {
      setResult(await orchestrateAgents({
        instruction,
        project_id: requiresProject ? projectId : undefined,
        session_key: sessionKey || undefined,
        use_memory: useMemory,
        steps: steps.map(({ agent_id, instruction: stepInstruction }) => ({
          agent_id,
          instruction: stepInstruction?.trim() || undefined,
        })),
      }));
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível executar o workflow.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-secondary"><Workflow /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Multi-Agent</p>
              <h1 className="mt-2 text-3xl font-bold">Workflow Builder</h1>
              <p className="mt-2 text-sm text-muted">Monte um pipeline sequencial e reaproveite a saída de cada agente na etapa seguinte.</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-2xl border bg-surface"><LoaderCircle className="animate-spin" /></div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-surface p-5 md:p-6">
                <label className="grid gap-2 text-sm font-semibold">Objetivo do workflow
                  <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="min-h-32 rounded-xl border bg-background p-3 font-normal" placeholder="Ex.: Use os documentos do projeto para criar um roteiro curto sobre guard-rails." required />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {requiresProject ? <label className="grid gap-2 text-sm font-semibold">Projeto
                    <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-12 rounded-xl border bg-background px-3 font-normal" required>
                      <option value="">Selecione</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                  </label> : null}
                  <label className="grid gap-2 text-sm font-semibold">Sessão
                    <input value={sessionKey} onChange={(event) => setSessionKey(event.target.value)} className="h-12 rounded-xl border bg-background px-3 font-normal" />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useMemory} onChange={(event) => setUseMemory(event.target.checked)} /> Usar memória dos agentes</label>

                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const agent = agents.find((item) => item.id === step.agent_id);
                    return <div key={step.id}>
                      <article className="rounded-2xl border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="text-xs uppercase tracking-wide text-muted">Etapa {index + 1}</p><p className="font-semibold">{agent?.name ?? step.agent_id}</p></div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ChevronUp size={16} /></button>
                            <button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ChevronDown size={16} /></button>
                            <button type="button" onClick={() => removeStep(step.id)} disabled={steps.length === 1} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <select value={step.agent_id} onChange={(event) => updateStep(step.id, { agent_id: event.target.value })} className="h-11 rounded-xl border bg-surface px-3">
                            {agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                          <textarea value={step.instruction ?? ""} onChange={(event) => updateStep(step.id, { instruction: event.target.value })} className="min-h-24 rounded-xl border bg-surface p-3 text-sm" placeholder="Instrução opcional desta etapa" />
                        </div>
                      </article>
                      {index < steps.length - 1 ? <div className="grid h-10 place-items-center text-muted"><ArrowDown size={18} /></div> : null}
                    </div>;
                  })}
                </div>

                <button type="button" onClick={addStep} disabled={steps.length >= 6} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40"><Plus size={17} /> Adicionar etapa</button>
                {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
                <button disabled={running} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-60">{running ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}{running ? "Executando pipeline..." : "Executar workflow"}</button>
              </form>

              {result ? <section className="space-y-4 rounded-2xl border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Resultado</h2><span className="rounded-full border px-3 py-1 text-xs">{(result.total_duration_ms / 1000).toFixed(2)} s</span></div>
                <div className="space-y-3">{result.steps.map((item, index) => <article key={`${item.agent.id}-${index}`} className="rounded-xl border bg-background p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{index + 1}. {item.agent.name}</p><span className="text-xs text-muted">{item.model} · {(item.duration_ms / 1000).toFixed(2)} s</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{item.content}</p></article>)}</div>
                <div className="rounded-xl bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-secondary">Conteúdo final</p><div className="mt-3 whitespace-pre-wrap text-sm leading-7">{result.final_content}</div></div>
              </section> : null}
            </div>

            <aside className="h-fit space-y-4 rounded-2xl border bg-surface p-5 xl:sticky xl:top-24">
              <div><h2 className="font-semibold">Workflows salvos</h2><p className="mt-1 text-xs text-muted">Salvos localmente neste navegador.</p></div>
              <div className="flex gap-2"><input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm" placeholder="Nome do workflow" /><button type="button" onClick={saveWorkflow} className="grid h-11 w-11 place-items-center rounded-xl border"><Save size={17} /></button></div>
              <div className="space-y-2">{saved.length ? saved.map((item) => <div key={item.id} className="rounded-xl border bg-background p-3"><button type="button" onClick={() => loadWorkflow(item)} className="w-full text-left"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">{item.steps.length} etapa(s)</p></button><button type="button" onClick={() => deleteWorkflow(item.id)} className="mt-3 inline-flex items-center gap-2 text-xs text-red-300"><Trash2 size={14} /> Excluir</button></div>) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted">Nenhum workflow salvo.</p>}</div>
            </aside>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

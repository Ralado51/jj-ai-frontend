"use client";

import { AxiosError } from "axios";
import { Bot, LoaderCircle, Play, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AgentDescriptor, AgentExecution, AgentRunResponse, clearAgentMemory, listAgentExecutions, listAgents, runAgent } from "@/lib/agents";
import { listProjects, Project } from "@/lib/projects";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [agentId, setAgentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sessionKey, setSessionKey] = useState("sessao-principal");
  const [instruction, setInstruction] = useState("");
  const [useMemory, setUseMemory] = useState(true);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const selected = agents.find((agent) => agent.id === agentId);
  const requiresProject = agentId === "rag";

  async function refreshHistory(id = agentId) {
    setExecutions(await listAgentExecutions(id || undefined));
  }

  useEffect(() => {
    Promise.all([listAgents(), listProjects({ is_active: true, limit: 100 }), listAgentExecutions()])
      .then(([agentRows, projectRows, executionRows]) => {
        setAgents(agentRows);
        setProjects(projectRows);
        setExecutions(executionRows);
        setAgentId(agentRows[0]?.id ?? "");
      })
      .catch(() => setError("Não foi possível carregar os agentes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (agentId) refreshHistory(agentId).catch(() => setError("Não foi possível carregar o histórico."));
  }, [agentId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (requiresProject && !projectId) return setError("Selecione um projeto para o agente RAG.");
    setRunning(true);
    try {
      const response = await runAgent({ agent_id: agentId, project_id: requiresProject ? projectId : undefined, session_key: sessionKey || undefined, use_memory: useMemory, instruction });
      setResult(response);
      setInstruction("");
      await refreshHistory(response.agent.id);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail ?? "Não foi possível executar o agente.");
    } finally {
      setRunning(false);
    }
  }

  async function clearMemory() {
    if (!agentId || !sessionKey) return;
    try {
      await clearAgentMemory(agentId, sessionKey);
      setResult(null);
    } catch {
      setError("Não foi possível limpar a memória.");
    }
  }

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8"><div className="flex gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-secondary"><Bot /></div><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Agent Framework</p><h1 className="mt-2 text-3xl font-bold">Agentes</h1><p className="mt-2 text-sm text-muted">Agentes especializados com modelo automático, memória e RAG por projeto.</p></div></div></header>
    {loading ? <div className="grid min-h-72 place-items-center rounded-2xl border bg-surface"><LoaderCircle className="animate-spin" /></div> : <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="space-y-3 rounded-2xl border bg-surface p-4">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => { setAgentId(agent.id); setResult(null); }} className={`w-full rounded-xl border p-4 text-left ${agent.id === agentId ? "border-primary/50 bg-primary/10" : "bg-background hover:bg-elevated"}`}><div className="flex justify-between gap-2"><span className="font-semibold">{agent.name}</span><span className="text-[10px] uppercase text-muted">{agent.task}</span></div><p className="mt-2 text-xs leading-5 text-muted">{agent.description}</p></button>)}</aside>
      <div className="space-y-6"><form onSubmit={submit} className="space-y-5 rounded-2xl border bg-surface p-5"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted">Agente selecionado</p><h2 className="text-xl font-bold">{selected?.name}</h2></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useMemory} onChange={(event) => setUseMemory(event.target.checked)} /> Usar memória</label></div>
        {requiresProject ? <label className="grid gap-2 text-sm font-semibold">Projeto<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-12 rounded-xl border bg-background px-3 font-normal" required><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label> : null}
        <label className="grid gap-2 text-sm font-semibold">Sessão<div className="flex gap-2"><input value={sessionKey} onChange={(event) => setSessionKey(event.target.value)} className="h-12 flex-1 rounded-xl border bg-background px-3 font-normal" /><button type="button" onClick={clearMemory} className="inline-flex items-center gap-2 rounded-xl border px-4"><Trash2 size={16} /> Limpar</button></div></label>
        <label className="grid gap-2 text-sm font-semibold">Instrução<textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="min-h-40 rounded-xl border bg-background p-3 font-normal" required /></label>
        {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <button disabled={running || !agentId} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-60">{running ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}{running ? "Executando..." : "Executar agente"}</button></form>
        {result ? <article className="rounded-2xl border bg-surface p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">Resposta</h2><div className="flex gap-2 text-xs"><span className="rounded-full border px-3 py-1">{result.model}</span><span className="rounded-full border px-3 py-1">{(result.duration_ms / 1000).toFixed(2)} s</span><span className="rounded-full border px-3 py-1">Memória: {result.memory_items_used}</span></div></div><p className="mt-3 text-xs text-muted">{result.routing_reason}</p><div className="mt-5 whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-7">{result.content}</div></article> : null}
        <section className="rounded-2xl border bg-surface"><div className="flex items-center justify-between border-b p-5"><h2 className="font-semibold">Histórico</h2><button type="button" onClick={() => refreshHistory()} className="grid h-10 w-10 place-items-center rounded-xl border"><RefreshCw size={17} /></button></div><div className="divide-y">{executions.length ? executions.map((item) => <article key={item.id} className="p-5"><div className="flex justify-between gap-3"><p className="font-medium">{item.instruction}</p><span className="text-xs text-muted">{new Date(item.created_at).toLocaleString("pt-BR")}</span></div><p className="mt-2 line-clamp-3 text-sm text-muted">{item.response}</p><p className="mt-3 text-xs text-muted">{item.model} · {(item.duration_ms / 1000).toFixed(2)} s{item.session_key ? ` · ${item.session_key}` : ""}</p></article>) : <p className="p-6 text-sm text-muted">Nenhuma execução registrada.</p>}</div></section>
      </div>
    </div>}
  </section></DashboardShell>;
}

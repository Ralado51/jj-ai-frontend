"use client";

import axios from "axios";
import { Archive, Boxes, FileText, LoaderCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/providers/auth-provider";
import { archiveProject, createProject, listProjects, Project } from "@/lib/projects";

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = user?.role === "admin" || user?.role === "member";
  const canArchive = user?.role === "admin";

  async function loadProjects() {
    setIsLoading(true);
    setError("");
    try {
      const data = await listProjects({
        search: search || undefined,
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
        limit: 100,
      });
      setProjects(data);
    } catch {
      setError("Não foi possível carregar os projetos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProjects(), 250);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter]);

  const summary = useMemo(() => ({
    total: projects.length,
    active: projects.filter((project) => project.is_active).length,
    archived: projects.filter((project) => !project.is_active).length,
  }), [projects]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const slug = toSlug(name);
    if (!slug) {
      setError("Informe um nome válido para o projeto.");
      return;
    }

    setIsSaving(true);
    try {
      await createProject({ name: name.trim(), slug, description: description.trim() || null, settings: {} });
      setName("");
      setDescription("");
      setShowForm(false);
      setSuccess("Projeto criado com sucesso.");
      await loadProjects();
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 409) {
        setError("Já existe um projeto com esse identificador.");
      } else {
        setError("Não foi possível criar o projeto.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(project: Project) {
    if (!window.confirm(`Arquivar o projeto “${project.name}”?`)) return;
    setError("");
    setSuccess("");
    try {
      await archiveProject(project.id);
      setSuccess("Projeto arquivado com sucesso.");
      await loadProjects();
    } catch {
      setError("Não foi possível arquivar o projeto.");
    }
  }

  return (
    <DashboardShell>
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary">Core Platform</p>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight">Projetos</h1>
            <p className="mt-2 text-sm text-muted">Organize produtos, agentes, automações e bases de conhecimento.</p>
          </div>
          {canCreate && (
            <button type="button" onClick={() => setShowForm((value) => !value)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white">
              <Plus size={18} /> Novo projeto
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[["Total exibido", summary.total], ["Ativos", summary.active], ["Arquivados", summary.archived]].map(([label, value]) => (
            <article key={String(label)} className="rounded-xl border bg-surface p-5 shadow-glow">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 font-[var(--font-manrope)] text-3xl font-bold">{value}</p>
            </article>
          ))}
        </div>

        {showForm && canCreate && (
          <form onSubmit={handleCreate} className="rounded-2xl border bg-surface p-6 shadow-glow">
            <h2 className="font-[var(--font-manrope)] text-xl font-bold">Criar projeto</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">Nome</label>
                <input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={150} className="h-11 w-full rounded-xl border bg-elevated px-4 text-sm outline-none focus:border-primary" placeholder="Ex.: Simba Content Factory" />
                {name && <p className="mt-2 text-xs text-muted">Slug: {toSlug(name)}</p>}
              </div>
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium">Descrição</label>
                <input id="description" value={description} onChange={(event) => setDescription(event.target.value)} className="h-11 w-full rounded-xl border bg-elevated px-4 text-sm outline-none focus:border-primary" placeholder="Objetivo principal do projeto" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-xl border px-5 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
                {isSaving && <LoaderCircle className="animate-spin" size={17} />}{isSaving ? "Criando" : "Criar projeto"}
              </button>
            </div>
          </form>
        )}

        {error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

        <div className="flex flex-col gap-3 rounded-xl border bg-surface p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, slug ou descrição" className="h-11 w-full rounded-xl border bg-elevated pl-10 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-xl border bg-elevated px-4 text-sm outline-none">
            <option value="active">Ativos</option><option value="archived">Arquivados</option><option value="all">Todos</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted"><LoaderCircle className="animate-spin" size={20} /> Carregando projetos</div>
        ) : projects.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-surface/50 p-8 text-center">
            <div><Boxes className="mx-auto text-secondary" size={34} /><h2 className="mt-4 font-[var(--font-manrope)] text-xl font-bold">Nenhum projeto encontrado</h2><p className="mt-2 text-sm text-muted">Crie o primeiro projeto ou ajuste os filtros.</p></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article key={project.id} className="rounded-2xl border bg-surface p-5 shadow-glow transition hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-secondary"><Boxes size={20} /></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${project.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-300"}`}>{project.is_active ? "Ativo" : "Arquivado"}</span>
                </div>
                <h2 className="mt-5 font-[var(--font-manrope)] text-xl font-bold">{project.name}</h2>
                <p className="mt-1 font-mono text-xs text-secondary">{project.slug}</p>
                <p className="mt-4 min-h-10 text-sm leading-5 text-muted">{project.description || "Sem descrição cadastrada."}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                  <p className="text-xs text-muted">Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}</p>
                  <div className="flex items-center gap-3">
                    <Link href={`/projects/${project.id}/documents`} className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-foreground">
                      <FileText size={15} /> Documentos
                    </Link>
                    {canArchive && project.is_active && <button type="button" onClick={() => void handleArchive(project)} className="flex items-center gap-1.5 text-xs font-medium text-red-300 hover:text-red-200"><Archive size={15} /> Arquivar</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

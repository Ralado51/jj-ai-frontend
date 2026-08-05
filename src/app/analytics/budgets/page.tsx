"use client";

import { AlertTriangle, CheckCircle2, CircleDollarSign, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AICostBudget, AICostBudgetPayload, BudgetScope, createAICostBudget, deleteAICostBudget, listAICostBudgets, updateAICostBudget } from "@/lib/ai-cost-budgets";

const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const statusLabel = { healthy: "Saudável", warning: "Em alerta", critical: "Crítico" } as const;
const statusClass = { healthy: "text-emerald-300", warning: "text-amber-300", critical: "text-red-300" } as const;
const emptyForm: AICostBudgetPayload = { scope_type: "global", scope_id: null, name: "", monthly_limit: 100, warning_threshold_percent: 80, critical_threshold_percent: 100, is_active: true };

export default function AICostBudgetsPage() {
  const [items, setItems] = useState<AICostBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AICostBudget | null>(null);
  const [form, setForm] = useState<AICostBudgetPayload>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems(await listAICostBudgets()); } catch { setError("Não foi possível carregar os budgets."); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => statusFilter ? items.filter((item) => item.status === statusFilter) : items, [items, statusFilter]);
  const totals = useMemo(() => ({
    active: items.filter((item) => item.is_active).length,
    warning: items.filter((item) => item.status === "warning").length,
    critical: items.filter((item) => item.status === "critical").length,
    spend: items.reduce((sum, item) => sum + Number(item.current_spend), 0),
    limit: items.reduce((sum, item) => sum + Number(item.monthly_limit), 0),
  }), [items]);

  function startCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function startEdit(item: AICostBudget) {
    setEditing(item); setForm({ scope_type: item.scope_type, scope_id: item.scope_id, name: item.name, monthly_limit: Number(item.monthly_limit), warning_threshold_percent: item.warning_threshold_percent, critical_threshold_percent: item.critical_threshold_percent, is_active: item.is_active }); setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.warning_threshold_percent >= form.critical_threshold_percent) { setError("O threshold de alerta deve ser menor que o crítico."); return; }
    setSaving(true); setError("");
    try {
      if (editing) await updateAICostBudget(editing.id, { name: form.name, monthly_limit: form.monthly_limit, warning_threshold_percent: form.warning_threshold_percent, critical_threshold_percent: form.critical_threshold_percent, is_active: form.is_active });
      else await createAICostBudget({ ...form, scope_id: form.scope_type === "global" ? null : form.scope_id });
      setOpen(false); await load();
    } catch { setError("Não foi possível salvar o budget."); } finally { setSaving(false); }
  }

  async function remove(item: AICostBudget) {
    if (!window.confirm(`Excluir o budget ${item.name}?`)) return;
    try { await deleteAICostBudget(item.id); setItems((current) => current.filter((budget) => budget.id !== item.id)); } catch { setError("Não foi possível excluir o budget."); }
  }

  return <DashboardShell><section className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl border bg-surface p-6 md:flex-row md:items-end md:justify-between md:p-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Governança financeira</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">AI Budgets</h1><p className="mt-2 text-sm text-muted">Defina limites mensais globais, por projeto ou workflow.</p></div>
      <div className="flex gap-2"><button onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><RefreshCw size={17} /> Atualizar</button><button onClick={startCreate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"><Plus size={17} /> Novo budget</button></div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Metric icon={CircleDollarSign} label="Budgets ativos" value={String(totals.active)} />
      <Metric icon={CheckCircle2} label="Saudáveis" value={String(items.filter((i) => i.status === "healthy").length)} />
      <Metric icon={AlertTriangle} label="Em alerta" value={String(totals.warning)} />
      <Metric icon={AlertTriangle} label="Críticos" value={String(totals.critical)} />
      <Metric icon={CircleDollarSign} label="Consumo total" value={`${usd.format(totals.spend)} / ${usd.format(totals.limit)}`} />
    </div>

    <div className="flex flex-wrap gap-2 rounded-2xl border bg-surface p-4"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="">Todos os status</option><option value="healthy">Saudável</option><option value="warning">Em alerta</option><option value="critical">Crítico</option></select></div>
    {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}
    {loading ? <div className="flex justify-center gap-2 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando budgets...</div> : null}

    {!loading ? <div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => {
      const width = Math.min(100, Math.max(0, item.usage_percent));
      return <article key={item.id} className="rounded-2xl border bg-surface p-6">
        <div className="flex items-start justify-between gap-4"><div><span className="rounded-full border bg-background px-3 py-1 text-xs text-muted">{item.scope_type}</span><h2 className="mt-3 text-xl font-bold">{item.name}</h2><p className={`mt-1 text-sm font-semibold ${statusClass[item.status]}`}>{statusLabel[item.status]}</p></div><div className="flex gap-2"><button onClick={() => startEdit(item)} className="grid h-9 w-9 place-items-center rounded-lg border"><Pencil size={16} /></button><button onClick={() => void remove(item)} className="grid h-9 w-9 place-items-center rounded-lg border text-red-300"><Trash2 size={16} /></button></div></div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
        <div className="mt-3 flex justify-between text-sm"><span>{usd.format(Number(item.current_spend))} usados</span><span>{item.usage_percent.toFixed(1)}%</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted"><div className="rounded-xl border bg-background p-3">Limite<br/><strong className="text-foreground">{usd.format(Number(item.monthly_limit))}</strong></div><div className="rounded-xl border bg-background p-3">Restante<br/><strong className="text-foreground">{usd.format(Number(item.remaining))}</strong></div></div>
      </article>;
    })}</div> : null}

    {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><form onSubmit={submit} className="w-full max-w-xl rounded-2xl border bg-surface p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? "Editar budget" : "Novo budget"}</h2><button type="button" onClick={() => setOpen(false)}><X /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2">
      <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
      <Field label="Escopo"><select disabled={Boolean(editing)} value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value as BudgetScope, scope_id: null })} className="input"><option value="global">Global</option><option value="project">Projeto</option><option value="workflow">Workflow</option></select></Field>
      {form.scope_type !== "global" ? <Field label="ID do escopo"><input required disabled={Boolean(editing)} value={form.scope_id ?? ""} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} className="input" placeholder="UUID" /></Field> : null}
      <Field label="Limite mensal (USD)"><input required type="number" min="0.01" step="0.01" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: Number(e.target.value) })} className="input" /></Field>
      <Field label="Alerta (%)"><input required type="number" min="1" max="100" value={form.warning_threshold_percent} onChange={(e) => setForm({ ...form, warning_threshold_percent: Number(e.target.value) })} className="input" /></Field>
      <Field label="Crítico (%)"><input required type="number" min="1" max="200" value={form.critical_threshold_percent} onChange={(e) => setForm({ ...form, critical_threshold_percent: Number(e.target.value) })} className="input" /></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
    </div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl border px-4 text-sm font-semibold">Cancelar</button><button disabled={saving} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar"}</button></div></form></div> : null}
  </section></DashboardShell>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>; }
function Metric({ icon: Icon, label, value }: { icon: typeof CircleDollarSign; label: string; value: string }) { return <article className="rounded-2xl border bg-surface p-5"><div className="flex items-center gap-2 text-sm text-muted"><Icon size={18} />{label}</div><p className="mt-4 text-2xl font-bold">{value}</p></article>; }

"use client";

import { AlertTriangle, Bell, CheckCheck, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
  NotificationList,
} from "@/lib/notifications";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationList | null>(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getNotifications({ page, pageSize: PAGE_SIZE, unreadOnly, severity, type }));
    } catch {
      setError("Não foi possível carregar as notificações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [page, unreadOnly, severity, type]);

  function applyFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function markRead(item: NotificationItem) {
    if (item.is_read) return;
    const updated = await markNotificationAsRead(item.id);
    setData((current) => current ? {
      ...current,
      items: current.items.map((entry) => entry.id === item.id ? updated : entry),
      unread_count: Math.max(0, current.unread_count - 1),
    } : current);
  }

  async function markAllRead() {
    setUpdating(true);
    try {
      await markAllNotificationsAsRead();
      await load();
    } finally {
      setUpdating(false);
    }
  }

  return <DashboardShell><section className="mx-auto max-w-[1200px] space-y-6">
    <header className="rounded-3xl border bg-surface p-6 shadow-glow md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Central de alertas</p><h1 className="mt-2 text-3xl font-bold">Notificações</h1><p className="mt-2 text-sm text-muted">Acompanhe regressões críticas, alertas operacionais e eventos relevantes da plataforma.</p></div>
        <button type="button" onClick={() => void markAllRead()} disabled={!data?.unread_count || updating} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50">{updating ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCheck size={16} />} Marcar todas como lidas</button>
      </div>
    </header>

    <section className="rounded-2xl border bg-surface p-5">
      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-muted">Status<select value={unreadOnly ? "unread" : "all"} onChange={(event) => applyFilters(() => setUnreadOnly(event.target.value === "unread"))} className="h-10 rounded-xl border bg-background px-3 text-sm font-normal text-foreground"><option value="all">Todas</option><option value="unread">Somente não lidas</option></select></label>
        <label className="grid gap-1 text-xs font-semibold text-muted">Severidade<select value={severity} onChange={(event) => applyFilters(() => setSeverity(event.target.value))} className="h-10 rounded-xl border bg-background px-3 text-sm font-normal text-foreground"><option value="">Todas</option><option value="critical">Crítica</option><option value="warning">Alerta</option><option value="info">Informativa</option></select></label>
        <label className="grid gap-1 text-xs font-semibold text-muted">Tipo<select value={type} onChange={(event) => applyFilters(() => setType(event.target.value))} className="h-10 rounded-xl border bg-background px-3 text-sm font-normal text-foreground"><option value="">Todos</option><option value="workflow_health_regression">Regressão de workflow</option></select></label>
        <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted">Não lidas</p><p className="mt-1 text-2xl font-bold">{data?.unread_count ?? 0}</p></div>
      </div>
    </section>

    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" /> Carregando notificações...</div> : null}
    {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}

    {!loading && data ? <section className="overflow-hidden rounded-2xl border bg-surface">
      <div className="border-b px-5 py-4"><p className="text-sm text-muted">{data.total} notificação(ões) encontrada(s)</p></div>
      <div>{data.items.length ? data.items.map((item) => <NotificationRow key={item.id} item={item} onRead={markRead} />) : <div className="p-12 text-center"><Bell className="mx-auto text-muted" /><p className="mt-3 text-sm text-muted">Nenhuma notificação encontrada para os filtros selecionados.</p></div>}</div>
      <div className="flex items-center justify-between border-t px-5 py-4"><p className="text-sm text-muted">Página {data.page} de {Math.max(1, data.total_pages)}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={data.page <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"><ChevronLeft size={16} /> Anterior</button><button type="button" onClick={() => setPage((current) => Math.min(data.total_pages, current + 1))} disabled={data.page >= data.total_pages} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40">Próxima <ChevronRight size={16} /></button></div></div>
    </section> : null}
  </section></DashboardShell>;
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: (item: NotificationItem) => Promise<void> }) {
  const href = item.workflow_id ? `/workflow-analytics?workflow_id=${item.workflow_id}` : "/workflow-analytics";
  return <article className={`border-b p-5 last:border-b-0 ${item.is_read ? "opacity-70" : "bg-secondary/5"}`}><div className="flex items-start gap-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.severity === "critical" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}><AlertTriangle size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{item.title}</h2>{!item.is_read ? <span className="h-2 w-2 rounded-full bg-secondary" /> : null}</div><p className="mt-1 text-sm leading-6 text-muted">{item.message}</p></div><span className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase">{item.severity}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{formatDate(item.created_at)}</p><div className="flex gap-2">{!item.is_read ? <button type="button" onClick={() => void onRead(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Marcar como lida</button> : null}<Link href={href} onClick={() => void onRead(item)} className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white">Abrir detalhes</Link></div></div></div></div></article>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

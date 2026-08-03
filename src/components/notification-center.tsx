"use client";

import { AlertTriangle, Bell, CheckCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from "@/lib/notifications";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await getNotifications({ page: 1, pageSize: 20 });
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function markRead(item: NotificationItem) {
    if (item.is_read) return;
    const updated = await markNotificationAsRead(item.id);
    setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    setUpdating(true);
    try {
      await markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } finally {
      setUpdating(false);
    }
  }

  return <div ref={rootRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="relative grid h-10 w-10 place-items-center rounded-xl border bg-surface transition hover:bg-elevated" aria-label={`Notificações${unreadCount ? `: ${unreadCount} não lidas` : ""}`} aria-expanded={open}>
      <Bell size={18} />
      {unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
    </button>

    {open ? <div className="absolute right-0 top-12 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div><p className="font-semibold">Notificações</p><p className="text-xs text-muted">{unreadCount} não lida(s)</p></div>
        <button type="button" onClick={() => void markAllRead()} disabled={!unreadCount || updating} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-secondary disabled:opacity-40">
          {updating ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCheck size={14} />} Marcar todas como lidas
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" /> Carregando...</div> : null}
        {!loading && !items.length ? <div className="p-8 text-center text-sm text-muted">Nenhuma notificação.</div> : null}
        {items.map((item) => <Link key={item.id} href={item.workflow_id ? `/workflow-analytics?workflow_id=${item.workflow_id}` : "/workflow-analytics"} onClick={() => { void markRead(item); setOpen(false); }} className={`block border-b p-4 last:border-b-0 hover:bg-elevated ${item.is_read ? "opacity-70" : "bg-secondary/5"}`}>
          <div className="flex gap-3">
            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.severity === "critical" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}><AlertTriangle size={16} /></div>
            <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{item.title}</p>{!item.is_read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" /> : null}</div><p className="mt-1 text-xs leading-5 text-muted">{item.message}</p><p className="mt-2 text-[11px] text-muted">{formatNotificationDate(item.created_at)}</p></div>
          </div>
        </Link>)}
      </div>
      <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t px-4 py-3 text-center text-sm font-semibold text-secondary hover:bg-elevated">Ver todas as notificações</Link>
    </div> : null}
  </div>;
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

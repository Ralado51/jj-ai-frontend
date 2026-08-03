"use client";

import {
  BarChart3,
  Bot,
  Boxes,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotificationCenter } from "@/components/notification-center";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/providers/auth-provider";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Projetos", icon: Boxes, href: "/projects" },
  { label: "AI Apps", icon: Sparkles, href: "/ai-apps" },
  { label: "Benchmark", icon: FlaskConical, href: "/benchmark" },
  { label: "AI Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Workflow Analytics", icon: BarChart3, href: "/workflow-analytics" },
  { label: "Documentos", icon: FileText },
  { label: "Agentes", icon: Bot, href: "/agents" },
  { label: "Workflows", icon: Workflow, href: "/workflows" },
  { label: "Execuções", icon: History, href: "/workflow-executions" },
  { label: "Configurações", icon: Settings },
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  member: "Membro",
  viewer: "Visualizador",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = user?.full_name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JJ";

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-surface/95 backdrop-blur transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b px-5"><div><p className="font-[var(--font-manrope)] text-lg font-bold tracking-tight">JJ AI Platform</p><p className="text-xs text-muted">Operação conectada</p></div><button type="button" className="grid h-9 w-9 place-items-center rounded-lg border md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button></div>
        <nav className="space-y-2 p-4">{navigation.map(({ label, icon: Icon, href }) => { const active = href === "/" ? pathname === "/" : Boolean(href && pathname.startsWith(href)); const classes = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${active ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-foreground ring-1 ring-primary/30" : "text-muted hover:bg-elevated hover:text-foreground"}`; return href ? <Link key={label} href={href} onClick={() => setOpen(false)} className={classes}><Icon size={18} />{label}</Link> : <button key={label} type="button" disabled className={`${classes} cursor-not-allowed opacity-55`}><Icon size={18} />{label}</button>; })}</nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4"><div className="rounded-xl border bg-elevated p-4"><p className="text-sm font-semibold">Ambiente MVP</p><p className="mt-1 text-xs text-muted">Frontend conectado à API pública da JJ Network.</p></div></div>
      </aside>
      {open ? <button type="button" className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" /> : null}
      <div className="min-w-0"><header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8"><button type="button" className="grid h-10 w-10 place-items-center rounded-xl border bg-surface md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={19} /></button><div className="relative hidden max-w-xl flex-1 md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input type="search" placeholder="Buscar projetos, documentos e agentes" className="h-11 w-full rounded-xl border bg-surface pl-10 pr-4 text-sm outline-none transition placeholder:text-muted focus:ring-2 focus:ring-primary/30" /></div><div className="ml-auto flex items-center gap-2"><ThemeToggle /><NotificationCenter /><div className="ml-1 hidden items-center gap-3 rounded-xl border bg-surface px-3 py-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">{initials}</div><div className="leading-tight"><p className="text-sm font-semibold">{user?.full_name ?? "Usuário"}</p><p className="text-xs text-muted">{user ? roleLabels[user.role] ?? user.role : "Sessão"}</p></div></div></div></header><main className="p-4 md:p-8">{children}</main></div>
    </div>
  );
}

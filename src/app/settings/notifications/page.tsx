"use client";

import { AlertTriangle, Bell, CheckCircle2, LoaderCircle, Mail, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  getNotificationPreferences,
  NotificationPreferences,
  sendNotificationTestEmail,
  TestEmailResult,
  updateNotificationPreferences,
} from "@/lib/notifications";

const initial: NotificationPreferences = {
  in_app_enabled: true,
  email_enabled: false,
  critical_only: true,
  email_address: "",
};

export default function NotificationSettingsPage() {
  const [saved, setSaved] = useState<NotificationPreferences>(initial);
  const [form, setForm] = useState<NotificationPreferences>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTest, setLastTest] = useState<TestEmailResult | null>(null);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(form), [saved, form]);
  const emailValid = !form.email_enabled || !form.email_address || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address);

  useEffect(() => {
    getNotificationPreferences()
      .then((data) => {
        const normalized = { ...data, email_address: data.email_address ?? "" };
        setSaved(normalized);
        setForm(normalized);
      })
      .catch(() => setError("Não foi possível carregar as preferências."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!emailValid) return;
    if (!form.in_app_enabled && !form.email_enabled && !window.confirm("Você ficará sem receber qualquer alerta. Continuar?")) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateNotificationPreferences({ ...form, email_address: form.email_address || null });
      const normalized = { ...updated, email_address: updated.email_address ?? "" };
      setSaved(normalized);
      setForm(normalized);
      setMessage("Preferências salvas com sucesso.");
    } catch {
      setError("Não foi possível salvar as preferências.");
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendNotificationTestEmail();
      setLastTest(result);
      setMessage(`E-mail enviado para ${result.recipient}.`);
    } catch {
      setError("Falha no envio. Verifique a configuração SMTP e o endereço informado.");
    } finally {
      setTesting(false);
    }
  }

  return <DashboardShell>
    <section className="mx-auto max-w-4xl space-y-6">
      <div><p className="text-sm font-semibold text-secondary">Configurações</p><h1 className="mt-1 text-3xl font-bold">Preferências de notificação</h1><p className="mt-2 text-sm text-muted">Defina como a plataforma deve avisar sobre regressões e eventos operacionais.</p></div>

      {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border bg-surface p-12 text-muted"><LoaderCircle className="animate-spin" size={20} /> Carregando preferências...</div> : <>
        {message ? <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"><CheckCircle2 size={18} />{message}</div> : null}
        {error ? <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm"><AlertTriangle size={18} />{error}</div> : null}

        <div className="space-y-4 rounded-2xl border bg-surface p-6">
          <PreferenceRow icon={Bell} title="Notificações na plataforma" description="Exibir alertas no sino e na central de notificações." checked={form.in_app_enabled} onChange={(value) => setForm((current) => ({ ...current, in_app_enabled: value }))} />
          <PreferenceRow icon={Mail} title="Notificações por e-mail" description="Enviar alertas para o endereço configurado." checked={form.email_enabled} onChange={(value) => setForm((current) => ({ ...current, email_enabled: value }))} />

          {form.email_enabled ? <div className="space-y-4 border-t pt-5">
            <label className="block text-sm font-semibold">Endereço de e-mail<input type="email" value={form.email_address ?? ""} onChange={(event) => setForm((current) => ({ ...current, email_address: event.target.value }))} placeholder="Use o e-mail da conta" className={`mt-2 h-11 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-primary/30 ${emailValid ? "" : "border-red-500"}`} /></label>
            {!emailValid ? <p className="text-xs text-red-400">Informe um endereço de e-mail válido.</p> : null}
            <PreferenceRow icon={AlertTriangle} title="Somente alertas críticos" description="Não enviar avisos de severidade baixa ou moderada por e-mail." checked={form.critical_only} onChange={(value) => setForm((current) => ({ ...current, critical_only: value }))} />
            <button type="button" onClick={() => void testEmail()} disabled={testing || !emailValid} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{testing ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}Enviar e-mail de teste</button>
          </div> : null}
        </div>

        {lastTest ? <div className="rounded-2xl border bg-surface p-5"><p className="text-sm font-semibold">Último envio de teste</p><p className="mt-2 text-sm text-emerald-300">{lastTest.status}</p><p className="mt-1 text-xs text-muted">{lastTest.recipient} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(lastTest.sent_at))}</p></div> : null}

        <div className="flex flex-col gap-3 rounded-2xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">{dirty ? "Existem alterações não salvas." : "Todas as alterações estão salvas."}</p><button type="button" onClick={() => void save()} disabled={!dirty || saving || !emailValid} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}Salvar preferências</button></div>
      </>}
    </section>
  </DashboardShell>;
}

function PreferenceRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Bell; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-4 rounded-xl border bg-background p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted">{description}</p></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" /></label>;
}

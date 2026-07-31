"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentCreatorBriefing } from "@/lib/content-creator";

type ContentCreatorWizardProps = {
  open: boolean;
  onClose: () => void;
  onApply: (briefing: ContentCreatorBriefing) => void;
};

type Briefing = {
  theme: string;
  audience: string;
  platform: string;
  objective: string;
  tone: string;
  format: string;
  duration: string;
  callToAction: string;
};

const steps = [
  { key: "theme", title: "Tema", description: "Qual é o assunto principal do conteúdo?" },
  { key: "audience", title: "Público", description: "Para quem esse conteúdo será criado?" },
  { key: "platform", title: "Plataforma", description: "Onde o conteúdo será publicado?" },
  { key: "objective", title: "Objetivo", description: "Qual resultado você quer alcançar?" },
  { key: "style", title: "Formato e estilo", description: "Defina tom, formato e duração." },
  { key: "review", title: "Revisão", description: "Revise o briefing antes de gerar." },
] as const;

const initialBriefing: Briefing = {
  theme: "",
  audience: "",
  platform: "YouTube Shorts",
  objective: "",
  tone: "Descontraído",
  format: "Vídeo curto",
  duration: "60 segundos",
  callToAction: "",
};

export function ContentCreatorWizard({ open, onClose, onApply }: ContentCreatorWizardProps) {
  const [step, setStep] = useState(0);
  const [briefing, setBriefing] = useState<Briefing>(initialBriefing);

  const current = steps[step];

  const canContinue = useMemo(() => {
    switch (current.key) {
      case "theme":
        return briefing.theme.trim().length >= 3;
      case "audience":
        return briefing.audience.trim().length >= 3;
      case "platform":
        return briefing.platform.trim().length > 0;
      case "objective":
        return briefing.objective.trim().length >= 3;
      case "style":
        return briefing.tone.trim().length > 0 && briefing.format.trim().length > 0;
      default:
        return true;
    }
  }, [briefing, current.key]);

  function updateField<K extends keyof Briefing>(field: K, value: Briefing[K]) {
    setBriefing((currentBriefing) => ({ ...currentBriefing, [field]: value }));
  }

  function closeWizard() {
    setStep(0);
    setBriefing(initialBriefing);
    onClose();
  }

  function applyWizard() {
    onApply({
      tema: briefing.theme.trim(),
      publico: briefing.audience.trim(),
      plataforma: briefing.platform.trim(),
      objetivo: briefing.objective.trim(),
      formato: briefing.format.trim(),
      tom: briefing.tone.trim(),
      duracao: briefing.duration.trim() || "Não definida",
      cta: briefing.callToAction.trim() || "Sugira a melhor CTA",
    });
    closeWizard();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Assistente de criação de conteúdo">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-secondary"><Sparkles size={17} /><span className="text-xs font-semibold uppercase tracking-wide">Criador de conteúdo</span></div>
            <h2 className="mt-1 font-[var(--font-manrope)] text-xl font-bold">Briefing guiado</h2>
          </div>
          <button type="button" onClick={closeWizard} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-elevated" aria-label="Fechar assistente"><X size={18} /></button>
        </div>

        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {steps.map((item, index) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${index < step ? "border-primary bg-primary text-white" : index === step ? "border-primary bg-primary/15 text-secondary" : "bg-background text-muted"}`}>
                  {index < step ? <Check size={14} /> : index + 1}
                </div>
                {index < steps.length - 1 && <div className="h-px w-8 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Etapa {step + 1} de {steps.length}</p>
          <h3 className="mt-2 font-[var(--font-manrope)] text-2xl font-bold">{current.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{current.description}</p>

          <div className="mt-6">
            {current.key === "theme" && <textarea value={briefing.theme} onChange={(event) => updateField("theme", event.target.value)} placeholder="Ex.: Como economizar combustível na moto" rows={5} autoFocus className="w-full resize-y rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />}
            {current.key === "audience" && <textarea value={briefing.audience} onChange={(event) => updateField("audience", event.target.value)} placeholder="Ex.: Motoboys que trabalham diariamente em grandes cidades" rows={5} autoFocus className="w-full resize-y rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />}
            {current.key === "platform" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["YouTube Shorts", "Instagram Reels", "TikTok", "LinkedIn", "YouTube", "Blog"].map((platform) => <button key={platform} type="button" onClick={() => updateField("platform", platform)} className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${briefing.platform === platform ? "border-primary bg-primary/10 text-secondary" : "bg-background hover:bg-elevated"}`}>{platform}</button>)}</div>}
            {current.key === "objective" && <div className="space-y-4"><textarea value={briefing.objective} onChange={(event) => updateField("objective", event.target.value)} placeholder="Ex.: Ganhar inscritos e posicionar o canal como referência" rows={4} autoFocus className="w-full resize-y rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary" /><input value={briefing.callToAction} onChange={(event) => updateField("callToAction", event.target.value)} placeholder="CTA opcional: Ex.: Inscreva-se no canal" className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>}
            {current.key === "style" && <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Formato</span><select value={briefing.format} onChange={(event) => updateField("format", event.target.value)} className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary"><option>Vídeo curto</option><option>Vídeo longo</option><option>Carrossel</option><option>Post</option><option>Artigo</option><option>Podcast</option></select></label><label className="space-y-2"><span className="text-sm font-semibold">Tom de voz</span><select value={briefing.tone} onChange={(event) => updateField("tone", event.target.value)} className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary"><option>Descontraído</option><option>Profissional</option><option>Educativo</option><option>Inspirador</option><option>Provocativo</option><option>Humorístico</option></select></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold">Duração</span><input value={briefing.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="Ex.: 60 segundos" className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary" /></label></div>}
            {current.key === "review" && <div className="grid gap-3 md:grid-cols-2">{[["Tema", briefing.theme], ["Público", briefing.audience], ["Plataforma", briefing.platform], ["Objetivo", briefing.objective], ["Formato", briefing.format], ["Tom", briefing.tone], ["Duração", briefing.duration || "Não definida"], ["CTA", briefing.callToAction || "A IA irá sugerir"]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value}</p></div>)}</div>}
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <button type="button" onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))} disabled={step === 0} className="flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={16} /> Voltar</button>
          {step < steps.length - 1 ? <button type="button" onClick={() => setStep((currentStep) => Math.min(steps.length - 1, currentStep + 1))} disabled={!canContinue} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Continuar <ArrowRight size={16} /></button> : <button type="button" onClick={applyWizard} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white hover:opacity-90"><Sparkles size={16} /> Gerar conteúdo</button>}
        </div>
      </div>
    </div>
  );
}

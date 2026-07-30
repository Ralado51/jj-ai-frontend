"use client";

import { LoaderCircle, Search, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  listPromptTemplates,
  PromptTemplate,
  updatePromptTemplate,
} from "@/lib/prompt-templates";

type PromptTemplateLibraryProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onApply: (template: PromptTemplate) => void;
};

export function PromptTemplateLibrary({
  projectId,
  open,
  onClose,
  onApply,
}: PromptTemplateLibraryProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const items = await listPromptTemplates({ projectId });
        if (!cancelled) {
          setTemplates(items);
          setSelected((current) => current ?? items[0] ?? null);
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar os templates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const categories = useMemo(
    () => Array.from(new Set(templates.map((template) => template.category))).sort(),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return templates.filter((template) => {
      if (favoritesOnly && !template.is_favorite) return false;
      if (category !== "all" && template.category !== category) return false;
      if (!normalized) return true;
      return [template.name, template.description ?? "", template.content]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized);
    });
  }, [category, favoritesOnly, query, templates]);

  async function toggleFavorite(template: PromptTemplate) {
    const previous = templates;
    const nextFavorite = !template.is_favorite;
    setTemplates((items) =>
      items.map((item) =>
        item.id === template.id ? { ...item, is_favorite: nextFavorite } : item,
      ),
    );
    setSelected((item) =>
      item?.id === template.id ? { ...item, is_favorite: nextFavorite } : item,
    );
    try {
      await updatePromptTemplate(template.id, { is_favorite: nextFavorite });
    } catch {
      setTemplates(previous);
      setError("Não foi possível atualizar o favorito.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Biblioteca de templates">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-[var(--font-manrope)] text-xl font-bold">Biblioteca de templates</h2>
            <p className="mt-1 text-xs text-muted">Escolha um prompt reutilizável para começar mais rápido.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-elevated" aria-label="Fechar biblioteca">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-r">
            <div className="space-y-3 border-b p-4">
              <label className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Search size={16} className="text-muted" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar templates" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCategory("all")} className={`rounded-lg border px-3 py-1.5 text-xs ${category === "all" ? "border-primary bg-primary/15 text-secondary" : "bg-background text-muted"}`}>Todos</button>
                {categories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg border px-3 py-1.5 text-xs ${category === item ? "border-primary bg-primary/15 text-secondary" : "bg-background text-muted"}`}>{item}</button>
                ))}
                <button type="button" onClick={() => setFavoritesOnly((value) => !value)} className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs ${favoritesOnly ? "border-primary bg-primary/15 text-secondary" : "bg-background text-muted"}`}>
                  <Star size={13} className={favoritesOnly ? "fill-current" : ""} /> Favoritos
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted"><LoaderCircle className="animate-spin" size={16} /> Carregando templates</div>
              ) : error && templates.length === 0 ? (
                <p className="p-4 text-sm text-red-300">{error}</p>
              ) : filteredTemplates.length === 0 ? (
                <p className="p-4 text-sm text-muted">Nenhum template encontrado.</p>
              ) : (
                filteredTemplates.map((template) => (
                  <div key={template.id} className={`mb-1 rounded-xl border p-3 ${selected?.id === template.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-elevated"}`}>
                    <div className="flex items-start gap-2">
                      <button type="button" onClick={() => setSelected(template)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold">{template.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{template.description || template.content}</p>
                      </button>
                      <button type="button" onClick={() => void toggleFavorite(template)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-surface" aria-label={template.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                        <Star size={15} className={template.is_favorite ? "fill-current text-amber-400" : "text-muted"} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5">
            {selected ? (
              <div className="flex min-h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-secondary"><Sparkles size={17} /><span className="text-xs font-semibold uppercase tracking-wide">{selected.category}</span></div>
                    <h3 className="mt-3 font-[var(--font-manrope)] text-2xl font-bold">{selected.name}</h3>
                    {selected.description && <p className="mt-2 text-sm leading-6 text-muted">{selected.description}</p>}
                  </div>
                </div>
                <pre className="mt-5 whitespace-pre-wrap rounded-2xl border bg-background p-4 text-sm leading-6 text-foreground">{selected.content}</pre>
                {selected.variables.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Variáveis</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.variables.map((variable) => <span key={variable} className="rounded-lg border bg-elevated px-2.5 py-1 font-mono text-xs">{`{{${variable}}}`}</span>)}
                    </div>
                  </div>
                )}
                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                <div className="mt-auto flex justify-end gap-3 pt-6">
                  <button type="button" onClick={onClose} className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-elevated">Cancelar</button>
                  <button type="button" onClick={() => onApply(selected)} className="h-10 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white hover:opacity-90">Usar template</button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center text-sm text-muted">Selecione um template para visualizar.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

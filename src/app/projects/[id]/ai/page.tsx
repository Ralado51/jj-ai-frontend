"use client";

import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentCreatorWizard } from "@/components/ai/content-creator-wizard";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import { PromptTemplateLibrary } from "@/components/ai/prompt-template-library";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  addConversationMessage,
  ConversationListItem,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  RagExecutionMetrics,
  RagSource,
  streamProjectAnswer,
  updateConversation,
} from "@/lib/ai-workspace";
import { PromptTemplate } from "@/lib/prompt-templates";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  model?: string;
  metrics?: RagExecutionMetrics;
  question?: string;
  isStreaming?: boolean;
};

function formatDuration(milliseconds?: number) {
  if (milliseconds === undefined) return null;
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatConfidence(value?: number) {
  if (value === undefined) return null;
  return `${Math.round(value * 100)}%`;
}

function titleFromQuestion(question: string) {
  const compact = question.replace(/\s+/g, " ").trim();
  return compact.length <= 56 ? compact : `${compact.slice(0, 53).trim()}...`;
}

export default function ProjectAiWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isContentCreatorWizardOpen, setIsContentCreatorWizardOpen] = useState(false);
  const [error, setError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );
  const latestSources = latestAssistantMessage?.sources ?? [];
  const activeConversation = conversations.find((item) => item.id === activeConversationId);

  const refreshConversations = useCallback(async () => {
    const response = await listConversations(projectId);
    setConversations(response.items);
    return response.items;
  }, [projectId]);

  const openConversation = useCallback(async (conversationId: string) => {
    setError("");
    const conversation = await getConversation(conversationId);
    setActiveConversationId(conversation.id);
    setMessages(
      conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        model: message.model ?? undefined,
      })),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoadingConversations(true);
      setError("");
      try {
        const items = await refreshConversations();
        if (cancelled) return;
        if (items.length > 0) await openConversation(items[0].id);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o histórico de conversas.");
      } finally {
        if (!cancelled) setIsLoadingConversations(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [openConversation, refreshConversations]);

  useEffect(() => {
    const storageKey = `jj-ai-content-briefing:${projectId}`;
    const briefing = sessionStorage.getItem(storageKey);
    if (briefing) {
      setQuestion(briefing);
      sessionStorage.removeItem(storageKey);
    }
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function handleNewConversation() {
    setMessages([]);
    setActiveConversationId(null);
    setQuestion("");
    setError("");
  }

  async function ensureConversation(firstQuestion: string) {
    if (activeConversationId) return activeConversationId;
    const created = await createConversation(projectId, titleFromQuestion(firstQuestion));
    setActiveConversationId(created.id);
    await refreshConversations();
    return created.id;
  }

  async function submitQuestion(rawQuestion: string) {
    const normalizedQuestion = rawQuestion.trim();
    if (!normalizedQuestion || isLoading) return;

    const assistantMessageId = crypto.randomUUID();
    const conversationId = await ensureConversation(normalizedQuestion);

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: normalizedQuestion },
      { id: assistantMessageId, role: "assistant", content: "", question: normalizedQuestion, isStreaming: true },
    ]);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      await addConversationMessage(conversationId, { role: "user", content: normalizedQuestion });
      let finalAnswer = "";
      let finalModel = "";

      await streamProjectAnswer(projectId, normalizedQuestion, conversationId, (event) => {
        if (event.type === "metadata") {
          finalModel = event.chat_model;
          setMessages((current) => current.map((message) => message.id === assistantMessageId ? { ...message, model: event.chat_model, sources: event.sources } : message));
          setSourcesOpen(true);
          return;
        }
        if (event.type === "token") {
          setMessages((current) => current.map((message) => message.id === assistantMessageId ? { ...message, content: `${message.content}${event.content}` } : message));
          return;
        }
        if (event.type === "done") {
          finalAnswer = event.answer;
          setMessages((current) => current.map((message) => message.id === assistantMessageId ? { ...message, content: event.answer, metrics: event.metrics, isStreaming: false } : message));
          return;
        }
        if (event.type === "error") throw new Error(event.detail);
      });

      if (finalAnswer) {
        await addConversationMessage(conversationId, { role: "assistant", content: finalAnswer, model: finalModel || undefined });
      }
      await refreshConversations();
    } catch (requestError) {
      const detail = requestError instanceof Error ? requestError.message : "Não foi possível consultar a IA deste projeto.";
      setError(detail);
      setMessages((current) => current.map((message) => message.id === assistantMessageId ? { ...message, isStreaming: false } : message));
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit() {
    void submitQuestion(question);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleApplyTemplate(template: PromptTemplate) {
    setQuestion(template.content);
    setIsTemplateLibraryOpen(false);
    setError("");
  }

  function handleApplyContentCreatorPrompt(prompt: string) {
    setQuestion(prompt);
    setIsContentCreatorWizardOpen(false);
    setError("");
  }

  async function handleCopy(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1600);
    } catch {
      setError("Não foi possível copiar a resposta.");
    }
  }

  async function handleToggleFavorite(conversation: ConversationListItem) {
    await updateConversation(conversation.id, { is_favorite: !conversation.is_favorite });
    await refreshConversations();
  }

  async function handleRename(conversation: ConversationListItem) {
    const title = window.prompt("Novo título da conversa", conversation.title)?.trim();
    if (!title) return;
    await updateConversation(conversation.id, { title });
    await refreshConversations();
  }

  async function handleDelete(conversation: ConversationListItem) {
    if (!window.confirm(`Excluir a conversa “${conversation.title}”?`)) return;
    await deleteConversation(conversation.id);
    const items = await refreshConversations();
    if (activeConversationId === conversation.id) {
      if (items.length > 0) await openConversation(items[0].id);
      else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  }

  return (
    <DashboardShell>
      <PromptTemplateLibrary projectId={projectId} open={isTemplateLibraryOpen} onClose={() => setIsTemplateLibraryOpen(false)} onApply={handleApplyTemplate} />
      <ContentCreatorWizard open={isContentCreatorWizardOpen} onClose={() => setIsContentCreatorWizardOpen(false)} onApply={handleApplyContentCreatorPrompt} />

      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/projects/${projectId}/documents`} className="text-sm font-medium text-secondary hover:underline">Conhecimento do projeto</Link>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight">AI Workspace</h1>
            <p className="mt-2 text-sm text-muted">Converse com a base de conhecimento do projeto e acompanhe as fontes utilizadas.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-surface px-4 py-2 text-sm text-muted"><Sparkles size={16} className="text-secondary" /> Respostas em tempo real</div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="overflow-hidden rounded-2xl border bg-surface shadow-glow">
            <div className="border-b p-4">
              <button type="button" onClick={() => void handleNewConversation()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white"><MessageSquarePlus size={17} /> Nova conversa</button>
            </div>
            <div className="max-h-[720px] overflow-y-auto p-2">
              {isLoadingConversations ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted"><LoaderCircle className="animate-spin" size={16} /> Carregando</div>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-muted">Nenhuma conversa salva.</p>
              ) : (
                conversations.map((conversation) => (
                  <div key={conversation.id} className={`group mb-1 rounded-xl border px-3 py-3 transition ${conversation.id === activeConversationId ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-elevated"}`}>
                    <button type="button" onClick={() => void openConversation(conversation.id)} className="w-full text-left">
                      <p className="truncate text-sm font-medium">{conversation.title}</p>
                      <p className="mt-1 text-[11px] text-muted">{new Date(conversation.updated_at).toLocaleDateString("pt-BR")}</p>
                    </button>
                    <div className="mt-2 flex items-center gap-1 opacity-70 group-hover:opacity-100">
                      <button type="button" onClick={() => void handleToggleFavorite(conversation)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-surface" aria-label="Favoritar"><Star size={14} className={conversation.is_favorite ? "fill-current text-amber-400" : ""} /></button>
                      <button type="button" onClick={() => void handleRename(conversation)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-surface" aria-label="Renomear"><Pencil size={14} /></button>
                      <button type="button" onClick={() => void handleDelete(conversation)} className="grid h-7 w-7 place-items-center rounded-lg text-red-300 hover:bg-red-400/10" aria-label="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border bg-surface shadow-glow">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-[var(--font-manrope)] text-xl font-bold">{activeConversation?.title ?? "Nova conversa"}</h2>
                  <p className="mt-1 text-xs text-muted">Histórico salvo automaticamente neste projeto.</p>
                </div>
                {latestAssistantMessage?.metrics && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="rounded-lg border bg-elevated px-2.5 py-1.5">Confiança {formatConfidence(latestAssistantMessage.metrics.confidence)}</span>
                    <span className="rounded-lg border bg-elevated px-2.5 py-1.5">{formatDuration(latestAssistantMessage.metrics.total_time_ms)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="grid min-h-[430px] place-items-center text-center">
                  <div className="max-w-md">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-secondary"><Bot size={28} /></div>
                    <h3 className="mt-5 font-[var(--font-manrope)] text-2xl font-bold">Pergunte sobre seus documentos</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">A conversa será salva e poderá ser retomada depois.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-secondary"><Bot size={18} /></div>}
                    <div className={`group max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-gradient-to-r from-primary to-secondary text-white" : "border bg-elevated text-foreground"}`}>
                      {message.role === "assistant" ? (
                        message.content ? <div><MarkdownMessage content={message.content} />{message.isStreaming && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-secondary align-middle" />}</div> : <div className="flex items-center gap-2 text-muted"><LoaderCircle className="animate-spin text-secondary" size={16} /> Buscando fontes e iniciando resposta</div>
                      ) : <p className="whitespace-pre-wrap">{message.content}</p>}
                      {message.role === "assistant" && !message.isStreaming && message.content && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted">
                          <div className="flex flex-wrap items-center gap-2">{message.model && <span>Modelo: {message.model}</span>}{message.metrics && <span>· {formatDuration(message.metrics.total_time_ms)}</span>}{message.metrics && <span>· Confiança {formatConfidence(message.metrics.confidence)}</span>}</div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => void handleCopy(message)} className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface" aria-label="Copiar resposta">{copiedMessageId === message.id ? <Check size={15} /> : <Clipboard size={15} />}</button>
                            {message.question && <button type="button" onClick={() => void submitQuestion(message.question ?? "")} disabled={isLoading} className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface disabled:opacity-50" aria-label="Regenerar resposta"><RotateCcw size={15} /></button>}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-elevated"><User size={18} /></div>}
                  </article>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              {error && <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
              <div className="rounded-2xl border bg-background p-3 focus-within:ring-2 focus-within:ring-primary/30">
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleKeyDown} placeholder="Digite uma pergunta sobre os documentos do projeto..." rows={3} maxLength={2000} disabled={isLoading} className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted disabled:opacity-60" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setIsContentCreatorWizardOpen(true)} disabled={isLoading} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/15 px-3 text-sm font-semibold text-foreground ring-1 ring-primary/30 transition hover:from-primary/30 hover:to-secondary/25 disabled:opacity-50"><Sparkles size={16} className="text-secondary" /> Criador de conteúdo</button>
                    <button type="button" onClick={() => setIsTemplateLibraryOpen(true)} disabled={isLoading} className="flex h-10 items-center gap-2 rounded-xl border bg-elevated px-3 text-sm font-semibold transition hover:bg-surface disabled:opacity-50"><Sparkles size={16} className="text-secondary" /> Templates</button>
                    <p className="text-xs text-muted">Enter envia · Shift+Enter cria uma nova linha</p>
                  </div>
                  <button type="button" onClick={handleSubmit} disabled={isLoading || question.trim().length < 2} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}{isLoading ? "Gerando" : "Enviar"}</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border bg-surface shadow-glow">
            <button type="button" onClick={() => setSourcesOpen((value) => !value)} className="flex w-full items-center justify-between border-b px-5 py-4 text-left xl:cursor-default">
              <div><h2 className="font-[var(--font-manrope)] text-xl font-bold">Fontes</h2><p className="mt-1 text-xs text-muted">Trechos recuperados para a resposta atual.</p></div>
              <span className="xl:hidden">{sourcesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
            </button>
            <div className={sourcesOpen ? "block" : "hidden xl:block"}>
              {latestSources.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-6 text-center"><div><FileText className="mx-auto text-secondary" size={30} /><p className="mt-3 text-sm font-semibold">Nenhuma fonte exibida</p><p className="mt-2 text-xs leading-5 text-muted">Envie uma pergunta para visualizar os documentos e trechos recuperados.</p></div></div>
              ) : (
                <div className="divide-y">
                  {latestSources.map((source, index) => (
                    <article key={source.chunk_id} className="p-5 transition hover:bg-elevated/60">
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{source.document_name}</p><p className="mt-1 text-xs text-muted">Fonte {index + 1} · Chunk {source.chunk_index}</p></div><span className="rounded-lg bg-primary/15 px-2 py-1 font-mono text-[11px] text-secondary">{source.score.toFixed(3)}</span></div>
                      <p className="mt-3 text-xs leading-5 text-muted">{source.snippet}</p>
                      <Link href={`/projects/${projectId}/documents`} className="mt-3 inline-flex text-xs font-medium text-secondary hover:underline">Abrir conhecimento</Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}

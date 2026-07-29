"use client";

import axios from "axios";
import { Bot, FileText, LoaderCircle, Send, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { KeyboardEvent, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { askProject, RagSource } from "@/lib/ai-workspace";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  model?: string;
};

export default function ProjectAiWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const latestSources = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.sources?.length)?.sources ?? [],
    [messages],
  );

  async function handleSubmit() {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isLoading) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: normalizedQuestion },
    ]);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const response = await askProject(projectId, normalizedQuestion);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          model: response.chat_model,
        },
      ]);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.detail ?? "Não foi possível consultar a IA deste projeto.");
      } else {
        setError("Não foi possível consultar a IA deste projeto.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <DashboardShell>
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/projects/${projectId}/documents`} className="text-sm font-medium text-secondary hover:underline">
              Conhecimento do projeto
            </Link>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight">AI Workspace</h1>
            <p className="mt-2 text-sm text-muted">Converse com a base de conhecimento do projeto e acompanhe as fontes utilizadas.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-surface px-4 py-2 text-sm text-muted">
            <Sparkles size={16} className="text-secondary" />
            Chat RAG do projeto
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border bg-surface shadow-glow">
            <div className="border-b px-5 py-4">
              <h2 className="font-[var(--font-manrope)] text-xl font-bold">Chat</h2>
              <p className="mt-1 text-xs text-muted">A conversa é mantida apenas nesta sessão.</p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="grid min-h-[430px] place-items-center text-center">
                  <div className="max-w-md">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-secondary">
                      <Bot size={28} />
                    </div>
                    <h3 className="mt-5 font-[var(--font-manrope)] text-2xl font-bold">Pergunte sobre seus documentos</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      As respostas serão geradas somente com base no conteúdo indexado neste projeto.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-secondary">
                        <Bot size={18} />
                      </div>
                    )}
                    <div
                      className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "border bg-elevated text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === "assistant" && message.model && (
                        <p className="mt-3 border-t pt-2 text-[11px] text-muted">Modelo: {message.model}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-elevated">
                        <User size={18} />
                      </div>
                    )}
                  </article>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <LoaderCircle className="animate-spin text-secondary" size={19} />
                  Consultando documentos e gerando resposta
                </div>
              )}
            </div>

            <div className="border-t p-4">
              {error && <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
              <div className="rounded-2xl border bg-background p-3 focus-within:ring-2 focus-within:ring-primary/30">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma pergunta sobre os documentos do projeto..."
                  rows={3}
                  maxLength={2000}
                  disabled={isLoading}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted disabled:opacity-60"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">Enter envia · Shift+Enter cria uma nova linha</p>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isLoading || question.trim().length < 2}
                    className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border bg-surface shadow-glow">
            <div className="border-b px-5 py-4">
              <h2 className="font-[var(--font-manrope)] text-xl font-bold">Fontes</h2>
              <p className="mt-1 text-xs text-muted">Trechos usados na resposta mais recente.</p>
            </div>

            {latestSources.length === 0 ? (
              <div className="grid min-h-64 place-items-center p-6 text-center">
                <div>
                  <FileText className="mx-auto text-secondary" size={30} />
                  <p className="mt-3 text-sm font-semibold">Nenhuma fonte exibida</p>
                  <p className="mt-2 text-xs leading-5 text-muted">Envie uma pergunta para visualizar os documentos e trechos recuperados.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {latestSources.map((source, index) => (
                  <article key={source.chunk_id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{source.document_name}</p>
                        <p className="mt-1 text-xs text-muted">Fonte {index + 1} · Chunk {source.chunk_index}</p>
                      </div>
                      <span className="rounded-lg bg-primary/15 px-2 py-1 font-mono text-[11px] text-secondary">
                        {source.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted">{source.snippet}</p>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}

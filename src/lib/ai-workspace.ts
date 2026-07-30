import { api, AUTH_EXPIRED_EVENT, TOKEN_KEY } from "@/lib/api";

const RAG_REQUEST_TIMEOUT_MS = 190_000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.jjnetwork.com.br";

export type RagSource = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  score: number;
  snippet: string;
};

export type RagExecutionMetrics = {
  confidence: number;
  retrieved_chunks: number;
  context_size: number;
  search_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
};

export type RagAnswerResponse = {
  project_id: string;
  question: string;
  answer: string;
  chat_provider: string;
  chat_model: string;
  embedding_provider: string;
  embedding_model: string;
  metrics: RagExecutionMetrics;
  sources: RagSource[];
};

export type RagStreamMetadataEvent = {
  type: "metadata";
  project_id: string;
  question: string;
  chat_provider: string;
  chat_model: string;
  embedding_provider: string;
  embedding_model: string;
  sources: RagSource[];
};

export type RagStreamTokenEvent = {
  type: "token";
  content: string;
};

export type RagStreamDoneEvent = {
  type: "done";
  answer: string;
  metrics: RagExecutionMetrics;
};

export type RagStreamErrorEvent = {
  type: "error";
  detail: string;
};

export type RagStreamEvent =
  | RagStreamMetadataEvent
  | RagStreamTokenEvent
  | RagStreamDoneEvent
  | RagStreamErrorEvent;

export async function askProject(projectId: string, question: string) {
  const response = await api.post<RagAnswerResponse>(
    `/api/v1/projects/${projectId}/ask`,
    {
      question,
      top_k: 5,
      min_score: 0.2,
    },
    {
      timeout: RAG_REQUEST_TIMEOUT_MS,
    },
  );

  return response.data;
}

export async function streamProjectAnswer(
  projectId: string,
  question: string,
  conversationId: string | undefined,
  onEvent: (event: RagStreamEvent) => void,
) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question,
      conversation_id: conversationId,
      top_k: 5,
      min_score: 0.2,
    }),
    signal: AbortSignal.timeout(RAG_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }

    let detail = "Não foi possível consultar a IA deste projeto.";
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") detail = payload.detail;
    } catch {
      // Mantém a mensagem padrão quando a resposta não for JSON.
    }
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("A API não retornou um fluxo de resposta.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const normalized = line.trim();
      if (!normalized) continue;
      onEvent(JSON.parse(normalized) as RagStreamEvent);
    }

    if (done) break;
  }

  const remaining = buffer.trim();
  if (remaining) {
    onEvent(JSON.parse(remaining) as RagStreamEvent);
  }
}

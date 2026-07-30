import { api } from "@/lib/api";

const RAG_REQUEST_TIMEOUT_MS = 190_000;

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

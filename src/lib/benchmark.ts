import { api } from "@/lib/api";

export const AI_TASK_OPTIONS = [
  { value: "content_generation", label: "Criação de conteúdo" },
  { value: "rag", label: "RAG e documentos" },
  { value: "coding", label: "Código" },
  { value: "summarization", label: "Resumo" },
  { value: "general", label: "Geral" },
] as const;

export type AITaskType = (typeof AI_TASK_OPTIONS)[number]["value"];

export type BenchmarkScores = {
  hook: number;
  storytelling: number;
  clarity: number;
  originality: number;
  call_to_action: number;
  structure: number;
  overall: number;
};

export type BenchmarkResult = {
  model: string;
  duration_ms: number;
  response: string;
  estimated_tokens: number;
  success: boolean;
  error: string | null;
  scores: BenchmarkScores | null;
};

export type BenchmarkRunResponse = {
  task: AITaskType;
  winner: string | null;
  results: BenchmarkResult[];
};

export type AnalyticsModel = {
  model: string;
  executions: number;
  average_score: number;
  average_duration_ms: number;
  estimated_tokens: number;
};

export type AnalyticsSummary = {
  total_runs: number;
  total_results: number;
  success_rate: number;
  top_model: string | null;
  models: AnalyticsModel[];
  winners: Array<{ model: string; wins: number }>;
};

export async function runBenchmark(payload: {
  task: AITaskType;
  system_prompt: string;
  prompt: string;
  models: string[];
}): Promise<BenchmarkRunResponse> {
  const { data } = await api.post<BenchmarkRunResponse>("/api/v1/benchmark/run", payload, {
    timeout: 600_000,
  });
  return data;
}

export async function getAnalyticsSummary(task?: AITaskType): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/api/v1/analytics/summary", {
    params: task ? { task } : undefined,
  });
  return data;
}

import { api } from "@/lib/api";

export type RagSource = {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  score: number;
  snippet: string;
};

export type RagAnswerResponse = {
  project_id: string;
  question: string;
  answer: string;
  chat_provider: string;
  chat_model: string;
  embedding_provider: string;
  embedding_model: string;
  sources: RagSource[];
};

export async function askProject(projectId: string, question: string) {
  const response = await api.post<RagAnswerResponse>(`/api/v1/projects/${projectId}/ask`, {
    question,
    top_k: 5,
    min_score: 0.2,
  });

  return response.data;
}

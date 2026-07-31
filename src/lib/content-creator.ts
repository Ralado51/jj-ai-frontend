import { api } from "@/lib/api";

export type ContentCreatorBriefing = {
  tema: string;
  publico: string;
  plataforma: string;
  objetivo: string;
  formato: string;
  tom: string;
  duracao: string;
  cta: string;
};

export type ContentValidation = {
  is_valid: boolean;
  issues: string[];
};

export type PromptEvaluationScores = {
  hook: number;
  storytelling: number;
  clarity: number;
  originality: number;
  call_to_action: number;
  structure: number;
  overall: number;
};

export type PromptEvaluation = {
  scores: PromptEvaluationScores;
  issues: string[];
  strengths: string[];
  passed: boolean;
};

export type ContentCreatorResponse = {
  content: string;
  provider: string;
  model: string;
  refined: boolean;
  validation: ContentValidation;
  evaluation: PromptEvaluation;
};

export async function generateContent(
  projectId: string,
  briefing: ContentCreatorBriefing,
): Promise<ContentCreatorResponse> {
  const response = await api.post<ContentCreatorResponse>(
    `/api/v1/projects/${projectId}/apps/content-creator/generate`,
    briefing,
    { timeout: 600_000 },
  );

  return response.data;
}

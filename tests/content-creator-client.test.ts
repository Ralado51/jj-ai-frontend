import { describe, expect, it, vi } from "vitest";

import { generateContent } from "@/lib/content-creator";

const { apiPost } = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: apiPost,
  },
}));

describe("content creator client", () => {
  it("posts a structured briefing and returns quality metrics", async () => {
    const briefing = {
      tema: "Guard-rails em IA",
      publico: "Leigos e profissionais de TI",
      plataforma: "TikTok",
      objetivo: "Explicar o conceito",
      formato: "Vídeo curto",
      tom: "Educativo",
      duracao: "30 segundos",
      cta: "Comente guard-rails",
    };
    const response = {
      content: "Conteúdo final",
      provider: "ollama",
      model: "qwen2.5:3b",
      refined: true,
      validation: { is_valid: true, issues: [] },
      evaluation: {
        scores: {
          hook: 8,
          storytelling: 8,
          clarity: 9,
          originality: 8,
          call_to_action: 9,
          structure: 10,
          overall: 8.67,
        },
        issues: [],
        strengths: ["Estrutura completa"],
        passed: true,
      },
    };
    apiPost.mockResolvedValueOnce({ data: response });

    await expect(generateContent("project-1", briefing)).resolves.toEqual(response);
    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/projects/project-1/apps/content-creator/generate",
      briefing,
      { timeout: 600_000 },
    );
  });
});

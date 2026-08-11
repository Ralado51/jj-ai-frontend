import { api } from "@/lib/api";

export type ImageProvider = "huggingface" | "google";

export type ImageGenerationPayload = {
  provider: ImageProvider;
  model?: string | null;
  prompt: string;
  width?: number;
  height?: number;
  seed?: number | null;
};

export type ImageGenerationResponse = {
  provider: ImageProvider;
  model: string;
  mime_type: string;
  image_base64: string;
  seed: number | null;
  latency_ms: number;
};

export type BatchImageItem = {
  id: string;
  prompt: string;
  model?: string | null;
  width?: number;
  height?: number;
  seed?: number | null;
};

export type BatchImageGenerationResponse = {
  provider: ImageProvider;
  total: number;
  completed: number;
  failed: number;
  results: Array<{
    id: string;
    status: "completed" | "failed";
    image: ImageGenerationResponse | null;
    error: string | null;
  }>;
};

export async function generateImage(payload: ImageGenerationPayload) {
  const response = await api.post<ImageGenerationResponse>("/api/v1/images/generate", payload, {
    timeout: 180000,
  });
  return response.data;
}

export async function generateImagesBatch(provider: ImageProvider, items: BatchImageItem[]) {
  const response = await api.post<BatchImageGenerationResponse>(
    "/api/v1/images/generate/batch",
    { provider, items },
    { timeout: 600000 },
  );
  return response.data;
}

export function imageDataUrl(image: ImageGenerationResponse) {
  return `data:${image.mime_type};base64,${image.image_base64}`;
}

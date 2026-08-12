import { api } from "@/lib/api";

export type ImageJobStatus = "pending" | "processing" | "generated" | "approved" | "rejected" | "failed";
export type ImageJobReviewAction = "approve" | "reject" | "regenerate";

export type ImageJob = {
  id: string;
  owner_id: string;
  project_id: string;
  external_id: string | null;
  provider: string;
  model: string;
  prompt: string;
  width: number;
  height: number;
  seed: number | null;
  status: ImageJobStatus;
  worker_id: string | null;
  asset_id: string | null;
  asset_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ImageJobCreate = {
  project_id: string;
  external_id?: string | null;
  provider?: string;
  model?: string;
  prompt: string;
  width?: number;
  height?: number;
  seed?: number | null;
};

export type ImageJobBatchResponse = {
  total: number;
  jobs: ImageJob[];
};

export async function createImageJob(payload: ImageJobCreate) {
  const response = await api.post<ImageJob>("/api/v1/images/jobs", payload);
  return response.data;
}

export async function createImageJobsBatch(items: ImageJobCreate[]) {
  const response = await api.post<ImageJobBatchResponse>("/api/v1/images/jobs/batch", { items });
  return response.data;
}

export async function listImageJobs(status?: ImageJobStatus) {
  const response = await api.get<ImageJob[]>("/api/v1/images/jobs", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function reviewImageJob(jobId: string, action: ImageJobReviewAction) {
  const response = await api.post<ImageJob>(`/api/v1/images/jobs/${jobId}/review`, { action });
  return response.data;
}

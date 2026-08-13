import { api } from "@/lib/api";

export type ImageWorkerOperational = {
  id: string;
  name: string;
  runtime: string;
  model: string;
  status: string;
  effective_status: "online" | "offline";
  is_online: boolean;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type ImageWorkerManagementSummary = {
  total_workers: number;
  online_workers: number;
  offline_workers: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  workers: ImageWorkerOperational[];
};

export async function getImageWorkerManagement(): Promise<ImageWorkerManagementSummary> {
  const { data } = await api.get<ImageWorkerManagementSummary>("/api/v1/image-workers");
  return data;
}

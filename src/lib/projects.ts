import { api } from "@/lib/api";

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectPayload = {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  settings?: Record<string, unknown>;
};

export async function listProjects(params?: {
  search?: string;
  is_active?: boolean;
  offset?: number;
  limit?: number;
}): Promise<Project[]> {
  const response = await api.get<Project[]>("/api/v1/projects", { params });
  return response.data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const response = await api.post<Project>("/api/v1/projects", payload);
  return response.data;
}

export async function archiveProject(projectId: string): Promise<Project> {
  const response = await api.delete<Project>(`/api/v1/projects/${projectId}`);
  return response.data;
}

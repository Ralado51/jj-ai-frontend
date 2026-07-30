import { api } from "@/lib/api";

export type PromptTemplate = {
  id: string;
  project_id: string | null;
  owner_id: string | null;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_public: boolean;
  is_favorite: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PromptTemplateFilters = {
  projectId?: string;
  category?: string;
  favorite?: boolean;
  search?: string;
  includeInactive?: boolean;
  offset?: number;
  limit?: number;
};

export async function listPromptTemplates(filters: PromptTemplateFilters = {}) {
  const response = await api.get<PromptTemplate[]>("/api/v1/prompt-templates", {
    params: {
      project_id: filters.projectId,
      category: filters.category,
      favorite: filters.favorite,
      search: filters.search,
      include_inactive: filters.includeInactive,
      offset: filters.offset,
      limit: filters.limit ?? 100,
    },
  });
  return response.data;
}

export async function updatePromptTemplate(
  templateId: string,
  data: Partial<Pick<PromptTemplate, "is_favorite" | "is_active">>,
) {
  const response = await api.patch<PromptTemplate>(
    `/api/v1/prompt-templates/${templateId}`,
    data,
  );
  return response.data;
}

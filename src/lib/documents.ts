import { api } from "@/lib/api";

export type DocumentAsset = {
  id: string;
  project_id: string;
  asset_type: string;
  name: string;
  description: string | null;
  storage_provider: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  asset_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  items: DocumentAsset[];
  total: number;
  offset: number;
  limit: number;
};

export type DocumentDownloadResponse = {
  document_id: string;
  filename: string;
  url: string;
  expires_in: number;
};

export async function listDocuments(
  projectId: string,
  params?: { offset?: number; limit?: number },
): Promise<DocumentListResponse> {
  const response = await api.get<DocumentListResponse>(
    `/api/v1/projects/${projectId}/documents`,
    { params },
  );
  return response.data;
}

export async function uploadDocument(
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<DocumentAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<DocumentAsset>(
    `/api/v1/projects/${projectId}/documents`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total || !onProgress) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    },
  );

  return response.data;
}

export async function getDocumentDownload(
  documentId: string,
): Promise<DocumentDownloadResponse> {
  const response = await api.get<DocumentDownloadResponse>(
    `/api/v1/documents/${documentId}/download`,
  );
  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/api/v1/documents/${documentId}`);
}

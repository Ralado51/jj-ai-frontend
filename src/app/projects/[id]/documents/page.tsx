"use client";

import axios from "axios";
import {
  Bot,
  Download,
  File,
  FileArchive,
  FileImage,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  deleteDocument,
  DocumentAsset,
  getDocumentDownload,
  listDocuments,
  uploadDocument,
} from "@/lib/documents";
import { useAuth } from "@/providers/auth-provider";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatBytes(value: number | null) {
  if (!value) return "Tamanho indisponível";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function DocumentIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith("image/")) return <FileImage size={20} />;
  if (mimeType?.includes("zip") || mimeType?.includes("compressed")) return <FileArchive size={20} />;
  if (mimeType?.includes("pdf") || mimeType?.startsWith("text/")) return <FileText size={20} />;
  return <File size={20} />;
}

export default function ProjectDocumentsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage = user?.role === "admin" || user?.role === "member";
  const totalSize = useMemo(
    () => documents.reduce((sum, document) => sum + (document.size_bytes ?? 0), 0),
    [documents],
  );

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await listDocuments(projectId, { limit: 100 });
      setDocuments(response.items);
    } catch {
      setError("Não foi possível carregar os documentos deste projeto.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(file: File) {
    setError("");
    setSuccess("");

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo excede o limite de 50 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await uploadDocument(projectId, file, setUploadProgress);
      setSuccess(`Documento “${file.name}” enviado com sucesso.`);
      await loadDocuments();
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 413) {
        setError("O arquivo é maior que o limite aceito pelo servidor.");
      } else {
        setError("Não foi possível enviar o documento.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleUpload(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleUpload(file);
  }

  async function handleDownload(document: DocumentAsset) {
    setBusyDocumentId(document.id);
    setError("");
    try {
      const download = await getDocumentDownload(document.id);
      window.open(download.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Não foi possível gerar o link de download.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function handleDelete(document: DocumentAsset) {
    if (!window.confirm(`Excluir permanentemente o documento “${document.name}”?`)) return;

    setBusyDocumentId(document.id);
    setError("");
    setSuccess("");
    try {
      await deleteDocument(document.id);
      setSuccess("Documento excluído com sucesso.");
      await loadDocuments();
    } catch {
      setError("Não foi possível excluir o documento.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  return (
    <DashboardShell>
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/projects" className="text-sm font-medium text-secondary hover:underline">
              Projetos
            </Link>
            <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight">Documentos do projeto</h1>
            <p className="mt-2 text-sm text-muted">Envie, consulte, baixe e remova arquivos vinculados a este projeto.</p>
          </div>
          <Link
            href={`/projects/${projectId}/ai`}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Bot size={17} />
            Abrir AI Workspace
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border bg-surface p-5 shadow-glow">
            <p className="text-sm text-muted">Documentos</p>
            <p className="mt-2 font-[var(--font-manrope)] text-3xl font-bold">{documents.length}</p>
          </article>
          <article className="rounded-xl border bg-surface p-5 shadow-glow">
            <p className="text-sm text-muted">Armazenamento exibido</p>
            <p className="mt-2 font-[var(--font-manrope)] text-3xl font-bold">{formatBytes(totalSize)}</p>
          </article>
        </div>

        {canManage && (
          <label
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragging ? "border-secondary bg-secondary/10" : "border-primary/30 bg-surface hover:border-primary/60"
            } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
          >
            <input type="file" className="hidden" onChange={handleFileInput} disabled={isUploading} />
            <UploadCloud className="mx-auto text-secondary" size={36} />
            <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-bold">
              {isUploading ? "Enviando documento" : "Arraste um arquivo ou clique para selecionar"}
            </h2>
            <p className="mt-2 text-sm text-muted">Limite de 50 MB por envio.</p>
            {isUploading && (
              <div className="mx-auto mt-5 max-w-md">
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{uploadProgress}%</p>
              </div>
            )}
          </label>
        )}

        {error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

        <section className="overflow-hidden rounded-2xl border bg-surface shadow-glow">
          <div className="border-b px-5 py-4">
            <h2 className="font-[var(--font-manrope)] text-xl font-bold">Arquivos</h2>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted">
              <LoaderCircle className="animate-spin" size={20} /> Carregando documentos
            </div>
          ) : documents.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <FileText className="mx-auto text-secondary" size={34} />
                <h3 className="mt-4 font-[var(--font-manrope)] text-xl font-bold">Nenhum documento enviado</h3>
                <p className="mt-2 text-sm text-muted">Use a área de upload para adicionar o primeiro arquivo.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((document) => {
                const isBusy = busyDocumentId === document.id;
                return (
                  <article key={document.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-secondary">
                      <DocumentIcon mimeType={document.mime_type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{document.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {document.mime_type ?? "Tipo desconhecido"} · {formatBytes(document.size_bytes)} · {new Date(document.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDownload(document)}
                        disabled={isBusy}
                        className="flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:bg-elevated disabled:opacity-50"
                      >
                        {isBusy ? <LoaderCircle className="animate-spin" size={16} /> : <Download size={16} />}
                        Download
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(document)}
                          disabled={isBusy}
                          className="grid h-10 w-10 place-items-center rounded-xl border text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                          aria-label={`Excluir ${document.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </DashboardShell>
  );
}

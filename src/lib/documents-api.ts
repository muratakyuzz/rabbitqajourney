import { delay, documents, nextId, nowIso } from "@/lib/mock-store";
import { seedAuthUsers } from "@/lib/mock-store";

export interface DocumentItem {
  id: string;
  fileName: string;
  description?: string | null;
  storageKey: string;
  contentType?: string | null;
  fileSizeBytes?: number | null;
  downloadUrl?: string;
  expiresInSeconds?: number;
  uploadedByUserId: string;
  uploadedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput { fileName: string; storageKey: string; partnerId?: string; }
export interface RequestDocumentUploadUrlInput { fileName: string; contentType?: string; partnerId?: string; }
export interface RequestDocumentUploadUrlResult { uploadUrl: string; storageKey: string; fileName: string; expiresInSeconds: number; }
export interface DeleteDocumentResult { id: string; deleted: true; }
export interface ListDocumentsInput { partnerId?: string; }
export interface UploadDocumentViaProxyInput { partnerId?: string; fileName?: string; description?: string; }

function normalizeStorageKey(storageKey: string) {
  const trimmed = storageKey.trim().replace(/\\/g, "/");
  const s3UriMatch = trimmed.match(/^s3:\/\/[^/]+\/(.+)$/i);
  return (s3UriMatch ? s3UriMatch[1] : trimmed).replace(/^\/+/, "");
}

export function isPartnerScopedStorageKey(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);
  return /^partners\/[^/]+\/documents\//i.test(normalized) || /^documents\/partners\/[^/]+\//i.test(normalized);
}

export function isStorageKeyForPartner(storageKey: string, partnerId: string) {
  const normalized = normalizeStorageKey(storageKey);
  return normalized.startsWith(`partners/${partnerId}/documents/`) || normalized.startsWith(`documents/partners/${partnerId}/`);
}

function userFromToken(token: string) {
  const id = token.replace(/^mock-token::/, "");
  return seedAuthUsers.find((x) => x.id === id);
}

export async function listDocuments(_token: string, input?: ListDocumentsInput) {
  await delay();
  if (input?.partnerId) {
    return documents.filter((d) => isStorageKeyForPartner(d.storageKey, input.partnerId!));
  }
  return [...documents];
}

export async function createDocument(token: string, input: CreateDocumentInput) {
  await delay();
  const u = userFromToken(token);
  const item: DocumentItem = {
    id: nextId("doc"),
    fileName: input.fileName,
    description: null,
    storageKey: input.storageKey,
    contentType: null,
    fileSizeBytes: 0,
    uploadedByUserId: u?.id ?? "u-admin-1",
    uploadedByEmail: u?.email ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  documents.unshift(item);
  return item;
}

export async function requestDocumentUploadUrl(_token: string, input: RequestDocumentUploadUrlInput) {
  await delay();
  const safeName = input.fileName.replace(/\s+/g, "-").toLowerCase();
  const key = input.partnerId
    ? `partners/${input.partnerId}/documents/${Date.now()}-${safeName}`
    : `documents/${Date.now()}-${safeName}`;
  return {
    uploadUrl: `https://mock.local/upload/${key}`,
    storageKey: key,
    fileName: input.fileName,
    expiresInSeconds: 600,
  } as RequestDocumentUploadUrlResult;
}

export async function uploadDocumentViaProxy(token: string, file: File, input?: UploadDocumentViaProxyInput) {
  await delay(300);
  const u = userFromToken(token);
  const fileName = input?.fileName?.trim() || file.name;
  const safeName = fileName.replace(/\s+/g, "-").toLowerCase();
  const storageKey = input?.partnerId
    ? `partners/${input.partnerId}/documents/${Date.now()}-${safeName}`
    : `documents/${Date.now()}-${safeName}`;

  const item: DocumentItem = {
    id: nextId("doc"),
    fileName,
    description: input?.description ?? null,
    storageKey,
    contentType: file.type || "application/octet-stream",
    fileSizeBytes: file.size,
    uploadedByUserId: u?.id ?? "u-admin-1",
    uploadedByEmail: u?.email ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  documents.unshift(item);
  return item;
}

export async function getDocumentDownloadMetadata(_token: string, documentId: string) {
  await delay();
  const d = documents.find((x) => x.id === documentId);
  if (!d) throw new Error("Document not found");
  return { ...d, downloadUrl: `https://mock.local/download/${encodeURIComponent(d.storageKey)}`, expiresInSeconds: 600 };
}

export async function deleteDocument(_token: string, documentId: string) {
  await delay();
  const idx = documents.findIndex((x) => x.id === documentId);
  if (idx < 0) throw new Error("Document not found");
  documents.splice(idx, 1);
  return { id: documentId, deleted: true as const };
}

function extensionFromFileName(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const extension = normalized.split(".").pop();
  if (!extension || extension === normalized) return null;
  return extension;
}

export function getDocumentTypeLabel(document: Pick<DocumentItem, "fileName" | "contentType">) {
  const normalizedContentType = document.contentType?.trim().toLowerCase() || "";
  if (normalizedContentType === "application/pdf") return "PDF";
  if (normalizedContentType.startsWith("video/")) return "Video";
  if (normalizedContentType.startsWith("image/")) return "Image";
  if (normalizedContentType.startsWith("text/")) return "Text";
  if (normalizedContentType === "application/vnd.ms-powerpoint" || normalizedContentType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "PowerPoint";
  if (normalizedContentType === "application/msword" || normalizedContentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "Word";
  if (normalizedContentType === "application/vnd.ms-excel" || normalizedContentType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "Excel";
  if (normalizedContentType === "application/zip" || normalizedContentType === "application/x-zip-compressed") return "ZIP";
  const extension = extensionFromFileName(document.fileName);
  if (!extension) return "Other";
  if (extension === "pdf") return "PDF";
  if (["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(extension)) return "Video";
  if (["ppt", "pptx"].includes(extension)) return "PowerPoint";
  if (["doc", "docx"].includes(extension)) return "Word";
  if (["xls", "xlsx", "csv"].includes(extension)) return "Excel";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return "Image";
  if (["txt", "md", "rtf"].includes(extension)) return "Text";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "Archive";
  return extension.toUpperCase();
}

export function formatDocumentSizeMb(fileSizeBytes?: number | null) {
  if (typeof fileSizeBytes !== "number" || !Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) return "—";
  const megabytes = fileSizeBytes / (1024 * 1024);
  const decimals = megabytes >= 100 ? 0 : megabytes >= 10 ? 1 : 2;
  return `${megabytes.toFixed(decimals)} MB`;
}

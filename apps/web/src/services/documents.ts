import {
  apiRequest
} from "./api";

import type {
  DocumentFormOptions,
  DocumentPriority,
  DocumentRecord
} from "../types/document";

interface DocumentsResponse {
  ok: boolean;

  data:
    DocumentRecord[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDocuments(
  options: {
    search?: string;
    status?: string;
    priority?: string;
    caseId?: string;
    page?: number;
  } = {}
) {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    options.search || ""
  );

  params.set(
    "status",
    options.status || "ALL"
  );

  params.set(
    "priority",
    options.priority || "ALL"
  );

  params.set(
    "caseId",
    options.caseId || ""
  );

  params.set(
    "page",
    String(
      options.page || 1
    )
  );

  params.set(
    "limit",
    "10"
  );

  return apiRequest<DocumentsResponse>(
    `/api/documents?${params.toString()}`
  );
}

export async function getDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    data: DocumentRecord;
  }>(
    `/api/documents/${id}`
  );
}

export async function getDocumentFormOptions() {
  return apiRequest<{
    ok: boolean;
    data: DocumentFormOptions;
  }>(
    "/api/documents/form-options"
  );
}

export async function createDocument(
  data: {
    caseId: string;
    documentTypeId: string;
    assignedUserId: string;
    fileName: string;
    dueDate: string;
    priority: DocumentPriority;
    notes: string;
  }
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    "/api/documents",
    {
      method: "POST",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function updateDocument(
  id: string,
  data: {
    caseId: string;
    documentTypeId: string;
    assignedUserId: string;
    fileName: string;
    dueDate: string;
    priority: DocumentPriority;
    notes: string;
  }
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function startDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}/start`,
    {
      method: "POST"
    }
  );
}

export async function completeDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}/complete`,
    {
      method: "POST"
    }
  );
}

export async function reopenDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}/reopen`,
    {
      method: "POST"
    }
  );
}

export async function cancelDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}/cancel`,
    {
      method: "POST"
    }
  );
}

export async function deleteDocument(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/documents/${id}`,
    {
      method: "DELETE"
    }
  );
}
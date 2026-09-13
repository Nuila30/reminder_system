import {
  apiRequest
} from "./api";

import type {
  CasePagination,
  CaseRecord,
  CaseStatus
} from "../types/case";

interface CasesResponse {
  ok: boolean;

  data:
    CaseRecord[];

  pagination:
    CasePagination;
}

interface CaseResponse {
  ok: boolean;
  message: string;
  data: CaseRecord;
}

export async function getCases(
  clientId: string,
  search = "",
  status = "ALL",
  page = 1
) {
  const params =
    new URLSearchParams();

  params.set(
    "clientId",
    clientId
  );

  params.set(
    "search",
    search
  );

  params.set(
    "status",
    status
  );

  params.set(
    "page",
    String(page)
  );

  params.set(
    "limit",
    "10"
  );

  return apiRequest<CasesResponse>(
    `/api/cases?${params.toString()}`
  );
}

export async function createCase(
  data: {
    clientId: string;
    caseNumber: string;
    description: string;
  }
) {
  return apiRequest<CaseResponse>(
    "/api/cases",
    {
      method: "POST",

      body:
        JSON.stringify(data)
    }
  );
}

export async function updateCase(
  id: string,
  data: {
    caseNumber?: string;
    description?: string;
    status?: CaseStatus;
  }
) {
  return apiRequest<CaseResponse>(
    `/api/cases/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(data)
    }
  );
}

export async function deleteCase(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/cases/${id}`,
    {
      method: "DELETE"
    }
  );
}
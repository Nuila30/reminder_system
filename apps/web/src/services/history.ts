import {
  apiRequest
} from "./api";

import type {
  HistoryResponse
} from "../types/history";

export interface HistoryFilters {
  clientId?:
    string;

  status?:
    string;

  priority?:
    string;

  userId?:
    string;

  dateFrom?:
    string;

  dateTo?:
    string;

  page?:
    number;

  limit?:
    number;
}

export async function getHistory(
  filters:
    HistoryFilters = {}
) {
  const params =
    new URLSearchParams();

  params.set(
    "clientId",
    filters.clientId ||
      ""
  );

  params.set(
    "status",
    filters.status ||
      "ALL"
  );

  params.set(
    "priority",
    filters.priority ||
      "ALL"
  );

  params.set(
    "userId",
    filters.userId ||
      ""
  );

  params.set(
    "dateFrom",
    filters.dateFrom ||
      ""
  );

  params.set(
    "dateTo",
    filters.dateTo ||
      ""
  );

  params.set(
    "page",
    String(
      filters.page ||
      1
    )
  );

  params.set(
    "limit",
    String(
      filters.limit ||
      20
    )
  );

  return apiRequest<HistoryResponse>(
    `/api/history?${params.toString()}`
  );
}
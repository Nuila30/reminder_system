import {
  apiRequest
} from "./api";

import type {
  CalendarEvent
} from "../types/calendar";

export interface CalendarStats {
  total: number;
  pending: number;
  critical: number;
  failed: number;
}

export interface CalendarResponsible {
  id: string;
  full_name: string;
  email: string;
}

export interface CalendarDocumentOption {
  id: string;

  file_name: string;

  due_date: string;

  priority:
    "LOW" |
    "MEDIUM" |
    "HIGH" |
    "CRITICAL";

  status:
    string;

  case_number:
    string | null;

  client_name:
    string | null;
}

export interface CalendarResponse {
  ok: boolean;

  data:
    CalendarEvent[];

  stats:
    CalendarStats;

  options: {
    users:
      CalendarResponsible[];

    documents:
      CalendarDocumentOption[];
  };
}

interface CalendarFilters {
  status?: string;

  priority?: string;

  assignedUserId?: string;
}

export async function getCalendarEvents(
  start: string,
  end: string,
  filters:
    CalendarFilters = {}
) {
  const params =
    new URLSearchParams();

  params.set(
    "start",
    start
  );

  params.set(
    "end",
    end
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
    "assignedUserId",
    filters.assignedUserId ||
      ""
  );

  return apiRequest<CalendarResponse>(
    `/api/calendar?${params.toString()}`
  );
}
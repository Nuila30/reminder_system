import type {
  DocumentPriority
} from "./document";

export type HistorySource =
  | "DOCUMENT"
  | "REMINDER"
  | "STATUS"
  | "NOTIFICATION";

export interface HistoryRecord {
  id: string;

  source:
    HistorySource;

  action:
    string;

  event_at:
    string;

  document_id:
    string;

  document_name:
    string;

  priority:
    DocumentPriority;

  status:
    string | null;

  client_id:
    string | null;

  client_name:
    string | null;

  case_number:
    string | null;

  user_id:
    string | null;

  user_name:
    string | null;

  channel:
    string | null;

  delivery_status:
    string | null;

  details:
    Record<
      string,
      unknown
    > | null;
}

export interface HistoryStats {
  successful:
    number;

  failed:
    number;

  cancelled:
    number;

  scheduled:
    number;
}

export interface HistoryClientOption {
  id:
    string;

  name:
    string;
}

export interface HistoryUserOption {
  id:
    string;

  full_name:
    string;

  email:
    string;
}

export interface HistoryResponse {
  ok:
    boolean;

  data:
    HistoryRecord[];

  pagination: {
    page:
      number;

    limit:
      number;

    total:
      number;

    totalPages:
      number;
  };

  stats:
    HistoryStats;

  options: {
    clients:
      HistoryClientOption[];

    users:
      HistoryUserOption[];
  };
}
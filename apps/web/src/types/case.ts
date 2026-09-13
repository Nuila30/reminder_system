export type CaseStatus =
  | "ACTIVE"
  | "ARCHIVED";

export interface CaseRecord {
  id: string;

  client_id: string;

  client_name: string;

  case_number: string;

  description:
    string | null;

  status:
    CaseStatus;

  documents_count:
    number;

  created_by_name:
    string | null;

  created_at:
    string;

  updated_at:
    string;
}

export interface CasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export type ClientStatus =
  | "ACTIVE"
  | "ARCHIVED";

export interface Client {
  id: string;

  name: string;

  status:
    ClientStatus;

  cases_count: number;

  created_by_name:
    string | null;

  created_at:
    string;

  updated_at:
    string;
}

export interface ClientPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
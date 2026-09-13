export type DocumentPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DocumentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface DocumentRecord {
  id: string;

  case_id: string;

  document_type_id: string;

  assigned_user_id: string;

  file_name: string;

  due_date: string;

  priority:
    DocumentPriority;

  status:
    DocumentStatus;

  notes:
    string | null;

  completed_at:
    string | null;

  case_number:
    string;

  client_id:
    string;

  client_name:
    string;

  document_type_name:
    string;

  assigned_user_name:
    string;

  created_by_name:
    string | null;

  reminders_count:
    number;

  created_at:
    string;

  updated_at:
    string;
}

export interface DocumentFormOptions {
  documentTypes: Array<{
    id: string;
    name: string;
  }>;

  users: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
  }>;

  clients: Array<{
    id: string;
    name: string;
  }>;
}
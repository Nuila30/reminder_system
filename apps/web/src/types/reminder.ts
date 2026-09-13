export type NotificationType =
  | "EMAIL"
  | "WHATSAPP"
  | "BOTH";

export type RecurrenceType =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "CUSTOM";

export type ReminderStatus =
  | "SCHEDULED"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "CANCELLED";

export interface ReminderRecord {
  id: string;

  document_id: string;

  reminder_at: string;

  notification_type:
    NotificationType;

  email_to:
    string | null;

  whatsapp_to:
    string | null;

  recurrence_type:
    RecurrenceType;

  recurrence_interval:
    number | null;

  status:
    ReminderStatus;

  retry_count: number;

  max_retries: number;

  last_attempt_at:
    string | null;

  sent_at:
    string | null;

  error_message:
    string | null;

  created_at: string;

  updated_at: string;

  file_name: string;

  due_date: string;

  priority: string;

  document_status:
    string;

  case_number:
    string | null;

  client_name:
    string | null;

  document_type_name:
    string | null;

  created_by_name:
    string | null;
}

export interface CreateReminderData {
  documentId: string;

  reminderAt: string;

  notificationType:
    NotificationType;

  emailTo: string;

  whatsappTo: string;

  recurrenceType:
    RecurrenceType;

  recurrenceInterval:
    number | null;
}

export interface UpdateReminderData {
  reminderAt?: string;

  notificationType?:
    NotificationType;

  emailTo?: string;

  whatsappTo?: string;

  recurrenceType?:
    RecurrenceType;

  recurrenceInterval?:
    number | null;
}

export interface ReminderResponse {
  ok: boolean;

  message?: string;

  data:
    ReminderRecord;
}

export interface RemindersResponse {
  ok: boolean;

  data:
    ReminderRecord[];
}
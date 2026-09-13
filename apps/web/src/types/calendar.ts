import type {
  DocumentPriority,
  DocumentStatus
} from "./document";

import type {
  NotificationType,
  RecurrenceType,
  ReminderStatus
} from "./reminder";

export interface CalendarEvent {
  id: string;

  document_id: string;

  reminder_at: string;

  notification_type:
    NotificationType;

  recurrence_type:
    RecurrenceType;

  recurrence_interval:
    number | null;

  status:
    ReminderStatus;

  email_to:
    string | null;

  whatsapp_to:
    string | null;

  retry_count:
    number;

  max_retries:
    number;

  file_name:
    string;

  due_date:
    string;

  priority:
    DocumentPriority;

  document_status:
    DocumentStatus;

  assigned_user_id:
    string | null;

  case_number:
    string | null;

  client_name:
    string | null;

  document_type_name:
    string | null;

  responsible_name:
    string | null;
}
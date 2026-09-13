import {
  apiRequest
} from "./api";

import type {
  CreateReminderData,
  ReminderRecord,
  RemindersResponse,
  UpdateReminderData
} from "../types/reminder";

export async function getReminders(
  documentId = "",
  status = "ALL"
) {
  const params =
    new URLSearchParams();

  params.set(
    "documentId",
    documentId
  );

  params.set(
    "status",
    status
  );

  return apiRequest<RemindersResponse>(
    `/api/reminders?${params.toString()}`
  );
}

export async function getReminder(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    data: ReminderRecord;
  }>(
    `/api/reminders/${id}`
  );
}

export async function createReminder(
  data:
    CreateReminderData
) {
  return apiRequest<{
    ok: boolean;
    message: string;
    data?: ReminderRecord;
  }>(
    "/api/reminders",
    {
      method: "POST",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function updateReminder(
  id: string,
  data:
    UpdateReminderData
) {
  return apiRequest<{
    ok: boolean;
    message: string;
    data?: ReminderRecord;
  }>(
    `/api/reminders/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function cancelReminder(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/reminders/${id}/cancel`,
    {
      method: "POST"
    }
  );
}

export async function reactivateReminder(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/reminders/${id}/reactivate`,
    {
      method: "POST"
    }
  );
}

export async function deleteReminder(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/reminders/${id}`,
    {
      method: "DELETE"
    }
  );
}
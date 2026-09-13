import {
  sql
} from "../config/db.js";

import {
  buildReminderMessage
} from "./notifications/message-builder.js";

import {
  sendEmailNotification
} from "./notifications/email.service.js";

import {
  sendWhatsAppNotification
} from "./notifications/whatsapp.service.js";

type NotificationChannel =
  | "EMAIL"
  | "WHATSAPP";

type NotificationType =
  | "EMAIL"
  | "WHATSAPP"
  | "BOTH";

type RecurrenceType =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "CUSTOM";

type ExecutionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PARTIAL"
  | "SENT"
  | "FAILED";

interface ExecutionRow {
  id: string;

  reminder_id:
    string;

  scheduled_for:
    string;

  status:
    ExecutionStatus;

  attempt_count:
    number;
}

interface ReminderData {
  reminder_id:
    string;

  execution_id:
    string;

  scheduled_for:
    string;

  attempt_count:
    number;

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

  max_retries:
    number;

  document_id:
    string;

  file_name:
    string;

  due_date:
    string;

  priority:
    string;

  document_status:
    string;

  case_number:
    string | null;

  client_name:
    string | null;

  document_type_name:
    string | null;

  responsible_name:
    string | null;
}

function nextRecurringDate(
  value:
    string,

  type:
    Exclude<
      RecurrenceType,
      "NONE"
    >,

  interval:
    number | null
) {
  const date =
    new Date(
      value
    );

  if (
    type ===
    "DAILY"
  ) {
    date.setDate(
      date.getDate() +
      1
    );

  } else if (
    type ===
    "WEEKLY"
  ) {
    date.setDate(
      date.getDate() +
      7
    );

  } else {
    date.setDate(
      date.getDate() +
      (
        interval &&
        interval > 0
          ? interval
          : 1
      )
    );
  }

  return date;
}

function retryDate(
  attempt:
    number
) {
  const minutes =
    attempt <= 1
      ? 5
      : 15;

  return new Date(
    Date.now() +
    minutes *
    60000
  );
}

async function generateExecutions() {
  const reminders =
    await sql`
      SELECT
        id,
        reminder_at

      FROM reminders

      WHERE
        status =
          'SCHEDULED'

        AND

        reminder_at <=
          NOW()

      ORDER BY
        reminder_at ASC

      LIMIT 100
    `;

  for (
    const reminder of
    reminders
  ) {
    await sql`
      INSERT INTO reminder_executions (
        reminder_id,
        scheduled_for,
        status,
        attempt_count,
        next_attempt_at
      )
      VALUES (
        ${reminder.id},

        ${reminder.reminder_at},

        'PENDING',

        0,

        NOW()
      )

      ON CONFLICT (
        reminder_id,
        scheduled_for
      )

      DO NOTHING
    `;
  }
}

async function getDueExecutions():
  Promise<
    ExecutionRow[]
  > {
  const rows =
    await sql`
      SELECT
        id,
        reminder_id,
        scheduled_for,
        status,
        attempt_count

      FROM
        reminder_executions

      WHERE
        status IN (
          'PENDING',
          'PARTIAL'
        )

        AND (
          next_attempt_at
            IS NULL

          OR

          next_attempt_at <=
            NOW()
        )

      ORDER BY
        scheduled_for ASC

      LIMIT 20
    `;

  return rows.map(
    (
      row
    ) => ({
      id:
        String(
          row.id
        ),

      reminder_id:
        String(
          row.reminder_id
        ),

      scheduled_for:
        String(
          row.scheduled_for
        ),

      status:
        String(
          row.status
        ) as ExecutionStatus,

      attempt_count:
        Number(
          row.attempt_count
        )
    })
  );
}

async function claimExecution(
  id:
    string
) {
  const result =
    await sql`
      UPDATE
        reminder_executions

      SET
        status =
          'PROCESSING',

        started_at =
          NOW(),

        updated_at =
          NOW()

      WHERE
        id =
          ${id}

        AND

        status IN (
          'PENDING',
          'PARTIAL'
        )

      RETURNING id
    `;

  return (
    result.length >
    0
  );
}

async function getReminderData(
  executionId:
    string
): Promise<
  ReminderData | null
> {
  const rows =
    await sql`
      SELECT
        r.id
          AS reminder_id,

        e.id
          AS execution_id,

        e.scheduled_for,

        e.attempt_count,

        r.notification_type,

        r.email_to,

        r.whatsapp_to,

        r.recurrence_type,

        r.recurrence_interval,

        r.max_retries,

        d.id
          AS document_id,

        d.file_name,

        d.due_date,

        d.priority,

        d.status
          AS document_status,

        cs.case_number,

        c.name
          AS client_name,

        dt.name
          AS document_type_name,

        u.full_name
          AS responsible_name

      FROM
        reminder_executions e

      INNER JOIN reminders r
        ON r.id =
        e.reminder_id

      INNER JOIN documents d
        ON d.id =
        r.document_id

      LEFT JOIN cases cs
        ON cs.id =
        d.case_id

      LEFT JOIN clients c
        ON c.id =
        cs.client_id

      LEFT JOIN document_types dt
        ON dt.id =
        d.document_type_id

      LEFT JOIN users u
        ON u.id =
        d.assigned_user_id

      WHERE
        e.id =
          ${executionId}

      LIMIT 1
    `;

  if (
    rows.length ===
    0
  ) {
    return null;
  }

  const row =
    rows[0];

  return {
    reminder_id:
      String(
        row.reminder_id
      ),

    execution_id:
      String(
        row.execution_id
      ),

    scheduled_for:
      String(
        row.scheduled_for
      ),

    attempt_count:
      Number(
        row.attempt_count
      ),

    notification_type:
      String(
        row.notification_type
      ) as NotificationType,

    email_to:
      row.email_to
        ? String(
            row.email_to
          )
        : null,

    whatsapp_to:
      row.whatsapp_to
        ? String(
            row.whatsapp_to
          )
        : null,

    recurrence_type:
      String(
        row.recurrence_type
      ) as RecurrenceType,

    recurrence_interval:
      row.recurrence_interval !==
      null
        ? Number(
            row.recurrence_interval
          )
        : null,

    max_retries:
      Number(
        row.max_retries
      ) || 3,

    document_id:
      String(
        row.document_id
      ),

    file_name:
      String(
        row.file_name
      ),

    due_date:
      String(
        row.due_date
      ),

    priority:
      String(
        row.priority
      ),

    document_status:
      String(
        row.document_status
      ),

    case_number:
      row.case_number
        ? String(
            row.case_number
          )
        : null,

    client_name:
      row.client_name
        ? String(
            row.client_name
          )
        : null,

    document_type_name:
      row.document_type_name
        ? String(
            row.document_type_name
          )
        : null,

    responsible_name:
      row.responsible_name
        ? String(
            row.responsible_name
          )
        : null
  };
}

async function channelSucceeded(
  executionId:
    string,

  channel:
    NotificationChannel
) {
  const rows =
    await sql`
      SELECT
        id

      FROM
        notification_attempts

      WHERE
        execution_id =
          ${executionId}

        AND

        channel =
          ${channel}

        AND

        status =
          'SUCCESS'

      LIMIT 1
    `;

  return (
    rows.length >
    0
  );
}

async function registerAttempt(
  data: {
    reminderId:
      string;

    executionId:
      string;

    channel:
      NotificationChannel;

    attemptNumber:
      number;

    success:
      boolean;

    providerResponse?:
      string;

    error?:
      string;
  }
) {
  await sql`
    INSERT INTO
      notification_attempts (
        reminder_id,
        execution_id,
        channel,
        attempt_number,
        status,
        provider_response,
        error_message
      )

    VALUES (
      ${data.reminderId},

      ${data.executionId},

      ${data.channel},

      ${data.attemptNumber},

      ${
        data.success
          ? "SUCCESS"
          : "FAILED"
      },

      ${
        data.providerResponse ||
        null
      },

      ${
        data.error ||
        null
      }
    )
  `;
}

async function failExecution(
  id:
    string,

  message:
    string
) {
  await sql`
    UPDATE
      reminder_executions

    SET
      status =
        'FAILED',

      last_error =
        ${message},

      completed_at =
        NOW(),

      next_attempt_at =
        NULL,

      updated_at =
        NOW()

    WHERE
      id =
        ${id}
  `;
}

async function processExecution(
  execution:
    ExecutionRow
) {
  const claimed =
    await claimExecution(
      execution.id
    );

  if (
    !claimed
  ) {
    return;
  }

  const data =
    await getReminderData(
      execution.id
    );

  if (!data) {
    await failExecution(
      execution.id,

      "Recordatorio o documento no encontrado"
    );

    return;
  }

  if (
    data.document_status ===
      "COMPLETED" ||
    data.document_status ===
      "CANCELLED"
  ) {
    await failExecution(
      execution.id,

      "Documento completado o cancelado"
    );

    await sql`
      UPDATE reminders

      SET
        status =
          'CANCELLED',

        updated_at =
          NOW()

      WHERE
        id =
          ${data.reminder_id}
    `;

    return;
  }

  const message =
    buildReminderMessage({
      documentId:
        data.document_id,

      fileName:
        data.file_name,

      clientName:
        data.client_name ||
        "Sin cliente",

      caseNumber:
        data.case_number ||
        "Sin expediente",

      documentType:
        data.document_type_name ||
        "Documento",

      dueDate:
        data.due_date,

      status:
        data.document_status,

      priority:
        data.priority,

      responsibleName:
        data.responsible_name ||
        "Sin asignar"
    });

  const attempt =
    data.attempt_count +
    1;

  const channels:
    NotificationChannel[] =
      data.notification_type ===
      "BOTH"
        ? [
            "EMAIL",
            "WHATSAPP"
          ]
        : data.notification_type ===
          "EMAIL"
        ? [
            "EMAIL"
          ]
        : [
            "WHATSAPP"
          ];

  const errors:
    string[] = [];

  if (
    channels.includes(
      "EMAIL"
    )
  ) {
    const sent =
      await channelSucceeded(
        data.execution_id,
        "EMAIL"
      );

    if (!sent) {
      if (
        !data.email_to
      ) {
        errors.push(
          "Correo no configurado"
        );

      } else {
        const result =
          await sendEmailNotification({
            to:
              data.email_to,

            subject:
              message.subject,

            text:
              message.text
          });

        await registerAttempt({
          reminderId:
            data.reminder_id,

          executionId:
            data.execution_id,

          channel:
            "EMAIL",

          attemptNumber:
            attempt,

          success:
            result.ok,

          providerResponse:
            result.providerResponse,

          error:
            result.error
        });

        if (!result.ok) {
          errors.push(
            `EMAIL: ${result.error || "Error"}`
          );
        }
      }
    }
  }

  if (
    channels.includes(
      "WHATSAPP"
    )
  ) {
    const sent =
      await channelSucceeded(
        data.execution_id,
        "WHATSAPP"
      );

    if (!sent) {
      if (
        !data.whatsapp_to
      ) {
        errors.push(
          "WhatsApp no configurado"
        );

      } else {
        const result =
          await sendWhatsAppNotification({
            to:
              data.whatsapp_to,

            documentName:
              data.file_name,

            clientName:
              data.client_name ||
              "Sin cliente",

            caseNumber:
              data.case_number ||
              "Sin expediente",

            dueDate:
              message.dueDate,

            priority:
              message.priority,

            link:
              message.link
          });

        await registerAttempt({
          reminderId:
            data.reminder_id,

          executionId:
            data.execution_id,

          channel:
            "WHATSAPP",

          attemptNumber:
            attempt,

          success:
            result.ok,

          providerResponse:
            result.providerResponse,

          error:
            result.error
        });

        if (!result.ok) {
          errors.push(
            `WHATSAPP: ${result.error || "Error"}`
          );
        }
      }
    }
  }

  const successful =
    await sql`
      SELECT DISTINCT
        channel

      FROM
        notification_attempts

      WHERE
        execution_id =
          ${data.execution_id}

        AND

        status =
          'SUCCESS'
    `;

  const successSet =
    new Set(
      successful.map(
        (
          row
        ) =>
          String(
            row.channel
          )
      )
    );

  const allSuccessful =
    channels.every(
      (
        channel
      ) =>
        successSet.has(
          channel
        )
    );

  if (
    allSuccessful
  ) {
    await sql`
      UPDATE
        reminder_executions

      SET
        status =
          'SENT',

        attempt_count =
          ${attempt},

        next_attempt_at =
          NULL,

        last_error =
          NULL,

        completed_at =
          NOW(),

        updated_at =
          NOW()

      WHERE
        id =
          ${data.execution_id}
    `;

    if (
      data.recurrence_type ===
      "NONE"
    ) {
      await sql`
        UPDATE reminders

        SET
          status =
            'SENT',

          retry_count =
            ${attempt},

          last_attempt_at =
            NOW(),

          sent_at =
            NOW(),

          error_message =
            NULL,

          updated_at =
            NOW()

        WHERE
          id =
            ${data.reminder_id}
      `;

      return;
    }

    const type =
      data.recurrence_type as
        Exclude<
          RecurrenceType,
          "NONE"
        >;

    let next =
      nextRecurringDate(
        data.scheduled_for,

        type,

        data.recurrence_interval
      );

    while (
      next.getTime() <=
      Date.now()
    ) {
      next =
        nextRecurringDate(
          next.toISOString(),

          type,

          data.recurrence_interval
        );
    }

    await sql`
      UPDATE reminders

      SET
        reminder_at =
          ${next.toISOString()},

        status =
          'SCHEDULED',

        retry_count =
          0,

        last_attempt_at =
          NOW(),

        sent_at =
          NOW(),

        error_message =
          NULL,

        updated_at =
          NOW()

      WHERE
        id =
          ${data.reminder_id}
    `;

    return;
  }

  const errorText =
    errors.length
      ? errors.join(
          " | "
        )
      : "Uno o más canales fallaron";

  if (
    attempt >=
    data.max_retries
  ) {
    await failExecution(
      data.execution_id,

      errorText
    );

    await sql`
      UPDATE reminders

      SET
        status =
          'FAILED',

        retry_count =
          ${attempt},

        last_attempt_at =
          NOW(),

        error_message =
          ${errorText},

        updated_at =
          NOW()

      WHERE
        id =
          ${data.reminder_id}
    `;

    return;
  }

  const nextAttempt =
    retryDate(
      attempt
    );

  await sql`
    UPDATE
      reminder_executions

    SET
      status =
        ${
          successSet.size >
          0
            ? "PARTIAL"
            : "PENDING"
        },

      attempt_count =
        ${attempt},

      next_attempt_at =
        ${nextAttempt.toISOString()},

      last_error =
        ${errorText},

      updated_at =
        NOW()

    WHERE
      id =
        ${data.execution_id}
  `;

  await sql`
    UPDATE reminders

    SET
      retry_count =
        ${attempt},

      last_attempt_at =
        NOW(),

      error_message =
        ${errorText},

      updated_at =
        NOW()

    WHERE
      id =
        ${data.reminder_id}
  `;
}

export async function processDueReminders() {
  console.log(
    `[REMINDER ENGINE] ${new Date().toISOString()}`
  );

  await generateExecutions();

  const executions =
    await getDueExecutions();

  if (
    executions.length ===
    0
  ) {
    console.log(
      "[REMINDER ENGINE] Sin recordatorios pendientes"
    );

    return {
      processed:
        0
    };
  }

  let processed =
    0;

  for (
    const execution of
    executions
  ) {
    try {
      await processExecution(
        execution
      );

      processed++;

    } catch (error) {
      console.error(
        "EXECUTION_ERROR:",
        execution.id,
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      await failExecution(
        execution.id,
        message
      );
    }
  }

  console.log(
    `[REMINDER ENGINE] Procesados: ${processed}`
  );

  return {
    processed
  };
}
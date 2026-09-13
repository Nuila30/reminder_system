import type {
  Request,
  Response
} from "express";

import {
  z
} from "zod";

import {
  sql
} from "../config/db.js";

const notificationTypeSchema =
  z.enum([
    "EMAIL",
    "WHATSAPP",
    "BOTH"
  ]);

const recurrenceTypeSchema =
  z.enum([
    "NONE",
    "DAILY",
    "WEEKLY",
    "CUSTOM"
  ]);

const reminderStatusSchema =
  z.enum([
    "SCHEDULED",
    "PROCESSING",
    "SENT",
    "FAILED",
    "CANCELLED"
  ]);

const createReminderSchema =
  z.object({
    documentId:
      z.string()
        .uuid(
          "Documento inválido"
        ),

    reminderAt:
      z.string()
        .min(
          1,
          "La fecha es obligatoria"
        ),

    notificationType:
      notificationTypeSchema,

    emailTo:
      z.string()
        .trim()
        .optional()
        .default(""),

    whatsappTo:
      z.string()
        .trim()
        .optional()
        .default(""),

    recurrenceType:
      recurrenceTypeSchema
        .default("NONE"),

    recurrenceInterval:
      z.number()
        .int()
        .positive()
        .nullable()
        .optional()
  });

const updateReminderSchema =
  createReminderSchema
    .omit({
      documentId:
        true
    })
    .partial();

function parseDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function validEmail(
  email: string
) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}

function validateDestination(
  notificationType:
    "EMAIL" |
    "WHATSAPP" |
    "BOTH",

  emailTo: string,

  whatsappTo: string
) {
  if (
    (
      notificationType ===
        "EMAIL" ||
      notificationType ===
        "BOTH"
    ) &&
    !emailTo
  ) {
    return "Debes ingresar un correo electrónico.";
  }

  if (
    emailTo &&
    !validEmail(
      emailTo
    )
  ) {
    return "El correo electrónico no es válido.";
  }

  if (
    (
      notificationType ===
        "WHATSAPP" ||
      notificationType ===
        "BOTH"
    ) &&
    !whatsappTo
  ) {
    return "Debes ingresar un número de WhatsApp.";
  }

  return null;
}

/* =====================================================
   LISTAR
===================================================== */

export async function getReminders(
  req: Request,
  res: Response
) {
  try {
    const documentId =
      String(
        req.query.documentId ||
        ""
      );

    const requestedStatus =
      String(
        req.query.status ||
        "ALL"
      );

    if (
      requestedStatus !==
        "ALL" &&
      !reminderStatusSchema
        .safeParse(
          requestedStatus
        )
        .success
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Estado de recordatorio inválido"
        });
    }

    const result =
      await sql`
        SELECT
          r.id,
          r.document_id,
          r.reminder_at,
          r.notification_type,
          r.email_to,
          r.whatsapp_to,
          r.recurrence_type,
          r.recurrence_interval,
          r.status,
          r.retry_count,
          r.max_retries,
          r.last_attempt_at,
          r.sent_at,
          r.error_message,
          r.created_at,
          r.updated_at,

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
            AS created_by_name

        FROM reminders r

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
          r.created_by

        WHERE
          (
            ${documentId} =
              ''

            OR

            r.document_id::text =
              ${documentId}
          )

          AND (
            ${requestedStatus} =
              'ALL'

            OR

            r.status =
              ${requestedStatus}
          )

        ORDER BY
          r.reminder_at ASC
      `;

    return res.json({
      ok: true,

      data:
        result
    });

  } catch (error) {
    console.error(
      "GET_REMINDERS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener los recordatorios"
      });
  }
}

/* =====================================================
   OBTENER UNO
===================================================== */

export async function getReminderById(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const result =
      await sql`
        SELECT
          r.*,

          d.file_name,

          d.due_date,

          d.priority,

          d.status
            AS document_status,

          cs.case_number,

          c.name
            AS client_name,

          dt.name
            AS document_type_name

        FROM reminders r

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

        WHERE
          r.id =
          ${id}

        LIMIT 1
      `;

    if (
      result.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Recordatorio no encontrado"
        });
    }

    return res.json({
      ok: true,

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "GET_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener el recordatorio"
      });
  }
}

/* =====================================================
   CREAR
===================================================== */

export async function createReminder(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      createReminderSchema
        .safeParse(
          req.body
        );

    if (
      !parsed.success
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Datos inválidos",

          errors:
            parsed.error
              .flatten()
              .fieldErrors
        });
    }

    const userId =
      req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({
          ok: false,

          message:
            "No autenticado"
        });
    }

    const reminderDate =
      parseDate(
        parsed.data
          .reminderAt
      );

    if (!reminderDate) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Fecha de recordatorio inválida"
        });
    }

    const emailTo =
      parsed.data.emailTo
        .trim();

    const whatsappTo =
      parsed.data.whatsappTo
        .trim();

    const destinationError =
      validateDestination(
        parsed.data
          .notificationType,

        emailTo,

        whatsappTo
      );

    if (
      destinationError
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            destinationError
        });
    }

    if (
      parsed.data
        .recurrenceType ===
        "CUSTOM" &&
      !parsed.data
        .recurrenceInterval
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Debes indicar cada cuántos días se repetirá."
        });
    }

    const documentResult =
      await sql`
        SELECT
          id,
          status

        FROM documents

        WHERE
          id =
          ${parsed.data.documentId}

        LIMIT 1
      `;

    if (
      documentResult.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Documento no encontrado"
        });
    }

    if (
      documentResult[0]
        .status ===
        "COMPLETED" ||
      documentResult[0]
        .status ===
        "CANCELLED"
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "No puedes agregar recordatorios a un documento completado o cancelado."
        });
    }

    const result =
      await sql`
        INSERT INTO reminders (
          document_id,
          reminder_at,
          notification_type,
          email_to,
          whatsapp_to,
          recurrence_type,
          recurrence_interval,
          status,
          retry_count,
          max_retries,
          created_by
        )
        VALUES (
          ${parsed.data.documentId},

          ${reminderDate.toISOString()},

          ${parsed.data.notificationType},

          ${emailTo || null},

          ${whatsappTo || null},

          ${parsed.data.recurrenceType},

          ${
            parsed.data
              .recurrenceType ===
            "CUSTOM"
              ? parsed.data
                  .recurrenceInterval
              : null
          },

          'SCHEDULED',

          0,

          3,

          ${userId}
        )

        RETURNING *
      `;

    const reminder =
      result[0];

    await sql`
      INSERT INTO audit_logs (
        user_id,
        entity_type,
        entity_id,
        action,
        new_value
      )
      VALUES (
        ${userId},

        'REMINDER',

        ${reminder.id},

        'CREATE',

        ${JSON.stringify({
          documentId:
            reminder
              .document_id,

          reminderAt:
            reminder
              .reminder_at,

          notificationType:
            reminder
              .notification_type,

          recurrenceType:
            reminder
              .recurrence_type,

          status:
            reminder.status
        })}::jsonb
      )
    `;

    return res
      .status(201)
      .json({
        ok: true,

        message:
          "Recordatorio creado correctamente",

        data:
          reminder
      });

  } catch (error) {
    console.error(
      "CREATE_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible crear el recordatorio"
      });
  }
}

/* =====================================================
   EDITAR
===================================================== */

export async function updateReminder(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const parsed =
      updateReminderSchema
        .safeParse(
          req.body
        );

    if (
      !parsed.success
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Datos inválidos",

          errors:
            parsed.error
              .flatten()
              .fieldErrors
        });
    }

    const existing =
      await sql`
        SELECT *
        FROM reminders
        WHERE id =
          ${id}
        LIMIT 1
      `;

    if (
      existing.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Recordatorio no encontrado"
        });
    }

    const current =
      existing[0];

    if (
      current.status ===
      "SENT" ||
      current.status ===
      "PROCESSING"
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Este recordatorio no puede modificarse en su estado actual."
        });
    }

    const notificationType =
      parsed.data
        .notificationType ??
      current.notification_type;

    const emailTo =
      parsed.data.emailTo !==
      undefined
        ? parsed.data
            .emailTo
            .trim()
        : String(
            current.email_to ||
            ""
          );

    const whatsappTo =
      parsed.data.whatsappTo !==
      undefined
        ? parsed.data
            .whatsappTo
            .trim()
        : String(
            current.whatsapp_to ||
            ""
          );

    const recurrenceType =
      parsed.data
        .recurrenceType ??
      current.recurrence_type;

    const recurrenceInterval =
      recurrenceType ===
      "CUSTOM"
        ? (
            parsed.data
              .recurrenceInterval ??
            current
              .recurrence_interval
          )
        : null;

    const destinationError =
      validateDestination(
        notificationType,

        emailTo,

        whatsappTo
      );

    if (
      destinationError
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            destinationError
        });
    }

    if (
      recurrenceType ===
        "CUSTOM" &&
      !recurrenceInterval
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Debes indicar el intervalo de repetición."
        });
    }

    let reminderAt =
      String(
        current.reminder_at
      );

    if (
      parsed.data
        .reminderAt
    ) {
      const date =
        parseDate(
          parsed.data
            .reminderAt
        );

      if (!date) {
        return res
          .status(400)
          .json({
            ok: false,

            message:
              "Fecha de recordatorio inválida"
          });
      }

      reminderAt =
        date
          .toISOString();
    }

    const result =
      await sql`
        UPDATE reminders

        SET
          reminder_at =
            ${reminderAt},

          notification_type =
            ${notificationType},

          email_to =
            ${emailTo || null},

          whatsapp_to =
            ${whatsappTo || null},

          recurrence_type =
            ${recurrenceType},

          recurrence_interval =
            ${recurrenceInterval},

          status =
            'SCHEDULED',

          retry_count =
            0,

          last_attempt_at =
            NULL,

          sent_at =
            NULL,

          error_message =
            NULL,

          updated_at =
            NOW()

        WHERE
          id =
          ${id}

        RETURNING *
      `;

    if (
      req.user?.userId
    ) {
      await sql`
        INSERT INTO audit_logs (
          user_id,
          entity_type,
          entity_id,
          action,
          new_value
        )
        VALUES (
          ${req.user.userId},

          'REMINDER',

          ${id},

          'UPDATE',

          ${JSON.stringify({
            reminderAt,
            notificationType,
            recurrenceType,
            recurrenceInterval
          })}::jsonb
        )
      `;
    }

    return res.json({
      ok: true,

      message:
        "Recordatorio actualizado correctamente",

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "UPDATE_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible actualizar el recordatorio"
      });
  }
}

/* =====================================================
   CANCELAR
===================================================== */

export async function cancelReminder(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const result =
      await sql`
        UPDATE reminders

        SET
          status =
            'CANCELLED',

          updated_at =
            NOW()

        WHERE
          id =
            ${id}

          AND

          status NOT IN (
            'SENT',
            'PROCESSING'
          )

        RETURNING id
      `;

    if (
      result.length ===
      0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "El recordatorio no puede cancelarse."
        });
    }

    return res.json({
      ok: true,

      message:
        "Recordatorio cancelado correctamente"
    });

  } catch (error) {
    console.error(
      "CANCEL_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible cancelar el recordatorio"
      });
  }
}

/* =====================================================
   REACTIVAR
===================================================== */

export async function reactivateReminder(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const result =
      await sql`
        UPDATE reminders r

        SET
          status =
            'SCHEDULED',

          retry_count =
            0,

          last_attempt_at =
            NULL,

          error_message =
            NULL,

          updated_at =
            NOW()

        FROM documents d

        WHERE
          r.id =
            ${id}

          AND

          d.id =
            r.document_id

          AND

          r.status IN (
            'CANCELLED',
            'FAILED'
          )

          AND

          d.status NOT IN (
            'COMPLETED',
            'CANCELLED'
          )

        RETURNING
          r.id
      `;

    if (
      result.length ===
      0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Este recordatorio no puede reactivarse."
        });
    }

    return res.json({
      ok: true,

      message:
        "Recordatorio reactivado correctamente"
    });

  } catch (error) {
    console.error(
      "REACTIVATE_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible reactivar el recordatorio"
      });
  }
}

/* =====================================================
   ELIMINAR
===================================================== */

export async function deleteReminder(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const attempts =
      await sql`
        SELECT
          COUNT(*)::int
            AS total

        FROM
          notification_attempts

        WHERE
          reminder_id =
            ${id}
      `;

    if (
      Number(
        attempts[0]?.total ||
        0
      ) > 0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Este recordatorio tiene historial de envíos. Cancélalo en lugar de eliminarlo."
        });
    }

    const result =
      await sql`
        DELETE FROM reminders

        WHERE
          id =
          ${id}

        RETURNING id
      `;

    if (
      result.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Recordatorio no encontrado"
        });
    }

    return res.json({
      ok: true,

      message:
        "Recordatorio eliminado correctamente"
    });

  } catch (error) {
    console.error(
      "DELETE_REMINDER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible eliminar el recordatorio"
      });
  }
}
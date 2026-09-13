import type {
  Request,
  Response
} from "express";

import {
  sql
} from "../config/db.js";

const validStatuses = [
  "SCHEDULED",
  "PROCESSING",
  "SENT",
  "FAILED",
  "CANCELLED"
];

const validPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

export async function getCalendarEvents(
  req: Request,
  res: Response
) {
  try {
    const start =
      String(
        req.query.start || ""
      );

    const end =
      String(
        req.query.end || ""
      );

    const status =
      String(
        req.query.status || "ALL"
      );

    const priority =
      String(
        req.query.priority || "ALL"
      );

    const assignedUserId =
      String(
        req.query.assignedUserId || ""
      );

    /* ================================================
       VALIDAR FECHAS
    ================================================ */

    if (
      !start ||
      !end
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          message:
            "Debes indicar el rango de fechas"
        });
    }

    const startDate =
      new Date(start);

    const endDate =
      new Date(end);

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          message:
            "El rango de fechas no es válido"
        });
    }

    if (
      endDate <=
      startDate
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          message:
            "El rango de fechas es incorrecto"
        });
    }

    /* ================================================
       VALIDAR FILTROS
    ================================================ */

    if (
      status !== "ALL" &&
      !validStatuses.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          message:
            "Estado inválido"
        });
    }

    if (
      priority !== "ALL" &&
      !validPriorities.includes(
        priority
      )
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          message:
            "Prioridad inválida"
        });
    }

    const startIso =
      startDate.toISOString();

    const endIso =
      endDate.toISOString();

    console.log(
      "CALENDAR_RANGE:",
      {
        start: startIso,
        end: endIso,
        status,
        priority,
        assignedUserId
      }
    );

    /* ================================================
       EVENTOS
    ================================================ */

    const events =
      await sql`
        SELECT
          r.id,

          r.document_id,

          r.reminder_at,

          r.notification_type,

          r.recurrence_type,

          r.recurrence_interval,

          r.status,

          r.email_to,

          r.whatsapp_to,

          r.retry_count,

          r.max_retries,

          d.file_name,

          d.due_date,

          d.priority,

          d.status
            AS document_status,

          d.assigned_user_id,

          cs.case_number,

          c.name
            AS client_name,

          dt.name
            AS document_type_name,

          u.full_name
            AS responsible_name

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
          d.assigned_user_id

        WHERE
          r.reminder_at >=
            ${startIso}::timestamptz

          AND

          r.reminder_at <
            ${endIso}::timestamptz

          AND (
            ${status} =
              'ALL'

            OR

            r.status =
              ${status}
          )

          AND (
            ${priority} =
              'ALL'

            OR

            d.priority =
              ${priority}
          )

          AND (
            ${assignedUserId} =
              ''

            OR

            d.assigned_user_id::text =
              ${assignedUserId}
          )

        ORDER BY
          r.reminder_at ASC
      `;

    console.log(
      "CALENDAR_EVENTS_FOUND:",
      events.length
    );

    /* ================================================
       ESTADÍSTICAS
    ================================================ */

    const statsResult =
      await sql`
        SELECT
          COUNT(*)::int
            AS total,

          COUNT(*) FILTER (
            WHERE
              r.status IN (
                'SCHEDULED',
                'PROCESSING'
              )
          )::int
            AS pending,

          COUNT(*) FILTER (
            WHERE
              d.priority =
                'CRITICAL'

              AND

              r.status NOT IN (
                'CANCELLED',
                'SENT'
              )
          )::int
            AS critical,

          COUNT(*) FILTER (
            WHERE
              r.status =
                'FAILED'
          )::int
            AS failed

        FROM reminders r

        INNER JOIN documents d
          ON d.id =
          r.document_id

        WHERE
          r.reminder_at >=
            ${startIso}::timestamptz

          AND

          r.reminder_at <
            ${endIso}::timestamptz
      `;

    const stats =
      statsResult[0];

    /* ================================================
       RESPONSABLES
    ================================================ */

    const users =
      await sql`
        SELECT
          id,
          full_name,
          email

        FROM users

        WHERE
          status =
            'ACTIVE'

        ORDER BY
          full_name ASC
      `;

    /* ================================================
       DOCUMENTOS DISPONIBLES
    ================================================ */

    const documents =
      await sql`
        SELECT
          d.id,

          d.file_name,

          d.due_date,

          d.priority,

          d.status,

          cs.case_number,

          c.name
            AS client_name

        FROM documents d

        LEFT JOIN cases cs
          ON cs.id =
          d.case_id

        LEFT JOIN clients c
          ON c.id =
          cs.client_id

        WHERE
          d.status NOT IN (
            'COMPLETED',
            'CANCELLED'
          )

        ORDER BY
          d.due_date ASC,
          d.file_name ASC

        LIMIT 500
      `;

    /* ================================================
       RESPUESTA
    ================================================ */

    return res.json({
      ok: true,

      data:
        events,

      stats: {
        total:
          Number(
            stats?.total || 0
          ),

        pending:
          Number(
            stats?.pending || 0
          ),

        critical:
          Number(
            stats?.critical || 0
          ),

        failed:
          Number(
            stats?.failed || 0
          )
      },

      options: {
        users,
        documents
      }
    });

  } catch (error) {
    console.error(
      "GET_CALENDAR_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,
        message:
          "No fue posible cargar el calendario"
      });
  }
}
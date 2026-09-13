import type {
  Request,
  Response
} from "express";

import {
  sql
} from "../config/db.js";

/* =====================================================
   VALORES PERMITIDOS
===================================================== */

const validPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const validStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
  "SCHEDULED",
  "PROCESSING",
  "SENT",
  "FAILED",
  "SUCCESS"
];

/* =====================================================
   PAGINACIÓN
===================================================== */

function getPagination(
  req: Request
) {
  const page =
    Math.max(
      Number(
        req.query.page
      ) || 1,
      1
    );

  const limit =
    Math.min(
      Math.max(
        Number(
          req.query.limit
        ) || 20,
        1
      ),
      100
    );

  return {
    page,
    limit,
    offset:
      (page - 1) *
      limit
  };
}

/* =====================================================
   HISTORIAL
   GET /api/history
===================================================== */

export async function getHistory(
  req: Request,
  res: Response
) {
  try {
    const {
      page,
      limit,
      offset
    } =
      getPagination(
        req
      );

    const clientId =
      String(
        req.query.clientId ||
        ""
      );

    const status =
      String(
        req.query.status ||
        "ALL"
      );

    const priority =
      String(
        req.query.priority ||
        "ALL"
      );

    const userId =
      String(
        req.query.userId ||
        ""
      );

    const dateFrom =
      String(
        req.query.dateFrom ||
        ""
      );

    const dateTo =
      String(
        req.query.dateTo ||
        ""
      );

    /* =================================================
       VALIDACIONES
    ================================================= */

    if (
      priority !==
        "ALL" &&
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

    if (
      status !==
        "ALL" &&
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

    let startDate:
      string | null =
      null;

    let endDate:
      string | null =
      null;

    if (
      dateFrom
    ) {
      const parsed =
        new Date(
          `${dateFrom}T00:00:00`
        );

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            message:
              "Fecha inicial inválida"
          });
      }

      startDate =
        parsed.toISOString();
    }

    if (
      dateTo
    ) {
      const parsed =
        new Date(
          `${dateTo}T23:59:59.999`
        );

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            message:
              "Fecha final inválida"
          });
      }

      endDate =
        parsed.toISOString();
    }

    /* =================================================
       HISTORIAL NORMALIZADO
    ================================================= */

    const history =
      await sql`
        WITH history_data AS (

          /* ==========================================
             AUDITORÍA DE DOCUMENTOS
          ========================================== */

          SELECT
            a.id::text
              AS id,

            'DOCUMENT'
              AS source,

            a.action
              AS action,

            a.created_at
              AS event_at,

            d.id
              AS document_id,

            d.file_name
              AS document_name,

            d.priority,

            d.status,

            c.id
              AS client_id,

            c.name
              AS client_name,

            cs.case_number,

            a.user_id,

            u.full_name
              AS user_name,

            NULL::text
              AS channel,

            NULL::text
              AS delivery_status,

            a.new_value
              AS details

          FROM audit_logs a

          INNER JOIN documents d
            ON
              a.entity_type =
                'DOCUMENT'

              AND

              d.id =
                a.entity_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id

          LEFT JOIN users u
            ON u.id =
              a.user_id


          UNION ALL


          /* ==========================================
             AUDITORÍA DE RECORDATORIOS
          ========================================== */

          SELECT
            a.id::text
              AS id,

            'REMINDER'
              AS source,

            a.action
              AS action,

            a.created_at
              AS event_at,

            d.id
              AS document_id,

            d.file_name
              AS document_name,

            d.priority,

            r.status,

            c.id
              AS client_id,

            c.name
              AS client_name,

            cs.case_number,

            a.user_id,

            u.full_name
              AS user_name,

            r.notification_type
              AS channel,

            NULL::text
              AS delivery_status,

            a.new_value
              AS details

          FROM audit_logs a

          INNER JOIN reminders r
            ON
              a.entity_type =
                'REMINDER'

              AND

              r.id =
                a.entity_id

          INNER JOIN documents d
            ON d.id =
              r.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id

          LEFT JOIN users u
            ON u.id =
              a.user_id


          UNION ALL


          /* ==========================================
             CAMBIOS DE ESTADO DE DOCUMENTO
          ========================================== */

          SELECT
            h.id::text
              AS id,

            'STATUS'
              AS source,

            'STATUS_CHANGE'
              AS action,

            h.changed_at
              AS event_at,

            d.id
              AS document_id,

            d.file_name
              AS document_name,

            d.priority,

            h.new_status
              AS status,

            c.id
              AS client_id,

            c.name
              AS client_name,

            cs.case_number,

            h.changed_by
              AS user_id,

            u.full_name
              AS user_name,

            NULL::text
              AS channel,

            NULL::text
              AS delivery_status,

            jsonb_build_object(
              'status',
              h.new_status
            )
              AS details

          FROM
            document_status_history h

          INNER JOIN documents d
            ON d.id =
              h.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id

          LEFT JOIN users u
            ON u.id =
              h.changed_by


          UNION ALL


          /* ==========================================
             INTENTOS DE NOTIFICACIÓN
          ========================================== */

          SELECT
            n.id::text
              AS id,

            'NOTIFICATION'
              AS source,

            'SEND_ATTEMPT'
              AS action,

            n.attempted_at
              AS event_at,

            d.id
              AS document_id,

            d.file_name
              AS document_name,

            d.priority,

            r.status,

            c.id
              AS client_id,

            c.name
              AS client_name,

            cs.case_number,

            r.created_by
              AS user_id,

            'Sistema'
              AS user_name,

            n.channel,

            n.status
              AS delivery_status,

            jsonb_build_object(
              'attemptNumber',
              n.attempt_number,

              'providerResponse',
              n.provider_response,

              'errorMessage',
              n.error_message
            )
              AS details

          FROM notification_attempts n

          INNER JOIN reminders r
            ON r.id =
              n.reminder_id

          INNER JOIN documents d
            ON d.id =
              r.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id
        )

        SELECT *

        FROM history_data

        WHERE
          (
            ${clientId} =
              ''

            OR

            client_id::text =
              ${clientId}
          )

          AND (
            ${priority} =
              'ALL'

            OR

            priority =
              ${priority}
          )

          AND (
            ${status} =
              'ALL'

            OR

            status =
              ${status}

            OR

            delivery_status =
              ${status}
          )

          AND (
            ${userId} =
              ''

            OR

            user_id::text =
              ${userId}
          )

          AND (
            ${startDate}::timestamptz
              IS NULL

            OR

            event_at >=
              ${startDate}::timestamptz
          )

          AND (
            ${endDate}::timestamptz
              IS NULL

            OR

            event_at <=
              ${endDate}::timestamptz
          )

        ORDER BY
          event_at DESC

        LIMIT ${limit}

        OFFSET ${offset}
      `;

    /* =================================================
       TOTAL
    ================================================= */

    const countResult =
      await sql`
        WITH history_data AS (

          SELECT
            a.created_at
              AS event_at,

            d.priority,

            d.status,

            c.id
              AS client_id,

            a.user_id,

            NULL::text
              AS delivery_status

          FROM audit_logs a

          INNER JOIN documents d
            ON
              a.entity_type =
                'DOCUMENT'

              AND

              d.id =
                a.entity_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id


          UNION ALL


          SELECT
            a.created_at,

            d.priority,

            r.status,

            c.id,

            a.user_id,

            NULL::text

          FROM audit_logs a

          INNER JOIN reminders r
            ON
              a.entity_type =
                'REMINDER'

              AND

              r.id =
                a.entity_id

          INNER JOIN documents d
            ON d.id =
              r.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id


          UNION ALL


          SELECT
            h.changed_at,

            d.priority,

            h.new_status,

            c.id,

            h.changed_by,

            NULL::text

          FROM
            document_status_history h

          INNER JOIN documents d
            ON d.id =
              h.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id


          UNION ALL


          SELECT
            n.attempted_at,

            d.priority,

            r.status,

            c.id,

            r.created_by,

            n.status

          FROM
            notification_attempts n

          INNER JOIN reminders r
            ON r.id =
              n.reminder_id

          INNER JOIN documents d
            ON d.id =
              r.document_id

          LEFT JOIN cases cs
            ON cs.id =
              d.case_id

          LEFT JOIN clients c
            ON c.id =
              cs.client_id
        )

        SELECT
          COUNT(*)::int
            AS total

        FROM history_data

        WHERE
          (
            ${clientId} =
              ''

            OR

            client_id::text =
              ${clientId}
          )

          AND (
            ${priority} =
              'ALL'

            OR

            priority =
              ${priority}
          )

          AND (
            ${status} =
              'ALL'

            OR

            status =
              ${status}

            OR

            delivery_status =
              ${status}
          )

          AND (
            ${userId} =
              ''

            OR

            user_id::text =
              ${userId}
          )

          AND (
            ${startDate}::timestamptz
              IS NULL

            OR

            event_at >=
              ${startDate}::timestamptz
          )

          AND (
            ${endDate}::timestamptz
              IS NULL

            OR

            event_at <=
              ${endDate}::timestamptz
          )
      `;

    const total =
      Number(
        countResult[0]
          ?.total ||
        0
      );

    /* =================================================
       ESTADÍSTICAS
    ================================================= */

    const statsResult =
      await sql`
        SELECT

          (
            SELECT
              COUNT(*)::int

            FROM
              notification_attempts

            WHERE
              status =
                'SUCCESS'
          )
            AS successful,

          (
            SELECT
              COUNT(*)::int

            FROM
              notification_attempts

            WHERE
              status =
                'FAILED'
          )
            AS failed,

          (
            SELECT
              COUNT(*)::int

            FROM
              reminders

            WHERE
              status =
                'CANCELLED'
          )
            AS cancelled,

          (
            SELECT
              COUNT(*)::int

            FROM
              reminders

            WHERE
              status =
                'SCHEDULED'
          )
            AS scheduled
      `;

    const rawStats =
      statsResult[0];

    /* =================================================
       CLIENTES
    ================================================= */

    const clients =
      await sql`
        SELECT
          id,
          name

        FROM clients

        ORDER BY
          name ASC
      `;

    /* =================================================
       USUARIOS
    ================================================= */

    const users =
      await sql`
        SELECT
          id,
          full_name,
          email

        FROM users

        ORDER BY
          full_name ASC
      `;

    return res.json({
      ok: true,

      data:
        history,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.max(
            Math.ceil(
              total /
              limit
            ),
            1
          )
      },

      stats: {
        successful:
          Number(
            rawStats
              ?.successful ||
            0
          ),

        failed:
          Number(
            rawStats
              ?.failed ||
            0
          ),

        cancelled:
          Number(
            rawStats
              ?.cancelled ||
            0
          ),

        scheduled:
          Number(
            rawStats
              ?.scheduled ||
            0
          )
      },

      options: {
        clients,
        users
      }
    });

  } catch (error) {
    console.error(
      "GET_HISTORY_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible cargar el historial"
      });
  }
}
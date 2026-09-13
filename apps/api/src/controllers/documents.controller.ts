import type {
  Request,
  Response
} from "express";

import { z } from "zod";

import { sql } from "../config/db.js";

const prioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
]);

const createDocumentSchema = z.object({
  caseId: z
    .string()
    .uuid("Expediente inválido"),

  documentTypeId: z
    .string()
    .uuid("Tipo de documento inválido"),

  assignedUserId: z
    .string()
    .uuid("Responsable inválido"),

  fileName: z
    .string()
    .trim()
    .min(
      2,
      "El nombre del documento es obligatorio"
    )
    .max(255),

  dueDate: z
    .string()
    .min(
      1,
      "La fecha límite es obligatoria"
    ),

  priority:
    prioritySchema,

  notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .default("")
});

const updateDocumentSchema =
  createDocumentSchema.partial();

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
        ) || 10,
        1
      ),
      100
    );

  return {
    page,
    limit,
    offset:
      (page - 1) * limit
  };
}

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

/* =====================================================
   FORM OPTIONS
   GET /api/documents/form-options
===================================================== */

export async function getDocumentFormOptions(
  _req: Request,
  res: Response
) {
  try {
    const documentTypes =
      await sql`
        SELECT
          id,
          name
        FROM document_types
        WHERE is_active = TRUE
        ORDER BY name
      `;

    const users =
      await sql`
        SELECT
          id,
          full_name,
          email,
          role
        FROM users
        WHERE status = 'ACTIVE'
        ORDER BY full_name
      `;

    const clients =
      await sql`
        SELECT
          id,
          name
        FROM clients
        WHERE status = 'ACTIVE'
        ORDER BY name
      `;

    return res.json({
      ok: true,

      data: {
        documentTypes,
        users,
        clients
      }
    });

  } catch (error) {
    console.error(
      "DOCUMENT_FORM_OPTIONS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,
        message:
          "No fue posible cargar las opciones del formulario"
      });
  }
}

/* =====================================================
   LISTADO
   GET /api/documents
===================================================== */

export async function getDocuments(
  req: Request,
  res: Response
) {
  try {
    const {
      page,
      limit,
      offset
    } =
      getPagination(req);

    const search =
      String(
        req.query.search || ""
      ).trim();

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

    const caseId =
      String(
        req.query.caseId || ""
      );

    const searchPattern =
      `%${search}%`;

    const documents =
      await sql`
        SELECT
          d.id,
          d.case_id,
          d.document_type_id,
          d.assigned_user_id,

          d.file_name,
          d.due_date,
          d.priority,
          d.status,
          d.notes,
          d.completed_at,

          d.created_at,
          d.updated_at,

          cs.case_number,

          c.id AS client_id,
          c.name AS client_name,

          dt.name AS document_type_name,

          assigned.full_name
            AS assigned_user_name,

          creator.full_name
            AS created_by_name,

          (
            SELECT
              COUNT(*)::int
            FROM reminders r
            WHERE
              r.document_id =
              d.id
          ) AS reminders_count

        FROM documents d

        LEFT JOIN cases cs
          ON cs.id =
          d.case_id

        LEFT JOIN clients c
          ON c.id =
          cs.client_id

        LEFT JOIN document_types dt
          ON dt.id =
          d.document_type_id

        LEFT JOIN users assigned
          ON assigned.id =
          d.assigned_user_id

        LEFT JOIN users creator
          ON creator.id =
          d.created_by

        WHERE
          (
            ${search} = ''
            OR d.file_name
              ILIKE ${searchPattern}
            OR cs.case_number
              ILIKE ${searchPattern}
            OR c.name
              ILIKE ${searchPattern}
            OR dt.name
              ILIKE ${searchPattern}
          )

          AND (
            ${status} = 'ALL'
            OR d.status =
              ${status}
          )

          AND (
            ${priority} = 'ALL'
            OR d.priority =
              ${priority}
          )

          AND (
            ${caseId} = ''
            OR
            d.case_id::text =
              ${caseId}
          )

        ORDER BY
          d.due_date ASC,
          d.created_at DESC

        LIMIT ${limit}
        OFFSET ${offset}
      `;

    const countResult =
      await sql`
        SELECT
          COUNT(*)::int AS total

        FROM documents d

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
          (
            ${search} = ''
            OR d.file_name
              ILIKE ${searchPattern}
            OR cs.case_number
              ILIKE ${searchPattern}
            OR c.name
              ILIKE ${searchPattern}
            OR dt.name
              ILIKE ${searchPattern}
          )

          AND (
            ${status} = 'ALL'
            OR d.status =
              ${status}
          )

          AND (
            ${priority} = 'ALL'
            OR d.priority =
              ${priority}
          )

          AND (
            ${caseId} = ''
            OR
            d.case_id::text =
              ${caseId}
          )
      `;

    const total =
      Number(
        countResult[0]
          ?.total || 0
      );

    return res.json({
      ok: true,

      data: documents,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit
          )
      }
    });

  } catch (error) {
    console.error(
      "GET_DOCUMENTS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener los documentos"
      });
  }
}

/* =====================================================
   DOCUMENTO INDIVIDUAL
   GET /api/documents/:id
===================================================== */

export async function getDocumentById(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const result =
      await sql`
        SELECT
          d.id,
          d.case_id,
          d.document_type_id,
          d.assigned_user_id,

          d.file_name,
          d.due_date,
          d.priority,
          d.status,
          d.notes,
          d.completed_at,

          d.created_at,
          d.updated_at,

          cs.case_number,

          c.id AS client_id,
          c.name AS client_name,

          dt.name
            AS document_type_name,

          assigned.full_name
            AS assigned_user_name,

          (
            SELECT
              COUNT(*)::int
            FROM reminders r
            WHERE
              r.document_id =
              d.id
          ) AS reminders_count

        FROM documents d

        LEFT JOIN cases cs
          ON cs.id =
          d.case_id

        LEFT JOIN clients c
          ON c.id =
          cs.client_id

        LEFT JOIN document_types dt
          ON dt.id =
          d.document_type_id

        LEFT JOIN users assigned
          ON assigned.id =
          d.assigned_user_id

        WHERE d.id = ${id}

        LIMIT 1
      `;

    if (
      result.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Documento no encontrado"
        });
    }

    return res.json({
      ok: true,
      data: result[0]
    });

  } catch (error) {
    console.error(
      "GET_DOCUMENT_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener el documento"
      });
  }
}

/* =====================================================
   CREAR
   POST /api/documents
===================================================== */

export async function createDocument(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      createDocumentSchema.safeParse(
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

    const dueDate =
      parseDate(
        parsed.data.dueDate
      );

    if (!dueDate) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "La fecha límite no es válida"
        });
    }

    const caseResult =
      await sql`
        SELECT
          cs.id,
          cs.status,
          c.status
            AS client_status

        FROM cases cs

        INNER JOIN clients c
          ON c.id =
          cs.client_id

        WHERE
          cs.id =
            ${parsed.data.caseId}

        LIMIT 1
      `;

    if (
      caseResult.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Expediente no encontrado"
        });
    }

    if (
      caseResult[0].status !==
        "ACTIVE" ||
      caseResult[0]
        .client_status !==
        "ACTIVE"
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "El cliente o expediente está archivado"
        });
    }

    const typeResult =
      await sql`
        SELECT id
        FROM document_types
        WHERE
          id =
            ${parsed.data.documentTypeId}
          AND
          is_active =
            TRUE
        LIMIT 1
      `;

    if (
      typeResult.length === 0
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Tipo de documento inválido"
        });
    }

    const assignedUser =
      await sql`
        SELECT id
        FROM users
        WHERE
          id =
            ${parsed.data.assignedUserId}
          AND
          status =
            'ACTIVE'
        LIMIT 1
      `;

    if (
      assignedUser.length ===
      0
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Responsable inválido"
        });
    }

    const result =
      await sql`
        INSERT INTO documents (
          case_id,
          document_type_id,
          assigned_user_id,
          file_name,
          due_date,
          priority,
          status,
          notes,
          created_by
        )
        VALUES (
          ${parsed.data.caseId},
          ${parsed.data.documentTypeId},
          ${parsed.data.assignedUserId},
          ${parsed.data.fileName},
          ${dueDate.toISOString()},
          ${parsed.data.priority},
          'PENDING',
          ${
            parsed.data.notes ||
            null
          },
          ${userId}
        )

        RETURNING
          id,
          case_id,
          document_type_id,
          assigned_user_id,
          file_name,
          due_date,
          priority,
          status,
          notes,
          created_at,
          updated_at
      `;

    const document =
      result[0];

    await sql`
      INSERT INTO
        document_status_history (
          document_id,
          new_status,
          changed_by
        )
      VALUES (
        ${document.id},
        'PENDING',
        ${userId}
      )
    `;

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
        'DOCUMENT',
        ${document.id},
        'CREATE',
        ${JSON.stringify({
          fileName:
            document.file_name,

          priority:
            document.priority,

          status:
            document.status
        })}::jsonb
      )
    `;

    return res
      .status(201)
      .json({
        ok: true,

        message:
          "Documento creado correctamente",

        data:
          document
      });

  } catch (error) {
    console.error(
      "CREATE_DOCUMENT_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible crear el documento"
      });
  }
}

/* =====================================================
   EDITAR
   PUT /api/documents/:id
===================================================== */

export async function updateDocument(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const parsed =
      updateDocumentSchema.safeParse(
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
        SELECT
          id,
          case_id,
          document_type_id,
          assigned_user_id,
          file_name,
          due_date,
          priority,
          notes

        FROM documents

        WHERE id = ${id}

        LIMIT 1
      `;

    if (
      existing.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Documento no encontrado"
        });
    }

    const current =
      existing[0];

    const caseId =
      parsed.data.caseId ??
      current.case_id;

    const documentTypeId =
      parsed.data
        .documentTypeId ??
      current.document_type_id;

    const assignedUserId =
      parsed.data
        .assignedUserId ??
      current.assigned_user_id;

    const fileName =
      parsed.data.fileName ??
      current.file_name;

    const priority =
      parsed.data.priority ??
      current.priority;

    const notes =
      parsed.data.notes ??
      current.notes;

    let dueDate =
      current.due_date;

    if (
      parsed.data.dueDate
    ) {
      const parsedDate =
        parseDate(
          parsed.data.dueDate
        );

      if (!parsedDate) {
        return res
          .status(400)
          .json({
            ok: false,
            message:
              "Fecha límite inválida"
          });
      }

      dueDate =
        parsedDate
          .toISOString();
    }

    const result =
      await sql`
        UPDATE documents

        SET
          case_id =
            ${caseId},

          document_type_id =
            ${documentTypeId},

          assigned_user_id =
            ${assignedUserId},

          file_name =
            ${fileName},

          due_date =
            ${dueDate},

          priority =
            ${priority},

          notes =
            ${notes || null},

          updated_at =
            NOW()

        WHERE id = ${id}

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
          'DOCUMENT',
          ${id},
          'UPDATE',
          ${JSON.stringify({
            caseId,
            fileName,
            dueDate,
            priority
          })}::jsonb
        )
      `;
    }

    return res.json({
      ok: true,

      message:
        "Documento actualizado correctamente",

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "UPDATE_DOCUMENT_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible actualizar el documento"
      });
  }
}

/* =====================================================
   CAMBIO DE ESTADO
===================================================== */

async function changeStatus(
  req: Request,
  res: Response,
  newStatus:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
) {
  try {
    const { id } =
      req.params;

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

    const existing =
      await sql`
        SELECT
          id,
          status
        FROM documents
        WHERE id = ${id}
        LIMIT 1
      `;

    if (
      existing.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,
          message:
            "Documento no encontrado"
        });
    }

    const completedAt =
      newStatus ===
      "COMPLETED"
        ? new Date()
            .toISOString()
        : null;

    await sql`
      UPDATE documents

      SET
        status =
          ${newStatus},

        completed_at =
          ${completedAt},

        updated_at =
          NOW()

      WHERE id = ${id}
    `;

    /*
     * Al completar o cancelar
     * el documento cancelamos
     * recordatorios pendientes.
     */
    if (
      newStatus ===
        "COMPLETED" ||
      newStatus ===
        "CANCELLED"
    ) {
      await sql`
        UPDATE reminders

        SET
          status =
            'CANCELLED',

          updated_at =
            NOW()

        WHERE
          document_id =
            ${id}

          AND status IN (
            'SCHEDULED',
            'PROCESSING'
          )
      `;
    }

    await sql`
      INSERT INTO
        document_status_history (
          document_id,
          new_status,
          changed_by
        )
      VALUES (
        ${id},
        ${newStatus},
        ${userId}
      )
    `;

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
        'DOCUMENT',
        ${id},
        'STATUS_CHANGE',
        ${JSON.stringify({
          status:
            newStatus
        })}::jsonb
      )
    `;

    return res.json({
      ok: true,

      message:
        "Estado actualizado correctamente"
    });

  } catch (error) {
    console.error(
      "DOCUMENT_STATUS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible cambiar el estado"
      });
  }
}

export function completeDocument(
  req: Request,
  res: Response
) {
  return changeStatus(
    req,
    res,
    "COMPLETED"
  );
}

export function startDocument(
  req: Request,
  res: Response
) {
  return changeStatus(
    req,
    res,
    "IN_PROGRESS"
  );
}

export function reopenDocument(
  req: Request,
  res: Response
) {
  return changeStatus(
    req,
    res,
    "PENDING"
  );
}

export function cancelDocument(
  req: Request,
  res: Response
) {
  return changeStatus(
    req,
    res,
    "CANCELLED"
  );
}

/* =====================================================
   ELIMINAR
===================================================== */

export async function deleteDocument(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const existing =
      await sql`
        SELECT
          id,
          file_name
        FROM documents
        WHERE id = ${id}
        LIMIT 1
      `;

    if (
      existing.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,
          message:
            "Documento no encontrado"
        });
    }

    const reminders =
      await sql`
        SELECT
          COUNT(*)::int
            AS total
        FROM reminders
        WHERE
          document_id =
          ${id}
      `;

    if (
      Number(
        reminders[0]
          ?.total || 0
      ) > 0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Este documento tiene recordatorios. Cancélalo en lugar de eliminarlo."
        });
    }

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
          'DOCUMENT',
          ${id},
          'DELETE',
          ${JSON.stringify({
            fileName:
              existing[0]
                .file_name
          })}::jsonb
        )
      `;
    }

    await sql`
      DELETE FROM documents
      WHERE id = ${id}
    `;

    return res.json({
      ok: true,

      message:
        "Documento eliminado correctamente"
    });

  } catch (error) {
    console.error(
      "DELETE_DOCUMENT_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible eliminar el documento"
      });
  }
}
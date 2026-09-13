import type {
  Request,
  Response
} from "express";

import { z } from "zod";

import { sql } from "../config/db.js";

const createCaseSchema = z.object({
  clientId: z
    .string()
    .uuid("Cliente inválido"),

  caseNumber: z
    .string()
    .trim()
    .min(1, "El número de expediente es obligatorio")
    .max(100),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default("")
});

const updateCaseSchema = z.object({
  caseNumber: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional(),

  status: z
    .enum([
      "ACTIVE",
      "ARCHIVED"
    ])
    .optional()
});

function getPagination(req: Request) {
  const page = Math.max(
    Number(req.query.page) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number(req.query.limit) || 10,
      1
    ),
    100
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}

/* ======================================================
   GET /api/cases
====================================================== */

export async function getCases(
  req: Request,
  res: Response
) {
  try {
    const {
      page,
      limit,
      offset
    } = getPagination(req);

    const clientId =
      String(req.query.clientId || "");

    const search =
      String(req.query.search || "")
        .trim();

    const status =
      String(req.query.status || "ALL");

    const searchPattern =
      `%${search}%`;

    const cases = await sql`
      SELECT
        cs.id,
        cs.client_id,
        cs.case_number,
        cs.description,
        cs.status,
        cs.created_at,
        cs.updated_at,

        c.name AS client_name,

        u.full_name AS created_by_name,

        (
          SELECT COUNT(*)::int
          FROM documents d
          WHERE d.case_id = cs.id
        ) AS documents_count

      FROM cases cs

      INNER JOIN clients c
        ON c.id = cs.client_id

      LEFT JOIN users u
        ON u.id = cs.created_by

      WHERE
        (
          ${clientId} = ''
          OR cs.client_id::text = ${clientId}
        )

        AND (
          ${search} = ''
          OR cs.case_number ILIKE ${searchPattern}
          OR cs.description ILIKE ${searchPattern}
        )

        AND (
          ${status} = 'ALL'
          OR cs.status = ${status}
        )

      ORDER BY
        cs.created_at DESC

      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT
        COUNT(*)::int AS total

      FROM cases cs

      WHERE
        (
          ${clientId} = ''
          OR cs.client_id::text = ${clientId}
        )

        AND (
          ${search} = ''
          OR cs.case_number ILIKE ${searchPattern}
          OR cs.description ILIKE ${searchPattern}
        )

        AND (
          ${status} = 'ALL'
          OR cs.status = ${status}
        )
    `;

    const total =
      Number(
        countResult[0]?.total || 0
      );

    return res.json({
      ok: true,

      data: cases,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(
      "GET_CASES_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible obtener los expedientes"
    });
  }
}

/* ======================================================
   GET /api/cases/:id
====================================================== */

export async function getCaseById(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT
        cs.id,
        cs.client_id,
        cs.case_number,
        cs.description,
        cs.status,
        cs.created_at,
        cs.updated_at,

        c.name AS client_name,

        (
          SELECT COUNT(*)::int
          FROM documents d
          WHERE d.case_id = cs.id
        ) AS documents_count

      FROM cases cs

      INNER JOIN clients c
        ON c.id = cs.client_id

      WHERE cs.id = ${id}

      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Expediente no encontrado"
      });
    }

    return res.json({
      ok: true,
      data: result[0]
    });

  } catch (error) {
    console.error(
      "GET_CASE_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible obtener el expediente"
    });
  }
}

/* ======================================================
   POST /api/cases
====================================================== */

export async function createCase(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      createCaseSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        message:
          "Datos inválidos",
        errors:
          parsed.error.flatten()
            .fieldErrors
      });
    }

    const userId =
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message:
          "No autenticado"
      });
    }

    const clientResult = await sql`
      SELECT
        id,
        name,
        status

      FROM clients

      WHERE id = ${parsed.data.clientId}

      LIMIT 1
    `;

    if (clientResult.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Cliente no encontrado"
      });
    }

    if (
      clientResult[0].status !==
      "ACTIVE"
    ) {
      return res.status(409).json({
        ok: false,
        message:
          "No puedes crear expedientes para un cliente archivado"
      });
    }

    try {
      const result = await sql`
        INSERT INTO cases (
          client_id,
          case_number,
          description,
          created_by
        )
        VALUES (
          ${parsed.data.clientId},
          ${parsed.data.caseNumber},
          ${
            parsed.data.description ||
            null
          },
          ${userId}
        )

        RETURNING
          id,
          client_id,
          case_number,
          description,
          status,
          created_at,
          updated_at
      `;

      const newCase =
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
          'CASE',
          ${newCase.id},
          'CREATE',
          ${JSON.stringify({
            clientId:
              newCase.client_id,

            caseNumber:
              newCase.case_number,

            status:
              newCase.status
          })}::jsonb
        )
      `;

      return res
        .status(201)
        .json({
          ok: true,
          message:
            "Expediente creado correctamente",
          data: newCase
        });

    } catch (error: any) {
      if (
        error?.code ===
        "23505"
      ) {
        return res.status(409).json({
          ok: false,
          message:
            "Este cliente ya tiene un expediente con ese número"
        });
      }

      throw error;
    }

  } catch (error) {
    console.error(
      "CREATE_CASE_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible crear el expediente"
    });
  }
}

/* ======================================================
   PUT /api/cases/:id
====================================================== */

export async function updateCase(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const parsed =
      updateCaseSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        message:
          "Datos inválidos",
        errors:
          parsed.error.flatten()
            .fieldErrors
      });
    }

    const existing = await sql`
      SELECT
        id,
        client_id,
        case_number,
        description,
        status

      FROM cases

      WHERE id = ${id}

      LIMIT 1
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Expediente no encontrado"
      });
    }

    const current =
      existing[0];

    const caseNumber =
      parsed.data.caseNumber ??
      current.case_number;

    const description =
      parsed.data.description ??
      current.description;

    const status =
      parsed.data.status ??
      current.status;

    try {
      const result = await sql`
        UPDATE cases

        SET
          case_number =
            ${caseNumber},

          description =
            ${description || null},

          status =
            ${status},

          updated_at =
            NOW()

        WHERE id = ${id}

        RETURNING
          id,
          client_id,
          case_number,
          description,
          status,
          created_at,
          updated_at
      `;

      if (req.user?.userId) {
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
            'CASE',
            ${id},
            'UPDATE',
            ${JSON.stringify({
              caseNumber,
              description,
              status
            })}::jsonb
          )
        `;
      }

      return res.json({
        ok: true,
        message:
          "Expediente actualizado correctamente",
        data: result[0]
      });

    } catch (error: any) {
      if (
        error?.code ===
        "23505"
      ) {
        return res.status(409).json({
          ok: false,
          message:
            "Ya existe un expediente con ese número para este cliente"
        });
      }

      throw error;
    }

  } catch (error) {
    console.error(
      "UPDATE_CASE_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible actualizar el expediente"
    });
  }
}

/* ======================================================
   DELETE /api/cases/:id
====================================================== */

export async function deleteCase(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const existing = await sql`
      SELECT
        id,
        case_number

      FROM cases

      WHERE id = ${id}

      LIMIT 1
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Expediente no encontrado"
      });
    }

    const documents = await sql`
      SELECT
        COUNT(*)::int AS total

      FROM documents

      WHERE case_id = ${id}
    `;

    const documentsCount =
      Number(
        documents[0]?.total || 0
      );

    if (documentsCount > 0) {
      return res.status(409).json({
        ok: false,
        message:
          "Este expediente tiene documentos asociados. Archívalo en lugar de eliminarlo."
      });
    }

    if (req.user?.userId) {
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
          'CASE',
          ${id},
          'DELETE',
          ${JSON.stringify({
            caseNumber:
              existing[0].case_number
          })}::jsonb
        )
      `;
    }

    await sql`
      DELETE FROM cases
      WHERE id = ${id}
    `;

    return res.json({
      ok: true,
      message:
        "Expediente eliminado correctamente"
    });

  } catch (error) {
    console.error(
      "DELETE_CASE_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible eliminar el expediente"
    });
  }
}
import type {
  Request,
  Response
} from "express";

import { z } from "zod";

import { sql } from "../config/db.js";

const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "El nombre es demasiado largo")
});

const updateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(200)
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

  const offset =
    (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

/* ======================================================
   GET /api/clients
====================================================== */

export async function getClients(
  req: Request,
  res: Response
) {
  try {
    const {
      page,
      limit,
      offset
    } = getPagination(req);

    const search =
      String(req.query.search || "")
        .trim();

    const status =
      String(
        req.query.status || "ALL"
      );

    const searchPattern =
      `%${search}%`;

    const clients =
      await sql`
        SELECT
          c.id,
          c.name,
          c.status,
          c.created_at,
          c.updated_at,

          u.full_name AS created_by_name,

          (
            SELECT COUNT(*)::int
            FROM cases cs
            WHERE cs.client_id = c.id
          ) AS cases_count

        FROM clients c

        LEFT JOIN users u
          ON u.id = c.created_by

        WHERE
          (
            ${search} = ''
            OR c.name ILIKE ${searchPattern}
          )

          AND (
            ${status} = 'ALL'
            OR c.status = ${status}
          )

        ORDER BY
          c.created_at DESC

        LIMIT ${limit}
        OFFSET ${offset}
      `;

    const countResult =
      await sql`
        SELECT
          COUNT(*)::int AS total

        FROM clients

        WHERE
          (
            ${search} = ''
            OR name ILIKE ${searchPattern}
          )

          AND (
            ${status} = 'ALL'
            OR status = ${status}
          )
      `;

    const total =
      Number(
        countResult[0]?.total || 0
      );

    return res.json({
      ok: true,

      data: clients,

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
      "GET_CLIENTS_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible obtener los clientes"
    });
  }
}

/* ======================================================
   GET /api/clients/:id
====================================================== */

export async function getClientById(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const result =
      await sql`
        SELECT
          id,
          name,
          status,
          created_at,
          updated_at

        FROM clients

        WHERE id = ${id}

        LIMIT 1
      `;

    if (result.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Cliente no encontrado"
      });
    }

    return res.json({
      ok: true,
      data: result[0]
    });

  } catch (error) {
    console.error(
      "GET_CLIENT_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible obtener el cliente"
    });
  }
}

/* ======================================================
   POST /api/clients
====================================================== */

export async function createClient(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      createClientSchema.safeParse(
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

    const result =
      await sql`
        INSERT INTO clients (
          name,
          created_by
        )
        VALUES (
          ${parsed.data.name},
          ${userId}
        )

        RETURNING
          id,
          name,
          status,
          created_at,
          updated_at
      `;

    const client =
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
        'CLIENT',
        ${client.id},
        'CREATE',
        ${JSON.stringify({
          name: client.name,
          status: client.status
        })}::jsonb
      )
    `;

    return res
      .status(201)
      .json({
        ok: true,
        message:
          "Cliente creado correctamente",
        data: client
      });

  } catch (error) {
    console.error(
      "CREATE_CLIENT_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible crear el cliente"
    });
  }
}

/* ======================================================
   PUT /api/clients/:id
====================================================== */

export async function updateClient(
  req: Request,
  res: Response
) {
  try {
    const { id } =
      req.params;

    const parsed =
      updateClientSchema.safeParse(
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

    if (
      !parsed.data.name &&
      !parsed.data.status
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "No hay cambios para guardar"
      });
    }

    const existing =
      await sql`
        SELECT
          id,
          name,
          status

        FROM clients

        WHERE id = ${id}

        LIMIT 1
      `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Cliente no encontrado"
      });
    }

    const current =
      existing[0];

    const newName =
      parsed.data.name ??
      current.name;

    const newStatus =
      parsed.data.status ??
      current.status;

    const result =
      await sql`
        UPDATE clients

        SET
          name = ${newName},
          status = ${newStatus},
          updated_at = NOW()

        WHERE id = ${id}

        RETURNING
          id,
          name,
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
          'CLIENT',
          ${id},
          'UPDATE',
          ${JSON.stringify({
            name: newName,
            status: newStatus
          })}::jsonb
        )
      `;
    }

    return res.json({
      ok: true,
      message:
        "Cliente actualizado correctamente",
      data: result[0]
    });

  } catch (error) {
    console.error(
      "UPDATE_CLIENT_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible actualizar el cliente"
    });
  }
}

/* ======================================================
   DELETE /api/clients/:id
====================================================== */

export async function deleteClient(
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
          name

        FROM clients

        WHERE id = ${id}

        LIMIT 1
      `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "Cliente no encontrado"
      });
    }

    const cases =
      await sql`
        SELECT
          COUNT(*)::int AS total

        FROM cases

        WHERE client_id = ${id}
      `;

    const casesCount =
      Number(
        cases[0]?.total || 0
      );

    if (casesCount > 0) {
      return res.status(409).json({
        ok: false,
        message:
          "No puedes eliminar este cliente porque tiene expedientes asociados. Archívalo en su lugar."
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
          'CLIENT',
          ${id},
          'DELETE',
          ${JSON.stringify({
            name: existing[0].name
          })}::jsonb
        )
      `;
    }

    await sql`
      DELETE FROM clients
      WHERE id = ${id}
    `;

    return res.json({
      ok: true,
      message:
        "Cliente eliminado correctamente"
    });

  } catch (error) {
    console.error(
      "DELETE_CLIENT_ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "No fue posible eliminar el cliente"
    });
  }
}
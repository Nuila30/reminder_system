import type {
  Request,
  Response
} from "express";

import bcrypt from "bcryptjs";

import {
  z
} from "zod";

import {
  sql
} from "../config/db.js";

/* =====================================================
   CONSTANTES
===================================================== */

const roleSchema =
  z.enum([
    "ADMIN",
    "SUPERVISOR",
    "EMPLOYEE",
    "READ_ONLY"
  ]);

const statusSchema =
  z.enum([
    "ACTIVE",
    "INACTIVE"
  ]);

/* =====================================================
   VALIDACIONES
===================================================== */

const createUserSchema =
  z.object({
    email:
      z.string()
        .trim()
        .email(
          "Correo electrónico inválido"
        ),

    fullName:
      z.string()
        .trim()
        .min(
          2,
          "El nombre es obligatorio"
        ),

    role:
      roleSchema,

    password:
      z.string()
        .min(
          8,
          "La contraseña debe tener al menos 8 caracteres"
        ),

    mustChangePassword:
      z.boolean()
        .default(true)
  });

const updateUserSchema =
  z.object({
    email:
      z.string()
        .trim()
        .email(
          "Correo electrónico inválido"
        ),

    fullName:
      z.string()
        .trim()
        .min(
          2,
          "El nombre es obligatorio"
        ),

    role:
      roleSchema
  });

const resetPasswordSchema =
  z.object({
    password:
      z.string()
        .min(
          8,
          "La contraseña debe tener al menos 8 caracteres"
        )
  });

/* =====================================================
   LISTAR USUARIOS
   GET /api/users
===================================================== */

export async function getUsers(
  req: Request,
  res: Response
) {
  try {
    const search =
      String(
        req.query.search ||
        ""
      ).trim();

    const role =
      String(
        req.query.role ||
        "ALL"
      );

    const status =
      String(
        req.query.status ||
        "ALL"
      );

    if (
      role !== "ALL" &&
      !roleSchema
        .safeParse(
          role
        )
        .success
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Rol inválido"
        });
    }

    if (
      status !== "ALL" &&
      !statusSchema
        .safeParse(
          status
        )
        .success
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          message:
            "Estado inválido"
        });
    }

    const users =
      await sql`
        SELECT
          id,
          email,
          full_name,
          role,
          status,
          must_change_password,
          last_login_at,
          created_at,
          updated_at

        FROM users

        WHERE
          (
            ${search} = ''

            OR

            LOWER(full_name)
              LIKE
              LOWER(
                ${`%${search}%`}
              )

            OR

            LOWER(email)
              LIKE
              LOWER(
                ${`%${search}%`}
              )
          )

          AND (
            ${role} = 'ALL'

            OR

            role = ${role}
          )

          AND (
            ${status} = 'ALL'

            OR

            status = ${status}
          )

        ORDER BY
          CASE
            WHEN status = 'ACTIVE'
            THEN 0
            ELSE 1
          END,

          full_name ASC
      `;

    const statsResult =
      await sql`
        SELECT
          COUNT(*)::int
            AS total,

          COUNT(*) FILTER (
            WHERE status = 'ACTIVE'
          )::int
            AS active,

          COUNT(*) FILTER (
            WHERE status = 'INACTIVE'
          )::int
            AS inactive,

          COUNT(*) FILTER (
            WHERE role = 'ADMIN'
          )::int
            AS admins

        FROM users
      `;

    const stats =
      statsResult[0];

    return res.json({
      ok: true,

      data:
        users,

      stats: {
        total:
          Number(
            stats?.total ||
            0
          ),

        active:
          Number(
            stats?.active ||
            0
          ),

        inactive:
          Number(
            stats?.inactive ||
            0
          ),

        admins:
          Number(
            stats?.admins ||
            0
          )
      }
    });

  } catch (error) {
    console.error(
      "GET_USERS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener los usuarios"
      });
  }
}

/* =====================================================
   OBTENER USUARIO
   GET /api/users/:id
===================================================== */

export async function getUserById(
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
          id,
          email,
          full_name,
          role,
          status,
          must_change_password,
          last_login_at,
          created_at,
          updated_at

        FROM users

        WHERE
          id = ${id}

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
            "Usuario no encontrado"
        });
    }

    return res.json({
      ok: true,

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "GET_USER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible obtener el usuario"
      });
  }
}

/* =====================================================
   CREAR USUARIO
   POST /api/users
===================================================== */

export async function createUser(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      createUserSchema
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
        SELECT id

        FROM users

        WHERE
          LOWER(email) =
          LOWER(
            ${parsed.data.email}
          )

        LIMIT 1
      `;

    if (
      existing.length > 0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Ya existe un usuario con este correo electrónico"
        });
    }

    const passwordHash =
      await bcrypt.hash(
        parsed.data.password,
        12
      );

    const result =
      await sql`
        INSERT INTO users (
          email,
          password_hash,
          full_name,
          role,
          status,
          must_change_password
        )
        VALUES (
          ${parsed.data.email},

          ${passwordHash},

          ${parsed.data.fullName},

          ${parsed.data.role},

          'ACTIVE',

          ${parsed.data.mustChangePassword}
        )

        RETURNING
          id,
          email,
          full_name,
          role,
          status,
          must_change_password,
          created_at,
          updated_at
      `;

    const user =
      result[0];

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

          'USER',

          ${user.id},

          'CREATE',

          ${JSON.stringify({
            email:
              user.email,

            fullName:
              user.full_name,

            role:
              user.role,

            status:
              user.status
          })}::jsonb
        )
      `;
    }

    return res
      .status(201)
      .json({
        ok: true,

        message:
          "Usuario creado correctamente",

        data:
          user
      });

  } catch (error) {
    console.error(
      "CREATE_USER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible crear el usuario"
      });
  }
}

/* =====================================================
   EDITAR USUARIO
   PUT /api/users/:id
===================================================== */

export async function updateUser(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const parsed =
      updateUserSchema
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
        SELECT
          id

        FROM users

        WHERE
          LOWER(email) =
          LOWER(
            ${parsed.data.email}
          )

          AND

          id <> ${id}

        LIMIT 1
      `;

    if (
      existing.length > 0
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "Ese correo ya pertenece a otro usuario"
        });
    }

    const result =
      await sql`
        UPDATE users

        SET
          email =
            ${parsed.data.email},

          full_name =
            ${parsed.data.fullName},

          role =
            ${parsed.data.role},

          updated_at =
            NOW()

        WHERE
          id = ${id}

        RETURNING
          id,
          email,
          full_name,
          role,
          status,
          must_change_password,
          last_login_at,
          created_at,
          updated_at
      `;

    if (
      result.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Usuario no encontrado"
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

          'USER',

          ${id},

          'UPDATE',

          ${JSON.stringify({
            email:
              parsed.data.email,

            fullName:
              parsed.data.fullName,

            role:
              parsed.data.role
          })}::jsonb
        )
      `;
    }

    return res.json({
      ok: true,

      message:
        "Usuario actualizado correctamente",

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "UPDATE_USER_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible actualizar el usuario"
      });
  }
}

/* =====================================================
   CAMBIAR ESTADO
   POST /api/users/:id/status
===================================================== */

export async function changeUserStatus(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const parsed =
      z.object({
        status:
          statusSchema
      })
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
            "Estado inválido"
        });
    }

    /*
     * Impedir que el administrador
     * desactive su propia cuenta.
     */
    if (
      req.user?.userId ===
        id &&
      parsed.data.status ===
        "INACTIVE"
    ) {
      return res
        .status(409)
        .json({
          ok: false,

          message:
            "No puedes desactivar tu propia cuenta"
        });
    }

    const result =
      await sql`
        UPDATE users

        SET
          status =
            ${parsed.data.status},

          updated_at =
            NOW()

        WHERE
          id =
          ${id}

        RETURNING
          id,
          email,
          full_name,
          role,
          status
      `;

    if (
      result.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Usuario no encontrado"
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

          'USER',

          ${id},

          'STATUS_CHANGE',

          ${JSON.stringify({
            status:
              parsed.data.status
          })}::jsonb
        )
      `;
    }

    return res.json({
      ok: true,

      message:
        parsed.data.status ===
        "ACTIVE"
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente",

      data:
        result[0]
    });

  } catch (error) {
    console.error(
      "CHANGE_USER_STATUS_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible cambiar el estado del usuario"
      });
  }
}

/* =====================================================
   RESTABLECER CONTRASEÑA
   POST /api/users/:id/reset-password
===================================================== */

export async function resetUserPassword(
  req: Request,
  res: Response
) {
  try {
    const {
      id
    } =
      req.params;

    const parsed =
      resetPasswordSchema
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
            "Contraseña inválida",

          errors:
            parsed.error
              .flatten()
              .fieldErrors
        });
    }

    const passwordHash =
      await bcrypt.hash(
        parsed.data.password,
        12
      );

    const result =
      await sql`
        UPDATE users

        SET
          password_hash =
            ${passwordHash},

          must_change_password =
            TRUE,

          updated_at =
            NOW()

        WHERE
          id =
          ${id}

        RETURNING
          id,
          email,
          full_name
      `;

    if (
      result.length === 0
    ) {
      return res
        .status(404)
        .json({
          ok: false,

          message:
            "Usuario no encontrado"
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

          'USER',

          ${id},

          'PASSWORD_RESET',

          '{"mustChangePassword":true}'::jsonb
        )
      `;
    }

    return res.json({
      ok: true,

      message:
        "Contraseña restablecida correctamente. El usuario deberá cambiarla al iniciar sesión."
    });

  } catch (error) {
    console.error(
      "RESET_USER_PASSWORD_ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        message:
          "No fue posible restablecer la contraseña"
      });
  }
}
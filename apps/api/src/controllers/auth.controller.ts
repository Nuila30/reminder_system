import type {
  Request,
  Response
} from "express";

import { z } from "zod";

import {
  authenticateUser,
  getAuthenticatedUser
} from "../services/auth.service.js";

import { env } from "../config/env.js";

const loginSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido"),

  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
});
export async function login(
  req: Request,
  res: Response
) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const result = await authenticateUser(
      parsed.data.email,
      parsed.data.password
    );

    if (!result) {
      return res.status(401).json({
        ok: false,
        message: "Correo o contraseña incorrectos"
      });
    }

    res.cookie(
      "session",
      result.token,
      {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000
      }
    );

    return res.status(200).json({
      ok: true,
      message: "Inicio de sesión correcto",
      user: result.user
    });

  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
}

export async function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie("session");

  return res.json({
    ok: true,
    message: "Sesión cerrada"
  });
}
export async function me(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "No autenticado"
      });
    }

    const user = await getAuthenticatedUser(
      req.user.userId
    );

    if (!user) {
      res.clearCookie("session");

      return res.status(401).json({
        ok: false,
        message: "Usuario no disponible"
      });
    }

    return res.status(200).json({
      ok: true,
      user
    });

  } catch (error) {
    console.error("AUTH_ME_ERROR:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
}
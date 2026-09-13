import type {
  RequestHandler
} from "express";

import jwt from "jsonwebtoken";

import {
  env
} from "../config/env.js";

import type {
  AuthTokenPayload
} from "../types/auth.js";

export const requireAuth:
  RequestHandler = (
    req,
    res,
    next
  ) => {
    const token =
      req.cookies?.session as
        | string
        | undefined;

    if (!token) {
      res
        .status(401)
        .json({
          ok: false,
          message:
            "No autenticado"
        });

      return;
    }

    try {
      const decoded =
        jwt.verify(
          token,
          env.JWT_SECRET
        );

      if (
        typeof decoded ===
        "string"
      ) {
        res
          .status(401)
          .json({
            ok: false,
            message:
              "Sesión inválida"
          });

        return;
      }

      const payload =
        decoded as AuthTokenPayload;

      if (
        !payload.userId ||
        !payload.email ||
        !payload.role
      ) {
        res
          .status(401)
          .json({
            ok: false,
            message:
              "Sesión inválida"
          });

        return;
      }

      req.user =
        payload;

      next();

    } catch {
      res
        .status(401)
        .json({
          ok: false,
          message:
            "Sesión inválida o expirada"
        });

      return;
    }
  };
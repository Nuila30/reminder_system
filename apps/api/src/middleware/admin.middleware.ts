import type {
  RequestHandler
} from "express";

export const requireAdmin:
  RequestHandler = (
    req,
    res,
    next
  ) => {
    if (!req.user) {
      res
        .status(401)
        .json({
          ok: false,
          message:
            "No autenticado"
        });

      return;
    }

    if (
      req.user.role !==
      "ADMIN"
    ) {
      res
        .status(403)
        .json({
          ok: false,
          message:
            "No tienes permisos para administrar usuarios"
        });

      return;
    }

    next();
  };
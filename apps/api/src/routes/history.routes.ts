import {
  Router
} from "express";

import {
  getHistory
} from "../controllers/history.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

const router =
  Router();

/* =====================================================
   PROTECCIÓN DE RUTAS
===================================================== */

router.use(
  requireAuth
);

/* =====================================================
   HISTORIAL
   GET /api/history
===================================================== */

router.get(
  "/",
  getHistory
);

/* =====================================================
   EXPORT
===================================================== */

export default router;
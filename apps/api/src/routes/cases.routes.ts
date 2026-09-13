import {
  Router
} from "express";

import {
  createCase,
  deleteCase,
  getCaseById,
  getCases,
  updateCase
} from "../controllers/cases.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  getCases
);

router.get(
  "/:id",
  getCaseById
);

router.post(
  "/",
  createCase
);

router.put(
  "/:id",
  updateCase
);

router.delete(
  "/:id",
  deleteCase
);

export default router;
import {
  Router
} from "express";

import {
  cancelDocument,
  completeDocument,
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocumentFormOptions,
  getDocuments,
  reopenDocument,
  startDocument,
  updateDocument
} from "../controllers/documents.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

const router =
  Router();

router.use(
  requireAuth
);

router.get(
  "/form-options",
  getDocumentFormOptions
);

router.get(
  "/",
  getDocuments
);

router.get(
  "/:id",
  getDocumentById
);

router.post(
  "/",
  createDocument
);

router.put(
  "/:id",
  updateDocument
);

router.post(
  "/:id/start",
  startDocument
);

router.post(
  "/:id/complete",
  completeDocument
);

router.post(
  "/:id/reopen",
  reopenDocument
);

router.post(
  "/:id/cancel",
  cancelDocument
);

router.delete(
  "/:id",
  deleteDocument
);

export default router;
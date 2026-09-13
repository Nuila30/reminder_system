import {
  Router
} from "express";

import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient
} from "../controllers/clients.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

const router =
  Router();

router.use(requireAuth);

router.get(
  "/",
  getClients
);

router.get(
  "/:id",
  getClientById
);

router.post(
  "/",
  createClient
);

router.put(
  "/:id",
  updateClient
);

router.delete(
  "/:id",
  deleteClient
);

export default router;
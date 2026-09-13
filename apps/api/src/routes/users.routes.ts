import {
  Router
} from "express";

import {
  changeUserStatus,
  createUser,
  getUserById,
  getUsers,
  resetUserPassword,
  updateUser
} from "../controllers/users.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

import {
  requireAdmin
} from "../middleware/admin.middleware.js";

const router =
  Router();

router.use(
  requireAuth
);

router.use(
  requireAdmin
);

router.get(
  "/",
  getUsers
);

router.get(
  "/:id",
  getUserById
);

router.post(
  "/",
  createUser
);

router.put(
  "/:id",
  updateUser
);

router.post(
  "/:id/status",
  changeUserStatus
);

router.post(
  "/:id/reset-password",
  resetUserPassword
);

export default router;
import {
  Router
} from "express";

import {
  cancelReminder,
  createReminder,
  deleteReminder,
  getReminderById,
  getReminders,
  reactivateReminder,
  updateReminder
} from "../controllers/reminders.controller.js";

import {
  requireAuth
} from "../middleware/auth.middleware.js";

const router =
  Router();

router.use(
  requireAuth
);

router.get(
  "/",
  getReminders
);

router.get(
  "/:id",
  getReminderById
);

router.post(
  "/",
  createReminder
);

router.put(
  "/:id",
  updateReminder
);

router.post(
  "/:id/cancel",
  cancelReminder
);

router.post(
  "/:id/reactivate",
  reactivateReminder
);

router.delete(
  "/:id",
  deleteReminder
);

export default router;
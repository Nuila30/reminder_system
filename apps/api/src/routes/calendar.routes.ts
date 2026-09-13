import {
  Router
} from "express";

import {
  getCalendarEvents
} from "../controllers/calendar.controller.js";

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
  getCalendarEvents
);

export default router;
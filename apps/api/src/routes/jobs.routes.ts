import {
  Router
} from "express";

import {
  env
} from "../config/env.js";

import {
  processDueReminders
} from "../services/reminder-engine.service.js";

const router =
  Router();

router.post(
  "/process-reminders",

  async (
    req,
    res
  ) => {
    const secret =
      req.headers[
        "x-job-secret"
      ];

    if (
      secret !==
      env.JOB_SECRET
    ) {
      return res
        .status(401)
        .json({
          ok: false,

          message:
            "No autorizado"
        });
    }

    try {
      const result =
        await processDueReminders();

      return res.json({
        ok: true,

        ...result
      });

    } catch (error) {
      console.error(
        "PROCESS_REMINDERS_JOB_ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          message:
            "Error procesando recordatorios"
        });
    }
  }
);

export default router;
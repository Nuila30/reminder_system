import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import casesRoutes from "./routes/cases.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import remindersRoutes from "./routes/reminders.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import historyRoutes from "./routes/history.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import usersRoutes from "./routes/users.routes.js";


/* =====================================================
   APP
===================================================== */

export const app =
  express();

/* =====================================================
   CONFIGURACIÓN GENERAL
===================================================== */

app.disable(
  "x-powered-by"
);

app.use(
  cors({
    origin:
      env.FRONTEND_URL,

    credentials:
      true
  })
);

app.use(
  express.json({
    limit:
      "1mb"
  })
);

app.use(
  express.urlencoded({
    extended:
      true
  })
);

app.use(
  cookieParser()
);

/* =====================================================
   HOME
===================================================== */

app.get(
  "/",
  (_req, res) => {
    return res
      .status(200)
      .json({
        ok:
          true,

        name:
          "Reminder System API",

        version:
          "1.0.0"
      });
  }
);

/* =====================================================
   RUTAS
===================================================== */

app.use(
  "/api/health",
  healthRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/clients",
  clientsRoutes
);

app.use(
  "/api/cases",
  casesRoutes
);

app.use(
  "/api/documents",
  documentsRoutes
);

app.use(
  "/api/reminders",
  remindersRoutes
);

app.use(
  "/api/calendar",
  calendarRoutes
);

app.use(
  "/api/history",
  historyRoutes
);

app.use(
  "/api/users",
  usersRoutes
);

app.use(
  "/api/jobs",
  jobsRoutes
);

/* =====================================================
   404
===================================================== */

app.use(
  (_req, res) => {
    return res
      .status(404)
      .json({
        ok:
          false,

        message:
          "Ruta no encontrada"
      });
  }
);
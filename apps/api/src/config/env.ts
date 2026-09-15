import dotenv from "dotenv";

import {
  existsSync
} from "node:fs";

import {
  dirname,
  resolve
} from "node:path";

import {
  fileURLToPath
} from "node:url";

import {
  z
} from "zod";

/* =====================================================
   CARGAR .ENV LOCAL
===================================================== */

const currentFile =
  fileURLToPath(
    import.meta.url
  );

const currentDir =
  dirname(
    currentFile
  );

/*
 * Funciona cuando se ejecuta desde:
 *
 * apps/api/src/config/env.ts
 *
 * y también desde:
 *
 * apps/api/dist/config/env.js
 */
const rootEnvPath =
  resolve(
    currentDir,
    "../../../../.env"
  );

/*
 * En Netlify normalmente este archivo no existe.
 * En ese caso se utilizan directamente process.env.
 */
if (
  existsSync(
    rootEnvPath
  )
) {
  dotenv.config({
    path:
      rootEnvPath
  });
}

/* =====================================================
   URL DE PRODUCCION
===================================================== */

const deploymentUrl =
  process.env.URL ||
  "http://localhost:5173";

/* =====================================================
   SCHEMA
===================================================== */

const envSchema =
  z.object({

    /* =================================================
       ENTORNO
    ================================================= */

    NODE_ENV:
      z.enum([
        "development",
        "production",
        "test"
      ])
        .default(
          "development"
        ),

    PORT:
      z.coerce
        .number()
        .int()
        .positive()
        .default(
          4000
        ),

    /* =================================================
       DATABASE
    ================================================= */

    DATABASE_URL:
      z.string()
        .min(
          1,
          "DATABASE_URL es obligatoria"
        ),

    /* =================================================
       APLICACION
    ================================================= */

    FRONTEND_URL:
      z.string()
        .url(
          "FRONTEND_URL debe ser una URL válida"
        ),

    APP_URL:
      z.string()
        .url(
          "APP_URL debe ser una URL válida"
        ),

    /* =================================================
       SEGURIDAD
    ================================================= */

    JWT_SECRET:
      z.string()
        .min(
          32,
          "JWT_SECRET debe tener al menos 32 caracteres"
        ),

    JOB_SECRET:
      z.string()
        .min(
          32,
          "JOB_SECRET debe tener al menos 32 caracteres"
        ),

    /* =================================================
       WORKER
    ================================================= */

    ENABLE_LOCAL_WORKER:
      z.enum([
        "true",
        "false"
      ])
        .default(
          "true"
        ),

    /* =================================================
       EMAIL
    ================================================= */

    EMAIL_PROVIDER:
      z.enum([
        "console",
        "smtp"
      ])
        .default(
          "console"
        ),

    EMAIL_FROM:
      z.string()
        .min(
          1,
          "EMAIL_FROM es obligatorio"
        ),

    SMTP_HOST:
      z.string()
        .default(
          "smtp.gmail.com"
        ),

    SMTP_PORT:
      z.coerce
        .number()
        .int()
        .positive()
        .default(
          465
        ),

    SMTP_SECURE:
      z.enum([
        "true",
        "false"
      ])
        .default(
          "true"
        ),

    SMTP_USER:
      z.string()
        .optional(),

    SMTP_PASS:
      z.string()
        .optional(),

    /* =================================================
       WHATSAPP
    ================================================= */

    WHATSAPP_PROVIDER:
      z.enum([
        "console",
        "meta"
      ])
        .default(
          "console"
        ),

    WHATSAPP_ACCESS_TOKEN:
      z.string()
        .optional(),

    WHATSAPP_PHONE_NUMBER_ID:
      z.string()
        .optional(),

    WHATSAPP_API_VERSION:
      z.string()
        .default(
          "v23.0"
        ),

    WHATSAPP_TEMPLATE_NAME:
      z.string()
        .default(
          "document_reminder"
        ),

    WHATSAPP_TEMPLATE_LANGUAGE:
      z.string()
        .default(
          "es"
        )
  });

/* =====================================================
   PREPARAR VARIABLES
===================================================== */

const rawEnvironment = {
  ...process.env,

  /*
   * En Netlify podemos utilizar automáticamente
   * process.env.URL si FRONTEND_URL o APP_URL
   * no fueron configuradas manualmente.
   */

  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    deploymentUrl,

  APP_URL:
    process.env.APP_URL ||
    deploymentUrl
};

/* =====================================================
   VALIDAR
===================================================== */

const parsed =
  envSchema.safeParse(
    rawEnvironment
  );

if (
  !parsed.success
) {

  console.error("");
  console.error(
    "=============================================="
  );

  console.error(
    "❌ VARIABLES DE ENTORNO INVÁLIDAS"
  );

  console.error(
    "=============================================="
  );

  console.error(
    parsed.error
      .flatten()
      .fieldErrors
  );

  console.error(
    "=============================================="
  );

  console.error("");

  throw new Error(
    "Variables de entorno inválidas"
  );
}

const env =
  parsed.data;

/* =====================================================
   VALIDACION SMTP
===================================================== */

if (
  env.EMAIL_PROVIDER ===
  "smtp"
) {

  if (
    !env.SMTP_USER
  ) {
    throw new Error(
      "EMAIL_PROVIDER=smtp requiere SMTP_USER"
    );
  }

  if (
    !env.SMTP_PASS
  ) {
    throw new Error(
      "EMAIL_PROVIDER=smtp requiere SMTP_PASS"
    );
  }
}

/* =====================================================
   VALIDACION WHATSAPP
===================================================== */

if (
  env.WHATSAPP_PROVIDER ===
    "meta" &&
  (
    !env.WHATSAPP_ACCESS_TOKEN ||
    !env.WHATSAPP_PHONE_NUMBER_ID
  )
) {

  throw new Error(
    "WHATSAPP_PROVIDER=meta requiere WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID"
  );
}

/* =====================================================
   EXPORT
===================================================== */

export {
  env
};
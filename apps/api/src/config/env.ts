import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "production",
      "test"
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  DATABASE_URL: z
    .string()
    .min(
      1,
      "DATABASE_URL es obligatoria"
    ),

  FRONTEND_URL: z
    .string()
    .default(
      "http://localhost:5173"
    ),

  APP_URL: z
    .string()
    .default(
      "http://localhost:5173"
    ),

  JWT_SECRET: z
    .string()
    .min(
      16,
      "JWT_SECRET debe tener al menos 16 caracteres"
    ),

  JOB_SECRET: z
    .string()
    .min(
      16,
      "JOB_SECRET debe tener al menos 16 caracteres"
    ),

  ENABLE_LOCAL_WORKER: z
    .string()
    .default("true"),

  EMAIL_PROVIDER: z
    .enum([
      "console",
      "resend"
    ])
    .default("console"),

  EMAIL_FROM: z
    .string()
    .default(
      "Reminder System <reminders@example.com>"
    ),

  RESEND_API_KEY: z
    .string()
    .optional(),

  WHATSAPP_PROVIDER: z
    .enum([
      "console",
      "meta"
    ])
    .default("console"),

  WHATSAPP_ACCESS_TOKEN: z
    .string()
    .optional(),

  WHATSAPP_PHONE_NUMBER_ID: z
    .string()
    .optional(),

  WHATSAPP_API_VERSION: z
    .string()
    .default("v23.0"),

  WHATSAPP_TEMPLATE_NAME: z
    .string()
    .default(
      "document_reminder"
    ),

  WHATSAPP_TEMPLATE_LANGUAGE: z
    .string()
    .default("es")
});

const parsed =
  envSchema.safeParse(
    process.env
  );

if (!parsed.success) {
  console.error("");
  console.error(
    "❌ Error en variables de entorno"
  );

  console.error(
    parsed.error
      .flatten()
      .fieldErrors
  );

  console.error("");

  process.exit(1);
}

export const env =
  parsed.data;
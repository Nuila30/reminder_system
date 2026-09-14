import nodemailer from "nodemailer";

import {
  env
} from "../../config/env.js";

/* =====================================================
   TIPOS
===================================================== */

export interface EmailNotificationInput {
  to: string;
  subject: string;
  text: string;
}

/*
 * IMPORTANTE:
 *
 * providerResponse y error son opcionales.
 *
 * Esto mantiene compatibilidad con:
 * - email.service.ts
 * - whatsapp.service.ts
 * - reminder-engine.service.ts
 */
export interface NotificationResult {
  ok: boolean;
  providerResponse?: string;
  error?: string;
}

/* =====================================================
   TRANSPORTER SMTP
===================================================== */

const transporter =
  env.EMAIL_PROVIDER === "smtp"
    ? nodemailer.createTransport({
        host:
          env.SMTP_HOST,

        port:
          env.SMTP_PORT,

        secure:
          env.SMTP_SECURE === "true",

        auth: {
          user:
            env.SMTP_USER,

          pass:
            env.SMTP_PASS
        }
      })
    : null;

/* =====================================================
   ENVIAR EMAIL
===================================================== */

export async function sendEmailNotification(
  input: EmailNotificationInput
): Promise<NotificationResult> {

  /* =================================================
     MODO CONSOLA
  ================================================= */

  if (
    env.EMAIL_PROVIDER === "console"
  ) {

    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "📧 EMAIL SIMULADO"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Para:",
      input.to
    );

    console.log(
      "Asunto:",
      input.subject
    );

    console.log("");

    console.log(
      input.text
    );

    console.log(
      "========================================"
    );

    console.log("");

    return {
      ok:
        true,

      providerResponse:
        JSON.stringify({
          provider:
            "console",

          to:
            input.to,

          sentAt:
            new Date()
              .toISOString()
        })
    };
  }

  /* =================================================
     SMTP
  ================================================= */

  if (
    env.EMAIL_PROVIDER === "smtp"
  ) {

    if (
      !transporter
    ) {
      return {
        ok:
          false,

        error:
          "SMTP no está configurado"
      };
    }

    try {

      const info =
        await transporter.sendMail({
          from:
            env.EMAIL_FROM,

          to:
            input.to,

          subject:
            input.subject,

          text:
            input.text
        });

      console.log(
        `[EMAIL] ✅ Enviado correctamente a ${input.to}`
      );

      console.log(
        `[EMAIL] Message ID: ${info.messageId}`
      );

      return {
        ok:
          true,

        providerResponse:
          JSON.stringify({
            provider:
              "smtp",

            messageId:
              info.messageId,

            accepted:
              info.accepted,

            rejected:
              info.rejected,

            response:
              info.response
          })
      };

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "[EMAIL] ❌ Error SMTP:",
        message
      );

      return {
        ok:
          false,

        error:
          message
      };
    }
  }

  /* =================================================
     PROVIDER NO SOPORTADO
  ================================================= */

  return {
    ok:
      false,

    error:
      `EMAIL_PROVIDER no soportado: ${env.EMAIL_PROVIDER}`
  };
}

/* =====================================================
   ALIAS
===================================================== */

export async function sendEmail(
  input: EmailNotificationInput
): Promise<NotificationResult> {

  return sendEmailNotification(
    input
  );
}

/* =====================================================
   VERIFICAR CONEXIÓN SMTP
===================================================== */

export async function verifyEmailConnection() {

  /* =================================================
     CONSOLE
  ================================================= */

  if (
    env.EMAIL_PROVIDER ===
    "console"
  ) {

    return {
      ok:
        true,

      provider:
        "console",

      message:
        "Email configurado en modo consola"
    };
  }

  /* =================================================
     VALIDAR PROVIDER
  ================================================= */

  if (
    env.EMAIL_PROVIDER !==
    "smtp"
  ) {

    throw new Error(
      `Proveedor no soportado: ${env.EMAIL_PROVIDER}`
    );
  }

  /* =================================================
     VALIDAR TRANSPORTER
  ================================================= */

  if (
    !transporter
  ) {

    throw new Error(
      "SMTP no está configurado"
    );
  }

  /* =================================================
     VERIFICAR
  ================================================= */

  await transporter.verify();

  console.log(
    "[EMAIL] ✅ Conexión SMTP correcta"
  );

  return {
    ok:
      true,

    provider:
      "smtp",

    message:
      "Conexión SMTP correcta"
  };
}
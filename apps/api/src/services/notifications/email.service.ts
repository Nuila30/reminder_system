import nodemailer from "nodemailer";

import {
  env
} from "../../config/env.js";

/* =====================================================
   TIPOS
===================================================== */

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

/* =====================================================
   TRANSPORT SMTP
===================================================== */

const transporter =
  env.EMAIL_PROVIDER ===
  "smtp"
    ? nodemailer.createTransport({
        host:
          env.SMTP_HOST,

        port:
          env.SMTP_PORT,

        secure:
          env.SMTP_SECURE ===
          "true",

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

export async function sendEmail(
  input: SendEmailInput
) {

  /* =================================================
     MODO CONSOLA
  ================================================= */

  if (
    env.EMAIL_PROVIDER ===
    "console"
  ) {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      "📧 EMAIL SIMULADO"
    );

    console.log(
      "======================================"
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
      "======================================"
    );

    console.log("");

    return {
      success:
        true,

      provider:
        "console",

      messageId:
        `console-${Date.now()}`
    };
  }

  /* =================================================
     SMTP
  ================================================= */

  if (
    !transporter
  ) {
    throw new Error(
      "El servicio SMTP no está configurado"
    );
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
      `[EMAIL] Enviado correctamente a ${input.to}`
    );

    console.log(
      `[EMAIL] Message ID: ${info.messageId}`
    );

    return {
      success:
        true,

      provider:
        "smtp",

      messageId:
        info.messageId
    };

  } catch (error) {

    console.error(
      "[EMAIL] Error SMTP:",
      error
    );

    throw error;
  }
}

/* =====================================================
   VERIFICAR CONEXIÓN
===================================================== */

export async function verifyEmailConnection() {

  if (
    env.EMAIL_PROVIDER ===
    "console"
  ) {
    return {
      success:
        true,

      provider:
        "console"
    };
  }

  if (
    !transporter
  ) {
    throw new Error(
      "SMTP no configurado"
    );
  }

  await transporter.verify();

  return {
    success:
      true,

    provider:
      "smtp"
  };
}
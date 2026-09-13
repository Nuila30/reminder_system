import {
  env
} from "../../config/env.js";

export interface EmailPayload {
  to: string;

  subject: string;

  text: string;
}

export interface NotificationResult {
  ok: boolean;

  providerResponse?:
    string;

  error?:
    string;
}

export async function sendEmailNotification(
  payload:
    EmailPayload
): Promise<
  NotificationResult
> {
  if (
    env.EMAIL_PROVIDER ===
    "console"
  ) {
    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "📧 EMAIL SIMULADO"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Para:",
      payload.to
    );

    console.log(
      "Asunto:",
      payload.subject
    );

    console.log("");

    console.log(
      payload.text
    );

    console.log(
      "=========================================="
    );

    console.log("");

    return {
      ok: true,

      providerResponse:
        "CONSOLE_EMAIL_SUCCESS"
    };
  }

  if (
    !env.RESEND_API_KEY
  ) {
    return {
      ok: false,

      error:
        "RESEND_API_KEY no está configurada"
    };
  }

  try {
    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${env.RESEND_API_KEY}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              from:
                env.EMAIL_FROM,

              to: [
                payload.to
              ],

              subject:
                payload.subject,

              text:
                payload.text
            })
        }
      );

    const responseText =
      await response.text();

    if (
      !response.ok
    ) {
      return {
        ok: false,

        error:
          responseText
      };
    }

    return {
      ok: true,

      providerResponse:
        responseText
    };

  } catch (error) {
    return {
      ok: false,

      error:
        error instanceof Error
          ? error.message
          : "Error desconocido enviando correo"
    };
  }
}
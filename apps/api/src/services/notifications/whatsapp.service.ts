import {
  env
} from "../../config/env.js";

import type {
  NotificationResult
} from "./email.service.js";

export interface WhatsAppPayload {
  to:
    string;

  documentName:
    string;

  clientName:
    string;

  caseNumber:
    string;

  dueDate:
    string;

  priority:
    string;

  link:
    string;
}

function cleanPhone(
  phone:
    string
) {
  return phone.replace(
    /\D/g,
    ""
  );
}

export async function sendWhatsAppNotification(
  payload:
    WhatsAppPayload
): Promise<
  NotificationResult
> {
  const phone =
    cleanPhone(
      payload.to
    );

  if (
    env.WHATSAPP_PROVIDER ===
    "console"
  ) {
    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "📱 WHATSAPP SIMULADO"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Para:",
      phone
    );

    console.log(
      "Documento:",
      payload.documentName
    );

    console.log(
      "Cliente:",
      payload.clientName
    );

    console.log(
      "Expediente:",
      payload.caseNumber
    );

    console.log(
      "Fecha límite:",
      payload.dueDate
    );

    console.log(
      "Prioridad:",
      payload.priority
    );

    console.log(
      "Link:",
      payload.link
    );

    console.log(
      "=========================================="
    );

    console.log("");

    return {
      ok: true,

      providerResponse:
        "CONSOLE_WHATSAPP_SUCCESS"
    };
  }

  if (
    !env.WHATSAPP_ACCESS_TOKEN ||
    !env.WHATSAPP_PHONE_NUMBER_ID
  ) {
    return {
      ok: false,

      error:
        "Credenciales de WhatsApp no configuradas"
    };
  }

  try {
    const url =
      `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response =
      await fetch(
        url,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              messaging_product:
                "whatsapp",

              to:
                phone,

              type:
                "template",

              template: {
                name:
                  env.WHATSAPP_TEMPLATE_NAME,

                language: {
                  code:
                    env.WHATSAPP_TEMPLATE_LANGUAGE
                },

                components: [
                  {
                    type:
                      "body",

                    parameters: [
                      {
                        type:
                          "text",

                        text:
                          payload.documentName
                      },

                      {
                        type:
                          "text",

                        text:
                          payload.clientName
                      },

                      {
                        type:
                          "text",

                        text:
                          payload.caseNumber
                      },

                      {
                        type:
                          "text",

                        text:
                          payload.dueDate
                      },

                      {
                        type:
                          "text",

                        text:
                          payload.priority
                      },

                      {
                        type:
                          "text",

                        text:
                          payload.link
                      }
                    ]
                  }
                ]
              }
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
          : "Error desconocido enviando WhatsApp"
    };
  }
}
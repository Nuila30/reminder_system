import {
  env
} from "../../config/env.js";

interface ReminderMessageData {
  documentId:
    string;

  fileName:
    string;

  clientName:
    string;

  caseNumber:
    string;

  documentType:
    string;

  dueDate:
    string;

  status:
    string;

  priority:
    string;

  responsibleName:
    string;
}

const priorityLabels:
  Record<string, string> = {
    LOW:
      "Baja",

    MEDIUM:
      "Media",

    HIGH:
      "Alta",

    CRITICAL:
      "Crítica"
  };

const statusLabels:
  Record<string, string> = {
    PENDING:
      "Pendiente",

    IN_PROGRESS:
      "En proceso",

    COMPLETED:
      "Completado",

    EXPIRED:
      "Vencido",

    CANCELLED:
      "Cancelado"
  };

export function buildReminderMessage(
  data:
    ReminderMessageData
) {
  const dueDate =
    new Date(
      data.dueDate
    )
      .toLocaleString(
        "es-SV",
        {
          dateStyle:
            "long",

          timeStyle:
            "short",

          timeZone:
            "America/El_Salvador"
        }
      );

  const priority =
    priorityLabels[
      data.priority
    ] ||
    data.priority;

  const status =
    statusLabels[
      data.status
    ] ||
    data.status;

  const link =
    `${env.APP_URL}/documents/${data.documentId}/reminders`;

  const subject =
    `Recordatorio: ${data.fileName}`;

  const text = [
    "RECORDATORIO DE DOCUMENTO",
    "",
    `Documento: ${data.fileName}`,
    `Cliente: ${data.clientName}`,
    `Expediente: ${data.caseNumber}`,
    `Tipo: ${data.documentType}`,
    `Fecha límite: ${dueDate}`,
    `Estado: ${status}`,
    `Prioridad: ${priority}`,
    `Responsable: ${data.responsibleName}`,
    "",
    `Abrir en el sistema: ${link}`
  ].join("\n");

  return {
    subject,
    text,
    dueDate,
    priority,
    status,
    link
  };
}
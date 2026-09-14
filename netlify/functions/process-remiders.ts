import type {
  Config
} from "@netlify/functions";

import {
  processDueReminders
} from "../../apps/api/src/services/reminder-engine.service.js";

export default async () => {
  console.log(
    "[NETLIFY] Iniciando procesamiento de recordatorios"
  );

  try {
    const result =
      await processDueReminders();

    console.log(
      "[NETLIFY] Recordatorios procesados:",
      result
    );

  } catch (error) {
    console.error(
      "[NETLIFY] PROCESS_REMINDERS_ERROR:",
      error
    );

    throw error;
  }
};

export const config:
  Config = {
  /*
   * Ejecutar cada minuto.
   */
  schedule: "* * * * *"
};
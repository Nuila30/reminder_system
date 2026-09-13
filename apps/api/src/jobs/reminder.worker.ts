import {
  env
} from "../config/env.js";

import {
  processDueReminders
} from "../services/reminder-engine.service.js";

let running =
  false;

let interval:
  ReturnType<
    typeof setInterval
  > | null =
  null;

let initialTimeout:
  ReturnType<
    typeof setTimeout
  > | null =
  null;

export function startReminderWorker() {
  if (
    env.ENABLE_LOCAL_WORKER !==
    "true"
  ) {
    console.log(
      "⏸ Reminder Worker desactivado"
    );

    return;
  }

  if (
    interval !==
    null
  ) {
    return;
  }

  console.log(
    "⏰ Reminder Worker iniciado"
  );

  async function run() {
    if (
      running
    ) {
      return;
    }

    try {
      running =
        true;

      await processDueReminders();

    } catch (error) {
      console.error(
        "REMINDER_WORKER_ERROR:",
        error
      );

    } finally {
      running =
        false;
    }
  }

  initialTimeout =
    setTimeout(
      () => {
        void run();
      },
      3000
    );

  interval =
    setInterval(
      () => {
        void run();
      },
      60 * 1000
    );
}

export function stopReminderWorker() {
  if (
    initialTimeout
  ) {
    clearTimeout(
      initialTimeout
    );

    initialTimeout =
      null;
  }

  if (
    interval
  ) {
    clearInterval(
      interval
    );

    interval =
      null;
  }

  running =
    false;
}
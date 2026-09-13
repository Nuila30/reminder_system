import {
  app
} from "./app.js";

import {
  env
} from "./config/env.js";

import {
  startReminderWorker,
  stopReminderWorker
} from "./jobs/reminder.worker.js";


const server =
  app.listen(
    env.PORT,
    () => {
      console.log("");
      console.log(
        "======================================"
      );

      console.log(
        "      REMINDER SYSTEM - API"
      );

      console.log(
        "======================================"
      );

      console.log(
        `Servidor: http://localhost:${env.PORT}`
      );

      console.log(
        `Entorno: ${env.NODE_ENV}`
      );

      console.log(
        "======================================"
      );

      console.log("");

      startReminderWorker();
    }
  );

function shutdown(
  signal: string
) {
  console.log("");
  console.log(
    `Recibida señal ${signal}`
  );

  stopReminderWorker();

  server.close(
    () => {
      console.log(
        "Servidor cerrado correctamente."
      );

      process.exit(0);
    }
  );
}

process.on(
  "SIGINT",
  () => {
    shutdown(
      "SIGINT"
    );
  }
);

process.on(
  "SIGTERM",
  () => {
    shutdown(
      "SIGTERM"
    );
  }
);
import { createApp } from "./app.ts";
import {
  type ServerEnvironment,
  validateEnvironment,
} from "./config/environment.ts";

const SHUTDOWN_TIMEOUT_MS = 10_000;

type LogLevel = "error" | "info";

function writeLog(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {},
): void {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  });

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
}

function startServer(environment: ServerEnvironment): void {
  const app = createApp();
  const server = app.listen(environment.port, environment.host, (error) => {
    if (error) {
      return;
    }

    writeLog("info", "server_started", environment);
  });

  let shutdownStarted = false;
  let forcedShutdown = false;

  function shutdown(reason: string): void {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    writeLog("info", "shutdown_started", { reason });

    const forceTimer = setTimeout(() => {
      forcedShutdown = true;
      process.exitCode = 1;
      writeLog("error", "shutdown_forced", {
        reason,
        timeoutMs: SHUTDOWN_TIMEOUT_MS,
      });
      server.closeAllConnections();
    }, SHUTDOWN_TIMEOUT_MS);

    forceTimer.unref();

    server.close((error) => {
      clearTimeout(forceTimer);

      if (error) {
        process.exitCode = 1;
        writeLog("error", "shutdown_failed", { errorName: error.name, reason });
        server.closeAllConnections();
        return;
      }

      if (!forcedShutdown) {
        writeLog("info", "shutdown_completed", { reason });
      }
    });
  }

  server.on("error", (error: NodeJS.ErrnoException) => {
    process.exitCode = 1;
    writeLog("error", "server_error", {
      errorName: error.name,
      errorCode: error.code ?? "UNKNOWN",
    });

    if (server.listening) {
      shutdown("server_error");
    }
  });

  process.once("SIGINT", () => {
    shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

const environmentResult = validateEnvironment(process.env);

if (!environmentResult.success) {
  process.exitCode = 1;
  writeLog("error", "configuration_invalid", {
    fields: environmentResult.invalidFields,
  });
} else {
  startServer(environmentResult.data);
}

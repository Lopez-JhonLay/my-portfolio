import { createApp } from "./app.ts";

const HOST = "127.0.0.1";
const PORT = 3000;
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

const app = createApp();
const server = app.listen(PORT, HOST, (error) => {
  if (error) {
    return;
  }

  writeLog("info", "server_started", { host: HOST, port: PORT });
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

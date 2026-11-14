import { createApp } from "./app.ts";
import { createAdminAuth, createGitHubOAuthClient } from "./auth/admin-auth.ts";
import {
  type ServerEnvironment,
  validateEnvironment,
} from "./config/environment.ts";
import {
  createDrizzleSnapshotSessionBoundary,
  createDrizzleTransactionSessionBoundary,
} from "./db/database-session.ts";
import { createDatabaseRuntime } from "./db/database.ts";
import {
  createAdminMediaRouter,
  createPublicMediaRouter,
} from "./media/media-router.ts";
import {
  createS3MediaObjectStore,
  type MediaStorageConfig,
} from "./media/media-object-store.ts";
import { createDrizzleMediaRepository } from "./media/media-repository.ts";
import { createMediaService } from "./media/media-service.ts";
import { validateStorageEnvironment } from "./media/media-storage-environment.ts";
import { createAdminContentRouter } from "./content/admin-content-router.ts";
import {
  createDrizzleAdminContentReadRepository,
  createDrizzleContentMutationService,
} from "./content/content-repository.ts";
import { createPublicPortfolioRouter } from "./content/public-portfolio-router.ts";
import { createDrizzlePublicPortfolioRepository } from "./content/public-portfolio-repository.ts";
import { createAdminProjectRouter } from "./projects/admin-project-router.ts";
import { createDrizzleProjectDraftReadRepository } from "./projects/project-draft-read-repository.ts";
import { createDrizzleProjectMutationService } from "./projects/project-mutation-repository.ts";
import { createDrizzleProjectPublicationService } from "./projects/project-publication-repository.ts";
import { createPublicProjectRouter } from "./projects/public-project-router.ts";
import { createDrizzlePublishedProjectReadRepository } from "./projects/published-project-repository.ts";

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

function startServer(
  environment: ServerEnvironment,
  storageConfig: MediaStorageConfig | null,
): void {
  const databaseRuntime = createDatabaseRuntime(environment.databaseUrl);
  const auth = createAdminAuth({
    config: {
      adminOrigin: environment.adminOrigin,
      adminUserId: environment.adminUserId,
      githubCallbackUrl: environment.githubCallbackUrl,
      githubClientId: environment.githubClientId,
      sessionTtlMs: environment.sessionTtlMs,
    },
    githubClient: createGitHubOAuthClient({
      clientId: environment.githubClientId,
      clientSecret: environment.githubClientSecret,
    }),
  });
  const mediaService =
    storageConfig === null
      ? null
      : createMediaService({
          objectStore: createS3MediaObjectStore(storageConfig),
          repository: createDrizzleMediaRepository({
            reads: createDrizzleSnapshotSessionBoundary(
              databaseRuntime.database,
            ),
            writes: createDrizzleTransactionSessionBoundary(
              databaseRuntime.database,
            ),
          }),
        });
  const app = createApp({
    adminOrigin: environment.adminOrigin,
    authRouter: auth.router,
    ...(mediaService === null
      ? {}
      : {
          adminMediaRouter: createAdminMediaRouter({
            service: mediaService,
            requireAdmin: auth.requireAdmin,
            requireCsrf: auth.requireCsrf,
          }),
          publicMediaRouter: createPublicMediaRouter(mediaService),
        }),
    adminContentRouter: createAdminContentRouter({
      mutationService: createDrizzleContentMutationService(
        createDrizzleTransactionSessionBoundary(databaseRuntime.database),
      ),
      readRepository: createDrizzleAdminContentReadRepository(
        createDrizzleSnapshotSessionBoundary(databaseRuntime.database),
      ),
      requireAdmin: auth.requireAdmin,
      requireCsrf: auth.requireCsrf,
    }),
    publicProjectRouter: createPublicProjectRouter({
      publicOrigin: environment.publicOrigin,
      repository: createDrizzlePublishedProjectReadRepository(
        createDrizzleSnapshotSessionBoundary(databaseRuntime.database),
      ),
    }),
    publicPortfolioRouter: createPublicPortfolioRouter({
      publicOrigin: environment.publicOrigin,
      repository: createDrizzlePublicPortfolioRepository(
        createDrizzleSnapshotSessionBoundary(databaseRuntime.database),
      ),
    }),
    adminProjectRouter: createAdminProjectRouter({
      mutationService: createDrizzleProjectMutationService(
        createDrizzleTransactionSessionBoundary(databaseRuntime.database),
      ),
      publicationService: createDrizzleProjectPublicationService(
        createDrizzleTransactionSessionBoundary(databaseRuntime.database),
      ),
      readRepository: createDrizzleProjectDraftReadRepository(
        createDrizzleSnapshotSessionBoundary(databaseRuntime.database),
      ),
      requireAdmin: auth.requireAdmin,
      requireCsrf: auth.requireCsrf,
    }),
  });
  const server = app.listen(environment.port, environment.host, (error) => {
    if (error) {
      return;
    }

    writeLog("info", "server_started", {
      host: environment.host,
      port: environment.port,
    });
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

    server.close((serverError) => {
      void databaseRuntime.close().then(
        () => {
          clearTimeout(forceTimer);
          if (serverError) {
            process.exitCode = 1;
            writeLog("error", "shutdown_failed", {
              errorName: serverError.name,
              reason,
            });
            server.closeAllConnections();
            return;
          }
          if (!forcedShutdown) {
            writeLog("info", "shutdown_completed", { reason });
          }
        },
        (databaseError: unknown) => {
          clearTimeout(forceTimer);
          process.exitCode = 1;
          writeLog("error", "shutdown_failed", {
            errorName:
              databaseError instanceof Error
                ? databaseError.name
                : "UnknownError",
            reason,
          });
        },
      );
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
const storageResult = validateStorageEnvironment(process.env);

if (!environmentResult.success || !storageResult.success) {
  process.exitCode = 1;
  writeLog("error", "configuration_invalid", {
    fields: [
      ...(environmentResult.success ? [] : environmentResult.invalidFields),
      ...(storageResult.success ? [] : storageResult.invalidFields),
    ],
  });
} else {
  startServer(environmentResult.data, storageResult.config);
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useBlocker, useLocation } from "react-router-dom";

import {
  createAuthClient,
  type AdminSession,
} from "./features/auth/auth-client";
import { ProjectsDashboard } from "./features/projects/projects-dashboard";
import { AdminShell } from "./features/shell/admin-shell";
import { resolveAdminView } from "./features/shell/admin-route";
import { UnsavedChangesDialog } from "./features/shell/unsaved-changes-dialog";
import { AdminApiError } from "./lib/admin-http";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:3000";

function apiOrigin(): string {
  const configuredValue = import.meta.env.VITE_API_ORIGIN as unknown;
  const configured =
    typeof configuredValue === "string" ? configuredValue : DEFAULT_API_ORIGIN;
  const url = new URL(configured);
  if (url.origin !== configured || url.username || url.password) {
    throw new Error("VITE_API_ORIGIN must be an origin without credentials.");
  }
  return url.origin;
}

type SessionState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly session: AdminSession }
  | { readonly status: "error"; readonly message: string };

export function App() {
  const origin = useMemo(apiOrigin, []);
  const authClient = useMemo(() => createAuthClient(origin), [origin]);
  const [sessionState, setSessionState] = useState<SessionState>({
    status: "loading",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const discardChanges = useRef<() => void>(() => undefined);
  const location = useLocation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  const registerDiscardChanges = useCallback((discard: () => void) => {
    discardChanges.current = discard;
  }, []);

  const loadSession = useCallback(async () => {
    setSessionState({ status: "loading" });
    try {
      setSessionState({
        status: "ready",
        session: await authClient.getSession(),
      });
    } catch (error) {
      setSessionState({
        status: "error",
        message:
          error instanceof AdminApiError
            ? error.message
            : "The session response was invalid.",
      });
    }
  }, [authClient]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const markUnauthorized = useCallback(() => {
    setSessionState({
      status: "ready",
      session: { authenticated: false },
    });
  }, []);

  async function logout(csrfToken: string) {
    setIsLoggingOut(true);
    try {
      await authClient.logout(csrfToken);
      markUnauthorized();
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        markUnauthorized();
      } else {
        setSessionState({
          status: "error",
          message:
            error instanceof AdminApiError
              ? error.message
              : "Logout could not be completed.",
        });
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (sessionState.status === "loading") {
    return (
      <main className="auth-shell" aria-busy="true">
        <section className="auth-card" aria-labelledby="loading-title">
          <p className="eyebrow">Portfolio CMS</p>
          <h1 id="loading-title">Loading your session</h1>
          <p role="status">Checking administrator access…</p>
        </section>
      </main>
    );
  }

  if (sessionState.status === "error") {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="error-title">
          <p className="eyebrow">Portfolio CMS</p>
          <h1 id="error-title">Admin API unavailable</h1>
          <p>{sessionState.message}</p>
          <button
            className="button button--primary"
            onClick={() => void loadSession()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const session = sessionState.session;
  if (!session.authenticated) {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="login-title">
          <p className="eyebrow">Private workspace</p>
          <h1 id="login-title">Portfolio CMS Admin</h1>
          <p>
            Sign in with the single GitHub account authorized by the local
            backend. Draft content is never available without a valid session.
          </p>
          <a className="button button--primary" href={authClient.getLoginUrl()}>
            Continue with GitHub
          </a>
        </section>
      </main>
    );
  }

  const view = resolveAdminView(location.pathname);
  if (view === null) {
    return <Navigate replace to="/projects" />;
  }

  const csrfToken = session.csrfToken;

  function requestLogout() {
    if (hasUnsavedChanges) {
      setConfirmLogout(true);
      return;
    }
    void logout(csrfToken);
  }

  function cancelDiscard() {
    if (blocker.state === "blocked") blocker.reset();
    setConfirmLogout(false);
  }

  function confirmDiscard() {
    discardChanges.current();
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    if (confirmLogout) {
      setConfirmLogout(false);
      void logout(csrfToken);
    }
  }

  return (
    <>
      <AdminShell isBusy={isLoggingOut} onLogout={requestLogout}>
        <ProjectsDashboard
          apiOrigin={origin}
          csrfToken={csrfToken}
          onDiscardReady={registerDiscardChanges}
          onDirtyChange={setHasUnsavedChanges}
          onUnauthorized={markUnauthorized}
          view={view}
        />
      </AdminShell>
      <UnsavedChangesDialog
        action={blocker.state === "blocked" ? "leave" : "logout"}
        onCancel={cancelDiscard}
        onConfirm={confirmDiscard}
        open={blocker.state === "blocked" || confirmLogout}
      />
    </>
  );
}

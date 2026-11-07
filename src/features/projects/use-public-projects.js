import { useCallback, useEffect, useState } from "react";

import {
  loadPublicProjects,
  readPublicApiOrigin,
} from "./public-projects-client.js";

const API_ORIGIN = readPublicApiOrigin(
  import.meta.env.VITE_PUBLIC_API_ORIGIN,
);

export function usePublicProjects({ resource, staticProjects }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    void loadPublicProjects({
      apiOrigin: API_ORIGIN,
      resource,
      signal: controller.signal,
      staticProjects,
    }).then(
      (projects) => {
        if (!controller.signal.aborted) {
          setState({ projects, status: "ready" });
        }
      },
      () => {
        if (!controller.signal.aborted) setState({ status: "error" });
      },
    );

    return () => controller.abort();
  }, [attempt, resource, staticProjects]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}

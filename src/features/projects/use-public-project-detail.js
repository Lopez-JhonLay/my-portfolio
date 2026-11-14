import { useCallback, useEffect, useState } from "react";

import {
  loadPublicProjectDetail,
  readPublicApiOrigin,
} from "./public-projects-client.js";

const API_ORIGIN = readPublicApiOrigin(import.meta.env.VITE_PUBLIC_API_ORIGIN);

export function usePublicProjectDetail({ slug, staticProject }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void loadPublicProjectDetail({
      apiOrigin: API_ORIGIN,
      signal: controller.signal,
      slug,
      staticProject,
    }).then(
      (project) => {
        if (!controller.signal.aborted)
          setState({ project, status: "ready" });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: "error" });
      },
    );
    return () => controller.abort();
  }, [attempt, slug, staticProject]);
  return {
    ...state,
    retry: useCallback(() => setAttempt((value) => value + 1), []),
  };
}

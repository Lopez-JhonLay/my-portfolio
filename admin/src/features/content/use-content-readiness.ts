import { useEffect, useState } from "react";

import { AdminApiError } from "../../lib/admin-http.ts";
import type { ContentSectionSummary } from "./content-contract.ts";
import type { ContentClient } from "./content-client.ts";

type ContentReadinessState =
  | { readonly status: "loading"; readonly sections: readonly [] }
  | {
      readonly status: "ready";
      readonly sections: readonly ContentSectionSummary[];
    }
  | { readonly status: "error"; readonly sections: readonly [] };

export function useContentReadiness(options: {
  readonly client: ContentClient;
  readonly onUnauthorized: () => void;
}): ContentReadinessState {
  const { client, onUnauthorized } = options;
  const [state, setState] = useState<ContentReadinessState>({
    status: "loading",
    sections: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    void client.list(controller.signal).then(
      (sections) => {
        if (!controller.signal.aborted) setState({ status: "ready", sections });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof AdminApiError && error.status === 401) {
          onUnauthorized();
          return;
        }
        setState({ status: "error", sections: [] });
      },
    );
    return () => controller.abort();
  }, [client, onUnauthorized]);

  return state;
}

import { useCallback, useEffect, useState } from 'react';

import { readPublicContent } from './public-portfolio-client';

export function usePublicContent(apiOrigin) {
  const [state, setState] = useState({ status: 'loading', sections: {} });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', sections: {} });
    void readPublicContent(apiOrigin, controller.signal).then(
      (result) => {
        if (!controller.signal.aborted) setState({ status: 'ready', sections: result.sections });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error', sections: {} });
      },
    );
    return () => controller.abort();
  }, [apiOrigin, attempt]);

  return { ...state, retry };
}

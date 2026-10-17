import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createNoopShare } from "./noop.js";
import type { ShareAdapter, ShareContent, ShareResult } from "./types.js";

const noop = createNoopShare();

export interface UseShareOptions {
  /** The adapter to use, for example `createReactNativeShare(Share)`. Default: the noop adapter (`unsupported`). */
  adapter?: ShareAdapter;
}

export interface ShareState {
  /** Opens the share sheet. Resolves a result and never rejects. A second call while one is pending resolves `unsupported` without a sheet. */
  share(content: ShareContent): Promise<ShareResult>;
  /** True while a share is unresolved. */
  pending: boolean;
  /** The result of the last share, or null before the first one. */
  result: ShareResult | null;
}

/** State around a share sheet. With no adapter it uses the noop adapter. State is not set after unmount. */
export function useShare(options: UseShareOptions = {}): ShareState {
  const adapter = options.adapter ?? noop;
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const share = useCallback(
    async (content: ShareContent): Promise<ShareResult> => {
      if (inFlight.current) return { action: "unsupported" };
      inFlight.current = true;
      if (mounted.current) setPending(true);
      let outcome: ShareResult;
      try {
        const answer = await adapter.share(content);
        const action = answer?.action;
        outcome = { action: action === "shared" || action === "dismissed" ? action : "unsupported" };
      } catch {
        outcome = { action: "unsupported" };
      }
      inFlight.current = false;
      if (mounted.current) {
        setResult(outcome);
        setPending(false);
      }
      return outcome;
    },
    [adapter]
  );

  return useMemo(() => ({ share, pending, result }), [share, pending, result]);
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { CapabilityStatus } from "../core/types.js";
import { resolveWebClipboard } from "./web.js";

export interface UseCopyToClipboardOptions {
  /** How long `copied` stays true after a successful copy, in milliseconds. Default 2000. */
  resetMs?: number;
}

export interface CopyToClipboard {
  /** Writes `text`. Resolves true on success, false on failure or when no clipboard is available; never rejects. */
  copy(text: string): Promise<boolean>;
  /** True for `resetMs` after a successful copy. */
  copied: boolean;
  /** The last failure, or null. Cleared by the next copy. */
  error: unknown;
  /** `noop` when nothing is configured and the platform cannot write. */
  status: CapabilityStatus;
}

/**
 * Copy-to-clipboard state. Resolves the `clipboard` capability (provider adapter, registry, then the web clipboard when
 * the platform has one), so it works with no provider and no optional package: `copy` then resolves false with
 * `error` null and `status` `noop`. Timers are cleared on unmount and a copy that finishes after unmount sets no state.
 */
export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}): CopyToClipboard {
  const { resetMs = 2000 } = options;
  const adapter = useCapability("clipboard");
  const web = useMemo(() => (adapter.status === "noop" ? resolveWebClipboard() : undefined), [adapter]);
  const api = web ?? adapter.api;
  const status: CapabilityStatus = web ? "available" : adapter.status;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const latest = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (status === "noop" || status === "unavailable") return false;
      const id = ++latest.current;
      clearTimeout(timer.current);
      if (mounted.current) {
        setCopied(false);
        setError(null);
      }
      try {
        await api.setString(text);
      } catch (failure) {
        if (mounted.current && id === latest.current) setError(failure ?? new Error("Copy failed"));
        return false;
      }
      if (mounted.current && id === latest.current) {
        setCopied(true);
        timer.current = setTimeout(() => {
          if (mounted.current) setCopied(false);
        }, Math.max(0, resetMs));
      }
      return true;
    },
    [api, status, resetMs]
  );

  return useMemo(() => ({ copy, copied, error, status }), [copy, copied, error, status]);
}

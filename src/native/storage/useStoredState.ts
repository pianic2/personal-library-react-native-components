import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { StorageAdapter } from "./types.js";

export interface StoredStateSerializer<T> {
  stringify(value: T): string;
  parse(raw: string): T;
}

export interface UseStoredStateOptions<T> {
  /** Backend. Default: the `storage` capability of the nearest CapabilityProvider (a noop when none is mounted). */
  storage?: Pick<StorageAdapter, "getItem" | "setItem" | "removeItem">;
  /** Default: JSON. */
  serialize?: StoredStateSerializer<T>;
}

export interface StoredState<T> {
  value: T;
  /** Replaces the value (or derives it from the current one) and writes it. */
  setValue(next: T | ((current: T) => T)): void;
  /** Deletes the stored value and resets to the default. */
  remove(): void;
  /** False until the first read has resolved (the default value is shown meanwhile). */
  hydrated: boolean;
}

const JSON_SERIALIZER: StoredStateSerializer<unknown> = { stringify: (value) => JSON.stringify(value), parse: (raw) => JSON.parse(raw) as unknown };

/**
 * State persisted under `key`. Starts with `defaultValue` and `hydrated: false`, reads the stored value, then sets
 * `hydrated: true`. A value written before the read resolves wins over it. A stored value that cannot be parsed is
 * ignored (the default stays). Write and read errors never throw; writes are applied in order.
 */
export function useStoredState<T>(key: string, defaultValue: T, options: UseStoredStateOptions<T> = {}): StoredState<T> {
  const capability = useCapability("storage");
  const storage = options.storage ?? capability.api;
  const serializer = (options.serialize ?? JSON_SERIALIZER) as StoredStateSerializer<T>;
  const [state, setState] = useState<{ key: string; value: T; hydrated: boolean }>({ key, value: defaultValue, hydrated: false });
  // State belongs to a key: after the key changes the first render shows the default and hydrating.
  const view = state.key === key ? state : { key, value: defaultValue, hydrated: false };

  const latest = useRef({ key, value: view.value, defaultValue, serializer, storage });
  latest.current = { key, value: view.value, defaultValue, serializer, storage };
  const written = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    written.current = false;
    (async () => {
      let next = latest.current.defaultValue;
      try {
        const raw = await storage.getItem(key);
        if (raw !== null) next = serializer.parse(raw);
      } catch {
        // unreadable or unparsable: keep the default
      }
      if (cancelled || !mounted.current) return;
      setState((prev) => (prev.key === key && written.current ? { ...prev, hydrated: true } : { key, value: next, hydrated: true }));
    })();
    return () => {
      cancelled = true;
    };
  }, [key, storage]);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queue.current = queue.current.then(task).catch(() => undefined);
  }, []);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const { key: k, value, serializer: s, storage: st } = latest.current;
      const resolved = typeof next === "function" ? (next as (current: T) => T)(value) : next;
      written.current = true;
      latest.current.value = resolved;
      setState((prev) => ({ key: k, value: resolved, hydrated: prev.key === k ? prev.hydrated : false }));
      enqueue(async () => st.setItem(k, s.stringify(resolved)));
    },
    [enqueue]
  );

  const remove = useCallback(() => {
    const { key: k, defaultValue: d, storage: st } = latest.current;
    written.current = true;
    latest.current.value = d;
    setState((prev) => ({ key: k, value: d, hydrated: prev.key === k ? prev.hydrated : false }));
    enqueue(async () => st.removeItem(k));
  }, [enqueue]);

  return useMemo(() => ({ value: view.value, setValue, remove, hydrated: view.hydrated }), [view.value, view.hydrated, setValue, remove]);
}

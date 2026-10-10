// Controllable fake clock and state emitters for tests. No timers, no native import: everything is synchronous and
// driven by the test.

export type Listener<T> = (value: T) => void;

export interface Emitter<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: Listener<T>): () => void;
  /** Restores `value` without notifying and detaches every listener. */
  reset(value: T): void;
}

function rethrow(errors: unknown[]): void {
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "multiple listeners threw");
}

export function createEmitter<T>(initial: T): Emitter<T> {
  let current = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => current,
    set(value) {
      current = value;
      const errors: unknown[] = [];
      for (const listener of [...listeners]) {
        if (!listeners.has(listener)) continue; // unsubscribed mid-emit
        try {
          listener(value);
        } catch (error) {
          errors.push(error);
        }
      }
      rethrow(errors);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    reset(value) {
      current = value;
      listeners.clear();
    },
  };
}

export interface FakeClock {
  now(): number;
  /**
   * Moves time forward and runs every scheduled callback that became due, in order (callbacks may schedule more).
   * Throws RangeError for a negative or non-finite `ms`. If a callback throws, time stays at that callback's due time,
   * later callbacks stay queued and the error is rethrown.
   */
  advance(ms: number): void;
  /** Schedules `fn` after `ms` fake milliseconds; returns a cancel function. */
  setTimeout(fn: () => void, ms: number): () => void;
  /** Number of callbacks still waiting. */
  pending(): number;
  /** Drops every pending callback and restores the start time. */
  reset(): void;
}

export function createFakeClock(start = 0): FakeClock {
  let time = start;
  let seq = 0;
  let queue: { at: number; seq: number; fn: () => void }[] = [];
  return {
    now: () => time,
    advance(ms) {
      if (!Number.isFinite(ms) || ms < 0) throw new RangeError(`advance(ms) needs a finite, non-negative number, got ${ms}`);
      const target = time + ms;
      for (;;) {
        const due = queue.filter((t) => t.at <= target).sort((a, b) => a.at - b.at || a.seq - b.seq)[0];
        if (!due) break;
        queue = queue.filter((t) => t !== due);
        time = due.at;
        due.fn();
      }
      time = target;
    },
    setTimeout(fn, ms) {
      const entry = { at: time + ms, seq: seq++, fn };
      queue.push(entry);
      return () => {
        queue = queue.filter((t) => t !== entry);
      };
    },
    pending: () => queue.length,
    reset() {
      queue = [];
      time = start;
    },
  };
}

export type FakeAppState = "active" | "background" | "inactive";
export type FakePermission = "granted" | "denied";
export interface FakeKeyboard {
  visible: boolean;
  height: number;
}

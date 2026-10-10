// Controllable fake clock and state emitters for tests. No timers, no native import: everything is synchronous and
// driven by the test.

export type Listener<T> = (value: T) => void;

export interface Emitter<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createEmitter<T>(initial: T): Emitter<T> {
  let current = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => current,
    set(value) {
      current = value;
      for (const listener of [...listeners]) listener(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export interface FakeClock {
  now(): number;
  /** Moves time forward and runs every scheduled callback that became due, in order. */
  advance(ms: number): void;
  /** Schedules `fn` after `ms` fake milliseconds; returns a cancel function. */
  setTimeout(fn: () => void, ms: number): () => void;
  /** Number of callbacks still waiting. */
  pending(): number;
}

export function createFakeClock(start = 0): FakeClock {
  let time = start;
  let seq = 0;
  let queue: { at: number; seq: number; fn: () => void }[] = [];
  return {
    now: () => time,
    advance(ms) {
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
  };
}

export type FakeAppState = "active" | "background" | "inactive";
export type FakePermission = "granted" | "denied";
export interface FakeKeyboard {
  visible: boolean;
  height: number;
}

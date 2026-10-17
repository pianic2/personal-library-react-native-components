import React from "react";
import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import {
  AppReadyGate,
  AppReadyTimeoutError,
  DEFAULT_APP_READY_TIMEOUT_MS,
  createExpoSplash,
  createNoopSplash,
  useAppReady,
  useHydratedTask,
} from "../../../src/native/app-ready/index.js";
import type { AppReadyState, AppReadyTask, SplashAdapter, UseAppReadyOptions } from "../../../src/native/app-ready/index.js";

afterEach(() => mock.timers.reset());

const CONTENT = "content";
const WAITING = "waiting";

function mockSplash() {
  const log: string[] = [];
  const splash: SplashAdapter = {
    preventAutoHide: async () => void log.push("prevent"),
    hide: async () => void log.push("hide"),
  };
  return { splash, log };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const text = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());

function mountGate(props: Partial<React.ComponentProps<typeof AppReadyGate>>) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      <AppReadyGate fallback={WAITING} {...props}>
        {CONTENT}
      </AppReadyGate>
    );
  });
  return r;
}

function mountHook(options: UseAppReadyOptions) {
  const out: { s?: AppReadyState } = {};
  function Probe() {
    out.s = useAppReady(options);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<Probe />);
  });
  return { out, r };
}

describe("PLRNUI-371 splash", () => {
  it("prevents auto hide on mount and hides exactly once after the tasks resolve", async () => {
    const { splash, log } = mockSplash();
    const a = deferred();
    const b = deferred();
    const r = mountGate({ tasks: [() => a.promise, () => b.promise], splash });
    await act(async () => {});
    assert.deepEqual(log, ["prevent"]);
    assert.ok(text(r).includes(WAITING));
    await act(async () => a.resolve());
    assert.deepEqual(log, ["prevent"]);
    assert.ok(text(r).includes(WAITING));
    await act(async () => b.resolve());
    assert.deepEqual(log, ["prevent", "hide"]);
    assert.ok(text(r).includes(CONTENT));
    await act(async () => {});
    assert.deepEqual(log, ["prevent", "hide"]);
  });

  it("hides once even if a later rejection or the timeout fires after it", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { splash, log } = mockSplash();
    const a = deferred();
    mountGate({ tasks: [() => a.promise], splash, timeoutMs: 1000 });
    await act(async () => a.resolve());
    act(() => mock.timers.tick(5000));
    assert.equal(log.filter((x) => x === "hide").length, 1);
  });

  it("without a splash adapter it renders the children once ready and calls no splash api", async () => {
    const canary = mockSplash();
    const a = deferred();
    const r = mountGate({ tasks: [() => a.promise] });
    assert.ok(text(r).includes(WAITING));
    await act(async () => a.resolve());
    assert.ok(text(r).includes(CONTENT));
    assert.deepEqual(canary.log, []);
  });

  it("splash rejections are ignored, and the Expo mapping swallows module errors", async () => {
    const calls: string[] = [];
    const failing = createExpoSplash({
      preventAutoHideAsync: async () => (calls.push("prevent"), Promise.reject(new Error("no splash registered"))),
      hideAsync: async () => (calls.push("hide"), Promise.reject(new Error("boom"))),
    });
    await failing.preventAutoHide();
    await failing.hide();
    assert.deepEqual(calls, ["prevent", "hide"]);
    const r = mountGate({ tasks: [async () => undefined], splash: failing });
    await act(async () => {});
    assert.ok(text(r).includes(CONTENT));
  });

  it("the Expo mapping forwards to the injected module", async () => {
    const calls: string[] = [];
    const splash = createExpoSplash({ preventAutoHideAsync: async () => void calls.push("prevent"), hideAsync: async () => void calls.push("hide") });
    await splash.preventAutoHide();
    await splash.hide();
    assert.deepEqual(calls, ["prevent", "hide"]);
  });

  it("the noop splash resolves and does nothing", async () => {
    const splash = createNoopSplash();
    assert.equal(await splash.preventAutoHide(), undefined);
    assert.equal(await splash.hide(), undefined);
  });
});

describe("PLRNUI-371 timeout and errors", () => {
  it("the timeout renders the children, calls onError once and hides the splash (fake timers)", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { splash, log } = mockSplash();
    const errors: unknown[] = [];
    const never = new Promise<void>(() => undefined);
    const r = mountGate({ tasks: [() => never], splash, timeoutMs: 3000, onError: (e) => errors.push(e) });
    act(() => mock.timers.tick(2999));
    assert.ok(text(r).includes(WAITING));
    assert.deepEqual(errors, []);
    await act(async () => mock.timers.tick(1));
    assert.ok(text(r).includes(CONTENT));
    assert.equal(errors.length, 1);
    assert.ok((errors[0] as object) instanceof AppReadyTimeoutError);
    assert.equal((errors[0] as AppReadyTimeoutError).timeoutMs, 3000);
    assert.deepEqual(log, ["prevent", "hide"]);
  });

  it("a rejected task does not leave the app blank: the children render and onError gets the error", async () => {
    const { splash, log } = mockSplash();
    const failure = new Error("fonts failed");
    const errors: unknown[] = [];
    const r = mountGate({ tasks: [async () => Promise.reject(failure), () => new Promise<void>(() => undefined)], splash, onError: (e) => errors.push(e) });
    await act(async () => {});
    assert.ok(text(r).includes(CONTENT));
    assert.deepEqual(errors, [failure]);
    assert.deepEqual(log, ["prevent", "hide"]);
  });

  it("a task that throws synchronously is handled like a rejection", async () => {
    const errors: unknown[] = [];
    const r = mountGate({
      tasks: [
        () => {
          throw new Error("sync");
        },
      ],
      onError: (e) => errors.push(e),
    });
    await act(async () => {});
    assert.ok(text(r).includes(CONTENT));
    assert.equal((errors[0] as Error).message, "sync");
  });

  it("exposes error and timedOut through useAppReady, and onError is not repeated", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const errors: unknown[] = [];
    const first = deferred();
    const { out } = mountHook({ tasks: [() => first.promise], timeoutMs: 100, onError: (e) => errors.push(e) });
    assert.deepEqual(out.s, { ready: false, error: null, timedOut: false });
    await act(async () => first.reject(new Error("x")));
    assert.equal(out.s?.ready, true);
    assert.equal(out.s?.timedOut, false);
    assert.equal((out.s?.error as unknown as Error).message, "x");
    act(() => mock.timers.tick(1000));
    assert.equal(errors.length, 1);
  });

  it("a throwing onError does not keep the app from starting", async () => {
    const r = mountGate({
      tasks: [async () => Promise.reject(new Error("x"))],
      onError: () => {
        throw new Error("handler");
      },
    });
    await act(async () => {});
    assert.ok(text(r).includes(CONTENT));
  });

  it("uses the default timeout when timeoutMs is not a finite number", async () => {
    for (const timeoutMs of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      mock.timers.enable({ apis: ["setTimeout"] });
      const { out } = mountHook({ tasks: [() => new Promise<void>(() => undefined)], timeoutMs });
      act(() => mock.timers.tick(DEFAULT_APP_READY_TIMEOUT_MS - 1));
      assert.equal(out.s?.ready, false);
      await act(async () => mock.timers.tick(1));
      assert.equal(out.s?.timedOut, true);
      mock.timers.reset();
    }
  });

  it("with no tasks it is ready after mount", async () => {
    const { out } = mountHook({});
    await act(async () => {});
    assert.equal(out.s?.ready, true);
  });
});

describe("PLRNUI-371 lifecycle", () => {
  it("unmounting while pending sets no state, clears the timer and still hides the splash once", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { splash, log } = mockSplash();
    const a = deferred();
    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
    try {
      const r = mountGate({ tasks: [() => a.promise], splash, timeoutMs: 500 });
      act(() => r.unmount());
      await act(async () => a.resolve());
      act(() => mock.timers.tick(5000));
    } finally {
      console.error = original;
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(log, ["prevent", "hide"]);
  });

  it("tasks run once: changing the tasks prop after mount does not rerun them", async () => {
    let runs = 0;
    const task: AppReadyTask = async () => void runs++;
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<AppReadyGate tasks={[task]}>{CONTENT}</AppReadyGate>);
    });
    await act(async () => {});
    act(() => r.update(<AppReadyGate tasks={[task, task]}>{CONTENT}</AppReadyGate>));
    await act(async () => {});
    assert.equal(runs, 1);
  });
});

describe("PLRNUI-371 useHydratedTask", () => {
  function Hydrating({ flags, log }: { flags: boolean[]; log: AppReadyTask[] }) {
    const task = useHydratedTask(...flags);
    log.push(task);
    return <AppReadyGate tasks={[task]} fallback={WAITING}>{CONTENT}</AppReadyGate>;
  }

  it("resolves when every flag becomes true, and the gate then shows the children", async () => {
    const log: AppReadyTask[] = [];
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Hydrating flags={[true, false]} log={log} />);
    });
    await act(async () => {});
    assert.ok(text(r).includes(WAITING));
    await act(async () => r.update(<Hydrating flags={[true, true]} log={log} />));
    await act(async () => {});
    assert.ok(text(r).includes(CONTENT));
    assert.equal(new Set(log).size, 1, "the task identity is stable");
  });

  it("resolves at once when the flags are already true, and with no flags", async () => {
    const out: AppReadyTask[] = [];
    function Probe({ flags }: { flags: boolean[] }) {
      out.push(useHydratedTask(...flags));
      return null;
    }
    act(() => void TestRenderer.create(<Probe flags={[true]} />));
    act(() => void TestRenderer.create(<Probe flags={[]} />));
    assert.equal(await out[0]!(), undefined);
    assert.equal(await out[out.length - 1]!(), undefined);
  });
});

describe("PLRNUI-371 boundaries", () => {
  const dir = join(import.meta.dirname, "../../../src/native/app-ready");
  const sources = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("imports no expo-* or react-native package and uses no require", () => {
    for (const [file, text_] of sources) {
      const code = text_.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/from\s+["'](?:expo|react-native)/.test(code), false, `${file} imports a native package`);
      assert.equal(/\brequire\s*\(/.test(code), false, `${file} uses require`);
      assert.equal(/\bimport\s*\(/.test(code), false, `${file} uses dynamic import`);
    }
  });

  it("is not reachable from the root entry and adds no dependency", () => {
    const root = join(import.meta.dirname, "../../..");
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
    assert.equal(/app-ready/.test(readFileSync(join(root, "src/index.ts"), "utf8")), false);
    const outside = walk(join(root, "src")).filter((f) => !f.includes("/native/") && /\.tsx?$/.test(f)).filter((f) => /native\/app-ready/.test(readFileSync(f, "utf8")));
    assert.deepEqual(outside, []);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "peerDependencies"]) assert.equal(JSON.stringify(pkg[section] ?? {}).includes("splash-screen"), false);
  });
});

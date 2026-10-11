import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import {
  ThemeProvider,
  useTheme,
  type ThemeMode,
  type ThemeStorageAdapter,
} from "../../src";

type ThemeSnapshot = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

type StorageCall =
  | { method: "getItem"; key: string }
  | { method: "setItem"; key: string; value: string };

function ThemeProbe({
  onSnapshot,
}: {
  onSnapshot: (snapshot: ThemeSnapshot) => void;
}) {
  const { mode, toggleTheme, setMode } = useTheme();

  onSnapshot({
    mode,
    toggleTheme,
    setMode,
  });

  return null;
}

function createStorageAdapter({
  getValue = null,
  getError,
  setError,
}: {
  getValue?: string | null | Promise<string | null>;
  getError?: Error;
  setError?: Error;
} = {}) {
  const calls: StorageCall[] = [];

  const storage: ThemeStorageAdapter = {
    async getItem(key) {
      calls.push({ method: "getItem", key });
      if (getError) {
        throw getError;
      }
      return getValue;
    },
    async setItem(key, value) {
      calls.push({ method: "setItem", key, value });
      if (setError) {
        throw setError;
      }
    },
  };

  return { storage, calls };
}

/** The JSON the provider writes: the preference, the preset id and the density. */
const stored = (preference: string, density = "regular") => JSON.stringify({ preference, presetId: "base", density });

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("PLRNUI-56 ThemeStorageAdapter", () => {
  it("keeps ThemeProvider without storage in memory only", () => {
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");

    act(() => {
      latestSnapshot?.setMode("dark");
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "dark");
  });

  it("does not read or write when storage is provided but persistTheme is omitted", async () => {
    const { storage, calls } = createStorageAdapter({ getValue: "dark" });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" storage={storage}>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });
    await flushEffects();

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");

    act(() => {
      latestSnapshot?.toggleTheme();
    });
    await flushEffects();

    assert.equal(latestSnapshot.mode, "dark");
    assert.deepEqual(calls, []);
  });

  it("hydrates a valid persisted theme mode after the initial render", async () => {
    const { storage, calls } = createStorageAdapter({ getValue: "dark" });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");

    await flushEffects();

    assert.equal(latestSnapshot.mode, "dark");
    assert.deepEqual(calls, [{ method: "getItem", key: "personal-library.theme" }]);
  });

  it("ignores invalid persisted values including system", async () => {
    for (const getValue of ["system", "bad-value"]) {
      const { storage } = createStorageAdapter({ getValue });
      let latestSnapshot: ThemeSnapshot | undefined;

      act(() => {
        TestRenderer.create(
          <ThemeProvider initialMode="light" persistTheme storage={storage}>
            <ThemeProbe
              onSnapshot={(snapshot) => {
                latestSnapshot = snapshot;
              }}
            />
          </ThemeProvider>
        );
      });
      await flushEffects();

      assert.ok(latestSnapshot);
      assert.equal(latestSnapshot.mode, "light");
    }
  });

  it("ignores null persisted values", async () => {
    const { storage } = createStorageAdapter({ getValue: null });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });
    await flushEffects();

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");
  });

  it("catches storage read failures without crashing", async () => {
    const { storage } = createStorageAdapter({ getError: new Error("read failed") });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });
    await flushEffects();

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");
  });

  it("updates in-memory mode when storage writes fail", async () => {
    const { storage, calls } = createStorageAdapter({
      getValue: null,
      setError: new Error("write failed"),
    });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });
    await flushEffects();

    act(() => {
      latestSnapshot?.setMode("dark");
    });
    await flushEffects();

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "dark");
    assert.deepEqual(calls, [
      { method: "getItem", key: "personal-library.theme" },
      { method: "setItem", key: "personal-library.theme", value: stored("dark") },
    ]);
  });

  it("uses a custom storageKey for hydration and writes", async () => {
    const { storage, calls } = createStorageAdapter({ getValue: "dark" });
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider
          initialMode="light"
          persistTheme
          storage={storage}
          storageKey="app.theme"
        >
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });
    await flushEffects();

    act(() => {
      latestSnapshot?.setMode("light");
    });
    await flushEffects();

    assert.equal(latestSnapshot?.mode, "light");
    assert.deepEqual(calls, [
      { method: "getItem", key: "app.theme" },
      { method: "setItem", key: "app.theme", value: stored("light") },
    ]);
  });

  it("does not set state after a late hydration promise resolves after unmount", async () => {
    let resolveHydration: (value: string | null) => void = () => undefined;
    const getValue = new Promise<string | null>((resolve) => {
      resolveHydration = resolve;
    });
    const { storage } = createStorageAdapter({ getValue });
    let snapshotCount = 0;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <ThemeProbe
            onSnapshot={() => {
              snapshotCount += 1;
            }}
          />
        </ThemeProvider>
      );
    });

    assert.equal(snapshotCount, 1);

    act(() => {
      renderer?.unmount();
    });

    resolveHydration("dark");
    await flushEffects();

    assert.equal(snapshotCount, 1);
  });
  it("reads a legacy plain 'dark' value as preference dark and resolved mode dark", async () => {
    const { storage } = createStorageAdapter({ getValue: "dark" });
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <Probe />
        </ThemeProvider>
      );
    });
    await flushEffects();

    assert.equal(latest?.preference, "dark");
    assert.equal(latest?.mode, "dark");
  });

  it("reads the JSON form, including the system preference and the density", async () => {
    const { storage } = createStorageAdapter({ getValue: stored("system", "compact") });
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="dark" persistTheme storage={storage} systemScheme="dark">
          <Probe />
        </ThemeProvider>
      );
    });
    await flushEffects();

    assert.equal(latest?.preference, "system");
    assert.equal(latest?.mode, "dark");
    assert.equal(latest?.theme.density.default, "compact");
  });

  it("ignores malformed JSON, unknown preferences and unknown densities", async () => {
    for (const getValue of ["{", "[]", "null", JSON.stringify({ preference: "blue" }), JSON.stringify({ density: "compact" })]) {
      const { storage } = createStorageAdapter({ getValue });
      let latest: ReturnType<typeof useTheme> | undefined;
      function Probe() {
        latest = useTheme();
        return null;
      }
      act(() => {
        TestRenderer.create(
          <ThemeProvider initialMode="light" persistTheme storage={storage}>
            <Probe />
          </ThemeProvider>
        );
      });
      await flushEffects();
      assert.equal(latest?.preference, "light", getValue);
      assert.equal(latest?.ready, true, getValue);
    }
    const { storage } = createStorageAdapter({ getValue: JSON.stringify({ preference: "dark", density: "huge" }) });
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider persistTheme storage={storage}>
          <Probe />
        </ThemeProvider>
      );
    });
    await flushEffects();
    assert.equal(latest?.preference, "dark");
    assert.equal(latest?.theme.density.default, "regular");
  });

  it("ready is false until a slow adapter answers, then true", async () => {
    let resolveRead: (value: string | null) => void = () => undefined;
    const getValue = new Promise<string | null>((resolve) => {
      resolveRead = resolve;
    });
    const { storage } = createStorageAdapter({ getValue });
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useTheme().ready);
      return null;
    }

    act(() => {
      TestRenderer.create(
        <ThemeProvider persistTheme storage={storage}>
          <Probe />
        </ThemeProvider>
      );
    });
    assert.equal(seen.at(-1), false);

    resolveRead(stored("dark"));
    await flushEffects();
    assert.equal(seen.at(-1), true);
  });

  it("ready is true at once without persistence, and true after an adapter error with the defaults kept", async () => {
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useTheme().ready);
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
    });
    assert.deepEqual(seen, [true]);

    const { storage } = createStorageAdapter({ getError: new Error("read failed") });
    let latest: ReturnType<typeof useTheme> | undefined;
    function ErrorProbe() {
      latest = useTheme();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="dark" persistTheme storage={storage}>
          <ErrorProbe />
        </ThemeProvider>
      );
    });
    assert.equal(latest?.ready, false);
    await flushEffects();
    assert.equal(latest?.ready, true);
    assert.equal(latest?.mode, "dark");
  });

  it("a choice made before the stored value arrives is not overwritten by it", async () => {
    let resolveRead: (value: string | null) => void = () => undefined;
    const getValue = new Promise<string | null>((resolve) => {
      resolveRead = resolve;
    });
    const { storage } = createStorageAdapter({ getValue });
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light" persistTheme storage={storage}>
          <Probe />
        </ThemeProvider>
      );
    });
    act(() => latest?.setMode("dark"));
    resolveRead(stored("light"));
    await flushEffects();
    assert.equal(latest?.mode, "dark");
    assert.equal(latest?.ready, true);
  });

  it("persists the preference chosen with setPreference, system included", async () => {
    const { storage, calls } = createStorageAdapter({ getValue: null });
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider persistTheme storage={storage} density="comfortable">
          <Probe />
        </ThemeProvider>
      );
    });
    await flushEffects();
    act(() => latest?.setPreference("system"));
    await flushEffects();
    assert.deepEqual(calls.at(-1), { method: "setItem", key: "personal-library.theme", value: stored("system", "comfortable") });
  });
  it("a read that answers after the storage key changed does not apply its value", async () => {
    const resolvers: Record<string, (value: string | null) => void> = {};
    const storage: ThemeStorageAdapter = {
      getItem: (key) => new Promise<string | null>((resolve) => (resolvers[key] = resolve)),
      setItem: async () => undefined,
    };
    let latest: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      latest = useTheme();
      return null;
    }
    const tree = (key: string) => (
      <ThemeProvider initialMode="light" persistTheme storage={storage} storageKey={key}>
        <Probe />
      </ThemeProvider>
    );
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(tree("first"));
    });
    act(() => renderer.update(tree("second")));
    resolvers.first!(stored("dark"));
    await flushEffects();
    assert.equal(latest?.mode, "light");
    assert.equal(latest?.ready, false);
    resolvers.second!(null);
    await flushEffects();
    assert.equal(latest?.ready, true);
  });
});

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
      { method: "setItem", key: "personal-library.theme", value: "dark" },
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
      { method: "setItem", key: "app.theme", value: "light" },
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
});

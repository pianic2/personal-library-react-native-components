import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import {
  FoldAdapterProvider,
  resolveAspectPosture,
  resolveDeviceClass,
  useAspectPosture,
  useDeviceClass,
  useFoldState,
  type AspectPosture,
  type DeviceClass,
  type FoldAdapter,
  type FoldState,
} from "../../src/responsive/useDeviceClass.js";
import { withWindowSize } from "../helpers/dimensions.js";

type MutablePlatform = { OS: string; isPad?: boolean };
const platform = Platform as unknown as MutablePlatform;

function withPlatform<T>(patch: Partial<MutablePlatform>, fn: () => T): T {
  const saved = { OS: platform.OS, isPad: platform.isPad };
  Object.assign(platform, patch);
  try {
    return fn();
  } finally {
    platform.OS = saved.OS;
    if (saved.isPad === undefined) delete platform.isPad;
    else platform.isPad = saved.isPad;
  }
}

function deviceAt(width: number, height: number): DeviceClass {
  let seen: DeviceClass | undefined;
  function Probe() {
    seen = useDeviceClass();
    return null;
  }
  act(() => {
    TestRenderer.create(withWindowSize(<Probe />, { width, height }));
  });
  return seen!;
}

describe("PLRNUI-183 useDeviceClass", () => {
  it("800x1280 is a tablet and 390x844 is a phone (native)", () => {
    withPlatform({ OS: "android" }, () => {
      assert.equal(deviceAt(800, 1280), "tablet");
      assert.equal(deviceAt(390, 844), "phone");
    });
  });

  const nativeTable: Array<[number, number, DeviceClass]> = [
    [599, 1000, "phone"],
    [600, 1000, "tablet"],
    [1000, 599, "phone"],
    [1000, 600, "tablet"],
    [0, 0, "phone"],
    [1280, 800, "tablet"],
  ];
  for (const [w, h, expected] of nativeTable) {
    it(`native ${w}x${h} (shortest side ${Math.min(w, h)}) is ${expected}`, () => {
      withPlatform({ OS: "ios", isPad: false }, () => assert.equal(deviceAt(w, h), expected));
    });
  }

  it("Platform.isPad forces tablet even for a small window", () => {
    withPlatform({ OS: "ios", isPad: true }, () => assert.equal(deviceAt(390, 500), "tablet"));
    withPlatform({ OS: "ios", isPad: false }, () => assert.equal(deviceAt(390, 500), "phone"));
  });

  it("macos and windows are desktops", () => {
    withPlatform({ OS: "macos" }, () => assert.equal(deviceAt(500, 400), "desktop"));
    withPlatform({ OS: "windows" }, () => assert.equal(deviceAt(500, 400), "desktop"));
  });

  it("web: a wide fine-pointer window is a desktop, a wide coarse-pointer window a tablet, a narrow one a phone", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    try {
      withPlatform({ OS: "web" }, () => {
        g.matchMedia = (query: string) => ({ matches: query.includes("fine") });
        assert.equal(deviceAt(1280, 800), "desktop");
        assert.equal(deviceAt(1023, 800), "tablet");
        assert.equal(deviceAt(500, 800), "phone");
        g.matchMedia = (query: string) => ({ matches: !query.includes("fine") });
        assert.equal(deviceAt(1280, 800), "tablet");
        assert.equal(deviceAt(500, 800), "phone");
      });
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });

  it("web without matchMedia, or with one that throws, assumes a fine pointer", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    try {
      withPlatform({ OS: "web" }, () => {
        delete g.matchMedia;
        assert.equal(deviceAt(1280, 800), "desktop");
        g.matchMedia = () => {
          throw new Error("unsupported");
        };
        assert.equal(deviceAt(1280, 800), "desktop");
      });
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });

  it("web calls matchMedia on globalThis (a browser throws Illegal invocation for any other this)", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    g.matchMedia = function (this: unknown, query: string) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return { matches: query.includes("fine") === false };
    };
    try {
      withPlatform({ OS: "web" }, () => assert.equal(deviceAt(1280, 800), "tablet"));
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });

  it("the pure rule matches the hook", () => {
    assert.equal(resolveDeviceClass(800, 1280, { OS: "android" }), "tablet");
    assert.equal(resolveDeviceClass(390, 844, { OS: "ios" }), "phone");
    assert.equal(resolveDeviceClass(390, 844, { OS: "ios", isPad: true }), "tablet");
  });
});

describe("PLRNUI-183 useAspectPosture", () => {
  function postureAt(width: number, height: number): AspectPosture {
    let seen: AspectPosture | undefined;
    function Probe() {
      seen = useAspectPosture();
      return null;
    }
    act(() => {
      TestRenderer.create(withWindowSize(<Probe />, { width, height }));
    });
    return seen!;
  }

  const table: Array<[number, number, AspectPosture]> = [
    [390, 844, "normal"],
    [844, 390, "wide"],
    [1600, 1000, "wide"],
    [1599, 1000, "normal"],
    [1000, 1000, "square-ish"],
    [1250, 1000, "square-ish"],
    [1251, 1000, "normal"],
    [800, 1000, "square-ish"],
    [799, 1000, "normal"],
    [0, 0, "normal"],
  ];
  for (const [w, h, expected] of table) {
    it(`${w}x${h} is ${expected}`, () => {
      assert.equal(postureAt(w, h), expected);
      assert.equal(resolveAspectPosture(w, h), expected);
    });
  }
});

describe("PLRNUI-183 FoldAdapter", () => {
  function foldWith(adapter: FoldAdapter | undefined): FoldState {
    let seen: FoldState | undefined;
    function Probe() {
      seen = useFoldState();
      return null;
    }
    act(() => {
      TestRenderer.create(adapter ? <FoldAdapterProvider adapter={adapter}><Probe /></FoldAdapterProvider> : <Probe />);
    });
    return seen!;
  }

  it("without an adapter the device is unfolded", () => {
    assert.deepEqual(foldWith(undefined), { isFolded: false });
  });

  it("adapter values flow through the hook", () => {
    const hinge = { x: 400, y: 0, width: 20, height: 800 };
    const adapter: FoldAdapter = { useFoldState: () => ({ isFolded: true, hingeBounds: hinge }) };
    const state = foldWith(adapter);
    assert.equal(state.isFolded, true);
    assert.deepEqual(state.hingeBounds, hinge);
  });

  it("an adapter that uses hooks and changes over time re-renders the consumer", () => {
    let setFolded!: (value: boolean) => void;
    const adapter: FoldAdapter = {
      useFoldState() {
        const [folded, set] = React.useState(false);
        setFolded = set;
        return { isFolded: folded };
      },
    };
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useFoldState().isFolded);
      return null;
    }
    act(() => {
      TestRenderer.create(<FoldAdapterProvider adapter={adapter}><Probe /></FoldAdapterProvider>);
    });
    assert.equal(seen.at(-1), false);
    act(() => setFolded(true));
    assert.equal(seen.at(-1), true);
  });

  it("an error thrown by the adapter propagates (swallowing it would change the hook order); adapters must not throw", () => {
    const adapter: FoldAdapter = {
      useFoldState() {
        throw new Error("native failure");
      },
    };
    const quiet = console.error;
    console.error = () => undefined;
    try {
      assert.throws(() => foldWith(adapter), /native failure/);
    } finally {
      console.error = quiet;
    }
  });

  it("isPad is ignored on web and on desktop operating systems", () => {
    assert.equal(resolveDeviceClass(500, 400, { OS: "web", isPad: true }, false), "phone");
    assert.equal(resolveDeviceClass(500, 400, { OS: "macos", isPad: true }), "desktop");
    assert.equal(resolveDeviceClass(500, 400, { OS: "android", isPad: true }), "tablet");
  });
});

describe("PLRNUI-183 no native imports", () => {
  it("the three modules import only react, react-native core and local files", () => {
    for (const file of ["src/responsive/useDeviceClass.ts", "src/responsive/FoldAdapter.tsx"]) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
        const spec = m[1]!;
        assert.ok(spec.startsWith(".") || spec === "react" || spec === "react-native", `${file} imports ${spec}`);
        assert.ok(!/^expo/.test(spec), spec);
      }
    }
  });
});

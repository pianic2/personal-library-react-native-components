// src/theme/variants.ts
//
// Variant / recipe API (design: audit/texo-v1/audit/E2-design-system.md section 3.3). A variants definition is a pure
// function of the Theme, so presets and theme changes apply automatically; slot styles stay plain React Native style
// objects (no CSS-in-JS, JS only, no native import). `useVariants` (./useVariants.ts) resolves it per component.
import type { TextStyle, ViewStyle } from "react-native";
import type { Theme } from "./types.js";

/** A plain React Native style object of one slot (view and text style keys; the slot decides which apply). */
export type SlotStyle = ViewStyle & TextStyle;

/** Styles per slot; a slot may be left out. */
export type SlotStyles<S extends string> = { [K in S]?: SlotStyle };

export type VariantGroups<S extends string> = Record<string, Record<string, SlotStyles<S>>>;

type OptionKey<G> = Extract<keyof G, string>;

/** The option names of every variant group, each optional. */
export type VariantSelection<V> = { [G in keyof V]?: OptionKey<V[G]> };

export interface CompoundVariant<S extends string, V> {
  /** Applies when every listed group has the listed option selected. */
  when: VariantSelection<V>;
  style: SlotStyles<S>;
}

export interface VariantsSpec<S extends string, V extends VariantGroups<S>, ST extends string> {
  slots: readonly S[];
  base?: SlotStyles<S>;
  variants?: V;
  /** Interaction states, layered after the variants in declaration order. */
  states?: { [K in ST]?: SlotStyles<S> };
  compoundVariants?: ReadonlyArray<CompoundVariant<S, V>>;
  defaultVariants?: VariantSelection<V>;
}

/** What `defineVariants` returns: the definition as a function of the theme, tagged with an optional override name. */
export interface VariantsDefinition<S extends string, V extends VariantGroups<S>, ST extends string> {
  (theme: Theme): VariantsSpec<S, V, ST>;
  /** Key of `theme.variants` whose overrides are deep-merged into this definition. */
  readonly variantsName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyVariantsDefinition = VariantsDefinition<any, any, any>;

/** The variant props of a definition, for component prop types: `VariantProps<typeof buttonVariants>`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariantProps<D> = D extends VariantsDefinition<any, infer V, any> ? VariantSelection<V> : never;

/** The state flag names of a definition. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariantStates<D> = D extends VariantsDefinition<any, any, infer ST> ? { [K in ST]?: boolean } : never;

/** The slot names of a definition. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariantSlots<D> = D extends VariantsDefinition<infer S, any, any> ? S : never;

/** The overrides a consumer may put in `theme.variants[name]` for a definition; unknown slots, groups and options do not compile. */
export type VariantOverrides<D> = D extends VariantsDefinition<infer S, infer V, infer ST>
  ? {
      base?: SlotStyles<S>;
      variants?: { [G in keyof V]?: { [O in OptionKey<V[G]>]?: SlotStyles<S> } };
      states?: { [K in ST]?: SlotStyles<S> };
      defaultVariants?: VariantSelection<V>;
    }
  : never;

/** The loosely typed shape stored in `Theme.variants` (the precise shape is `VariantOverrides<typeof definition>`). */
export interface ThemeVariantOverrides {
  [name: string]:
    | {
        base?: Record<string, SlotStyle>;
        variants?: Record<string, Record<string, Record<string, SlotStyle>>>;
        states?: Record<string, Record<string, SlotStyle>>;
        defaultVariants?: Record<string, string>;
      }
    | undefined;
}

/**
 * Declares variants as a function of the theme. Pass `{ name }` to let consumers override it through
 * `theme.variants[name]` (deep-merged over the definition).
 */
export function defineVariants<S extends string, V extends VariantGroups<S>, ST extends string = never>(
  build: (theme: Theme) => VariantsSpec<S, V, ST>,
  options: { name?: string } = {}
): VariantsDefinition<S, V, ST> {
  const definition = ((theme: Theme) => build(theme)) as { (theme: Theme): VariantsSpec<S, V, ST>; variantsName?: string };
  if (options.name !== undefined) Object.defineProperty(definition, "variantsName", { value: options.name, enumerable: true });
  return definition as VariantsDefinition<S, V, ST>;
}

type PlainObject = Record<string, unknown>;
const isPlain = (value: unknown): value is PlainObject => value !== null && typeof value === "object" && !Array.isArray(value);

/** Deep merge of plain objects; arrays and other values from `source` replace; `undefined` in `source` is skipped. */
export function mergeDeep<T>(target: T, source: unknown): T {
  if (!isPlain(source) || !isPlain(target)) return (source === undefined ? target : (source as T));
  const out: PlainObject = { ...target };
  for (const key of Object.keys(source)) {
    if (key === "__proto__") continue;
    const value = source[key];
    if (value === undefined) continue;
    out[key] = isPlain(out[key]) && isPlain(value) ? mergeDeep(out[key], value) : value;
  }
  return out as T;
}

export type ResolvedSlots<S extends string> = { readonly [K in S]: SlotStyle };

const EMPTY: SlotStyle = Object.freeze({}) as SlotStyle;

interface Entry {
  spec: VariantsSpec<string, VariantGroups<string>, string>;
  cache: Map<string, ResolvedSlots<string>>;
}

// One entry per (theme, definition): the evaluated spec (with the theme override merged) and the resolved styles per key.
const entries = new WeakMap<object, WeakMap<object, Entry>>();

function entryFor(theme: Theme, definition: AnyVariantsDefinition): Entry {
  let byDefinition = entries.get(theme);
  if (!byDefinition) entries.set(theme, (byDefinition = new WeakMap()));
  let entry = byDefinition.get(definition);
  if (!entry) {
    let spec = definition(theme) as Entry["spec"];
    const name = (definition as { variantsName?: string }).variantsName;
    const override = name === undefined ? undefined : (theme as { variants?: ThemeVariantOverrides }).variants?.[name];
    if (override) spec = mergeDeep(spec, override);
    entry = { spec, cache: new Map() };
    byDefinition.set(definition, entry);
  }
  return entry;
}

/**
 * Resolves the slot styles of a definition for the selected variants and active states. Order: `base`, then each variant
 * group in declaration order (the selected option, else `defaultVariants`), then matching `compoundVariants` in order,
 * then active `states` in declaration order; later layers win per style key. The result is memoized per
 * (theme, definition, selection, states): the same inputs return the same object, a new theme recomputes.
 */
export function resolveVariants<D extends AnyVariantsDefinition>(
  theme: Theme,
  definition: D,
  variantProps: VariantProps<D> = {} as VariantProps<D>,
  states: VariantStates<D> = {} as VariantStates<D>
): ResolvedSlots<VariantSlots<D>> {
  const entry = entryFor(theme, definition);
  const { spec } = entry;
  const groups = spec.variants ?? {};

  const selected: Record<string, string | undefined> = {};
  for (const group of Object.keys(groups)) {
    const chosen = (variantProps as Record<string, unknown>)[group];
    const fallback = (spec.defaultVariants as Record<string, string | undefined> | undefined)?.[group];
    const option = typeof chosen === "string" && Object.hasOwn(groups[group]!, chosen) ? chosen : fallback;
    selected[group] = option !== undefined && Object.hasOwn(groups[group]!, option) ? option : undefined;
  }
  const stateNames = Object.keys(spec.states ?? {});
  const active = stateNames.filter((name) => (states as Record<string, unknown>)[name] === true);

  const key = `${Object.keys(groups).map((g) => `${g}=${selected[g] ?? ""}`).join("|")}#${active.join(",")}`;
  const cached = entry.cache.get(key);
  if (cached) return cached as ResolvedSlots<VariantSlots<D>>;

  const out: Record<string, Record<string, unknown>> = {};
  for (const slot of spec.slots) out[slot] = {};
  const layer = (styles: SlotStyles<string> | undefined): void => {
    if (!styles) return;
    for (const slot of Object.keys(styles)) {
      const style = styles[slot];
      if (style) out[slot] = { ...(out[slot] ?? {}), ...(style as Record<string, unknown>) };
    }
  };

  layer(spec.base);
  for (const group of Object.keys(groups)) {
    const option = selected[group];
    if (option !== undefined) layer(groups[group]![option]);
  }
  for (const compound of spec.compoundVariants ?? []) {
    const when = compound.when as Record<string, string | undefined>;
    if (Object.keys(when).every((g) => selected[g] === when[g])) layer(compound.style);
  }
  for (const name of active) layer(spec.states?.[name]);

  const resolved: Record<string, SlotStyle> = {};
  for (const slot of spec.slots) resolved[slot] = Object.keys(out[slot]!).length === 0 ? EMPTY : Object.freeze(out[slot]!) as SlotStyle;
  Object.freeze(resolved);
  entry.cache.set(key, resolved);
  return resolved as ResolvedSlots<VariantSlots<D>>;
}

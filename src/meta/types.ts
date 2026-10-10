/**
 * Component metadata (ADR 0016). One `<Name>.meta.ts` file per component, colocated with the component, is the only
 * source read by the maturity gate, the catalog, the docs lint and the AI manifests.
 *
 * Everything here is JSON-serialisable (strings, arrays, plain objects). Component code never imports this module and
 * it is not exported from `src/index.ts`; the build excludes `**\/*.meta.ts` and `src/meta`.
 */

/** Maturity ladder (ADR 0003). `deprecated` is the exit state. */
export type ComponentStatus = "prototype" | "demo" | "stable" | "production-ready" | "deprecated";

export interface ComponentMetaExample {
  title: string;
  /** Repository-relative path of an example file or a docs page. At least one of `path` and `code` is required. */
  path?: string;
  /** Short inline snippet. */
  code?: string;
}

export interface ComponentMeta {
  /** Component directory name, for example `Button`. */
  name: string;
  /** Docs family, for example `form` (the folder under docs/components). */
  category: string;
  status: ComponentStatus;
  /** One sentence, at most 140 characters. */
  summary: string;
  whenToUse: string[];
  /** `instead` must name another component that has a meta file. */
  whenNotToUse: Array<{ reason: string; instead: string }>;
  composition: {
    parents: string[];
    children: string[];
    pairsWith: string[];
  };
  /** Accessibility behavior and known gaps. */
  a11y: string[];
  /** Prop name to the values it accepts, for example `{ size: ["sm", "md"] }`. Numeric values are written as strings. */
  variants: Record<string, string[]>;
  /** User-visible states, at least one. */
  states: string[];
  platformNotes: string[];
  /** At least one. */
  examples: ComponentMetaExample[];
}

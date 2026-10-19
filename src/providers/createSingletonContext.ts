import { createContext, type Context } from "react";

type Registry = Record<symbol, Context<unknown> | undefined>;

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/**
 * Creates the React context `name`, or returns the one a first copy of the library already registered on
 * `globalThis[Symbol.for("texo.<name>")]`. Two copies of the package (for example the shim and Texo itself) then share
 * one context, so a provider of one copy is seen by the hooks of the other. A second registration logs one
 * development warning, because two copies usually mean a duplicated dependency.
 */
export function createSingletonContext<T>(name: string, defaultValue: T): Context<T> {
  const registry = globalThis as unknown as Registry;
  const key = Symbol.for(`texo.${name}`);
  const existing = registry[key];
  if (existing) {
    if (isDev()) {
      console.warn(`Texo: the "${name}" context is registered a second time. Two copies of the library are loaded; the first one is reused.`);
    }
    return existing as unknown as Context<T>;
  }
  const created = createContext<T>(defaultValue);
  registry[key] = created as unknown as Context<unknown>;
  return created;
}

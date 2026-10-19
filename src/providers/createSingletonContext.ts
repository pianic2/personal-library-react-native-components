import { createContext, type Context } from "react";

type Registry = Record<symbol, Context<unknown> | undefined>;

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/**
 * Registers `context` on `globalThis[Symbol.for("texo.<name>")]` and returns the registered one. When another context is
 * already registered under that name (a second copy of the library is loaded) the first one is returned and one
 * development warning is logged. Registering the same context again is silent.
 */
export function registerSingletonContext<T>(name: string, context: Context<T>): Context<T> {
  const registry = globalThis as unknown as Registry;
  const key = Symbol.for(`texo.${name}`);
  const existing = registry[key];
  if (!existing) {
    registry[key] = context as unknown as Context<unknown>;
    return context;
  }
  if (existing !== (context as unknown) && isDev()) {
    console.warn(`Texo: the "${name}" context is registered a second time. Two copies of the library are loaded; the first one is reused.`);
  }
  return existing as unknown as Context<T>;
}

/**
 * Creates the React context `name`, or returns the one a first copy of the library already registered. Two copies of
 * the package then share one context, so a provider of one copy is seen by the hooks of the other.
 */
export function createSingletonContext<T>(name: string, defaultValue: T): Context<T> {
  return registerSingletonContext(name, createContext<T>(defaultValue));
}

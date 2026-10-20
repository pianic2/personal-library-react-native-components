import { useMemo } from "react";
import { useMessages } from "../../i18n/index.js";
import type { Messages } from "../../i18n/index.js";
import { createMessageLookup } from "./messages.js";
import { readPath } from "./rules.js";
import type { Errors, Resolver, Rule, RuleMap } from "./types.js";

export interface CreateResolverOptions {
  /** Catalog used for rule messages (usually `useMessages()`); `useResolver` passes it. Default: English defaults. */
  messages?: Partial<Messages>;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/**
 * Builds a `Resolver` from rules per field path. For each field the first failing rule wins; rules after it do not run.
 * The resolver is synchronous when no rule returns a promise, otherwise it returns a promise.
 */
export function createResolver<T>(rules: RuleMap<T>, options: CreateResolverOptions = {}): Resolver<T> {
  const entries = Object.entries(rules).map(([path, rule]) => [path, ([] as Array<Rule<T>>).concat(rule as Rule<T> | Array<Rule<T>>)] as const);
  return (values: T) => {
    const message = createMessageLookup(options.messages);
    const errors: Record<string, string> = {};
    const pending: Array<Promise<void>> = [];

    for (const [path, list] of entries) {
      const value = readPath(values, path);
      const context = { values, path, message };
      const settle = (index: number): void | Promise<void> => {
        for (let i = index; i < list.length; i += 1) {
          const result = list[i]!(value, context);
          if (isThenable(result)) {
            return Promise.resolve(result).then((text) => {
              if (typeof text === "string") errors[path] = text;
              else return settle(i + 1);
            });
          }
          if (typeof result === "string") {
            errors[path] = result;
            return;
          }
        }
      };
      const outcome = settle(0);
      if (outcome) pending.push(outcome);
    }

    if (pending.length === 0) return errors as Errors<T>;
    return Promise.all(pending).then(() => {
      // Keep the declaration order of the rule map regardless of which async rule settled first.
      const ordered: Record<string, string> = {};
      for (const [path] of entries) if (path in errors) ordered[path] = errors[path]!;
      return ordered as Errors<T>;
    });
  };
}

/** `createResolver` bound to the `LocaleProvider` catalog. Memoize or hoist `rules` to keep the resolver stable. */
export function useResolver<T>(rules: RuleMap<T>): Resolver<T> {
  const messages = useMessages();
  return useMemo(() => createResolver<T>(rules, { messages }), [rules, messages]);
}

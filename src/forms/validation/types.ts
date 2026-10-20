import type { MessageKey, MessageVars } from "../../i18n/index.js";

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date | ((...args: never[]) => unknown);

/** Dot-separated paths of the object `T` (`"address.city"`, `"tags.0"`). Depth is capped to keep inference cheap. */
export type Path<T, Depth extends readonly unknown[] = []> = Depth["length"] extends 5
  ? never
  : T extends Primitive
    ? never
    : T extends ReadonlyArray<infer U>
      ? `${number}` | `${number}.${Path<U, [...Depth, unknown]>}`
      : {
          [K in keyof T & (string | number)]: `${K}` | (T[K] extends Primitive ? never : `${K}.${Path<T[K], [...Depth, unknown]>}`);
        }[keyof T & (string | number)];

/** Field path to the first error message. A field without an error is absent. */
export type Errors<T> = Partial<Record<Path<T>, string>>;

/** Schema-agnostic validator: returns the errors (an empty object when valid), synchronously or not. */
export type Resolver<T> = (values: T) => Errors<T> | Promise<Errors<T>>;

/** What a rule receives next to the field value. */
export interface RuleContext<T = unknown> {
  /** The whole form value. */
  values: T;
  /** The path of the field being validated. */
  path: string;
  /** Resolves a catalog message (`validation.*`), applying the global overrides and the resolver's messages. */
  message: (key: MessageKey, vars?: MessageVars) => string;
}

/** Returns an error message, or `undefined` when the value is valid. May be async. */
export type Rule<T = unknown> = (value: unknown, context: RuleContext<T>) => string | undefined | Promise<string | undefined>;

/** Rules per field. A field with several rules reports the first failing one, in array order. */
export type RuleMap<T> = { [P in Path<T>]?: Rule<T> | ReadonlyArray<Rule<T>> };

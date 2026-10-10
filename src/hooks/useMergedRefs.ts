import { useRef } from "react";
import type { MutableRefObject, Ref, RefCallback } from "react";

function sameRefs<T>(a: ReadonlyArray<Ref<T> | undefined>, b: ReadonlyArray<Ref<T> | undefined>): boolean {
  return a.length === b.length && a.every((ref, index) => ref === b[index]);
}

/**
 * Merges several refs (callback refs, object refs, `null` or `undefined`) into one callback ref.
 *
 * The returned callback keeps its identity while the same refs are passed in the same order, so React does not
 * detach and re-attach the refs on every render. A different set of refs produces a new callback; the number of
 * refs may change between renders.
 */
export function useMergedRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  const memo = useRef<{ refs: Array<Ref<T> | undefined>; callback: RefCallback<T> } | null>(null);
  if (memo.current === null || !sameRefs(memo.current.refs, refs)) {
    const captured = refs;
    memo.current = {
      refs: captured,
      callback: (node: T | null) => {
        for (const ref of captured) {
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as MutableRefObject<T | null>).current = node;
        }
      },
    };
  }
  return memo.current.callback;
}

import React, { createContext, useContext } from "react";

/** A rectangle in window coordinates (dp). */
export interface HingeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FoldState {
  /** True while the device is folded (closed or half-open posture the consumer treats as folded). */
  isFolded: boolean;
  /** The hinge/fold area when the platform reports one. */
  hingeBounds?: HingeBounds;
}

/**
 * Consumer-supplied native posture information. The library has no native dependency: an app that wants real fold data
 * wraps a native module (for example the Jetpack WindowManager bridge) in an adapter and provides it with
 * `FoldAdapterProvider`. `useFoldState` is a React hook: it runs inside the components that call `useFoldState()`, so
 * keep the adapter object stable (module level or memoized) and follow the rules of hooks inside it.
 */
export interface FoldAdapter {
  useFoldState(): FoldState;
}

const UNFOLDED: FoldState = Object.freeze({ isFolded: false });

/** The default adapter: never folded, no hinge. */
export const defaultFoldAdapter: FoldAdapter = { useFoldState: () => UNFOLDED };

const FoldAdapterContext = createContext<FoldAdapter>(defaultFoldAdapter);

export interface FoldAdapterProviderProps {
  adapter: FoldAdapter;
  children?: React.ReactNode;
}

/** Provides a fold adapter to the subtree. The adapter must be stable between renders (see `FoldAdapter`). */
export function FoldAdapterProvider({ adapter, children }: FoldAdapterProviderProps): React.ReactElement {
  return <FoldAdapterContext.Provider value={adapter}>{children}</FoldAdapterContext.Provider>;
}

/**
 * The fold state from the provided adapter; `{ isFolded: false }` without one. The adapter runs as part of this hook, so
 * an error it throws (or a promise it throws to suspend) propagates to the nearest error boundary / Suspense boundary:
 * swallowing it would change the number of hooks React sees between renders. Adapters must not throw.
 */
export function useFoldState(): FoldState {
  return useContext(FoldAdapterContext).useFoldState();
}

// ui/components/navigation/NavContext.tsx

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type NavActiveMatch = "exact" | "prefix";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  /** Short status shown next to the label (a count or a word). */
  badge?: string | number;
  /** Nested items; a parent is active when one of its descendants is. */
  children?: NavItem[];
  /** Hides the item from rendering; it still takes part in active matching. */
  hidden?: boolean;
  /** Marks the item as not pressable. */
  disabled?: boolean;
  /** How `href` is compared with the current path. Defaults to "exact". */
  activeMatch?: NavActiveMatch;
}

/** Router-agnostic navigation contract. Router packages implement it; core imports no router. */
export interface NavAdapter {
  navigate: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  /** Returns the current path. Must be stable between calls while the path does not change. */
  currentPath: () => string;
  /** Registers a listener for path changes and returns the unsubscribe function. Members are called detached from the adapter (no `this`). */
  subscribe: (listener: () => void) => () => void;
}

export interface NavContextValue {
  logo?: React.ReactNode;
  items: NavItem[];
  pathname: string;
  navigate: (href: string) => void;
  /** Present when the provider received an adapter. */
  replace?: (href: string) => void;
  /** Present when the provider received an adapter. */
  back?: () => void;
}

interface NavProviderBaseProps {
  items: NavItem[];
  logo?: React.ReactNode;
  children: React.ReactNode;
}

/** Legacy form: the host owns the pathname and passes `navigate`. */
export interface NavProviderLegacyProps extends NavProviderBaseProps {
  pathname: string;
  navigate: (href: string) => void;
  adapter?: undefined;
}

/** Adapter form: the pathname is read from, and kept in sync with, the adapter. */
export interface NavProviderAdapterProps extends NavProviderBaseProps {
  adapter: NavAdapter;
  pathname?: undefined;
  navigate?: undefined;
}

export type NavProviderProps = NavProviderLegacyProps | NavProviderAdapterProps;

const NavContext = createContext<NavContextValue | null>(null);

const noopSubscribe = () => () => undefined;

// Overloads keep the legacy signature last, so ComponentProps<typeof NavProvider> stays the legacy props.
export function NavProvider(props: NavProviderAdapterProps): React.JSX.Element;
export function NavProvider(props: NavProviderLegacyProps): React.JSX.Element;
export function NavProvider(props: NavProviderProps): React.JSX.Element {
  const { items, logo, children, adapter } = props;
  const subscribe = adapter ? adapter.subscribe : noopSubscribe;
  const getSnapshot = () => (adapter ? adapter.currentPath() : (props.pathname as string));
  const pathname = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const navigate = adapter ? adapter.navigate : (props.navigate as (href: string) => void);

  const value = useMemo<NavContextValue>(
    () => ({ logo, items, pathname, navigate, replace: adapter?.replace, back: adapter?.back }),
    [adapter, logo, items, pathname, navigate]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

/* =========================
   Active matching
   ========================= */

function normalizePath(path: string): string {
  const bare = path.split(/[?#]/)[0] ?? "";
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return trimmed === "" ? "/" : trimmed;
}

/**
 * Whether `href` matches `pathname`. "exact" compares normalized paths (query, hash and a
 * trailing slash are ignored). "prefix" also matches nested paths on a segment boundary
 * ("/library" matches "/library/42", not "/library-x"); the root "/" only matches "/".
 */
export function isActive(href: string, pathname: string, match: NavActiveMatch = "exact"): boolean {
  const target = normalizePath(href);
  const current = normalizePath(pathname);
  if (current === target) return true;
  if (match !== "prefix" || target === "/") return false;
  return current.startsWith(target + "/");
}

function itemMatches(item: NavItem, pathname: string): boolean {
  return isActive(item.href, pathname, item.activeMatch);
}

/** True when the item, or any nested descendant, matches `pathname`. */
export function isItemActive(item: NavItem, pathname: string): boolean {
  return itemMatches(item, pathname) || (item.children?.some((child) => isItemActive(child, pathname)) ?? false);
}

/** The most specific (longest href) matching item of the tree, or undefined. Hidden and disabled items still match. */
export function findActiveItem(items: NavItem[], pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  const visit = (list: NavItem[]) => {
    for (const item of list) {
      if (itemMatches(item, pathname) && (!best || normalizePath(item.href).length > normalizePath(best.href).length)) best = item;
      if (item.children) visit(item.children);
    }
  };
  visit(items);
  return best;
}

/* =========================
   Hooks pubblici
   ========================= */

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error("useNav must be used inside <NavProvider>");
  }
  return ctx;
}

export function useNavItems(): NavItem[] {
  return useNav().items ?? [];
}
export function useNavLogo(): React.ReactNode {
  return useNav().logo;
}

export function useNavPathname() {
  return useNav().pathname;
}

export function useNavigate() {
  return useNav().navigate;
}

/* =========================
   Hook opzionale (safe)
   ========================= */

export function useOptionalNav() {
  return useContext(NavContext);
}

/* =========================
   Active state hooks
   ========================= */

/** The active item of the provider's items for the current pathname. */
export function useActiveItem(): NavItem | undefined {
  const { items, pathname } = useNav();
  return useMemo(() => findActiveItem(items, pathname), [items, pathname]);
}

/** Whether `item` (or a nested child) is active for the current pathname. */
export function useIsActive(item: NavItem): boolean {
  const { pathname } = useNav();
  return isItemActive(item, pathname);
}

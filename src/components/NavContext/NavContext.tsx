// ui/components/navigation/NavContext.tsx

import React, { createContext, useContext, useMemo } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export interface NavContextValue {
  logo?: React.ReactNode;
  items: NavItem[];
  pathname: string;
  navigate: (href: string) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({
  items,
  logo,
  pathname,
  navigate,
  children,
}: {
  items: NavItem[];
  logo?: React.ReactNode;
  pathname: string;
  navigate: (href: string) => void;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      logo,
      items,
      pathname,
      navigate,
    }),
    [logo, items, pathname, navigate]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
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

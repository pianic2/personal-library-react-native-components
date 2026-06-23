import React from "react";
import { Platform } from "react-native";
import { NavProvider, type NavItem } from "../NavContext";
import { TopBar } from "../TopBar";
import { BottomBar } from "../BottomBar";
import { SideBar, type SideBarVariant } from "../SideBar";

export interface NavBarProps {
  items?: NavItem[];
  logo?: React.ReactNode;

  // IMPORTANT: l’app fornisce lo stato di routing
  pathname: string;
  navigate: (href: string) => void;

  layout?: "auto" | "top" | "bottom" | "sidebar";
  bottomMaxItems?: number;
  sidebarWidth?: number;
  sidebarVariant?: SideBarVariant;
}

export function NavBar({
  items = [],
  logo,
  pathname,
  navigate,
  layout = "auto",
  bottomMaxItems = 5,
  sidebarWidth = 260,
  sidebarVariant = "fixed",
}: NavBarProps) {
  const finalLayout =
    layout === "auto" ? (Platform.OS === "web" ? "top" : "bottom") : layout;

  return (
    <NavProvider items={items} logo={logo} navigate={navigate} pathname={pathname}>
      {finalLayout === "top" && <TopBar />}
      {finalLayout === "bottom" && <BottomBar maxItems={bottomMaxItems} />}
      {finalLayout === "sidebar" && (
        <SideBar width={sidebarWidth} variant={sidebarVariant} />
      )}
    </NavProvider>
  );
}

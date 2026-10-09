// ui/components/navigation/SideBar.tsx

import React, { useState } from "react";
import { Platform, Pressable, ScrollView, View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import { Link } from "../Link/index.js";
import { Text } from "../Text/index.js";
import { useOptionalNav, type NavItem } from "../NavContext/index.js";

export type SideBarVariant = "fixed" | "embedded";

export interface SideBarProps {
  width?: number;
  variant?: SideBarVariant;
}

/** One navigation entry rendered by the sidebar (same shape as the navigation context items). */
type SideBarItem = NavItem;

const COLLAPSED_WIDTH = 72;

/**
 * react-native's ViewStyle has no "fixed" position because it only exists on web.
 * This is the single place where the web-only value is cast, so the rest of the file stays fully typed.
 */
function webFixedPosition(zIndex: number): ViewStyle {
  return {
    position: "fixed" as unknown as ViewStyle["position"],
    top: 0,
    bottom: 0,
    left: 0,
    zIndex,
  };
}

function SideBarItemLink({ item, active, collapsed }: { item: SideBarItem; active: boolean; collapsed: boolean }) {
  const { colors, theme } = useTheme();

  return (
    <Link
      href={item.href}
      underline={false}
      containerStyle={{
        paddingVertical: theme.space.sm,
        paddingHorizontal: theme.space.sm,
        borderRadius: theme.radius.md,
        backgroundColor: active ? colors.disabledBg : "transparent",
        marginBottom: theme.space.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {item.icon ? <View style={{ marginRight: collapsed ? 0 : theme.space.sm }}>{item.icon}</View> : null}
        {!collapsed ? (
          <Text weight={active ? "bold" : "regular"} style={{ color: active ? colors.primary : colors.textPrimary }}>
            {item.label}
          </Text>
        ) : null}
      </View>
    </Link>
  );
}

export function SideBar({ width = 280, variant }: SideBarProps = {}) {
  const { colors, theme } = useTheme();
  const nav = useOptionalNav();
  const [collapsed, setCollapsed] = useState(false);
  const items: SideBarItem[] = nav?.items ?? [];
  const pathname = nav?.pathname;

  // Behavior is unchanged from the former platform files: web defaults to a fixed, collapsible bar,
  // native defaults to an embedded bar without a collapse control.
  const isWeb = Platform.OS === "web";
  const resolvedVariant: SideBarVariant = variant ?? (isWeb ? "fixed" : "embedded");
  const isCollapsed = isWeb && collapsed;

  const base: ViewStyle = {
    width: isCollapsed ? COLLAPSED_WIDTH : width,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: theme.space.md,
  };
  let containerStyle: ViewStyle;
  if (!isWeb) {
    containerStyle = { ...base, alignSelf: resolvedVariant === "fixed" ? "stretch" : undefined };
  } else if (resolvedVariant === "fixed") {
    containerStyle = { ...base, ...webFixedPosition(theme.zIndex.sticky) };
  } else {
    containerStyle = { ...base, position: "relative", alignSelf: "stretch", zIndex: theme.zIndex.base };
  }

  return (
    <View style={containerStyle}>
      {isWeb ? (
        <Pressable
          onPress={() => setCollapsed((v) => !v)}
          style={({ pressed }) => ({
            alignSelf: "flex-end",
            padding: theme.space.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text variant="muted" align="center">
            {collapsed ? ">" : "<"}
          </Text>
        </Pressable>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: theme.space.sm }}>
        {items.map((item) => (
          <SideBarItemLink key={item.href} item={item} active={pathname === item.href} collapsed={isCollapsed} />
        ))}
      </ScrollView>
    </View>
  );
}

export default SideBar;

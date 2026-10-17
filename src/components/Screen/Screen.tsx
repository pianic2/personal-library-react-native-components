import React, { createContext, useContext, useMemo } from "react";
import * as ReactNative from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { DismissKeyboardView, KeyboardAvoidingContainer, useKeyboard } from "../../native/keyboard/index.js";
import type { KeyboardAvoidingContainerProps, KeyboardHost } from "../../native/keyboard/index.js";
import { safeAreaEnvStyle, useSafeAreaState } from "../../native/safe-area/index.js";
import type { Edge, Insets } from "../../native/safe-area/index.js";
import { ThemedStatusBar } from "../../native/system-ui/index.js";
import type { ThemedStatusBarProps } from "../../native/system-ui/index.js";
import { useTheme } from "../../theme/useTheme.js";

type Theme = ReturnType<typeof useTheme>["theme"];
type SpaceKey = keyof Theme["space"];
type ColorKey = keyof Theme["colors"];
type HostComponent = React.ComponentType<Record<string, unknown>>;

const ALL_EDGES: readonly Edge[] = ["top", "bottom", "left", "right"];
const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_REFRESH_LABEL = "Refresh";

/** Host overrides for tests, previews and custom hosts. Each one replaces the react-native core member Screen would otherwise use. */
export interface ScreenHosts {
  /** Replaces react-native's `Keyboard` for the keyboard state and for tap-outside dismissal. */
  keyboard?: KeyboardHost;
  /** Replaces `Platform.OS` for the keyboard events and the avoidance behavior. */
  platform?: string;
  /** Replaces `KeyboardAvoidingView`. */
  keyboardAvoidingComponent?: KeyboardAvoidingContainerProps["component"];
  /** Replaces `StatusBar`. */
  statusBarComponent?: ThemedStatusBarProps["StatusBarComponent"];
  /** Replaces `RefreshControl`. */
  refreshControlComponent?: React.ComponentType<Record<string, unknown>>;
}

export interface ScreenProps {
  children?: React.ReactNode;
  /** Renders the body in a vertical `ScrollView` (with pull-to-refresh when `onRefresh` is set) instead of a static `View`. Default `false`. */
  scroll?: boolean;
  /** Edges padded by the safe-area insets. Default: all four. Pass `[]` when a parent already handles the insets. */
  edges?: readonly Edge[];
  /** Padding of the body, as a `theme.space` key. Not applied to the header and the footer. */
  padding?: SpaceKey;
  /** Background, as a `theme.colors` key. Default `"background"`. */
  bg?: ColorKey;
  /** Keeps the footer above the keyboard: `KeyboardAvoidingView` with `padding` on iOS and `height` on Android; the bottom inset is dropped while the keyboard is open. Default `false`. */
  keyboardAvoiding?: boolean;
  /** Dismisses the keyboard when the empty area of the body is pressed. Default `false`. */
  dismissKeyboardOnTapOutside?: boolean;
  /** `auto` follows the theme mode; `light` forces light content (for dark backgrounds) and `dark` forces dark content. Default `auto`. */
  statusBar?: "auto" | "light" | "dark";
  /** Pull-to-refresh state. Only used when `scroll` and `onRefresh` are set. Default `false`. */
  refreshing?: boolean;
  /** Enables pull-to-refresh on the scrolling body. */
  onRefresh?: () => void;
  /** Accessibility label of the refresh control. Default `"Refresh"`. */
  refreshAccessibilityLabel?: string;
  /** Rendered above the body, outside the scroll content. */
  header?: React.ReactNode;
  /** Rendered below the body, outside the scroll content, sticky at the bottom. */
  footer?: React.ReactNode;
  /** Style of the scroll content container (`scroll`) or of the static body. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Host overrides (tests, previews, custom hosts). */
  hosts?: ScreenHosts;
}

const ScreenInsetsContext = createContext<Insets>(NO_INSETS);

/** The safe-area insets the nearest `Screen` applies: the selected `edges` only, and a bottom of 0 while the keyboard is avoided. Zeros outside a `Screen`. */
export function useScreenInsets(): Insets {
  return useContext(ScreenInsetsContext);
}

const cap = (edge: Edge) => `padding${edge[0]!.toUpperCase()}${edge.slice(1)}`;

/**
 * Page root: background, safe-area padding for the chosen edges (from the safe-area adapter, zero fallback), a header,
 * a static or scrolling body, a sticky footer, optional keyboard avoidance and the themed status bar. It does not trap
 * focus and renders header, body and footer in reading order. It composes `src/native` primitives and leaves
 * `ThemeAppShell` untouched.
 */
export function Screen({
  children,
  scroll = false,
  edges = ALL_EDGES,
  padding,
  bg = "background",
  keyboardAvoiding = false,
  dismissKeyboardOnTapOutside = false,
  statusBar = "auto",
  refreshing = false,
  onRefresh,
  refreshAccessibilityLabel = DEFAULT_REFRESH_LABEL,
  header,
  footer,
  contentContainerStyle,
  style,
  testID,
  hosts,
}: ScreenProps) {
  const { theme, colors } = useTheme();
  const { insets, status } = useSafeAreaState();
  const keyboard = useKeyboard({ host: hosts?.keyboard, platform: hosts?.platform });
  const rn = ReactNative as unknown as { View: HostComponent; ScrollView: HostComponent; RefreshControl?: HostComponent };
  const { View, ScrollView } = rn;
  const RefreshControl = hosts?.refreshControlComponent ?? rn.RefreshControl;

  // While the keyboard is avoided it covers the bottom inset, so the footer sits directly on top of it.
  const dropBottom = keyboardAvoiding && keyboard.visible;
  const applied = useMemo<Insets>(
    () => ({
      top: edges.includes("top") ? insets.top : 0,
      right: edges.includes("right") ? insets.right : 0,
      bottom: edges.includes("bottom") && !dropBottom ? insets.bottom : 0,
      left: edges.includes("left") ? insets.left : 0,
    }),
    [edges, insets.top, insets.right, insets.bottom, insets.left, dropBottom]
  );

  const webEnv = status === "noop" && ((ReactNative as unknown as { Platform?: { OS?: string } }).Platform?.OS ?? "web") === "web";
  const framePadding: Record<string, string | number> = webEnv
    ? safeAreaEnvStyle(edges.filter((edge) => edge !== "bottom" || !dropBottom))
    : Object.fromEntries((Object.keys(applied) as Edge[]).map((edge) => [cap(edge), applied[edge]]));

  const bodyPadding = padding === undefined ? undefined : { padding: theme.space[padding] };

  let body: React.ReactNode = children;
  if (dismissKeyboardOnTapOutside) {
    body = <DismissKeyboardView host={hosts?.keyboard} style={scroll ? { flex: undefined, flexGrow: 1 } : undefined}>{children}</DismissKeyboardView>;
  }

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ flexGrow: 1 }, theme.globalStyles?.scrollContent, bodyPadding, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={dismissKeyboardOnTapOutside ? "on-drag" : "none"}
      automaticallyAdjustKeyboardInsets={!keyboardAvoiding}
      showsVerticalScrollIndicator={false}
      {...(onRefresh && RefreshControl
        ? {
            refreshControl: (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                accessibilityLabel={refreshAccessibilityLabel}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ),
          }
        : {})}
    >
      {body}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, bodyPadding, contentContainerStyle]}>{body}</View>
  );

  const statusMode = statusBar === "auto" ? undefined : statusBar === "light" ? "dark" : "light";

  return (
    <ScreenInsetsContext.Provider value={applied}>
      <View
        style={[{ flex: 1, backgroundColor: colors[bg] }, theme.globalStyles?.content, style]}
        {...(testID === undefined ? {} : { testID })}
      >
        <ThemedStatusBar
          {...(statusMode === undefined ? {} : { mode: statusMode })}
          {...(hosts?.statusBarComponent ? { StatusBarComponent: hosts.statusBarComponent } : {})}
        />
        <KeyboardAvoidingContainer
          enabled={keyboardAvoiding}
          {...(hosts?.platform ? { platform: hosts.platform } : {})}
          {...(hosts?.keyboardAvoidingComponent ? { component: hosts.keyboardAvoidingComponent } : {})}
        >
          <View style={[theme.globalStyles?.safeArea, { flex: 1 }, framePadding]}>
            {header}
            {content}
            {footer}
          </View>
        </KeyboardAvoidingContainer>
      </View>
    </ScreenInsetsContext.Provider>
  );
}

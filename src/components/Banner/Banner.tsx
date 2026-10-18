// src/components/Banner/Banner.tsx
// A persistent, full-width announcement for a page or a section (offline, update available, trial ending).

import React from "react";
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "../Text/Text.js";
import { Button } from "../Button/index.js";
import { defineVariants } from "../../theme/variants.js";
import { useVariants } from "../../theme/useVariants.js";
import { useTheme } from "../../theme/useTheme.js";
import { useSafeInsets } from "../../native/safe-area/SafeAreaInsetsProvider.js";

type BannerTone = "neutral" | "info" | "success" | "warning" | "danger";
type BannerPosition = "inline" | "sticky";

const TOUCH_TARGET = 44;
const HIT_SLOP = 8;

// Styling comes from the variants API (E2-06) and semantic tokens only; the tone picks the accent colour.
const bannerVariants = defineVariants(
  (t) => ({
    slots: ["root", "content", "text", "title", "message"],
    base: {
      root: {
        alignSelf: "stretch",
        backgroundColor: t.semantic.surface.sunken,
        borderLeftWidth: t.borderWidth.thick,
        paddingHorizontal: t.space.md,
        paddingVertical: t.space.sm,
        gap: t.space.xs,
      },
      content: { flexDirection: "row", alignItems: "flex-start", gap: t.space.sm },
      text: { flex: 1, gap: t.space.xs },
      title: { color: t.semantic.text.primary },
      message: { color: t.semantic.text.primary },
    },
    variants: {
      tone: {
        neutral: { root: { borderLeftColor: t.semantic.border.default } },
        info: { root: { borderLeftColor: t.semantic.feedback.info } },
        success: { root: { borderLeftColor: t.semantic.feedback.success } },
        warning: { root: { borderLeftColor: t.semantic.feedback.warning } },
        danger: { root: { borderLeftColor: t.semantic.feedback.error } },
      },
      position: {
        inline: {},
        // Web supports `position: sticky`; native has no sticky, so the banner is pinned to the top of its parent.
        sticky: { root: { position: Platform.OS === "web" ? ("sticky" as ViewStyle["position"]) : "absolute", top: 0, left: 0, right: 0, zIndex: t.zIndex.sticky } },
      },
    },
    defaultVariants: { tone: "info", position: "inline" },
  }),
  { name: "banner" }
);

export interface BannerProps {
  /** Colour and urgency: `warning` and `danger` are announced with role alert, the others with role status. */
  tone?: BannerTone;
  title?: string;
  message?: string;
  /** A leading icon. Decorative: it is hidden from assistive technology, the role and the text carry the meaning. */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Extra actions, rendered after the `actionLabel` button; the caller supplies the controls. */
  actions?: React.ReactNode;
  /** Shows the close button. Defaults to true when `onDismiss` is set. Closing hides the banner and calls `onDismiss`. */
  dismissible?: boolean;
  /** Called after the banner is dismissed, with `dismissKey` so the app can remember the dismissal (the Banner stores nothing). */
  onDismiss?: (dismissKey?: string) => void;
  /** An identifier for this announcement, passed to `onDismiss`; the Banner never reads or writes storage itself. */
  dismissKey?: string;
  /** Accessibility label of the close button. Defaults to "Dismiss". */
  dismissLabel?: string;
  /** `inline` (default) sits in the layout; `sticky` stays at the top of its parent and adds the top safe-area inset when a SafeAreaInsetsProvider is mounted. */
  position?: BannerPosition;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Banner({
  tone = "info",
  title,
  message,
  icon,
  actionLabel,
  onAction,
  actions,
  dismissible,
  onDismiss,
  dismissKey,
  dismissLabel = "Dismiss",
  position = "inline",
  style,
  testID,
}: BannerProps) {
  const { theme } = useTheme();
  const styles = useVariants(bannerVariants, { tone, position });
  const insets = useSafeInsets();
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const urgent = tone === "warning" || tone === "danger";
  const showClose = dismissible ?? onDismiss !== undefined;
  const safeTop = position === "sticky" ? insets.top : 0;
  const rootStyle = [styles.root, safeTop > 0 ? { paddingTop: (styles.root.paddingVertical as number) + safeTop } : null, style];

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.(dismissKey);
  };

  const button = actionLabel && onAction ? <Button size="sm" variant="ghost" onPress={onAction} label={actionLabel} /> : null;

  return (
    <View
      testID={testID}
      // `status` exists only as a `role` value (not as an accessibilityRole), so `role` carries both; alert also sets accessibilityRole like Alert.
      role={urgent ? "alert" : "status"}
      accessibilityRole={urgent ? "alert" : undefined}
      accessibilityLiveRegion={tone === "danger" ? "assertive" : "polite"}
      style={rootStyle}
    >
      <View style={styles.content}>
        {icon ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {icon}
          </View>
        ) : null}
        <View style={styles.text}>
          {title ? (
            <Text weight="bold" align="left" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {message ? (
            <Text align="left" style={styles.message}>
              {message}
            </Text>
          ) : null}
        </View>
        {showClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={dismiss}
            hitSlop={HIT_SLOP}
            style={{ minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, alignItems: "center", justifyContent: "center", marginTop: -theme.space.sm, marginRight: -theme.space.sm }}
          >
            <Text style={styles.message} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>
      {actions ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.space.sm }}>
          {button}
          {actions}
        </View>
      ) : (
        button
      )}
    </View>
  );
}

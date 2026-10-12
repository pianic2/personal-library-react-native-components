// EmptyState, ErrorState, LoadingState, Result and AsyncBoundary: the blocks every async screen needs.

import React, { useCallback, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Button } from "../Button/index.js";
import { Heading } from "../Heading/Heading.js";
import { Spinner } from "../Spinner/Spinner.js";
import { Text } from "../Text/Text.js";
import { useTheme } from "../../theme/useTheme.js";

/** `sm` is compact (inline in a card or list), `md` is the full, screen-filling layout. */
type Size = "sm" | "md";

const HIDDEN_FROM_AT = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" } as const;
const TOUCH_TARGET = 44;

interface Common {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function useContainerStyle(size: Size, fill: boolean) {
  const { theme } = useTheme();
  const pad = size === "sm" ? theme.space.md : theme.space.lg;
  return {
    ...(fill && size === "md" ? { flex: 1 } : null),
    alignItems: "center",
    justifyContent: "center",
    padding: pad,
    gap: theme.space.sm,
  } as const;
}

// ---------------------------------------------------------------------------------------------------------------------
// EmptyState

type EmptyVariant = "empty" | "no-results" | "offline";

const EMPTY_COPY: Record<EmptyVariant, { title: string; description: string }> = {
  empty: { title: "Nothing here yet", description: "When there is something to show, it will appear here." },
  "no-results": { title: "No results", description: "Try a different search or remove some filters." },
  offline: { title: "You are offline", description: "Check your connection and try again." },
};

export interface EmptyStateProps extends Common {
  /** Preset copy: `empty` (default), `no-results` or `offline`. `title` and `description` override it. */
  variant?: EmptyVariant;
  /** `md` (default) fills its container; `sm` is a compact block. */
  size?: Size;
  title?: string;
  description?: string;
  /** Icon or illustration slot. Decorative: hidden from assistive technology. */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Extra actions after the two buttons; the caller supplies the controls. */
  actions?: React.ReactNode;
}

/** Icon, title, description, then actions, in that reading order. Actions are the library `Button`. */
export function EmptyState({
  variant = "empty",
  size = "md",
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  actions,
  style,
  testID,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const container = useContainerStyle(size, true);
  const copy = EMPTY_COPY[variant];
  const hasActions = (actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) || actions;
  return (
    <View style={[container, style]} {...(testID === undefined ? {} : { testID })}>
      {icon ? <View {...HIDDEN_FROM_AT}>{icon}</View> : null}
      <Heading level={size === "sm" ? 5 : 3} align="center">
        {title ?? copy.title}
      </Heading>
      <Text variant="muted" align="center">
        {description ?? copy.description}
      </Text>
      {hasActions ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: theme.space.sm, marginTop: theme.space.sm }}>
          {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} size={size === "sm" ? "sm" : "md"} /> : null}
          {secondaryActionLabel && onSecondaryAction ? <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="secondary" size={size === "sm" ? "sm" : "md"} /> : null}
          {actions}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// ErrorState

export interface ErrorStateProps extends Common {
  /** `fullscreen` (default) fills its container; `inline` is a compact block. */
  variant?: "inline" | "fullscreen";
  title?: string;
  /** The user-facing message. Announced politely (`role alert`, live region polite on Android). */
  message?: string;
  /** Called once per press. May return a promise: the button is disabled until it settles. */
  onRetry?: () => void | Promise<void>;
  /** Controls the retrying state yourself (for example from a query). Takes precedence over the promise tracking. */
  retrying?: boolean;
  retryLabel?: string;
  retryingLabel?: string;
  /** Technical detail (for example the error message), hidden behind a toggle and absent from the tree until opened. */
  detail?: string;
  showDetailsLabel?: string;
  hideDetailsLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ErrorState({
  variant = "fullscreen",
  title = "Something went wrong",
  message,
  onRetry,
  retrying,
  retryLabel = "Retry",
  retryingLabel = "Retrying…",
  detail,
  showDetailsLabel = "Show details",
  hideDetailsLabel = "Hide details",
  open,
  defaultOpen = false,
  onOpenChange,
  style,
  testID,
}: ErrorStateProps) {
  const { theme } = useTheme();
  const size: Size = variant === "inline" ? "sm" : "md";
  const container = useContainerStyle(size, true);
  const [pending, setPending] = useState(false);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const inFlight = useRef(false);
  const isOpen = open ?? innerOpen;
  const isRetrying = retrying ?? pending;

  const handleRetry = useCallback(async () => {
    if (inFlight.current || !onRetry) return;
    inFlight.current = true;
    setPending(true);
    try {
      await onRetry();
    } catch {
      // the caller owns error reporting; the button becomes available again
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [onRetry]);

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  return (
    <View style={[container, style]} {...(testID === undefined ? {} : { testID })}>
      <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ alignItems: "center", gap: theme.space.xs }}>
        <Heading level={size === "sm" ? 5 : 3} align="center" variant="danger">
          {title}
        </Heading>
        {message ? (
          <Text variant="muted" align="center">
            {message}
          </Text>
        ) : null}
      </View>
      {onRetry ? (
        <Button label={isRetrying ? retryingLabel : retryLabel} onPress={handleRetry} disabled={isRetrying} size={size === "sm" ? "sm" : "md"} />
      ) : null}
      {detail ? (
        <View style={{ alignItems: "center", gap: theme.space.xs }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isOpen ? hideDetailsLabel : showDetailsLabel}
            accessibilityState={{ expanded: isOpen }}
            onPress={toggle}
            hitSlop={8}
            style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.space.md }}
          >
            <Text variant="muted" size="sm" weight="semibold">
              {isOpen ? hideDetailsLabel : showDetailsLabel}
            </Text>
          </Pressable>
          {isOpen ? (
            <Text variant="muted" size="sm" align="center" selectable>
              {detail}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// LoadingState

export interface LoadingStateProps extends Common {
  /** `fullscreen` (default) fills and centres in its container; `inline` is a spinner next to the label. */
  variant?: "inline" | "fullscreen";
  /** Visible text and accessible name of the spinner. Default `"Loading"`. Pass an empty string for a spinner only. */
  label?: string;
}

export function LoadingState({ variant = "fullscreen", label = "Loading", style, testID }: LoadingStateProps) {
  const { theme } = useTheme();
  const inline = variant === "inline";
  return (
    <View
      style={[
        inline
          ? { flexDirection: "row", alignItems: "center", gap: theme.space.sm, padding: theme.space.sm }
          : { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.space.sm, padding: theme.space.lg },
        style,
      ]}
      {...(testID === undefined ? {} : { testID })}
    >
      <Spinner size={inline ? "sm" : "md"} accessibilityLabel={label || "Loading"} />
      {label ? (
        <View {...HIDDEN_FROM_AT}>
          <Text variant="muted">{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Result

type ResultStatus = "success" | "info" | "warning" | "error" | "403" | "404";

const RESULT_COPY: Record<ResultStatus, { title: string; glyph: string }> = {
  success: { title: "Success", glyph: "✓" },
  info: { title: "For your information", glyph: "i" },
  warning: { title: "Warning", glyph: "!" },
  error: { title: "Something went wrong", glyph: "✕" },
  "403": { title: "Access denied", glyph: "403" },
  "404": { title: "Page not found", glyph: "404" },
};

export interface ResultProps extends Common {
  status?: ResultStatus;
  title?: string;
  description?: string;
  /** Replaces the preset glyph. Decorative: hidden from assistive technology. */
  icon?: React.ReactNode;
  /** Buttons or links below the text; the caller supplies the controls. */
  actions?: React.ReactNode;
}

export function Result({ status = "info", title, description, icon, actions, style, testID }: ResultProps) {
  const { theme, colors } = useTheme();
  const container = useContainerStyle("md", true);
  const copy = RESULT_COPY[status];
  const toneColor = { success: colors.success, info: colors.info, warning: colors.warning, error: colors.error, "403": colors.warning, "404": colors.info }[status];
  const urgent = status === "error";
  return (
    <View
      accessible={false}
      {...(urgent ? { accessibilityRole: "alert" as const, accessibilityLiveRegion: "polite" as const } : {})}
      style={[container, style]}
      {...(testID === undefined ? {} : { testID })}
    >
      <View {...HIDDEN_FROM_AT}>
        {icon ?? (
          <View
            style={{
              minWidth: theme.size.height.lg,
              height: theme.size.height.lg,
              borderRadius: theme.size.height.lg,
              borderWidth: theme.borderWidth.thick,
              borderColor: toneColor,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.space.sm,
            }}
          >
            <Text weight="bold" style={{ color: toneColor }}>
              {copy.glyph}
            </Text>
          </View>
        )}
      </View>
      <Heading level={3} align="center">
        {title ?? copy.title}
      </Heading>
      {description ? (
        <Text variant="muted" align="center">
          {description}
        </Text>
      ) : null}
      {actions ? <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: theme.space.sm, marginTop: theme.space.sm }}>{actions}</View> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// AsyncBoundary

export type AsyncStatus = "idle" | "loading" | "error" | "success";

export interface AsyncBoundaryProps<T> extends Common {
  /** `idle` and `loading` show the loading state (nothing has been loaded yet). */
  status: AsyncStatus;
  data?: T | null;
  error?: unknown;
  /** Decides whether successful data counts as empty. Default: `null`, `undefined` and empty arrays. */
  isEmpty?: (data: T | null | undefined) => boolean;
  /** Passed to the error state's retry button. */
  onRetry?: () => void | Promise<void>;
  /** Replaces the default `LoadingState`. */
  loading?: React.ReactNode;
  /** Props for the default `EmptyState`, or a node that replaces it. */
  empty?: EmptyStateProps | React.ReactElement;
  /** Props for the default `ErrorState`, or a node that replaces it. */
  errorView?: ErrorStateProps | React.ReactElement;
  /** Renders the data once loaded and not empty. */
  children: (data: T) => React.ReactNode;
}

const defaultIsEmpty = (data: unknown): boolean => data === null || data === undefined || (Array.isArray(data) && data.length === 0);

function errorDetail(error: unknown): string | undefined {
  if (error instanceof Error) return error.message || undefined;
  return typeof error === "string" && error ? error : undefined;
}

/** Chooses the loading, error, empty or content view from `{ status, data, error }`. */
export function AsyncBoundary<T>({ status, data, error, isEmpty = defaultIsEmpty, onRetry, loading, empty, errorView, children, style, testID }: AsyncBoundaryProps<T>) {
  const wrap = (node: React.ReactNode) =>
    style || testID !== undefined ? (
      <View style={style} {...(testID === undefined ? {} : { testID })}>
        {node}
      </View>
    ) : (
      <>{node}</>
    );
  if (status === "idle" || status === "loading") return wrap(loading ?? <LoadingState />);
  if (status === "error") {
    if (React.isValidElement(errorView)) return wrap(errorView);
    const detail = errorDetail(error);
    return wrap(<ErrorState {...(onRetry ? { onRetry } : {})} {...(detail ? { detail } : {})} {...(errorView as ErrorStateProps | undefined)} />);
  }
  if (isEmpty(data)) {
    if (React.isValidElement(empty)) return wrap(empty);
    return wrap(<EmptyState {...(empty as EmptyStateProps | undefined)} />);
  }
  return wrap(children(data as T));
}

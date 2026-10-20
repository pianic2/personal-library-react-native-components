// Pure placement maths for Popover: which side, which position. No React and no React Native import, so it is unit-tested directly.

export type PopoverPlacement = "bottom" | "top" | "right" | "left";

/** A rectangle in window coordinates (density-independent pixels). */
export interface PopoverRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlacementInput {
  /** The trigger, from `measureInWindow`. */
  anchor: PopoverRect;
  /** The measured size of the popover content. */
  content: { width: number; height: number };
  /** The window size. */
  window: { width: number; height: number };
  /** Safe-area insets: the popover never enters them. Default all zero. */
  insets?: Partial<PopoverInsets>;
  /** The preferred side. */
  placement: PopoverPlacement;
  /** Distance between the trigger and the popover. */
  gap: number;
  /** Minimum distance kept to the edges of the usable area. Default 0. */
  margin?: number;
}

export interface PlacementResult {
  /** Top-left corner of the popover in window coordinates. */
  x: number;
  y: number;
  /** The side actually used: differs from the preferred one when it flipped. */
  placement: PopoverPlacement;
  flipped: boolean;
}

const OPPOSITE: Record<PopoverPlacement, PopoverPlacement> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Keeps `value` in [min, max]; when the range is empty (content larger than the area) the start edge `min` wins. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Chooses the side and the position of a popover next to its trigger. The preferred side is used when the content fits
 * there; otherwise it flips to the opposite side when that fits, or when that side has more room. Across the axis the
 * popover is centred on the trigger and shifted back inside the usable area (the window minus insets and margin).
 */
export function computePopoverPlacement(input: PlacementInput): PlacementResult {
  const { anchor, content, placement, gap } = input;
  const margin = input.margin ?? 0;
  const insets = { top: 0, right: 0, bottom: 0, left: 0, ...input.insets };
  const minX = insets.left + margin;
  const minY = insets.top + margin;
  const maxX = input.window.width - insets.right - margin;
  const maxY = input.window.height - insets.bottom - margin;

  const room: Record<PopoverPlacement, number> = {
    top: anchor.y - gap - minY,
    bottom: maxY - (anchor.y + anchor.height) - gap,
    left: anchor.x - gap - minX,
    right: maxX - (anchor.x + anchor.width) - gap,
  };
  const need = (side: PopoverPlacement) => (side === "top" || side === "bottom" ? content.height : content.width);

  let side = placement;
  if (room[placement] < need(placement)) {
    const other = OPPOSITE[placement];
    if (room[other] >= need(other) || room[other] > room[placement]) side = other;
  }

  if (side === "top" || side === "bottom") {
    const y = side === "top" ? anchor.y - gap - content.height : anchor.y + anchor.height + gap;
    return {
      x: clamp(anchor.x + anchor.width / 2 - content.width / 2, minX, maxX - content.width),
      y: clamp(y, minY, maxY - content.height),
      placement: side,
      flipped: side !== placement,
    };
  }
  const x = side === "left" ? anchor.x - gap - content.width : anchor.x + anchor.width + gap;
  return {
    x: clamp(x, minX, maxX - content.width),
    y: clamp(anchor.y + anchor.height / 2 - content.height / 2, minY, maxY - content.height),
    placement: side,
    flipped: side !== placement,
  };
}

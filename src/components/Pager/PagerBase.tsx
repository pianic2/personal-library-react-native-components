import React, { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import { useVariants } from "../../theme/useVariants.js";
import { pagerVariants } from "./pager.variants.js";

export interface PagerBaseProps {
  count: number;
  renderPage: (index: number) => React.ReactNode;
  /** Current page (always controlled here: Pager and Carousel own the state). */
  index: number;
  onIndexChange: (index: number) => void;
  lazy: boolean;
  /** Points of the neighbouring pages shown on each side of the current one. */
  peek: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  /** Called with true when a touch or drag starts and false when it ends or the scroll settles. */
  onInteraction?: (active: boolean) => void;
}

export const clampIndex = (value: number, count: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), Math.max(count - 1, 0));
};

/** Shared horizontal paging engine of Pager and Carousel: lazy window, scroll placement, settle detection. */
export function PagerBase({
  count,
  renderPage,
  index,
  onIndexChange,
  lazy,
  peek,
  style,
  testID,
  accessibilityLabel,
  onInteraction,
}: PagerBaseProps) {
  const slots = useVariants(pagerVariants);
  const reduceMotion = useMotionPreference();
  const scrollRef = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(0);
  const current = clampIndex(index, count);
  const itemWidth = Math.max(viewport - 2 * peek, 0);

  // The page last reported while `current` was unchanged: a repeated settle on the same page never reports it twice.
  const reported = useRef<number | null>(null);
  useEffect(() => {
    reported.current = null;
  }, [current]);

  // Keeps the scroll offset on the current page: a parent-driven index, autoplay and a width change all scroll here.
  const placedWidth = useRef(0);
  useEffect(() => {
    if (itemWidth === 0) return;
    const first = placedWidth.current !== itemWidth;
    placedWidth.current = itemWidth;
    scrollRef.current?.scrollTo({ x: current * itemWidth, y: 0, animated: !first && !reduceMotion });
  }, [current, itemWidth, reduceMotion]);

  const onLayout = (e: LayoutChangeEvent) => setViewport(e.nativeEvent.layout.width);

  // One report per settle: only the momentum end carries the final offset; scroll events during the move are ignored.
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onInteraction?.(false);
    if (itemWidth === 0) return;
    const page = clampIndex(e.nativeEvent.contentOffset.x / itemWidth, count);
    if (page === current || page === reported.current) return;
    reported.current = page;
    onIndexChange(page);
  };

  const pages: React.ReactNode[] = [];
  for (let i = 0; i < count; i += 1) {
    const mounted = !lazy || Math.abs(i - current) <= 1;
    const visible = i === current;
    pages.push(
      <View
        key={i}
        testID={testID ? `${testID}-page-${i}` : undefined}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
        style={[slots.page, { width: itemWidth }]}
      >
        {mounted ? renderPage(i) : null}
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      horizontal
      pagingEnabled={peek === 0}
      snapToInterval={peek === 0 ? undefined : itemWidth}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: current * itemWidth, y: 0 }}
      contentContainerStyle={{ paddingHorizontal: peek }}
      onLayout={onLayout}
      onTouchStart={() => onInteraction?.(true)}
      onTouchEnd={() => onInteraction?.(false)}
      onTouchCancel={() => onInteraction?.(false)}
      onScrollBeginDrag={() => onInteraction?.(true)}
      onScrollEndDrag={() => onInteraction?.(false)}
      onMomentumScrollEnd={onMomentumScrollEnd}
      style={[slots.root, style]}
    >
      {pages}
    </ScrollView>
  );
}

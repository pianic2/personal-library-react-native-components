// src/tokens/motion.base.ts
export type CubicBezier = readonly [number, number, number, number];

export const motion = {
  duration: {
    instant: 0,
    fast: 120,
    base: 200,
    slow: 320,
    slower: 480,
  },
  easing: {
    standard: [0.4, 0, 0.2, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    emphasized: [0.2, 0, 0, 1],
  },
  spring: {
    gentle: { stiffness: 120, damping: 14, mass: 1 },
    snappy: { stiffness: 300, damping: 24, mass: 1 },
    bouncy: { stiffness: 400, damping: 12, mass: 1 },
  },
  stagger: {
    fast: 30,
    base: 50,
  },
  distance: {
    sm: 8,
    md: 16,
    lg: 32,
  },
  scale: {
    press: 0.97,
  },
} as const satisfies {
  duration: Record<string, number>;
  easing: Record<string, CubicBezier>;
  spring: Record<string, { stiffness: number; damping: number; mass: number }>;
  stagger: Record<string, number>;
  distance: Record<string, number>;
  scale: Record<string, number>;
};

export type MotionTokens = typeof motion;
export type MotionEasingName = keyof MotionTokens["easing"];

function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const ax = 1 - 3 * x2 + 3 * x1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 1 - 3 * y2 + 3 * y1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sampleX = (u: number): number => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number): number => ((ay * u + by) * u + cy) * u;
  const slopeX = (u: number): number => (3 * ax * u + 2 * bx) * u + cx;

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(u) - t;
      if (Math.abs(error) < 1e-6) return sampleY(u);
      const slope = slopeX(u);
      if (Math.abs(slope) < 1e-6) break;
      u -= error / slope;
    }
    let low = 0;
    let high = 1;
    u = t;
    for (let i = 0; i < 40 && low < high; i += 1) {
      const x = sampleX(u);
      if (Math.abs(x - t) < 1e-6) break;
      if (t > x) low = u;
      else high = u;
      u = (low + high) / 2;
    }
    return sampleY(u);
  };
}

/**
 * Returns the easing function (a plain `(t) => number`, accepted by
 * `Animated.timing({ easing })`) of a motion easing token, given by name
 * (`"standard"`) or as a cubic-bezier tuple. It maps 0 to 0 and 1 to 1. The
 * curve is computed here instead of with `Easing.bezier` so the token layer
 * has no react-native import and runs unchanged under the test shim.
 */
export function toEasing(token: MotionEasingName | CubicBezier): (value: number) => number {
  const [x1, y1, x2, y2] = typeof token === "string" ? motion.easing[token] : token;
  return cubicBezier(x1, y1, x2, y2);
}

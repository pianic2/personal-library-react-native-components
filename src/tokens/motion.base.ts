// src/tokens/motion.base.ts

export const motion = {
  duration: {
    instant: 0,
    fast: 120,
    normal: 200,
    slow: 320,
  },
  easing: {
    standard: "ease-in-out",
    enter: "ease-out",
    exit: "ease-in",
  },
} as const;

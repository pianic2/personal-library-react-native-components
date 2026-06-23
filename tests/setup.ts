Object.defineProperty(globalThis, "__DEV__", {
  configurable: true,
  value: false,
  writable: true,
});

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});

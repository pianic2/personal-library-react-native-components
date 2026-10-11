/**
 * @deprecated Auth token shape does not belong to the design-system token
 * layer; use your own auth types. Kept for backward compatibility only.
 */
export type TokenPair = {
  access: string;
  refresh: string;
};

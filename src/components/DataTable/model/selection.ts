// Selection. Pure functions; no React.
import type { Selection, SelectionAction, SelectionMode } from "./types.js";

/**
 * The reducer of the selection. In `none` mode nothing can be selected. In `single` mode at most one id is kept (the
 * last one selected); `selectAll` selects nothing there. In `multi` mode ids are kept in selection order without
 * duplicates. Returns the same array when nothing changes, so a state update can be skipped.
 */
export function selectionReducer(state: Selection, action: SelectionAction, mode: SelectionMode): Selection {
  if (mode === "none") return state.length === 0 ? state : [];
  switch (action.type) {
    case "clear":
      return state.length === 0 ? state : [];
    case "selectAll": {
      if (mode === "single") return state;
      const next = [...new Set([...state, ...action.ids])];
      return next.length === state.length ? state : next;
    }
    case "deselect": {
      const next = state.filter((id) => id !== action.id);
      return next.length === state.length ? state : next;
    }
    case "select": {
      if (mode === "single") return state.length === 1 && state[0] === action.id ? state : [action.id];
      return state.includes(action.id) ? state : [...state, action.id];
    }
    case "toggle": {
      if (state.includes(action.id)) return state.filter((id) => id !== action.id);
      return mode === "single" ? [action.id] : [...state, action.id];
    }
  }
}

/** Keeps only the ids that are in `valid`, in their order; the same array when all are valid. */
export function pruneSelection(state: Selection, valid: ReadonlySet<string>): Selection {
  const next = state.filter((id) => valid.has(id));
  return next.length === state.length ? state : next;
}

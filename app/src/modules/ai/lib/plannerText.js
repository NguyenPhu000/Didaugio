export const MAX_PLANNER_NOTES_CHARS = 500;

export function normalizePlannerNotes(value) {
  const text = String(value ?? "").trim();
  let bounded = text.slice(0, MAX_PLANNER_NOTES_CHARS);

  const lastCodeUnit = bounded.charCodeAt(bounded.length - 1);
  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
    bounded = bounded.slice(0, -1);
  }

  return bounded;
}

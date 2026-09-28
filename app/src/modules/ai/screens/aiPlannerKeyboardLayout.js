export function getComposerBaseBottomPadding(insetsBottom = 0) {
  return Math.max(Number(insetsBottom) || 0, 12) + 10;
}

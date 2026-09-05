export function resolveStatusBarStyle({ splashFinished, isDark }) {
  if (!splashFinished || isDark) return "light";
  return "dark";
}

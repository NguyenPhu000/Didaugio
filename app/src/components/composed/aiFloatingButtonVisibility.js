const HIDE_PATHS = new Set([
  "/(tabs)/ai",
  "/ai",
  "/ai/chat",
  "/(auth)/login",
  "/login",
  "/(auth)/register",
  "/register",
  "/onboarding",
]);

export function shouldHideAIFloatingButton(pathname) {
  if (!pathname || HIDE_PATHS.has(pathname)) return true;

  return (
    pathname.startsWith("/place/") ||
    pathname.startsWith("/booking/") ||
    pathname.startsWith("/profile/booking/") ||
    pathname.startsWith("/trip/")
  );
}

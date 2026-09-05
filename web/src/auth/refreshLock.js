const REFRESH_LOCK_NAME = "ipoint-browser-refresh";

export const withBrowserRefreshLock = async (
  operation,
  lockManager = globalThis.navigator?.locks,
) => {
  if (!lockManager?.request) return operation();
  return lockManager.request(
    REFRESH_LOCK_NAME,
    { mode: "exclusive" },
    operation,
  );
};

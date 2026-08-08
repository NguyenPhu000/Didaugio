import { useState, useRef, useEffect, useCallback } from "react";

const serialize = (value) => JSON.stringify(value ?? null);

/**
 * Tracks whether `data` differs from the last saved baseline.
 * Baseline updates only on markSaved(serverTruth); call it after the
 * initial load and after every successful save.
 */
export function useSettingsSaveState(data) {
  const baselineRef = useRef(serialize(data));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(serialize(data) !== baselineRef.current);
  }, [data]);

  const markSaved = useCallback((snapshot) => {
    baselineRef.current = serialize(snapshot);
    setIsDirty(false);
  }, []);

  const getBaseline = useCallback(() => JSON.parse(baselineRef.current), []);

  return { isDirty, markSaved, getBaseline };
}

const UNSAVED_CHANGES_MESSAGE =
  "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?";

/**
 * Warns on browser reload / tab close and same-origin link navigation while
 * `when` is true. BrowserRouter does not expose a data-router blocker, so the
 * capture-phase link guard covers the app's sidebar and breadcrumb links.
 */
export function useBeforeUnloadWarning(when) {
  useEffect(() => {
    if (!when) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    const linkHandler = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      if (destination.href === current.href) return;

      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("click", linkHandler, true);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("click", linkHandler, true);
    };
  }, [when]);
}

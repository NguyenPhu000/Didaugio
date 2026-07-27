import React from "react";

export function safeLazy(importFunc) {
  return React.lazy(() =>
    importFunc().catch((err) => {
      const isChunkError =
        err?.name === "ChunkLoadError" ||
        err?.message?.includes("Failed to fetch dynamically imported module") ||
        err?.message?.includes("Importing a module script failed");

      if (isChunkError) {
        const storageKey = "chunk_reload_retry";
        const hasRetried = sessionStorage.getItem(storageKey);
        if (!hasRetried) {
          sessionStorage.setItem(storageKey, "true");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw err;
    })
  );
}

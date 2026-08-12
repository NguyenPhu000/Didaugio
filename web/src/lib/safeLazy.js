import React from "react";

const CHUNK_RELOAD_KEY = "chunk_reload_retry";

export function safeLazy(importFunc) {
  return React.lazy(() =>
    importFunc().then((module) => {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    }).catch((err) => {
      const isChunkError =
        err?.name === "ChunkLoadError" ||
        err?.message?.includes("Failed to fetch dynamically imported module") ||
        err?.message?.includes("Importing a module script failed");

      if (isChunkError) {
        const hasRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY);
        if (!hasRetried) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw err;
    })
  );
}

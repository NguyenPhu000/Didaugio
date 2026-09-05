import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/authStore";
import {
  createBrowserSessionBootstrap,
  withBrowserRefreshLock,
} from "@/auth/browserSession";

describe("browser session bootstrap", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAuthStore.getState().setLoading(true);
  });

  it("restores the access token into memory from the refresh-cookie response", async () => {
    const bootstrap = createBrowserSessionBootstrap({
      refreshSession: async () => ({
        success: true,
        data: {
          user: { id: 21, roleId: 2 },
          accessToken: "fresh-memory-token",
        },
      }),
      authStore: useAuthStore,
      runWithLock: (operation) => operation(),
    });

    await expect(bootstrap()).resolves.toBe(true);
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 21, roleId: 2 },
      accessToken: "fresh-memory-token",
      isAuthenticated: true,
      isLoading: false,
    });
    expect(localStorage.getItem("auth-storage")).toBeNull();
  });

  it("clears memory state when the refresh cookie is absent or invalid", async () => {
    useAuthStore.getState().setAuth({ id: 21, roleId: 2 }, "stale-token");
    useAuthStore.getState().setLoading(true);
    const bootstrap = createBrowserSessionBootstrap({
      refreshSession: async () => {
        throw new Error("invalid refresh cookie");
      },
      authStore: useAuthStore,
      runWithLock: (operation) => operation(),
    });

    await expect(bootstrap()).resolves.toBe(false);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("deduplicates concurrent bootstrap calls in one tab", async () => {
    let refreshCalls = 0;
    const bootstrap = createBrowserSessionBootstrap({
      refreshSession: async () => {
        refreshCalls += 1;
        return {
          success: true,
          data: { user: { id: 30 }, accessToken: "one-token" },
        };
      },
      authStore: useAuthStore,
      runWithLock: (operation) => operation(),
    });

    await Promise.all([bootstrap(), bootstrap()]);

    expect(refreshCalls).toBe(1);
  });

  it("uses an exclusive same-origin lock when Web Locks is available", async () => {
    const request = vi.fn(async (_name, _options, operation) => operation());

    await expect(
      withBrowserRefreshLock(async () => "done", { request }),
    ).resolves.toBe("done");
    expect(request).toHaveBeenCalledWith(
      "ipoint-browser-refresh",
      { mode: "exclusive" },
      expect.any(Function),
    );
  });
});

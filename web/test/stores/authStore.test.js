import { beforeEach, describe, expect, it, vi } from "vitest";

describe("web auth store persistence boundary", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("purges a legacy persisted bearer token and starts with no authenticated session", async () => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: { id: 9, roleId: 2 },
          accessToken: "legacy-access-token",
          isAuthenticated: true,
        },
      }),
    );

    const { useAuthStore } = await import("@/stores/authStore");

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
    });
    expect(localStorage.getItem("auth-storage")).toBeNull();
  });

  it("never writes a new access token into browser storage", async () => {
    const { useAuthStore } = await import("@/stores/authStore");

    useAuthStore.getState().setAuth({ id: 11, roleId: 3 }, "memory-access-token");

    expect(useAuthStore.getState().accessToken).toBe("memory-access-token");
    expect(localStorage.getItem("auth-storage")).toBeNull();
  });
});

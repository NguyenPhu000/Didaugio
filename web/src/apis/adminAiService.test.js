import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/constants/api", () => ({
  default: apiClient,
}));

import { adminAiService } from "@/apis/adminAiService";

describe("adminAiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads overview from the exact admin AI route", async () => {
    const response = { data: { totalRequests: 12 } };
    apiClient.get.mockResolvedValue(response);

    await expect(adminAiService.getOverview()).resolves.toBe(response);

    expect(apiClient.get).toHaveBeenCalledWith("/v1/admin/ai/overview");
  });

  it("loads metadata logs with every supplied query param", async () => {
    const params = {
      page: 2,
      limit: 25,
      feature: "planner",
      status: "error",
      safetyBlocked: true,
      feedback: "down",
    };
    const response = { data: { items: [], total: 0 } };
    apiClient.get.mockResolvedValue(response);

    await expect(adminAiService.getLogs(params)).resolves.toBe(response);

    expect(apiClient.get).toHaveBeenCalledWith("/v1/admin/ai/logs", { params });
  });

  it("loads configuration from the exact admin AI route", async () => {
    const response = { data: { mode: "normal" } };
    apiClient.get.mockResolvedValue(response);

    await expect(adminAiService.getConfig()).resolves.toBe(response);

    expect(apiClient.get).toHaveBeenCalledWith("/v1/admin/ai/config");
  });

  it("saves a draft with PUT and returns the response body", async () => {
    const payload = { mode: "safe" };
    const response = { data: { version: 4 } };
    apiClient.put.mockResolvedValue(response);

    await expect(adminAiService.saveDraft(payload)).resolves.toBe(response);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/v1/admin/ai/config/draft",
      payload,
    );
  });

  it("tests a draft with POST and the supplied payload", async () => {
    const payload = { prompt: "test" };
    const response = { data: { output: "ok" } };
    apiClient.post.mockResolvedValue(response);

    await expect(adminAiService.testConfig(payload)).resolves.toBe(response);

    expect(apiClient.post).toHaveBeenCalledWith("/v1/admin/ai/config/test", payload);
  });

  it("publishes with POST and the supplied payload", async () => {
    const payload = { expectedRevision: 4 };
    const response = { data: { published: true } };
    apiClient.post.mockResolvedValue(response);

    await expect(adminAiService.publishConfig(payload)).resolves.toBe(response);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/v1/admin/ai/config/publish",
      payload,
    );
  });

  it("rolls back with POST and the supplied payload", async () => {
    const payload = { targetRevision: 3 };
    const response = { data: { rolledBack: true } };
    apiClient.post.mockResolvedValue(response);

    await expect(adminAiService.rollbackConfig(payload)).resolves.toBe(response);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/v1/admin/ai/config/rollback",
      payload,
    );
  });

  it("updates the kill switch with PUT and the supplied payload", async () => {
    const payload = { enabled: true, reason: "incident-42" };
    const response = { data: { enabled: true } };
    apiClient.put.mockResolvedValue(response);

    await expect(adminAiService.updateKillSwitch(payload)).resolves.toBe(response);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/v1/admin/ai/kill-switch",
      payload,
    );
  });
});

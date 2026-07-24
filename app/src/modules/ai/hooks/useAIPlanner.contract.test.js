import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAIPlanner } from "./useAIPlanner";

const mocks = vi.hoisted(() => ({
  mutationIndex: 0,
  mutationConfigs: [],
  mutations: [
    {
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    },
    {
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    },
  ],
  state: {
    messages: [],
    draftPlan: null,
    selectedPlaceIds: [],
    lastPreferences: null,
    appendMessage: vi.fn(),
    replaceDraftPreviewMessage: vi.fn(),
    setDraftPlan: vi.fn(),
    setSelectedPlaceIds: vi.fn(),
    setLastPreferences: vi.fn(),
    resetPlannerState: vi.fn(),
  },
}));

vi.mock("react", () => ({
  useCallback: (callback) => callback,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config) => {
    const index = mocks.mutationIndex % 2;
    mocks.mutationIndex += 1;
    mocks.mutationConfigs[index] = config;
    return mocks.mutations[index];
  },
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("../api/aiApi", () => ({
  confirmGeneratedTripApi: vi.fn(),
  generateTripPreviewApi: vi.fn(),
  getMyTripsApi: vi.fn(),
}));

vi.mock("../lib/mapAIError", () => ({
  mapAIError: () => "request failed",
}));

vi.mock("../lib/plannerPreferences", () => ({
  inferPlannerPreferences: () => ({}),
}));

vi.mock("../../../stores/aiPlannerStore", () => ({
  useAIPlannerStore: (selector) => selector(mocks.state),
}));

vi.mock("../../../constants/trip-query-keys", () => ({
  TRIP_QUERY_KEYS: {
    lists: () => ["trips"],
    list: () => ["trips"],
  },
}));

describe("useAIPlanner mutation boundaries", () => {
  beforeEach(() => {
    mocks.mutationIndex = 0;
    mocks.mutationConfigs.length = 0;
    mocks.state.messages.length = 0;
    mocks.state.draftPlan = null;
    mocks.state.selectedPlaceIds = [];
    mocks.state.lastPreferences = null;

    for (const mutation of mocks.mutations) {
      mutation.mutateAsync.mockReset();
      mutation.reset.mockReset();
      mutation.error = null;
      mutation.isPending = false;
    }

    for (const method of [
      "appendMessage",
      "replaceDraftPreviewMessage",
      "setDraftPlan",
      "setSelectedPlaceIds",
      "setLastPreferences",
      "resetPlannerState",
    ]) {
      mocks.state[method].mockReset();
    }
  });

  it("handles a rejected preview mutation without rethrowing past the submit event", async () => {
    const planner = useAIPlanner();
    const error = new Error("offline");
    mocks.mutations[0].mutateAsync.mockImplementation(async () => {
      mocks.mutationConfigs[0].onError(error);
      throw error;
    });

    await expect(planner.sendMessage("lap lich 2 ngay")).resolves.toEqual({
      success: false,
    });

    expect(mocks.mutations[0].mutateAsync).toHaveBeenCalledOnce();
    expect(mocks.state.appendMessage).toHaveBeenCalledTimes(2);
    expect(mocks.state.appendMessage.mock.calls[1][0]).toMatchObject({
      role: "assistant",
      text: "request failed",
      isError: true,
    });
  });

  it("returns success and caps every planner notes payload at a safe 500 code units", async () => {
    const planner = useAIPlanner();
    const longTranscript = `${"x".repeat(498)}😀${"y".repeat(100)}`;
    mocks.mutations[0].mutateAsync.mockResolvedValueOnce({
      data: { previewOnly: true },
    });

    await expect(planner.sendMessage(longTranscript)).resolves.toEqual({
      success: true,
      data: { previewOnly: true },
    });

    const payload = mocks.mutations[0].mutateAsync.mock.calls[0][0];
    expect(payload.notes.length).toBe(500);
    expect(payload.notes.endsWith("\ud83d")).toBe(false);
  });

  it("handles a rejected confirmation without rethrowing and preserves its request", async () => {
    mocks.state.draftPlan = {
      itinerary: { title: "preview", days: [] },
      suggestedPlaces: [{ id: 1 }, { id: 2 }],
    };
    mocks.state.selectedPlaceIds = [2];
    mocks.state.lastPreferences = { totalDays: 2, budget: 2_000_000 };

    const planner = useAIPlanner();
    const error = new Error("offline");
    mocks.mutations[1].mutateAsync.mockImplementation(async () => {
      mocks.mutationConfigs[1].onError(error);
      throw error;
    });

    await expect(planner.confirmSelectedPlaces()).resolves.toBeNull();

    expect(mocks.mutations[1].mutateAsync).toHaveBeenCalledWith({
      totalDays: 2,
      budget: 2_000_000,
      selectedPlaceIds: [2],
      itineraryDraft: mocks.state.draftPlan.itinerary,
    });
    expect(mocks.state.appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "assistant",
        text: "request failed",
        isError: true,
      }),
    );
  });
});

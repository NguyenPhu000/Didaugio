import { beforeEach, describe, expect, it, vi } from "vitest";

const plannerState = {
  messages: [],
  draftPlan: {
    itinerary: { title: "Draft", totalDays: 1, days: [] },
    suggestedPlaces: [{ id: 31 }, { id: 32 }],
  },
  selectedPlaceIds: [],
  lastPreferences: null,
  appendMessage: vi.fn(),
  replaceDraftPreviewMessage: vi.fn(),
  setDraftPlan: vi.fn(),
  setSelectedPlaceIds: vi.fn(),
  setLastPreferences: vi.fn(),
  resetPlannerState: vi.fn(),
};

const previewMutateAsync = vi.fn(async () => ({ data: { previewOnly: true } }));

vi.mock("react", () => ({ useCallback: (callback) => callback }));
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi
    .fn()
    .mockImplementationOnce(() => ({
      mutateAsync: previewMutateAsync,
      isPending: false,
      error: null,
      reset: vi.fn(),
    }))
    .mockImplementationOnce(() => ({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    })),
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("../../../../src/stores/aiPlannerStore", () => ({
  useAIPlannerStore: (selector) => selector(plannerState),
}));
vi.mock("../../../../src/modules/ai/api/aiApi", () => ({
  confirmGeneratedTripApi: vi.fn(),
  generateTripPreviewApi: vi.fn(),
  getMyTripsApi: vi.fn(),
}));
vi.mock("../../../../src/modules/ai/lib/mapAIError", () => ({
  mapAIError: (error) => error?.message || "error",
}));

describe("AI planner dynamic place selection", () => {
  beforeEach(() => {
    previewMutateAsync.mockClear();
  });

  it("does not turn deselected draft suggestions back into mandatory IDs", async () => {
    const { useAIPlanner } = await import(
      "../../../../src/modules/ai/hooks/useAIPlanner"
    );
    const planner = useAIPlanner();

    await planner.sendMessage("Tạo lại lịch trình khác");

    expect(previewMutateAsync).toHaveBeenCalledOnce();
    expect(previewMutateAsync.mock.calls[0][0].selectedPlaceIds).toBeUndefined();
  });
});

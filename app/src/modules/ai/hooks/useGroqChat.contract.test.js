import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGroqChat } from "./useGroqChat";

const mocks = vi.hoisted(() => {
  const state = {
    messages: [],
    appendMessage: vi.fn(),
    clearChatMessages: vi.fn(),
  };

  state.appendMessage.mockImplementation((message) => {
    state.messages.push({
      ...message,
      id: message.id || `message-${state.messages.length + 1}`,
      text: message.text ?? message.content ?? "",
    });
  });

  return {
    apiClient: { post: vi.fn() },
    sessionContext: {},
    state,
  };
});

vi.mock("react", () => ({
  useCallback: (callback) => callback,
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useRef: (initialValue) => ({ current: initialValue }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("../../../stores/aiContextStore", () => ({
  useAIContextStore: (selector) =>
    selector({
      sessionContext: mocks.sessionContext,
      conversationMemory: [],
      clearConversation: vi.fn(),
    }),
}));

vi.mock("../../../stores/aiPlannerStore", () => {
  const useAIPlannerStore = (selector) => selector(mocks.state);
  useAIPlannerStore.getState = () => mocks.state;
  return { useAIPlannerStore };
});

vi.mock("../lib/conversationMemory", () => ({
  buildApiPayload: (history, text) => ({
    messages: [
      ...history.map((message) => ({
        role: message.role,
        content: message.text ?? message.content ?? "",
      })),
      { role: "user", content: text },
    ],
  }),
}));

vi.mock("../lib/mapAIError", () => ({ mapAIError: () => "request failed" }));
vi.mock("../lib/genieAssistantExperience", () => ({
  normalizeGenieResponse: () => ({
    reply: "retry reply",
    suggestedPlaces: [],
    quickReplies: [],
    actions: [],
    requestLogId: 77,
  }),
}));
vi.mock("../../../api/endpoints", () => ({
  ENDPOINTS: { ai: { groqChat: "/chat" } },
}));
vi.mock("../../../api/client", () => ({ default: mocks.apiClient }));
vi.mock("../../../constants/api", () => ({ AI_REQUEST_TIMEOUT: 1000 }));

const source = readFileSync(
  fileURLToPath(new URL("./useGroqChat.js", import.meta.url)),
  "utf8",
);
const plannerSource = readFileSync(
  fileURLToPath(new URL("../screens/AIPlanner.jsx", import.meta.url)),
  "utf8",
);

describe("useGroqChat routing contract", () => {
  beforeEach(() => {
    mocks.state.messages.length = 0;
    mocks.state.appendMessage.mockClear();
    mocks.apiClient.post.mockReset();
    mocks.sessionContext.currentLocation = { latitude: 10.03, longitude: 105.78 };
    mocks.sessionContext.currentCity = "Can Tho";
    mocks.sessionContext.timeOfDay = "morning";
    mocks.sessionContext.preferences = { travelStyle: "budget" };
    mocks.sessionContext.visitedPlaceIds = [1, 2];
  });

  it("omits null optional store context while preserving valid empty and false values", async () => {
    mocks.sessionContext.currentLocation = null;
    mocks.sessionContext.currentCity = null;
    mocks.sessionContext.timeOfDay = null;
    mocks.sessionContext.preferences = null;
    mocks.sessionContext.visitedPlaceIds = [];
    mocks.apiClient.post.mockResolvedValueOnce({});

    const chat = useGroqChat();
    await chat.sendMessage("hello");

    expect(mocks.apiClient.post.mock.calls[0][1].context).toEqual({
      visitedPlaceIds: [],
      isPlaceQuery: false,
    });
    expect(mocks.state.appendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        role: "assistant",
        requestLogId: 77,
      }),
    );
  });

  it("is chat-only", () => {
    expect(source).not.toContain("ITINERARY_PATTERN");
    expect(source).not.toContain("hybrid-plan");
    expect(source).toContain("ENDPOINTS.ai.groqChat");
  });

  it("supports retry without appending a duplicate user message", () => {
    expect(source).toContain("appendUserMessage");
    expect(source).toContain("retryLastMessage");
  });

  it("retries the failed request snapshot after intervening messages without another user append", async () => {
    const chat = useGroqChat();
    mocks.apiClient.post.mockRejectedValueOnce(new Error("offline"));

    await expect(chat.sendMessage("original request")).rejects.toThrow("request failed");
    const originalRequest = mocks.apiClient.post.mock.calls[0][1];

    mocks.state.appendMessage({
      id: "intervening-message",
      role: "user",
      content: "intervening request",
      source: "chat",
    });
    mocks.sessionContext.currentLocation = { latitude: 21.03, longitude: 105.85 };
    mocks.sessionContext.currentCity = "Ha Noi";
    mocks.sessionContext.timeOfDay = "evening";
    mocks.sessionContext.preferences = { travelStyle: "luxury" };
    mocks.sessionContext.visitedPlaceIds = [9];
    mocks.apiClient.post.mockResolvedValueOnce({});

    await chat.retryLastMessage();

    expect(mocks.apiClient.post.mock.calls[1][1]).toEqual(originalRequest);
    expect(
      mocks.state.messages.filter(
        (message) => message.role === "user" && message.content === "original request",
      ),
    ).toHaveLength(1);
  });

  it("keeps voice errors separate from retryable chat errors", () => {
    expect(plannerSource).toContain("const [voiceError, setVoiceError]");
    expect(plannerSource).toContain("onError: setVoiceError");
    expect(plannerSource).not.toContain("onError: setChatError");
    expect(plannerSource).toContain('activeError.source === "chat"');
  });
});

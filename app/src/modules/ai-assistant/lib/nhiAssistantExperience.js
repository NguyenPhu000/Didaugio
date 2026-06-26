import { INTENT_TYPES, detectAllIntents } from "./intentDetector";

export const NHI_INTENT_TYPES = Object.freeze({
  ITINERARY: "itinerary",
  PLACE_DISCOVERY: "place_discovery",
  VOICE: "voice",
  CHAT: "chat",
});

const TIME_SUGGESTIONS = {
  morning: {
    id: "morning-plan",
    icon: "wb-sunny",
    textKey: "aiPlanner.suggestionGroups.context.morning",
    promptKey: "aiPlanner.suggestionPrompts.morning",
  },
  afternoon: {
    id: "afternoon-checkin",
    icon: "photo-camera",
    textKey: "aiPlanner.suggestionGroups.context.afternoon",
    promptKey: "aiPlanner.suggestionPrompts.afternoon",
  },
  evening: {
    id: "evening-plan",
    icon: "nightlife",
    textKey: "aiPlanner.suggestionGroups.context.evening",
    promptKey: "aiPlanner.suggestionPrompts.evening",
  },
};

const BASE_GROUPS = [
  {
    id: "nearby",
    titleKey: "aiPlanner.suggestionGroups.nearby.title",
    items: [
      {
        id: "food-nearby",
        icon: "restaurant",
        textKey: "aiPlanner.suggestionGroups.nearby.food",
        promptKey: "aiPlanner.suggestionPrompts.foodNearby",
      },
      {
        id: "hot-now",
        icon: "local-fire-department",
        textKey: "aiPlanner.suggestionGroups.nearby.hot",
        promptKey: "aiPlanner.suggestionPrompts.hotNow",
      },
    ],
  },
  {
    id: "trip",
    titleKey: "aiPlanner.suggestionGroups.trip.title",
    items: [
      {
        id: "one-day-trip",
        icon: "route",
        textKey: "aiPlanner.suggestionGroups.trip.oneDay",
        promptKey: "aiPlanner.suggestionPrompts.oneDayTrip",
      },
      {
        id: "family-trip",
        icon: "family-restroom",
        textKey: "aiPlanner.suggestionGroups.trip.family",
        promptKey: "aiPlanner.suggestionPrompts.familyTrip",
      },
    ],
  },
];

export function detectNhiIntent(text) {
  const intents = detectAllIntents(text);
  if (intents.includes(INTENT_TYPES.SCHEDULE)) return NHI_INTENT_TYPES.ITINERARY;
  if (
    intents.some((intent) =>
      [INTENT_TYPES.EAT, INTENT_TYPES.NEARBY, INTENT_TYPES.REVIEW].includes(
        intent,
      ),
    )
  ) {
    return NHI_INTENT_TYPES.PLACE_DISCOVERY;
  }
  if (intents.includes(INTENT_TYPES.VOICE)) return NHI_INTENT_TYPES.VOICE;
  return NHI_INTENT_TYPES.CHAT;
}

export function buildNhiSuggestionGroups({
  hasSavedPlaces = false,
  timeOfDay = "",
} = {}) {
  const groups = BASE_GROUPS.map((group) => ({
    ...group,
    items: [...group.items],
  }));

  const normalizedTime = String(timeOfDay).toLowerCase();
  const timeSuggestion =
    TIME_SUGGESTIONS[normalizedTime] ||
    (normalizedTime.includes("tối") ? TIME_SUGGESTIONS.evening : null);

  if (timeSuggestion) {
    groups[0].items.unshift(timeSuggestion);
  }

  if (hasSavedPlaces) {
    groups.unshift({
      id: "saved",
      titleKey: "aiPlanner.suggestionGroups.saved.title",
      items: [
        {
          id: "saved-route",
          icon: "bookmark",
          textKey: "aiPlanner.suggestionGroups.saved.route",
          promptKey: "aiPlanner.suggestionPrompts.savedRoute",
        },
      ],
    });
  }

  return groups;
}

export function normalizeNhiResponse(response = {}) {
  const data = response?.data?.data || response?.data || response || {};
  const reply =
    typeof data.reply === "string" && data.reply.trim()
      ? data.reply.trim()
      : "";
  const suggestedPlaces = Array.isArray(data.relatedPlaces)
    ? data.relatedPlaces
    : Array.isArray(data.suggestedPlaces)
      ? data.suggestedPlaces
      : [];
  const quickReplies = Array.isArray(data.quickReplies) ? data.quickReplies : [];
  const actions = [];

  if (suggestedPlaces.length > 0) {
    actions.push({ type: "view_map" }, { type: "add_trip" });
  }
  if (data.planDraft || data.hybridPlan) {
    actions.push({ type: "review_plan" });
  }

  return {
    reply,
    suggestedPlaces,
    quickReplies,
    actions,
    planDraft: data.planDraft || data.hybridPlan || null,
  };
}

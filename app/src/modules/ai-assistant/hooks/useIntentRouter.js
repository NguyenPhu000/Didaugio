import { useCallback } from "react";
import { detectIntent, INTENT_TYPES } from "../lib/intentDetector";
import { useAIContextStore } from "../../../stores/aiContextStore";

/**
 * Routes detected intents to the appropriate actions.
 * Returns a function that handles a user message and returns intent info.
 */
export function useIntentRouter() {
  const addIntent = useAIContextStore((s) => s.addIntent);

  const route = useCallback(
    (text) => {
      const intent = detectIntent(text);
      addIntent({ intent, text, timestamp: Date.now() });

      return {
        intent,
        isNavigation: intent === INTENT_TYPES.NAVIGATE,
        isBooking: intent === INTENT_TYPES.BOOK,
        isNearby: intent === INTENT_TYPES.NEARBY,
        isSchedule: intent === INTENT_TYPES.SCHEDULE,
        isVoice: intent === INTENT_TYPES.VOICE,
        isFood: intent === INTENT_TYPES.EAT,
      };
    },
    [addIntent],
  );

  return { route };
}

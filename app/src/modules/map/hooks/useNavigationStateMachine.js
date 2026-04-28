import { useMemo } from "react";
import { MAP_TEXT } from "../constants/mapText.constants";

export const NAVIGATION_STATE = {
  IDLE: "idle",
  NAVIGATING: "navigating",
  PENDING_CONFIRM: "pending_confirm",
  RECOVERY: "recovery",
  COMPLETED: "completed",
};

export function resolveNavigationState({
  routeBuilderMode,
  routeBuilderHasFinished,
  routeBuilderPendingArrival,
  routeBuilderRecoveryMode,
  routeBuilderActiveTargetName,
}) {
  if (!routeBuilderMode) {
    return {
      state: NAVIGATION_STATE.IDLE,
      label: null,
    };
  }

  if (routeBuilderHasFinished) {
    return {
      state: NAVIGATION_STATE.COMPLETED,
      label: MAP_TEXT.routeBuilder.stateCompleted,
    };
  }

  if (routeBuilderPendingArrival) {
    return {
      state: NAVIGATION_STATE.PENDING_CONFIRM,
      label: MAP_TEXT.routeBuilder.statePendingConfirm(
        routeBuilderPendingArrival.targetName,
      ),
    };
  }

  if (routeBuilderRecoveryMode) {
    return {
      state: NAVIGATION_STATE.RECOVERY,
      label: MAP_TEXT.routeBuilder.stateRecovery(routeBuilderActiveTargetName),
    };
  }

  return {
    state: NAVIGATION_STATE.NAVIGATING,
    label: null,
  };
}

export function useNavigationStateMachine({
  routeBuilderMode,
  routeBuilderHasFinished,
  routeBuilderPendingArrival,
  routeBuilderRecoveryMode,
  routeBuilderActiveTargetName,
}) {
  return useMemo(
    () =>
      resolveNavigationState({
        routeBuilderMode,
        routeBuilderHasFinished,
        routeBuilderPendingArrival,
        routeBuilderRecoveryMode,
        routeBuilderActiveTargetName,
      }),
    [
      routeBuilderActiveTargetName,
      routeBuilderHasFinished,
      routeBuilderMode,
      routeBuilderPendingArrival,
      routeBuilderRecoveryMode,
    ],
  );
}

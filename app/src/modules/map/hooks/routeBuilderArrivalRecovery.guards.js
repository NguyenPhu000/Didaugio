import {
  ROUTE_BUILDER_ARRIVAL_RADIUS_M,
  ROUTE_BUILDER_MISSED_APPROACH_RADIUS_M,
  ROUTE_BUILDER_MISSED_DELTA_M,
  ROUTE_BUILDER_MISSED_DISTANCE_M,
  ROUTE_BUILDER_RECOVERY_CLEAR_DISTANCE_M,
} from "../constants/routeBuilder.constants";
import { MAP_TEXT } from "../constants/mapText.constants";

export function shouldEnterPendingArrival({
  pendingForCurrentLeg,
  distanceToTarget,
  arrivalRadius = ROUTE_BUILDER_ARRIVAL_RADIUS_M,
}) {
  if (pendingForCurrentLeg) return false;
  if (!Number.isFinite(distanceToTarget)) return false;
  return distanceToTarget <= arrivalRadius;
}

export function createPendingArrivalPayload({
  activeLeg,
  targetName,
  fallbackTargetName = MAP_TEXT.common.destinationNameLower,
}) {
  return {
    legIndex: activeLeg,
    targetName: targetName || fallbackTargetName,
  };
}

export function shouldEnterRecoveryMode({
  pendingForCurrentLeg,
  minDistance,
  distanceToTarget,
  missedApproachRadius = ROUTE_BUILDER_MISSED_APPROACH_RADIUS_M,
  missedDistance = ROUTE_BUILDER_MISSED_DISTANCE_M,
  missedDelta = ROUTE_BUILDER_MISSED_DELTA_M,
}) {
  if (pendingForCurrentLeg) return false;
  if (!Number.isFinite(minDistance) || !Number.isFinite(distanceToTarget)) {
    return false;
  }

  return (
    minDistance <= missedApproachRadius &&
    distanceToTarget >= missedDistance &&
    distanceToTarget - minDistance >= missedDelta
  );
}

export function shouldClearRecoveryMode({
  recoveryMode,
  distanceToTarget,
  recoveryClearDistance = ROUTE_BUILDER_RECOVERY_CLEAR_DISTANCE_M,
}) {
  if (!recoveryMode) return false;
  if (!Number.isFinite(distanceToTarget)) return false;
  return distanceToTarget <= recoveryClearDistance;
}

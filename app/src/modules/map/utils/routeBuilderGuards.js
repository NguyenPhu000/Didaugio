export const hasSameStopOrder = (first, second) => {
  if (!Array.isArray(first) || !Array.isArray(second)) return false;
  if (first.length !== second.length) return false;

  for (let index = 0; index < first.length; index += 1) {
    if (String(first[index]?.id) !== String(second[index]?.id)) {
      return false;
    }
  }

  return true;
};

export const createLegTrackingState = (legIndex = -1) => ({
  legIndex,
  minDistance: Number.POSITIVE_INFINITY,
  prevDistance: Number.POSITIVE_INFINITY,
  recoveryCandidateCount: 0,
  recoveryEventEmitted: false,
});

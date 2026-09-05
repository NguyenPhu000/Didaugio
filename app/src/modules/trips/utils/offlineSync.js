const toTripKey = (tripId) => {
  if (tripId === null || tripId === undefined || tripId === "") return null;
  return String(tripId);
};

export const getQueuedTripId = (action) => {
  if (action?.type === "CREATE_TRIP") return action.tempId;
  if (action?.type === "DELETE_TRIP") return action.data?.id ?? action.data;
  if (action?.type === "UPDATE_TRIP") return action.data?.tripId;
  return null;
};

export const resolveQueuedTripId = (queuedTripId, idMap = {}) => {
  if (queuedTripId === null || queuedTripId === undefined) return queuedTripId;
  return idMap[String(queuedTripId)] ?? queuedTripId;
};

export const dedupOfflineActions = (actions) => {
  const cancelledTripKeys = new Set();

  actions.forEach((action, index) => {
    if (action?.type !== "DELETE_TRIP") return;

    const deleteTripKey = toTripKey(getQueuedTripId(action));
    if (!deleteTripKey) return;

    const createBeforeDelete = actions.findIndex(
      (candidate) =>
        candidate?.type === "CREATE_TRIP" &&
        toTripKey(getQueuedTripId(candidate)) === deleteTripKey,
    );

    if (createBeforeDelete !== -1 && createBeforeDelete < index) {
      cancelledTripKeys.add(deleteTripKey);
    }
  });

  if (cancelledTripKeys.size === 0) return actions;

  return actions.filter(
    (action) => !cancelledTripKeys.has(toTripKey(getQueuedTripId(action))),
  );
};

export async function flushOfflineTripActions(
  actions,
  {
    idMap = {},
    createTrip,
    updateTrip,
    deleteTrip,
  } = {},
) {
  const nextIdMap = { ...idMap };
  const remainingActions = [];
  const blockedTripKeys = new Set();

  for (const action of actions) {
    const queuedTripKey = toTripKey(getQueuedTripId(action));

    // Preserve queue order for the same trip after any failed action. This
    // prevents a later DELETE/UPDATE from running against stale state.
    if (queuedTripKey && blockedTripKeys.has(queuedTripKey)) {
      remainingActions.push(action);
      continue;
    }

    try {
      if (action?.type === "CREATE_TRIP") {
        const response = await createTrip(action.data);
        const serverId = response?.data?.id;
        if (action.tempId && serverId !== undefined && serverId !== null) {
          nextIdMap[String(action.tempId)] = serverId;
        }
      } else if (action?.type === "DELETE_TRIP") {
        const queuedId = getQueuedTripId(action);
        await deleteTrip(resolveQueuedTripId(queuedId, nextIdMap));
      } else if (action?.type === "UPDATE_TRIP") {
        const queuedId = getQueuedTripId(action);
        await updateTrip(
          resolveQueuedTripId(queuedId, nextIdMap),
          action.data?.data,
        );
      }
    } catch {
      remainingActions.push(action);
      if (queuedTripKey) blockedTripKeys.add(queuedTripKey);
    }
  }

  return { remainingActions, idMap: nextIdMap };
}

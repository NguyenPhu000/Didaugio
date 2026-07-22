import { useCallback, useEffect, useMemo, useState } from "react";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { useQuery } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import {
  getTripDetailApi,
  getTripSessionApi,
  syncTripSessionApi,
} from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { OFFLINE_STORAGE_KEYS } from "../../../constants/storage";
import { normalizeServerTripSession } from "./activeTripSession";

const ACTIVE_TRIP_KEY = "ACTIVE_TRIP_ID";
const VISITED_PREFIX = "visitedDestinations_";
const PAUSED_PREFIX = "pausedTrip_";
const SESSION_OUTBOX_KEY = OFFLINE_STORAGE_KEYS.TRIP_SESSION_OUTBOX;

/** Bán kính nhận diện đã đến nơi (mét). */
export const ARRIVAL_RADIUS_M = 50;

const visitedKey = (tripId) => `${VISITED_PREFIX}${tripId}`;
const pausedKey = (tripId) => `${PAUSED_PREFIX}${tripId}`;

const generateOperationId = () =>
  `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

async function readSessionOutbox() {
  try {
    const raw = await safeAsyncStorage.getItem(SESSION_OUTBOX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSessionOutbox(items) {
  if (items.length === 0) return safeAsyncStorage.removeItem(SESSION_OUTBOX_KEY);
  return safeAsyncStorage.setItem(SESSION_OUTBOX_KEY, JSON.stringify(items));
}

let sessionFlushPromise = null;

async function runSessionOutboxFlush() {
  const queue = await readSessionOutbox();
  if (queue.length === 0) return;
  const remaining = [...queue];
  while (remaining.length > 0) {
    const operation = remaining[0];
    try {
      if (operation.baseVersion == null) {
        const session = await getTripSessionApi(operation.tripId);
        operation.baseVersion = Number(session?.data?.clientStateVersion || 0);
        await writeSessionOutbox(remaining);
      }
      await syncTripSessionApi(operation.tripId, {
        ...operation.payload,
        operationId: operation.operationId,
        baseVersion: operation.baseVersion,
      });
      remaining.shift();
      await writeSessionOutbox(remaining);
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status === 409) {
        operation.baseVersion = null;
        await writeSessionOutbox(remaining);
      } else if (status >= 400 && status < 500) {
        remaining.shift();
        await writeSessionOutbox(remaining);
        continue;
      }
      break;
    }
  }
}

async function flushSessionOutbox() {
  if (!sessionFlushPromise) {
    sessionFlushPromise = runSessionOutboxFlush().finally(() => {
      sessionFlushPromise = null;
    });
  }
  return sessionFlushPromise;
}

async function enqueueSessionOperation(tripId, payload) {
  const queue = await readSessionOutbox();
  queue.push({
    tripId: String(tripId),
    operationId: generateOperationId(),
    baseVersion: null,
    payload,
    createdAt: Date.now(),
  });
  await writeSessionOutbox(queue);
  await flushSessionOutbox();
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export async function getActiveTripId() {
  try {
    return await safeAsyncStorage.getItem(ACTIVE_TRIP_KEY);
  } catch {
    return null;
  }
}

export async function setActiveTripId(tripId) {
  try {
    await safeAsyncStorage.setItem(ACTIVE_TRIP_KEY, String(tripId));
  } catch {
    // Bỏ qua lỗi ghi storage.
  }
}

export async function clearActiveTripId() {
  try {
    await safeAsyncStorage.removeItem(ACTIVE_TRIP_KEY);
  } catch {
    // Bỏ qua lỗi xóa storage.
  }
}

export async function getVisitedDestinations(tripId) {
  if (!tripId) return [];
  try {
    const raw = await safeAsyncStorage.getItem(visitedKey(tripId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setVisitedDestinations(tripId, ids) {
  if (!tripId) return;
  try {
    await safeAsyncStorage.setItem(visitedKey(tripId), JSON.stringify(ids || []));
  } catch {
    // Bỏ qua lỗi ghi storage.
  }
}

export async function resetVisitedDestinations(tripId) {
  await setVisitedDestinations(tripId, []);
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Quản lý vòng đời chuyến đi đang chạy ngầm.
 * Phần tính khoảng cách / nhận diện đến nơi được xử lý phía MapScreen
 * (nơi có GPS thời gian thực) để tránh phụ thuộc vòng.
 */
export function useActiveTrip() {
  const [activeTripId, setActiveTripIdState] = useState(null);
  const [visitedIds, setVisitedIds] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshActiveTripId = useCallback(async () => {
    const id = await getActiveTripId();
    setActiveTripIdState(id);
    if (id) {
      const localVisitedIds = await getVisitedDestinations(id);
      let nextVisitedIds = localVisitedIds;
      let nextIsPaused = false;

      const pausedVal = await safeAsyncStorage.getItem(pausedKey(id));
      nextIsPaused = pausedVal === "true";

      try {
        const sessionRes = await getTripSessionApi(id);
        const snapshot = normalizeServerTripSession(sessionRes?.data);

        if (snapshot?.shouldClearActiveTrip) {
          await clearActiveTripId();
          await resetVisitedDestinations(id);
          await safeAsyncStorage.removeItem(pausedKey(id));
          setActiveTripIdState(null);
          setVisitedIds([]);
          setIsPaused(false);
          setIsHydrated(true);
          return;
        }

        if (snapshot) {
          nextVisitedIds = snapshot.visitedIds;
          nextIsPaused = snapshot.isPaused;
          await setVisitedDestinations(id, nextVisitedIds);
          if (nextIsPaused) {
            await safeAsyncStorage.setItem(pausedKey(id), "true");
          } else {
            await safeAsyncStorage.removeItem(pausedKey(id));
          }
        }
      } catch {
        // Keep the local snapshot when the network is unavailable.
      }

      setVisitedIds(nextVisitedIds);
      setIsPaused(nextIsPaused);
    } else {
      setVisitedIds([]);
      setIsPaused(false);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    void refreshActiveTripId();
    void flushSessionOutbox();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void flushSessionOutbox();
      }
    });
    return unsubscribe;
  }, [refreshActiveTripId]);

  const { data: activeTrip } = useQuery({
    queryKey: QUERY_KEYS.trips.detail(activeTripId),
    queryFn: () => getTripDetailApi(activeTripId),
    enabled: !!activeTripId,
    select: (res) => res?.data || null,
    staleTime: 60 * 1000,
  });

  const isActive = !!activeTripId && !!activeTrip;

  // Tìm điểm đến chưa đi đầu tiên (theo thứ tự ngày + order).
  const nextDestination = useMemo(() => {
    if (!activeTrip?.destinations?.length) return null;
    const ordered = [...activeTrip.destinations].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.order - b.order;
    });
    return (
      ordered.find((d) => !visitedIds.includes(d.id)) || null
    );
  }, [activeTrip, visitedIds]);

  const targetPoint = useMemo(() => {
    const place = nextDestination?.place;
    if (!place) return null;
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, name: place.name };
  }, [nextDestination]);

  const startActiveTrip = useCallback(async (tripId) => {
    await safeAsyncStorage.removeItem(pausedKey(tripId));
    await setActiveTripId(tripId);
    await resetVisitedDestinations(tripId);
    setActiveTripIdState(String(tripId));
    setVisitedIds([]);
    setIsPaused(false);

    await enqueueSessionOperation(tripId, { status: "active", visitedIds: [] });
  }, []);

  const markArrived = useCallback(
    async (destId) => {
      if (!activeTripId || destId == null) return;
      let nextVisitedIds = [];
      setVisitedIds((prev) => {
        if (prev.includes(destId)) {
          nextVisitedIds = prev;
          return prev;
        }
        const next = [...prev, destId];
        nextVisitedIds = next;
        void setVisitedDestinations(activeTripId, next);
        return next;
      });

      await enqueueSessionOperation(activeTripId, {
        status: "active",
        currentStopId: destId,
        visitedIds: nextVisitedIds,
      });
    },
    [activeTripId],
  );

  const pauseActiveTrip = useCallback(async () => {
    if (!activeTripId) return;
    await safeAsyncStorage.setItem(pausedKey(activeTripId), "true");
    setIsPaused(true);

    await enqueueSessionOperation(activeTripId, { status: "paused", visitedIds });
  }, [activeTripId, visitedIds]);

  const resumeActiveTrip = useCallback(async () => {
    if (!activeTripId) return;
    await safeAsyncStorage.removeItem(pausedKey(activeTripId));
    setIsPaused(false);

    await enqueueSessionOperation(activeTripId, { status: "active", visitedIds });
  }, [activeTripId, visitedIds]);

  const exitActiveTrip = useCallback(async () => {
    const tripIdToExit = activeTripId;
    if (tripIdToExit) {
      await safeAsyncStorage.removeItem(pausedKey(tripIdToExit));
      await enqueueSessionOperation(tripIdToExit, { status: "completed", visitedIds });
    }
    await clearActiveTripId();
    setActiveTripIdState(null);
    setVisitedIds([]);
    setIsPaused(false);
  }, [activeTripId, visitedIds]);

  const isLastDestination = useMemo(() => {
    if (!activeTrip?.destinations?.length || !nextDestination) return false;
    const remaining = activeTrip.destinations.filter(
      (d) => !visitedIds.includes(d.id),
    );
    return remaining.length === 1 && remaining[0].id === nextDestination.id;
  }, [activeTrip, nextDestination, visitedIds]);

  return {
    activeTripId,
    activeTrip,
    isActive,
    isHydrated,
    nextDestination,
    targetPoint,
    isLastDestination,
    visitedIds,
    isPaused,
    startActiveTrip,
    markArrived,
    pauseActiveTrip,
    resumeActiveTrip,
    exitActiveTrip,
    refreshActiveTripId,
  };
}

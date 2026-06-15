/**
 * Retry Queue Service - Xử lý các thao tác offline khi có mạng trở lại
 *
 * Sử dụng:
 * - Tự động retry khi có kết nối mạng
 * - Lưu trữ pending actions vào AsyncStorage
 * - Sync với server khi online
 */

import safeAsyncStorage from "../../utils/safeAsyncStorage";
import NetInfo from "@react-native-community/netinfo";
import { create } from "zustand";
import { savePlaceApi, unsavePlaceApi } from "../saved/api/savedApi";

const PENDING_ACTIONS_KEY = "@pending_actions_queue";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

// ─── Pending Action Types ───────────────────────────────────────────────────────

export const ACTION_TYPES = {
  CREATE_TRIP: "CREATE_TRIP",
  UPDATE_TRIP: "UPDATE_TRIP",
  DELETE_TRIP: "DELETE_TRIP",
  CREATE_BOOKING: "CREATE_BOOKING",
  CANCEL_BOOKING: "CANCEL_BOOKING",
  SAVE_PLACE: "SAVE_PLACE",
  UNSAVE_PLACE: "UNSAVE_PLACE",
  ADD_REVIEW: "ADD_REVIEW",
  UPDATE_PROFILE: "UPDATE_PROFILE",
};

// ─── Retry Queue Store ─────────────────────────────────────────────────────────

export const useRetryQueueStore = create((set, get) => ({
  pendingActions: [],
  isProcessing: false,
  isOnline: true,
  lastSyncTime: null,
  errorCount: 0,

  // Initialize - load pending actions from storage
  init: async () => {
    try {
      const stored = await safeAsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (stored) {
        const actions = JSON.parse(stored);
        set({ pendingActions: actions });
      }
    } catch (error) {
      console.warn("[RetryQueue] Failed to load pending actions:", error);
    }

    // Start network listener
    NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected ?? true;
      set({ isOnline });

      // Auto-retry when back online
      if (isOnline && get().pendingActions.length > 0) {
        get().processQueue();
      }
    });
  },

  // Add action to queue
  addAction: async (action) => {
    const pendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    };

    const updatedActions = [...get().pendingActions, pendingAction];
    set({ pendingActions: updatedActions });
    await safeAsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updatedActions));

    // Try to process immediately if online
    if (get().isOnline) {
      get().processQueue();
    }

    return pendingAction.id;
  },

  // Remove action from queue
  removeAction: async (actionId) => {
    const updatedActions = get().pendingActions.filter((a) => a.id !== actionId);
    set({ pendingActions: updatedActions });
    await safeAsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updatedActions));
  },

  // Mark action as failed
  markFailed: async (actionId, error) => {
    const actions = get().pendingActions;
    const actionIndex = actions.findIndex((a) => a.id === actionId);

    if (actionIndex === -1) return;

    const action = actions[actionIndex];
    const newRetryCount = (action.retryCount || 0) + 1;

    if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
      // Max retries reached, mark as failed permanently
      const updatedActions = actions.map((a) =>
        a.id === actionId
          ? { ...a, retryCount: newRetryCount, status: "failed", lastError: error }
          : a
      );
      set({ pendingActions: updatedActions, errorCount: get().errorCount + 1 });
      await safeAsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updatedActions));
    } else {
      // Schedule retry
      const updatedActions = actions.map((a) =>
        a.id === actionId
          ? { ...a, retryCount: newRetryCount, status: "pending", lastError: error }
          : a
      );
      set({ pendingActions: updatedActions });
      await safeAsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updatedActions));

      // Schedule retry after delay
      setTimeout(() => {
        if (get().isOnline) {
          get().processQueue();
        }
      }, RETRY_DELAY_MS * newRetryCount);
    }
  },

  // Mark action as completed
  markCompleted: async (actionId) => {
    await get().removeAction(actionId);
    set({ lastSyncTime: Date.now() });
  },

  // Process queue
  processQueue: async () => {
    const state = get();

    if (state.isProcessing || !state.isOnline || state.pendingActions.length === 0) {
      return;
    }

    set({ isProcessing: true });

    const pendingActions = state.pendingActions.filter(
      (a) => a.status !== "completed" && a.status !== "failed"
    );

    for (const action of pendingActions) {
      try {
        // Mark as processing
        set((s) => ({
          pendingActions: s.pendingActions.map((a) =>
            a.id === action.id ? { ...a, status: "processing" } : a
          ),
        }));

        // Execute action
        const result = await executeAction(action);

        if (result.success) {
          await get().markCompleted(action.id);
        } else {
          await get().markFailed(action.id, result.error);
        }
      } catch (error) {
        await get().markFailed(action.id, error.message);
      }
    }

    set({ isProcessing: false });
  },

  // Clear all pending actions
  clearAll: async () => {
    set({ pendingActions: [], errorCount: 0 });
    await safeAsyncStorage.removeItem(PENDING_ACTIONS_KEY);
  },

  // Get pending count
  getPendingCount: () => {
    return get().pendingActions.filter((a) => a.status === "pending" || a.status === "processing").length;
  },
}));

// ─── Action Executors ───────────────────────────────────────────────────────────

const executeAction = async (action) => {
  // This would integrate with actual API calls
  // For now, simulate success

  switch (action.type) {
    case ACTION_TYPES.CREATE_TRIP:
      // await tripApi.create(action.data);
      break;
    case ACTION_TYPES.UPDATE_TRIP:
      // await tripApi.update(action.data.id, action.data);
      break;
    case ACTION_TYPES.DELETE_TRIP:
      // await tripApi.delete(action.data.id);
      break;
    case ACTION_TYPES.CREATE_BOOKING:
      // await bookingApi.create(action.data);
      break;
    case ACTION_TYPES.CANCEL_BOOKING:
      // await bookingApi.cancel(action.data.id, action.data.reason);
      break;
    case ACTION_TYPES.SAVE_PLACE:
      await savePlaceApi(action.data.placeId, action.data.note, action.data.collectionName);
      break;
    case ACTION_TYPES.UNSAVE_PLACE:
      await unsavePlaceApi(action.data.placeId);
      break;
    case ACTION_TYPES.ADD_REVIEW:
      // await reviewApi.create(action.data);
      break;
    case ACTION_TYPES.UPDATE_PROFILE:
      // await profileApi.update(action.data);
      break;
    default:
      console.warn("[RetryQueue] Unknown action type:", action.type);
      return { success: false, error: "Unknown action type" };
  }

  return { success: true };
};

// ─── Queue Status Component ─────────────────────────────────────────────────────

export const getQueueStatus = () => {
  const { pendingActions, isProcessing, isOnline, lastSyncTime, errorCount } =
    useRetryQueueStore.getState();

  return {
    pendingCount: pendingActions.filter((a) => a.status === "pending").length,
    processingCount: pendingActions.filter((a) => a.status === "processing").length,
    failedCount: pendingActions.filter((a) => a.status === "failed").length,
    totalCount: pendingActions.length,
    isProcessing,
    isOnline,
    lastSyncTime,
    errorCount,
    hasErrors: errorCount > 0,
    hasPending: pendingActions.filter((a) => a.status === "pending").length > 0,
  };
};

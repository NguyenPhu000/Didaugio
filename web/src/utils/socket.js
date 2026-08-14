import { io } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/constants/constants";

let socket = null;
let socketIdentity = null;

const STALE_SESSION_ERROR_MARKERS = [
  "user not found",
  "invalid token",
  "session revoked",
  "account is banned",
  "account is inactive",
  "account banned",
  "account inactive",
];

export const isStaleSocketSessionError = (message) => {
  const normalizedMessage = String(message || "").toLowerCase();
  return STALE_SESSION_ERROR_MARKERS.some((marker) =>
    normalizedMessage.includes(marker),
  );
};

export const shouldInvalidateAuthForSocketError = ({
  isCurrentSocket,
  socketAccessToken,
  currentAccessToken,
  socketUserId,
  currentUserId,
}) =>
  Boolean(
    isCurrentSocket &&
      socketAccessToken &&
      socketAccessToken === currentAccessToken &&
      String(socketUserId) === String(currentUserId),
  );

const resolveUserId = (user) => user?.userId || user?.id;

/**
 * Connect Socket.io for the authenticated user.
 * Call once on app mount (e.g. in AdminHeader or App layout).
 */
export const connectSocket = () => {
  const { accessToken, user } = useAuthStore.getState();
  const userId = resolveUserId(user);
  if (!accessToken || !userId) return;

  const identity = `${userId}:${accessToken}`;
  if (socket && socketIdentity === identity) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketIdentity = null;
  }

  const socketUrl = API_BASE_URL.replace("/api", "");

  const socketInstance = io(socketUrl, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  });
  socket = socketInstance;
  socketIdentity = identity;

  socketInstance.on("connect", () => {
    console.log("[Socket] Connected:", socketInstance.id);
  });

  socketInstance.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
    const currentAuth = useAuthStore.getState();
    const isCurrentSocket = socketIdentity === identity && socket === socketInstance;
    if (
      isStaleSocketSessionError(err?.message) &&
      shouldInvalidateAuthForSocketError({
        isCurrentSocket,
        socketAccessToken: accessToken,
        currentAccessToken: currentAuth.accessToken,
        socketUserId: userId,
        currentUserId: resolveUserId(currentAuth.user),
      })
    ) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socket = null;
      socketIdentity = null;
      currentAuth.logout();
    } else if (isStaleSocketSessionError(err?.message)) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      if (socket === socketInstance) {
        socket = null;
        socketIdentity = null;
      }
    }
  });

  return socketInstance;
};

/**
 * Disconnect Socket.io.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketIdentity = null;
  }
};

/**
 * Get the current socket instance.
 */
export const getSocket = () => socket;

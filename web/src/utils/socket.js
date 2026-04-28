import { io } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/constants/constants";

let socket = null;
let socketIdentity = null;

/**
 * Connect Socket.io for the authenticated user.
 * Call once on app mount (e.g. in AdminHeader or App layout).
 */
export const connectSocket = () => {
  const { accessToken, user } = useAuthStore.getState();
  if (!accessToken || !user?.userId) return;

  const identity = `${user.userId}:${accessToken}`;
  if (socket && socketIdentity === identity) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketIdentity = null;
  }

  const socketUrl = API_BASE_URL.replace("/api", "");

  socket = io(socketUrl, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  });
  socketIdentity = identity;

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
  });

  return socket;
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

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./prismaClient.js";

const JWT_SECRET = process.env.JWT_SECRET;

const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
  STAFF: 4,
  USER: 5,
  GUEST: 6,
};

const ROLE_NAME_TO_ID = {
  super_admin: ROLES.SUPER_ADMIN,
  admin: ROLES.ADMIN,
  business: ROLES.BUSINESS,
  staff: ROLES.STAFF,
  user: ROLES.USER,
  guest: ROLES.GUEST,
};

const ADMIN_ROLE_IDS = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const resolveRoleId = (decoded = {}) => {
  if (decoded.roleId) return decoded.roleId;
  const roleKey = String(decoded.roleName || decoded.role || "").toLowerCase();
  return ROLE_NAME_TO_ID[roleKey] || null;
};

/**
 * In-memory registry: socketId -> { userId, role }
 */
const connectedUsers = new Map();

/** Singleton io instance */
let ioInstance = null;

/**
 * Initialize Socket.io server.
 * @param {import("http").Server} httpServer
 * @param {string[]} allowedOrigins
 */
export const initSocketIO = (httpServer, allowedOrigins = []) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Auth middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      socket.roleId = resolveRoleId(decoded);
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, roleId } = socket;

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);
    if (roleId) {
      socket.join(`role:${roleId}`);
    }

    // Join admin room if admin
    if (ADMIN_ROLE_IDS.includes(roleId)) {
      socket.join("admin");
      socket.join("role:admin");
    }

    let businessId = null;
    try {
      const business = await prisma.business.findUnique({
        where: { ownerId: Number(userId) },
        select: { id: true },
      });
      businessId = business?.id || null;
      if (businessId) {
        socket.join(`business:${businessId}`);
      }
    } catch (error) {
      console.warn("[Socket] Could not resolve business room:", error.message);
    }

    // Track connection after room assignment
    connectedUsers.set(socket.id, { userId, roleId, businessId });

    console.log(
      `[Socket] User ${userId} connected (${socket.id}), total: ${connectedUsers.size}`
    );

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.id);
      console.log(
        `[Socket] User ${userId} disconnected (${socket.id}), total: ${connectedUsers.size}`
      );
    });
  });

  ioInstance = io;

  return io;
};

/**
 * Get the Socket.io instance (after initSocketIO has been called).
 */
export const getIO = () => ioInstance;

/**
 * Emit a notification to a specific user.
 * @param {number} userId
 * @param {string} event
 * @param {object} data
 */
export const emitToUser = (userId, event, data) => {
  const io = ioInstance;
  if (!io) return;
  io.to(`user:${Number(userId)}`).emit(event, data);
};

/**
 * Emit a notification to all admins.
 * @param {string} event
 * @param {object} data
 */
export const emitToAdmins = (event, data) => {
  const io = ioInstance;
  if (!io) return;
  io.to("admin").emit(event, data);
};

/**
 * Emit a notification to all sockets for a business.
 * @param {number} businessId
 * @param {string} event
 * @param {object} data
 */
export const emitToBusiness = (businessId, event, data) => {
  const io = ioInstance;
  if (!io) return;
  io.to(`business:${Number(businessId)}`).emit(event, data);
};

/**
 * Check if a user currently has at least one active socket.
 * @param {number} userId
 */
export const isUserOnline = (userId) => {
  const io = ioInstance;
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(`user:${Number(userId)}`);
  return Boolean(room?.size);
};

/**
 * Get count of connected users.
 */
export const getConnectedCount = () => connectedUsers.size;
